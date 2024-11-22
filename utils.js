const fs = require("fs")

const readJsonFile = (jsonFilePath) => {
  const jsonString = fs.readFileSync(jsonFilePath, "utf8")
  const jsonContent = JSON.parse(jsonString)
  return jsonContent
}

const listAllProsAndCons = (jsonFilePath) => {
  let allPros = []
  let allCons = []
  const jsonContent = readJsonFile(jsonFilePath)
  for (const country of Object.keys(jsonContent)) {
    allPros = [...allPros, ...jsonContent[country].pros_cons.pros]
    allCons = [...allCons, ...jsonContent[country].pros_cons.cons]
  }

  const rankedPros = {}
  const rankedCons = {}
  for (const pro of allPros) {
    if (!rankedPros[pro]) {
      rankedPros[pro] = 1
    } else {
      rankedPros[pro] += 1
    }
  }
  for (const con of allCons) {
    if (!rankedCons[con]) {
      rankedCons[con] = 1
    } else {
      rankedCons[con] += 1
    }
  }

  return {
    pros: Object.keys(rankedPros)
      .map((pro) => [pro, rankedPros[pro]])
      .sort((a, b) => b[1] - a[1]),
    cons: Object.keys(rankedCons)
      .map((con) => [con, rankedCons[con]])
      .sort((a, b) => b[1] - a[1]),
  }
}

const listAllAttributes = (jsonFilePath) => {
  const jsonContent = readJsonFile(jsonFilePath)

  // Define the attributes and their paths
  const attributesMap = {
    safety: "details.safety.value",
    food_safety: "details.food_safety.value",
    lack_of_crime: "details.lack_of_crime.value",
    power_grid: "details.power_grid.value",
    climate_change_vulnerability:
      "details.vulnerability_to_climate_change.value",
  }

  const extractAttributes = (path) => {
    const keys = path.split(".")
    return Object.values(jsonContent)
      .map((item) => {
        try {
          return keys.reduce((obj, key) => obj?.[key], item)
        } catch {
          return undefined // Handle missing attributes safely
        }
      })
      .filter((value) => value !== undefined) // Remove undefined values
  }

  const attributes = {}
  for (const [key, path] of Object.entries(attributesMap)) {
    attributes[key] = [...new Set(extractAttributes(path))]
  }

  return attributes
}

const transformAttributesToScores = (jsonFilePath) => {
  const jsonContent = readJsonFile(jsonFilePath)

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

  for (const country of Object.keys(jsonContent)) {
    const scores = {}

    for (const attr of attributes) {
      const valuePath = `details.${attr}.value`

      try {
        const currentValue = valuePath
          .split(".")
          .reduce((obj, key) => obj?.[key], jsonContent[country])
          ?.trim()
          ?.toLowerCase()

        const score = scoreMapping[currentValue]

        if (score !== undefined) {
          scores[attr] = String(score)

          // Remove the original attribute
          delete jsonContent[country].details[attr]
        }
      } catch (error) {
        console.error(`Error processing ${attr} for ${country}:`, error)
        continue
      }
    }

    jsonContent[country].scores = { ...jsonContent[country].scores, ...scores }
  }

  return jsonContent
}

// Example usage
function main() {
  const updatedJson = transformAttributesToScores(
    "./city_data_output/output.json"
  )
  fs.writeFile(
    "./city_data_output/trimmed_output.json",
    JSON.stringify(updatedJson, null, 2),
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

console.log(listAllProsAndCons("./city_data_output/trimmed_output.json"))
