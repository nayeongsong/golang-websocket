const path = require("path")
const fs = require("fs")
const parser = require("node-html-parser")

const dataDir = path.join(__dirname, "data")
const outputDir = path.join(__dirname, "json_data")

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}

function cleanKeyText(text) {
  return toSnakeCase(removeEndingBracket(text.replace(/^[^\w\s]+/, "").trim()))
}

function removeRefParameter(url) {
  let urlObject = new URL(url)
  urlObject.searchParams.delete("ref")
  return urlObject.toString()
}

function isValidURL(url) {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

function toSnakeCase(str) {
  return str
    .replace(/\W+/g, " ") // Replace non-word characters with spaces
    .trim()
    .toLowerCase()
    .replace(/ /g, "_") // Replace spaces with underscores
}

function removeEndingBracket(str) {
  return str.replace(/[\(\)]/g, "").trim()
}

function processCountryHtml(html) {
  const root = parser.parse(
    html.replace("tab-digital-nomad-guide ", "tab-digital-nomad-guide"),
    {
      parseNoneClosedTags: true,
    }
  )

  // Extract the "scores" section
  const scoreElements = root.querySelectorAll("tr[data-key][data-value]")
  const scores = scoreElements.reduce((acc, el) => {
    const key = el.getAttribute("data-key")
    const value = el.getAttribute("data-value")
    acc[key] = value
    return acc
  }, {})

  // Extract the "details" section
  const detailsTables = root.querySelectorAll("table.details")

  const details = {}
  detailsTables.forEach((detailsTable) => {
    const rows = detailsTable
      .querySelectorAll("tr")
      .filter(
        (row) =>
          !row.hasAttribute("data-key") && !row.hasAttribute("data-value")
      )

    rows.forEach((row) => {
      const keyElement = row.querySelector(".key")
      const valueElement = row.querySelector(".value")
      const imgElement = valueElement ? valueElement.querySelector("img") : null
      const linkElement = valueElement ? valueElement.querySelector("a") : null
      const logoElement = valueElement
        ? valueElement.querySelector("img.brand-logo")
        : null

      let additionalAttributes = {}
      let value = ""

      if (valueElement && valueElement.querySelector(".filling")) {
        value = valueElement.querySelector(".filling").text.trim()
      } else if (valueElement) {
        value = valueElement.text.trim()
      }

      if (imgElement) {
        additionalAttributes.image_url = imgElement.getAttribute("src")
      }

      if (linkElement) {
        const link = linkElement.getAttribute("href")
        if (isValidURL(link)) {
          additionalAttributes.url = removeRefParameter(link)
        }
      }

      if (logoElement) {
        additionalAttributes.logo_url = logoElement.getAttribute("src")
      }

      const key = keyElement ? cleanKeyText(keyElement.text) : null

      if (key) {
        details[key] = {
          value: value,
          ...additionalAttributes,
        }
      }
    })
  })

  // Extract the "pros-cons" section
  const prosAndConsSection = root.querySelector(".tab-pros-cons")
  const prosCons = { pros: [], cons: [] }

  if (prosAndConsSection) {
    const divs = prosAndConsSection.querySelectorAll("div")

    if (divs.length >= 2) {
      const prosElements = divs[0].querySelectorAll("p")
      const consElements = divs[1].querySelectorAll("p")

      prosElements.forEach((p) => {
        prosCons.pros.push(p.textContent.replace("✅ ", "").trim())
      })

      consElements.forEach((p) => {
        prosCons.cons.push(p.textContent.replace("❌ ", "").trim())
      })
    }
  }

  // Extract the "reviews" section
  const reviewsSection = root.querySelector(".tab-reviews .reviews")
  const reviews = []

  if (reviewsSection) {
    const reviewElements = reviewsSection.querySelectorAll(
      '.review[itemprop="review"]'
    )

    reviewElements.forEach((reviewEl) => {
      const reviewText =
        reviewEl
          .querySelector('.review-text[itemprop="reviewBody"]')
          ?.textContent.trim() || ""
      if (reviewText) {
        reviews.push(reviewText)
      }
    })
  }

  // Combine scores and details into a single JSON object
  return {
    scores: scores,
    details: details,
    pros_cons: prosCons,
    reviews: reviews,
  }
}

async function main() {
  const result = {}
  const files = fs.readdirSync(dataDir)

  const filePromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const filePath = path.join(dataDir, file)
      fs.readFile(filePath, "utf8", (err, html) => {
        if (err) {
          console.error("Error reading HTML file:", err)
          reject(err)
          return
        }

        const countryName = file.replace("_page.html", "")
        const countryData = processCountryHtml(html)
        result[countryName] = countryData
        resolve()
      })
    })
  })

  await Promise.all(filePromises)

  // Save the resulting JSON to a file
  const jsonPath = path.join(outputDir, "output.json")
  fs.writeFile(
    jsonPath,
    JSON.stringify(result, null, 2),
    "utf8",
    (writeErr) => {
      if (writeErr) {
        console.error("Error writing JSON file:", writeErr)
        return
      }
      console.log("Data has been written to output.json")
    }
  )
}

main().catch(console.error)
