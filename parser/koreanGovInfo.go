package parser

import (
	"fmt"
	"io"
	"net/http"

	"github.com/biter777/countries"
)

func fetchInfo(countryList []string, endpoint string, outputDir string) error {
	for _, country := range countryList {
		countryISOCode := countries.ByName(country).Alpha2()
		if countryISOCode == "" {
			fmt.Printf("No ISO code found for country: %s\n", country)
			continue
		}

		url := fmt.Sprintf(KoreanGovernmentBaseURL+endpoint, ServiceKey, countryISOCode)

		response, err := http.Get(url)
		if err != nil {
			fmt.Printf("Error occurred while processing %s: %v\n", country, err)
			continue
		}
		defer response.Body.Close()

		if response.StatusCode == http.StatusOK {
			body, err := io.ReadAll(response.Body)
			if err != nil {
				fmt.Printf("Error reading response for %s: %v\n", country, err)
				continue
			}

			if err := saveJSONToFile(countryISOCode, body, outputDir); err != nil {
				fmt.Printf("Error saving file for %s: %v\n", country, err)
			}
		} else {
			fmt.Printf("Failed to retrieve info for %s. Status code: %d\n", country, response.StatusCode)
		}
	}

	return nil
}
