import OpenAI from "openai"
import fs from "fs"
import * as dotenv from "dotenv"

interface CitiesData {
  [countryName: string]: CityData
}

interface CityData {
  scores: Scores
  city_traits: CityTraits
  reviews: string[]
  description: string | null
  description_kor: string | null
}

interface Scores {
  life_score: string
  family_score: string
  community_score: string
  leisure_quality: string
  racial_tolerance: string
  education_index_score: string
  english_speaking: string
  walkScore_score: string
  road_traffic_score: string
  airlines_score: string
  lost_luggage_score: string
  top_hospital_score: string
  happiness_score: string
  nightlife: string
  wifi_availability: string
  places_to_work_score: string
  press_freedom_index_score: string
  female_friendly: string
  lgbt_friendly: string
  startup_score: string
  foreign_land_ownership: string
  safety: string
  food_safety: string
  lack_of_crime: string
  power_grid: string
  vulnerability_to_climate_change: string
}

interface CityTraits {
  cost_usd: string
  internet_speed_mbps: string
  income_level_usd: string
  average_trip_length_days: string
  power: string
  tipping: string
  return_rate_percentage: string
  gdp_per_capita_usd: string
  cost_of_living_for_nomad_usd: string
  cost_of_living_for_expat_usd: string
  cost_of_living_for_family_usd: string
  cost_of_living_for_local_usd: string
  airbnb_median_price_usd: string
  hotel_median_price_usd: string
  beer_in_cafe_usd: string
  coffee_in_cafe_usd: string
  average_meal_price_usd: string
  non_alcoholic_drink_in_cafe_usd: string
  apartment_cost_usd: string
  coworking_cost_usd: string
  intl_school_cost_yearly_usd: string
  taxi_cost_per_km_usd: string
  mobile_cost_per_minute_usd: string
  country: string
}

dotenv.config()

const readCitiesJSONData = (jsonFilePath: string): CitiesData => {
  const jsonString = fs.readFileSync(jsonFilePath, "utf8")
  return JSON.parse(jsonString) as CitiesData
}

const writeCitiesJSONData = (filePath: string, data: CitiesData) => {
  const jsonData = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, jsonData, "utf-8")
}

const createCityDescription = async ({
  cityName,
  countryName,
  cityReviews,
}: {
  cityName: string
  countryName: string
  cityReviews: string[]
}): Promise<string | null> => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const systemPrompt = `
You are a travel assistant. Your task is to generate a casual and engaging description of the city in website frontpage, based on genuine reviews from people who have visited the city. The description should feel like you're introducing the city to the audience in friendly tone. Use the provided reviews to highlight the city's unique experiences, pros, and cons, while keeping the tone conversational and approachable. Avoid using generic descriptions and focus on the personal insights and experiences shared in the reviews."

Focus on the following aspects:
- Positive and negative aspects of living in the city.
- Culture, cost of living, public transportation, and safety.
- Notable attractions, unique characteristics, and local customs.
- Challenges such as language barriers, high costs, or limited public transportation.
- Practical tips for visitors and residents.
- Popular activities and historical aspects.
- Recommended neighborhoods, necessary precautions, or specific cultural considerations.

Avoid description with starting with "welcome to". Avoid using too fancy English words, as the audience is non-native
Keep descriptions between 150 to 200 words and use simple language. Avoid making it sound too formal, and ensure it doesn't reference review sources directly. Additionally, DO NOT mention any topics related to "nomads.com" or cannabis.
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Please provide a brief description of the city ${cityName} located at ${countryName} based on the reviews of this city: ${cityReviews.join(
          " "
        )}`,
      },
    ],
  })

  const description = completion.choices[0].message.content
  return description
}

const translateDescription = async (
  cityDescription: string
): Promise<string | null> => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const systemPrompt = `Please rewrite the following Korean text to make it sound more natural and fluent, suitable for native Korean speakers:

[Insert your Korean text here]`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: cityDescription,
      },
    ],
  })

  const descriptionKor = completion.choices[0].message.content
  return descriptionKor
}

const extractDescriptionFromReviews = async (
  citiesData: CitiesData,
  filePath: string
) => {
  for (const city of Object.keys(citiesData)) {
    const reviews = citiesData[city].reviews
    if (reviews.length !== 0) {
      const description = await createCityDescription({
        cityName: city,
        countryName: citiesData[city].city_traits.country,
        cityReviews: reviews,
      })
      citiesData[city].description = description
      writeCitiesJSONData(filePath, citiesData)
      console.log(`description generated for city ${city}`)
    }
  }
}

const translateDescriptionToKorean = async (
  citiesData: CitiesData,
  filePath: string
) => {
  for (const city of Object.keys(citiesData)) {
    const korean_description = citiesData[city].description_kor
    if (korean_description) {
      const koreanDescription = await translateDescription(korean_description)
      citiesData[city].description_kor = koreanDescription
      writeCitiesJSONData(filePath, citiesData)
      console.log(`Korean description generated for city ${city}`)
    }
  }
}

const main = async () => {
  const filePath = "./city_data_output/openai_output.json"
  const jsonData = readCitiesJSONData(filePath)
  //await extractDescriptionFromReviews(
  //  jsonData,
  //  "./city_data_output/openai_output.json"
  //)
  await translateDescriptionToKorean(jsonData, filePath)
}

main()
