const fs = require("fs")
const path = require("path")

// List of cities you want to fetch HTML for (you can loop through this list later if needed)
const cities = [
  "bristol",
  "ko-chang",
  "lusaka",
  "vadodara",
  "ipoh",
  "ningbo",
  "seminyak-bali",
  "rhodes",
  "reykjavik",
  "hannover",
  "zagreb",
  "mendoza",
  "bursa",
  "costa-da-caparica",
  "bellingham",
  "erlangen",
  "agadir",
  "oxnard",
  "sarajevo",
  "fes",
  "gaziantep",
  "ho-chi-minh-city",
  "puerto-viejo",
  "bodrum",
  "hagatna",
  "oaxaca",
  "cork",
  "cardiff",
  "cebu",
  "handan",
  "porto-alegre",
  "tainan",
  "london",
  "boading",
  "quebec-city",
  "rimini",
  "norwich",
  "lagos",
  "santa-barbara",
  "nassau",
  "anchorage",
  "cluj",
  "guangzhou",
  "bari",
  "sheffield",
  "vilnius",
  "stockholm",
  "almaty",
  "marrakesh",
  "siargao",
  "salento",
]

// Base URL to send requests to
const baseUrl = "https://nomads.com/modal/city/{city_name}?2024-11-20"
const outputFilePath = path.join(__dirname, "city_data_html")

// Function to save HTML to a file
const saveHtmlToFile = (city, htmlContent) => {
  const fileName = path.join(outputFilePath, `${city}_page.html`)
  fs.writeFileSync(fileName, htmlContent, "utf8")
  console.log(`Successfully saved HTML for ${city} as ${fileName}`)
}

// Loop through cities and fetch HTML for each
const fetchCitiesHtml = async () => {
  for (const city of cities) {
    const url = baseUrl.replace("{city_name}", city)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    try {
      // Send GET request to the URL
      const response = await fetch(url, {
        headers: {
          referer: "https://nomads.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        },
      })

      // Check if the request was successful (status code 200)
      if (response.status === 200) {
        const response_html = await response.text()
        // Save the HTML content to a file
        saveHtmlToFile(city, response_html)
      } else {
        console.log(
          `Failed to retrieve HTML for ${city}. Status code: ${response.status}`
        )
      }
    } catch (error) {
      console.error(`Error occurred while processing ${city}:`, error)
    }
  }
}

fetchCitiesHtml()
