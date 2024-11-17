package parser

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
)

func saveJSONToFile(countryCode string, data []byte, outputDir string) error {
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	fileName := filepath.Join(outputDir, fmt.Sprintf("%s.json", countryCode))
	if err := os.WriteFile(fileName, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

func readJSONFile(jsonFilePath string) ([]byte, error) {
	file, err := os.Open(jsonFilePath)
	if err != nil {
		return nil, fmt.Errorf("error reading JSON file: %v", err)
	}
	defer file.Close()

	data, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("error reading JSON file: %v", err)
	}

	return data, nil
}

func extractCountryNames(jsonFilePath string) ([]string, error) {
	data, err := readJSONFile(jsonFilePath)
	if err != nil {
		log.Fatal(err)
	}

	var cities map[string]CityData
	if err := json.Unmarshal(data, &cities); err != nil {
		return nil, fmt.Errorf("error parsing JSON data: %v", err)
	}

	countrySet := make(map[string]struct{})
	for _, city := range cities {
		if city.Details.Country.Value != "" {
			countrySet[city.Details.Country.Value] = struct{}{}
		}
	}

	countryList := make([]string, 0, len(countrySet))
	for country := range countrySet {
		countryList = append(countryList, country)
	}

	return countryList, nil
}
