package parser

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var cities = []string{
	"seoul", "tokyo",
}

func saveHTMLToFile(city string, htmlContent []byte) error {
	fileName := filepath.Join(NomadEndpoint, fmt.Sprintf("%s_page.html", city))
	err := os.WriteFile(fileName, htmlContent, 0644)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}
	fmt.Printf("Successfully saved HTML for %s as %s\n", city, fileName)
	return nil
}

func fetchCityHTML(city string) {
	url := fmt.Sprintf(NomadEndpoint, city)

	time.Sleep(1 * time.Second)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Printf("Error occurred while creating request for %s: %v\n", city, err)
		return
	}

	req.Header.Set("Referer", "https://nomads.com/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error occurred while processing %s: %v\n", city, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Printf("Error reading response for %s: %v\n", city, err)
			return
		}

		err = saveHTMLToFile(city, body)
		if err != nil {
			fmt.Printf("Error saving file for %s: %v\n", city, err)
		}
	} else {
		fmt.Printf("Failed to retrieve HTML for %s. Status code: %d\n", city, resp.StatusCode)
	}
}

func FetchCitiesHTML() {
	if err := os.MkdirAll(nomadOutputDir, os.ModePerm); err != nil {
		fmt.Printf("Failed to create output directory: %v\n", err)
		return
	}

	for _, city := range cities {
		fetchCityHTML(city)
	}
}
