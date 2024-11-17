package parser

import (
	"fmt"
	"log"
)

type Details struct {
	Country struct {
		Value string `json:"value"`
	} `json:"country"`
}

type CityData struct {
	Details Details `json:"details"`
}

func fetchEmbassyInfo(countryList []string) error {
	return fetchInfo(countryList, EmbassyEndpoint, embassyOutputDir)
}

func fetchVisaInfo(countryList []string) error {
	return fetchInfo(countryList, VisaEndpoint, visaOutputDir)
}

func GetEmbassyInfo() {
	jsonFilePath := nomadOutputDir + "/output.json"
	countryISOcodeList, err := extractCountryNames(jsonFilePath)
	if err != nil {
		log.Fatal("Something went wrong while extracting country names.")
	}

	if err := fetchEmbassyInfo(countryISOcodeList); err != nil {
		fmt.Printf("Error fetching embassy information: %v\n", err)
	}
}

func GetVisaInfo() {
	jsonFilePath := nomadOutputDir + "/output.json"
	countryISOcodeList, err := extractCountryNames(jsonFilePath)
	if err != nil {
		log.Fatal("Something went wrong while extracting country names.")
	}

	// Fetch embassy information for the list of countries
	if err := fetchVisaInfo(countryISOcodeList); err != nil {
		fmt.Printf("Error fetching embassy information: %v\n", err)
	}
}
