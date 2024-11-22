import OpenAI from "openai"
import fs from "fs"
import * as dotenv from "dotenv"

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
You are a helpful assistant specialized in generating brief descriptions of cities. Your responses should be in clear, user-friendly English, suitable for a general audience, including non-native speakers. Your task is to provide a balanced view of each city by prioritizing key aspects mentioned in user reviews. Supplement with additional city information only if the reviews lack certain details. Ensure the descriptions are concise, informative, and written in a friendly tone.

Focus on the following aspects, based on user reviews:
- Positive and negative aspects of living in the city.
- Culture, cost of living, public transportation, and safety.
- Notable attractions, unique characteristics, and local customs.
- Challenges such as language barriers, high costs, or limited public transportation.

If user reviews are too focused on "digital nomad" topics, generalize the information to make it relevant for all travelers and residents, not just digital nomads. If reviews do not cover these topics, add relevant city information to provide a complete overview:

- Natural scenery, amenities, and quality of life.
- Popular activities and historical aspects.
- Recommended neighborhoods, necessary precautions, or specific cultural considerations.

Keep descriptions between 150 to 200 words and use simple language. Avoid making it sound too formal or AI-generated, and do not mention topics related to nomads.com or cannabis.
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
    if (reviews.length !== 0 && !citiesData[city].description) {
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
  const filePath = "./city_data_output/trimmed_output.json"
  const jsonData = readCitiesJSONData(filePath)
  //await extractDescriptionFromReviews(jsonData, filePath)
  await translateDescriptionToKorean(jsonData, filePath)
}

main()
