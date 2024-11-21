const fs = require("fs")

const listAllProsAndCons = (jsonFilePath) => {
  let allPros = []
  let allCons = []
  const jsonString = fs.readFileSync(jsonFilePath, "utf8")
  const jsonContent = JSON.parse(jsonString)
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

const prosAndCons = listAllProsAndCons("./city_data_output/output.json")
console.log("all pros", prosAndCons.pros)
console.log("all cons", prosAndCons.cons)
