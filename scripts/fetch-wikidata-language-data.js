#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '../src/lib/data')

// SPARQL query to get comprehensive language data
const SPARQL_QUERY = `
SELECT DISTINCT ?iso ?langLabel 
  (MAX(?nativeSpeakers_) as ?nativeSpeakers) 
  (MAX(?totalSpeakers_) as ?totalSpeakers)
  (GROUP_CONCAT(DISTINCT ?writingSystemLabel;separator=", ") as ?writingSystems)
  (GROUP_CONCAT(DISTINCT ?familyLabel;separator=", ") as ?families)
  (GROUP_CONCAT(DISTINCT ?countryLabel;separator="|") as ?countries)
  ?unescoStatus ?ethnologueStatus
  (GROUP_CONCAT(DISTINCT ?nativeName;separator=", ") as ?nativeNames)
WHERE {
  ?lang wdt:P220 ?iso.  # ISO 639-3 code
  
  # Basic info
  ?lang rdfs:label ?langLabel.
  FILTER(LANG(?langLabel) = "en")
  
  # Speakers
  OPTIONAL { ?lang wdt:P1098 ?nativeSpeakers_ }  # native speakers
  OPTIONAL { ?lang wdt:P1843 ?totalSpeakers_ }   # total speakers
  
  # Classification and identifiers
  OPTIONAL { 
    ?lang wdt:P282 ?writingSystem.
    ?writingSystem rdfs:label ?writingSystemLabel.
    FILTER(LANG(?writingSystemLabel) = "en")
  }
  OPTIONAL {
    ?lang wdt:P1394 ?family.  # language family
    ?family rdfs:label ?familyLabel.
    FILTER(LANG(?familyLabel) = "en")
  }
  
  # Geographic and cultural info
  OPTIONAL {
    ?lang wdt:P17 ?country.  # country
    ?country rdfs:label ?countryLabel.
    FILTER(LANG(?countryLabel) = "en")
  }
  
  # Status and classification
  OPTIONAL { ?lang wdt:P1999 ?unescoStatus }  # UNESCO status
  OPTIONAL { ?lang wdt:P3823 ?ethnologueStatus }  # Ethnologue status
  OPTIONAL { ?lang wdt:P1705 ?nativeName }  # native name
  
  # Only include if it has at least one speaker count
  FILTER(BOUND(?nativeSpeakers_) || BOUND(?totalSpeakers_))
}
GROUP BY ?iso ?langLabel ?unescoStatus ?ethnologueStatus
ORDER BY DESC(MAX(?nativeSpeakers_))
LIMIT 200
`

async function fetchWikidataSpeakers() {
  console.log('Fetching comprehensive language data from Wikidata...')
  
  const url = 'https://query.wikidata.org/sparql'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'AnanasDictionary/1.0 (https://github.com/mrgnw/ananas)'
    },
    body: 'query=' + encodeURIComponent(SPARQL_QUERY)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  
  // Transform the data into a simpler format
  const simplifiedData = data.results.bindings.map(row => {
    const simplified = {}
    for (const [key, value] of Object.entries(row)) {
      if (key.endsWith('Speakers')) {
        simplified[key] = value.value ? parseInt(value.value) : null
      } else if (key === 'countries') {
        simplified[key] = value.value.split('|').map(s => s.trim()).filter(Boolean)
      } else if (key.endsWith('s') && value.value.includes(',')) {
        simplified[key] = value.value.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        simplified[key] = value.value
      }
    }
    return simplified
  })
  
  // Save simplified results to JSON
  const outputPath = path.join(OUTPUT_DIR, 'wikidata-languages.json')
  fs.writeFileSync(
    outputPath,
    JSON.stringify(simplifiedData, null, 2)
  )
  
  // Print a summary of the first few languages
  console.log('\nTop languages by native speaker count:')
  console.log('ISO\tLanguage\tNative Speakers\tTotal Speakers\tCountries')
  console.log('-'.repeat(100))
  
  for (const lang of simplifiedData.slice(0, 10)) {
    const iso = lang.iso
    const name = lang.langLabel.padEnd(15)
    const native = lang.nativeSpeakers?.toLocaleString() || '-'
    const total = lang.totalSpeakers?.toLocaleString() || '-'
    const countries = Array.isArray(lang.countries) ? lang.countries.slice(0, 3).join(', ') + (lang.countries.length > 3 ? '...' : '') : '-'
    
    console.log(`${iso}\t${name}\t${native}\t${total}\t${countries}`)
  }
  
  console.log(`\nFull data written to ${outputPath}`)
  console.log(`Retrieved ${simplifiedData.length} unique languages`)
}

fetchWikidataSpeakers().catch(console.error)
