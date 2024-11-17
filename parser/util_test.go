package parser

import (
	"fmt"
	"log"
	"testing"
)

func TestExtractCountries(t *testing.T) {
	jsonFilePath := nomadOutputDir + "/output.json"
	countryList, err := extractCountryNames(jsonFilePath)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Country List:", countryList)
}
