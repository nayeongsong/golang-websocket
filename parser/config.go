package parser

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var (
	ServiceKey               string
	NomadEndpoint            = "https://nomads.com/modal/city/%s?2024-11-15"
	KoreanGovernmentBaseURL  = "http://apis.data.go.kr/1262000"
	EmbassyEndpoint          = "/EmbassyService2/getEmbassyList2?serviceKey=%s&cond[country_iso_alp2::EQ]=%s&returnType=JSON"
	VisaEndpoint             = "/EntranceVisaService2/getEntranceVisaList2?serviceKey=%s&cond[country_iso_alp2::EQ]=%s&returnType=JSON"
	EmergencyContactEndpoint = "/LocalContactService2?serviceKey=%s&cond[country_iso_alp2::EQ]=%s&returnType=JSON"
)

// Data output directories
const nomadOutputDir = "output/city_data_json"
const embassyOutputDir = "output/embassy_info_json"
const visaOutputDir = "output/visa_info_json"

func init() {
	// Load environment variables from .env file
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found")
	}

	ServiceKey = os.Getenv("SERVICE_KEY")
	if ServiceKey == "" {
		log.Fatal("SERVICE_KEY missing for data.go.kr")
	}
}
