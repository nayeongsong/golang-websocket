const fs = require("fs")
const path = require("path")
const xml2js = require("xml2js")
const he = require("he")

const xmlDirPath = path.join(__dirname, "korea_mofa_data", "xml_data")
const outputJsonPath = path.join(
  __dirname,
  "korea_mofa_data",
  "json_data",
  "output.json"
)

// Function to extract and transform information
function extractInformation(basicInfo) {
  const information = {}

  const locationMatch = basicInfo.match(/ㅇ 위치\s*:\s*(.*?)<br>/)
  information.location = locationMatch ? locationMatch[1].trim() : null

  const countrySizeMatch = basicInfo.match(/ㅇ 면적\s*:\s*(.*?)<br>/)
  information.country_size = countrySizeMatch
    ? countrySizeMatch[1].trim()
    : null
  
  const languageMatch = basicInfo.match(/ㅇ 언어\s*:\s*(.*?)<br>/)
  information.language = languageMatch ? languageMatch[1].trim() : null

  const raceMatch = basicInfo.match(/ㅇ 인종\s*:\s*(.*?)<br>/)
  information.race = raceMatch ? raceMatch[1].trim() : null

  const religionMatch = basicInfo.match(/ㅇ 종교\s*:\s*(.*?)<br>/)
  information.religion = religionMatch ? religionMatch[1].trim() : null

  const timeZoneMatch = basicInfo.match(/ㅇ 시차\s*:\s*(.*?)<br>/)
  information.time_zone = timeZoneMatch ? timeZoneMatch[1].trim() : null

  const currencyMatch = basicInfo.match(/ㅇ 화폐단위\s*:\s*(.*?)<br>/)
  information.currency = currencyMatch ? currencyMatch[1].trim() : null
  return information
}

function processXmlFile(filePath, countryName, resultJson) {
  const data = fs.readFileSync(filePath, "utf8")

  xml2js.parseString(data, (err, result) => {
    if (err) {
      console.error(`Error parsing XML for ${countryName}:`, err)
      return
    }

    try {
      const basicInfoEncoded = result.response.body[0].items[0].item[0].basic[0]
      const basicInfo = he.decode(basicInfoEncoded) // Decode HTML entities
      console.log("basic info", basicInfo)
      const extractedInfo = extractInformation(basicInfo)
      resultJson[countryName] = extractedInfo
    } catch (e) {
      console.error(`Error extracting information for ${countryName}:`, e)
      // Skip this file and continue
    }
  })
}

async function main() {
  // Read directory and process each XML file
  fs.readdir(xmlDirPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err)
      return
    }

    const resultJson = {}

    files.forEach((file) => {
      if (path.extname(file) === ".xml") {
        const countryName = path.basename(file, ".xml")
        const filePath = path.join(xmlDirPath, file)
        processXmlFile(filePath, countryName, resultJson)
      }
    })

    // Save the result JSON to a file
    fs.writeFile(
      outputJsonPath,
      JSON.stringify(resultJson, null, 2),
      "utf8",
      (err) => {
        if (err) {
          console.error("Error writing JSON file:", err)
          return
        }
        console.log("Successfully saved JSON data to", outputJsonPath)
      }
    )
  })
}

main().catch(console.error)
