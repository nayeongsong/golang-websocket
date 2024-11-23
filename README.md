## 1. parse-city-info.js

As a very first step, this parses very first information as html format

## 2. extract-city-info.js

Extract the relevant information from html and write the result into "city_output.json" and "country_output.json".
city_output contains the scores, city traits information.
country_output contains best taxi app, best short haul/international airline, best hospital and apartment listing of the country.

## 3. openai-util.ts
Extract the AI generated description both in English & Korean from the people's reviews.
Final output is named as "openai_output.json".