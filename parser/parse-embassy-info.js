const fs = require("fs")
const path = require("path")
const countryToIso = require("country-to-iso")

const jsonFilePath = path.join(__dirname, "city_data_json", "output.json")

let countryList = []

// Function to extract country names
function extractCountryNames(data) {
  const countryList = []

  for (const city in data) {
    if (data[city].details && data[city].details.country) {
      countryList.push(data[city].details.country.value)
    }
  }

  return [...new Set(countryList)]
}

// Read the JSON file
fs.readFile(jsonFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading JSON file:", err)
    return
  }

  const jsonData = JSON.parse(data)
  countryList = extractCountryNames(jsonData)

  // Call fetchMofaInfo after countryList is set
  fetchEmbassyInfo().catch(console.error)
})

// Base URL to send requests to
const serviceKey =
  "DrPgu5Rwp%2B3lT1TGNdpo3EuYTiIXGkS9vyUQ4bHfNd0wm4GSfGO1%2B%2F%2FlamUytgB6OhHS4hWF9qdg58qZWfeM%2BA%3D%3D"
const baseUrl = `https://apis.data.go.kr/1262000/EmbassyService2/getEmbassyList2?serviceKey=${serviceKey}&cond[country_iso_alp2::EQ]={countryCode}`

// Function to save HTML to a file
const saveJSONToFile = (country_iso_code, htmlContent) => {
  const fileName = `korea_embassy_data_json/${country_iso_code}.json`
  fs.writeFileSync(fileName, htmlContent, "utf8")
}

// Loop through cities and fetch HTML for each
const fetchEmbassyInfo = async () => {
  for (const country of countryList) {
    const countryCode = countryToIso.countryToAlpha2(country)
    const url = baseUrl.replace("{countryCode}", countryCode)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    try {
      // Send GET request to the URL
      const response = await fetch(url)

      // Check if the request was successful (status code 200)
      if (response.status === 200) {
        const response_html = await response.text()
        // Save the HTML content to a file
        saveJSONToFile(countryCode, response_html)
      } else {
        console.log(
          `Failed to retrieve HTML for ${country}. Status code: ${response.status}`
        )
      }
    } catch (error) {
      console.error(`Error occurred while processing ${country}:`, error)
    }
  }
}
