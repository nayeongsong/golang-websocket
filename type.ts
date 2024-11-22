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
