import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import slugify from "slugify"
import dotenv from "dotenv"
import fs from "fs"

dotenv.config()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

enum AttractionTypes {
  HistoricalSite = "historical_site",
  Landmark = "landmark",
  CulturalSite = "cultural_site",
  ShoppingDistrict = "shopping_district",
  AmusementPark = "amusement_park",
  ReligiosSite = "religious_site",
  RecreationArea = "recreational_area",
  Market = "market",
  MuseumArt = "museum_and_art",
  Park = "park",
}

type PlaceCountry = {
  city: string
  country: string
}

const placeCountryMap: PlaceCountry[] = [
  { city: "Seoul", country: "South Korea" },
  { city: "Busan", country: "South Korea" },
]

const Attraction = z.object({
  name: z.string(),
  category: z.nativeEnum(AttractionTypes),
  description: z.string(),
  location: z.string(),
})

const outputFilePath = "attractions.json"
const AtractionsResponse = z.object({ attractions: z.array(Attraction) })
let currentData = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"))
type AttractionType = z.infer<typeof Attraction>

async function generateAttractions() {
  const attractionsByCity: Record<string, any> = {}

  // Initialize the JSON file with an empty object

  fs.writeFileSync(outputFilePath, JSON.stringify(currentData))

  for (const { city, country } of placeCountryMap) {
    currentData = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"))
    const slugifiedCity = slugify(city, { lower: true })

    if (slugifiedCity in currentData) {
      console.log(`Attractions for ${city} already exist in ${outputFilePath}`)
      continue
    }

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a travel assistant. Generate a list of the top 10 attractions in the specified city. Provide the name, category (choose from historical_site, landmark, cultural_site, shopping_district, amusement_park, religious_site, recreational_area, market, museum_and_art, park), a brief description, and the location for each attraction. Ensure the information is accurate and relevant to tourists. If there are fewer than 10 attractions, provide as many as possible.",
        },
        {
          role: "user",
          content: `City name is ${city}, Country name is ${country}`,
        },
      ],
      response_format: zodResponseFormat(AtractionsResponse, "attractions"),
    })

    const attractions = completion.choices[0].message.parsed?.attractions
    if (attractions) {
      attractionsByCity[slugifiedCity] = { attractions }
    }

    // Update the data with the new city attractions
    currentData[slugifiedCity] = { attractions }

    // Write the updated data back to the file
    fs.writeFileSync(outputFilePath, JSON.stringify(currentData, null, 2))

    console.log(`Attractions for ${city} written to ${outputFilePath}`)
  }

  return attractionsByCity
}

generateAttractions()
