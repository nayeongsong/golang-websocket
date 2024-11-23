import OpenAI from "openai"
import fs from "fs"
import * as dotenv from "dotenv"

interface CitiesData {
  [countryName: string]: CityData
}

interface CityData {
  scores: Scores
  details: Details
  pros_cons: ProsCons
  reviews: string[]
  description: string | null
  description_kor: string | null
}

interface Scores {
  life_score: string
  family_score: string
  community_score: string
  leisure_quality: string
  education_index_score: string
  english_speaking: string
  walkScore_score: string
  road_traffic_score: string
  airlines_score: string
  lost_luggage_score: string
  happiness_score: string
  nightlife: string
  wifi_availability: string
  places_to_work_score: string
  ac_availability: string
  friendliness_to_foreigners: string
  female_friendly: string
  lgbt_friendly: string
  startup_score: string
  apartment_cost: string
  coworking_cost: string
  average_meal_price: string
  non_alcoholic_drink_in_cafe: string
  beer_in_cafe: string
  coffee_in_cafe: string
  safety: string
  food_safety: string
  power_grid: string
}

interface Details {
  total_score: DetailValue
  cost: DetailValue
  internet: DetailValue
  temperature_now: DetailValue
  humidity_now: DetailValue
  income_level: DetailValue
  people_density: DetailValue
  continent: DetailValue
  country: DetailValue
  average_trip_length: DetailValue
  internet_speed_avg: DetailValue
  weather_now: DetailValue
  travel_medical_insurance: DetailValueWithUrl
  "1_000_xof_in_usd": DetailValue
  suggested_atm_take_out: DetailValue
  best_coworking_space: DetailValueWithUrl
  best_coffee_place: DetailValueWithUrl
  best_alt_coffee_place: DetailValueWithUrl
  tap_water: DetailValueWithUrl
  population: DetailValue
  gdp_per_capita: DetailValue
  population_density: DetailValue
  gender_ratio_population: DetailValue
  gender_ratio_young_adults: DetailValue
  gender_ratio_nomads: DetailValue
  religious_government: DetailValue
  apartment_listings: DetailValueWithUrl
  best_short_haul_air_carrier: DetailValueWithUrl
  best_int_l_air_carrier: DetailValueWithUrl
  best_hospital: DetailValueWithUrl
  cost_of_living_for_nomad: DetailValue
  cost_of_living_for_expat: DetailValue
  cost_of_living_for_family: DetailValue
  cost_of_living_for_local: DetailValue
  airbnb_median_price: DetailValueWithUrl
  hotel_median_price: DetailValue
}

interface DetailValue {
  value: string
}

interface DetailValueWithUrl extends DetailValue {
  url?: string
  image_url?: string
  logo_url?: string
}

interface ProsCons {
  pros: string[]
  cons: string[]
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
You are a helpful assistant specialized in generating brief, engaging descriptions of cities. Your responses should be in clear, user-friendly English, suitable for a general audience, including non-native speakers.

Your task is to provide a balanced view of each city by prioritizing key aspects mentioned in user reviews and supplementing with additional information if needed. Ensure the descriptions are concise, informative, and written in a friendly, conversational tone.

Focus on the following aspects:
- Positive and negative aspects of living in the city.
- Culture, cost of living, public transportation, and safety.
- Notable attractions, unique characteristics, and local customs.
- Challenges such as language barriers, high costs, or limited public transportation.
- Practical tips for visitors and residents.

f user reviews are too focused on "digital nomad" topics, generalize the information to make it relevant for all travelers and residents. If reviews do not cover these topics, add relevant city information to provide a complete overview:

- Natural scenery, amenities, and quality of life.
- Popular activities and historical aspects.
- Recommended neighborhoods, necessary precautions, or specific cultural considerations.

Keep descriptions between 150 to 200 words and use simple language. Avoid making it sound too formal or AI-generated, and ensure it doesn't reference review sources directly. Additionally, DO NOT mention any topics related to "nomads.com" or cannabis.
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

  const systemPrompt = `You are a translation assistant specialized in translating English text into smooth and natural Korean. Your task is to translate city descriptions from English to Korean, ensuring that the translation is accurate, fluent, and culturally appropriate. Pay attention to context and nuance to maintain the original meaning and tone.

    Example Input: "Austin, Texas, is a vibrant city known for its lively culture and a strong tech scene. Many residents appreciate the high-quality food options, particularly the local BBQ and Tex-Mex cuisine. The centralized area around Lady Bird Lake is popular for its scenic views and walking paths, making it great for outdoor activities like running, biking, or simply enjoying the sunshine."

    Example Output: "오스틴, 텍사스는 활기찬 문화와 강력한 기술 산업으로 유명한 도시입니다. 많은 주민들은 특히 현지 BBQ와 텍스멕스 요리를 포함한 고품질의 음식 옵션을 높이 평가합니다. 레이디 버드 호수 주변의 중심 지역은 경치 좋은 풍경과 산책로로 유명하여 달리기, 자전거 타기 또는 단순히 햇볕을 즐기기에 좋습니다."

    Ensure that the translations are coherent and maintain the essence of the original English description.`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Please translate this sentence into Korean: ${cityDescription}`,
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
        countryName: citiesData[city].details.country.value,
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
    const description = citiesData[city].description
    if (description) {
      const koreanDescription = await translateDescription(description)
      citiesData[city].description_kor = koreanDescription
      writeCitiesJSONData(filePath, citiesData)
      console.log(`Korean description generated for city ${city}`)
    }
  }
}

const main = async () => {
  const filePath = "./city_data_output/output.json"
  const jsonData = readCitiesJSONData(filePath)
  await extractDescriptionFromReviews(jsonData, filePath)
  //await translateDescriptionToKorean(jsonData, filePath)
}

main()
