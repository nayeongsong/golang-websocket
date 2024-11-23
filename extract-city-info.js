const path = require("path")
const fs = require("fs")
const parser = require("node-html-parser")

const htmlDataDir = path.join(__dirname, "city_data_html")
const outputDir = path.join(__dirname, "city_data_output")

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

const transformAttributesToScores = (countryContent) => {
  const scoreMapping = {
    "🧨 Conflict / political instability": 0,
    "very bad": 1,
    bad: 2,
    okay: 3,
    good: 4,
    great: 5,
  }

  // All the attributes that we want to map to scores
  const attributes = [
    "safety",
    "food_safety",
    "lack_of_crime",
    "power_grid",
    "vulnerability_to_climate_change",
  ]

  const scores = {}

  for (const attr of attributes) {
    const valuePath = `details.${attr}.value`

    try {
      const currentValue = valuePath
        .split(".")
        .reduce((obj, key) => obj?.[key], countryContent)
        ?.trim()
        ?.toLowerCase()

      const score = scoreMapping[currentValue]
      if (score !== undefined) {
        scores[attr] = String(score)

        // Remove the original attribute
        delete countryContent.details[attr]
      }
    } catch (error) {
      console.error(`Error processing ${attr} for ${valuePath}:`, error)
      continue
    }
  }

  countryContent.scores = { ...countryContent.scores, ...scores }
}

const extractCityTraits = (countryContent) => {
  const city_traits = {}
  const details = countryContent?.details

  for (const key of Object.keys(details)) {
    const costPattern = /\$\s?([\d,]+)/
    const valueString = details[key]?.value

    const costMatch = valueString.match(costPattern)

    if (costMatch && costMatch[1]) {
      const costValue = parseFloat(costMatch[1].replace(/,/g, ""))
      if (costValue) {
        const newKey = `${key}_usd`
        city_traits[newKey] = costValue
      }
    }

    if (key === "internet") {
      const internetPattern = /([\d.]+)Mbps/
      const internetMatch = valueString.match(internetPattern)
      if (internetMatch && internetMatch[1]) {
        const internetValue = parseFloat(internetMatch[1])
        countryContent.details.internet.value = internetValue
        if (internetValue) {
          city_traits["internet_speed_mbps"] = internetValue
        }
      }
    }

    if (key === "power") {
      city_traits["power"] = valueString
    }

    if (key === "average_trip_length") {
      const tripLengthPattern = /(\d+)\s+days/
      const tripLengthMatch = valueString.match(tripLengthPattern)
      if (tripLengthMatch && tripLengthMatch[1]) {
        const tripLengthValue = parseFloat(tripLengthMatch[1])
        city_traits["average_trip_length_days"] = tripLengthValue
      }
    }

    if (key === "tipping") {
      const tippingPattern = /(\d+(\.\d+)?)%/
      const tippingMatch = valueString.match(tippingPattern)
      if (tippingMatch && tippingMatch[1]) {
        const tippingValue = parseFloat(tippingMatch[1], 10)
        city_traits["tipping"] = tippingValue
      } else if (valueString.toLowerCase() === "no") {
        city_traits["tipping"] = 0
      }
    }

    if (key === "return_rate") {
      const returnRatePattern = /(\d+)%/
      const returnRateMatch = valueString.match(returnRatePattern)
      if (returnRateMatch && returnRateMatch[1]) {
        const returnRateValue = parseInt(returnRateMatch[1], 10)
        city_traits.return_rate_percentage = returnRateValue
      }
    }

    if (key === "gdp_per_capita") {
      const gdpPattern = /\$\s?([\d,]+)/
      const gdpMatch = valueString.match(gdpPattern)
      if (gdpMatch && gdpMatch[1]) {
        const gdpValue = parseFloat(gdpMatch[1].replace(/,/g, ""))
        city_traits.gdp_per_capita_usd = gdpValue
      }
    }
  }

  countryContent.city_traits = city_traits
}

const extractCountryTraits = (countryContent) => {
  const country_traits = {}
  const details = countryContent?.details

  for (const key of Object.keys(details)) {
    if (
      key === "online_electronics_shop" ||
      key === "apartment_listings" ||
      key === "best_short_haul_airline" ||
      key === "best_intnl_airline" ||
      key === "best_hospital"
    ) {
      country_traits[key] = details[key]
    }
  }

  countryContent.country_traits = country_traits
}

async function main() {
  const result = {}
  const files = fs.readdirSync(htmlDataDir)

  const filePromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const filePath = path.join(htmlDataDir, file)
      fs.readFile(filePath, "utf8", (err, html) => {
        if (err) {
          console.error("Error reading HTML file:", err)
          reject(err)
          return
        }

        const countryName = file.replace("_page.html", "")
        let countryData = processCountryHtml(html)
        transformAttributesToScores(countryData)
        extractCityTraits(countryData)
        extractCountryTraits(countryData)
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
