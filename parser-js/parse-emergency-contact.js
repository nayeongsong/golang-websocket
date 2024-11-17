const fs = require("fs")
const path = require("path")
const countryToIso = require("country-to-iso")

const jsonFilePath = path.join(__dirname, "city_data_json", "output.json")
const outputFilePath = path.join(__dirname, "emergency_contact_data_json")

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
  fetchEmergencyContactInfo().catch(console.error)
})

// Base URL to send requests to
const serviceKey =
  "DrPgu5Rwp%2B3lT1TGNdpo3EuYTiIXGkS9vyUQ4bHfNd0wm4GSfGO1%2B%2F%2FlamUytgB6OhHS4hWF9qdg58qZWfeM%2BA%3D%3D"
const baseUrl = `https://apis.data.go.kr/1262000/LocalContactService2/getLocalContactList2?serviceKey=${serviceKey}&cond[country_iso_alp2::EQ]={countryCode}`

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

// Function to save structured JSON to a file
const saveJSONToFile = (country_iso_code, jsonData) => {
  const fileName = path.join(outputFilePath, `${country_iso_code}.json`)
  fs.writeFileSync(fileName, JSON.stringify(jsonData, null, 2), "utf8")
}

// Loop through cities and fetch HTML for each
const fetchEmergencyContactInfo = async () => {
  for (const country of countryList) {
    const countryCode = countryToIso.countryToAlpha2(country)
    const url = baseUrl.replace("{countryCode}", countryCode)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    try {
      // Send GET request to the URL
      const response = await fetch(url)

      // Check if the request was successful (status code 200)
      if (response.status === 200) {
        const responseJson = await response.json()

        // Parse and restructure the data
        const transformedData = responseJson.data.map((entry) => {
          const parsedContact = parseContactRemark(entry.contact_remark)

          return {
            ...entry,
            ...parsedContact, // Add parsed fields
            contact_remark: undefined, // Remove original field if no longer needed
          }
        })

        // Save the structured data to a file
        saveJSONToFile(countryCode, transformedData)
      } else {
        console.log(
          `Failed to retrieve JSON data for ${country}. Status code: ${response.status}`
        )
      }
    } catch (error) {
      console.error(`Error occurred while processing ${country}:`, error)
    }
  }
}
