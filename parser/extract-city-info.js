const path = require("path")
const fs = require("fs")
const parser = require("node-html-parser")

const dataDir = path.join(__dirname, "data")
const outputDir = path.join(__dirname, "json_data")

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

// Function to remove any ending bracket from the string
function removeEndingBracket(str) {
  return str.replace(/[\(\)]/g, "").trim()
}

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}

const html_file_path = path.join(dataDir, "zurich_page.html")

fs.readFile(html_file_path, "utf8", (err, html) => {
  if (err) {
    console.error("Error reading HTML file:", err)
    return
  }

  // Parse the HTML content
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
  detailsTables.map((detailsTable) => {
    const rows = detailsTable
      .querySelectorAll("tr")
      .filter(
        (row) =>
          !row.hasAttribute("data-key") && !row.hasAttribute("data-value")
      )

    rows.map((row) => {
      const keyElement = row.querySelector(".key")
      const valueElement = row.querySelector(".value")
      const imgElement = valueElement ? valueElement.querySelector("img") : null
      const linkElement = valueElement ? valueElement.querySelector("a") : null
      const logoElement = valueElement
        ? valueElement.querySelector("img.brand-logo")
        : null

      let additionalAttributes = {}
      if (valueElement && valueElement.querySelector(".filling")) {
        // If there is a nested div with class 'filling', get its text content
        value = valueElement.querySelector(".filling").text.trim()
      } else if (valueElement) {
        // Otherwise, get the text content of the value element
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
        console.log("logo element exist")
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
      // First <div> for pros, second <div> for cons
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
  const result = {
    scores: scores,
    details: details,
    pros_cons: prosCons,
    reviews: reviews,
  }

  // Save the resulting JSON to a file
  const jsonPath = "json_data/output.json"
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
})
