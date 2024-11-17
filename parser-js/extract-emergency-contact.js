const fs = require("fs")
const path = require("path")
const xml2js = require("xml2js")
const he = require("he")

const jsonDirPath = path.join(__dirname, "emergency_contact_data_json")
const outputJsonPath = path.join(
  __dirname,
  "emergency_contact_data_json",
  "trimmed",
  "output.json"
)

// Function to save HTML to a file
function parseContactRemark(contactRemark) {
  const fields = {}

  // Use regex to extract different fields
  const addressMatch = contactRemark.match(/ㅇ\s주소\s:\s(.*?)<br>/)
  const emailMatch = contactRemark.match(
    /ㅇ\s이메일\s:\s<a\s+href="mailto:(.*?)">/
  )
  const repNumberMatch = contactRemark.match(
    /ㅇ\s대표번호\(근무시간\s중\)\s:\s(.*?)<br>/
  )
  const emergencyContactMatch = contactRemark.match(
    /ㅇ\s긴급연락처\(.*?\)\s:\s(.*?)<br>/
  )
  const jurisdictionMatch = contactRemark.match(/ㅇ\s관할지역\s:\s(.*?)<br>/)

  // Extract general emergency services
  const policeMatch = contactRemark.match(/ㅇ\s경찰\s:\s(\d+)<br>/)
  const fireMatch = contactRemark.match(/ㅇ\s화재\s:\s(\d+)<br>/)
  const emergencyMatch = contactRemark.match(/ㅇ\sEmergency\s:\s(\d+)<br>/)
  const trafficPoliceMatch = contactRemark.match(/ㅇ\s교통경찰\s:\s(\d+)<br>/)

  // Extract medical information
  const medicalInfoMatch = contactRemark.match(
    /<h3 class="tit">의료기관 연락처<\/h3>(.*?)<\/div>/s
  )

  // Assign extracted values to fields
  fields.address = addressMatch ? addressMatch[1].trim() : null
  fields.email = emailMatch ? emailMatch[1].trim() : null
  fields.representative_number = repNumberMatch
    ? repNumberMatch[1].trim()
    : null
  fields.emergency_contact = emergencyContactMatch
    ? emergencyContactMatch[1].trim()
    : null
  fields.jurisdiction = jurisdictionMatch ? jurisdictionMatch[1].trim() : null

  fields.emergency_services = {
    police: policeMatch ? policeMatch[1] : null,
    fire: fireMatch ? fireMatch[1] : null,
    emergency: emergencyMatch ? emergencyMatch[1] : null,
    traffic_police: trafficPoliceMatch ? trafficPoliceMatch[1] : null,
  }

  fields.medical_contact = medicalInfoMatch ? medicalInfoMatch[1].trim() : null

  return fields
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
  fs.readdir(jsonDirPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err)
      return
    }

    const resultJson = {}

    files.forEach((file) => {
      if (path.extname(file) === ".xml") {
        const countryName = path.basename(file, ".xml")
        const filePath = path.join(jsonDirPath, file)
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
