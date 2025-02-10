#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '../src/lib/data')

const SPARQL_QUERY = fs.readFileSync(path.join(__dirname, 'languages.sql'), 'utf-8')

// UNESCO status mapping
const UNESCO_STATUS = {
  "20672082": "extinct",
  "20672083": "critically endangered",
  "20672084": "severely endangered",
  "20672085": "definitely endangered",
  "20672086": "vulnerable",
  "20672087": "safe"
}

// Ethnologue status mapping
const ETHNOLOGUE_STATUS = {
  "29051540": "0 International",
  "29051541": "1 National",
  "29051542": "2 Provincial",
  "29051543": "3 Wider Communication",
  "29051544": "4 Educational",
  "29051545": "5 Developing",
  "29051546": "6a Vigorous",
  "29051547": "6b Threatened",
  "29051548": "7 Shifting",
  "29051549": "8a Moribund",
  "29051550": "8b Nearly Extinct",
  "29051551": "9 Dormant",
  "29051552": "10 Extinct"
}

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
      if (key === 'nativeSpeakers_k') {
        simplified[key] = value.value ? parseInt(value.value) : null
      } else if (key === 'countries') {
        simplified[key] = value.value.split('|')
          .map(s => s.trim())
          .filter(Boolean)
          .sort()
      } else if (key === 'writingSystems' || key === 'families' || key === 'nativeNames') {
        simplified[key] = value.value.split(', ')
          .filter(Boolean)
          .sort()
      } else if (key === 'unescoStatus') {
        const ids = value.value.split(', ').filter(Boolean)
        simplified[key] = ids.length > 0 ? UNESCO_STATUS[ids[0]] || ids[0] : null
      } else if (key === 'ethnologueStatus') {
        const ids = value.value.split(', ').filter(Boolean)
        simplified[key] = ids.length > 0 ? ETHNOLOGUE_STATUS[ids[0]] || ids[0] : null
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
  console.log('\nTop languages by native speakers (in thousands):')
  console.log('ISO\tLanguage\tNative Speakers (k)\tCountries')
  console.log('-'.repeat(100))
  
  for (const lang of simplifiedData.slice(0, 10)) {
    const iso = lang.iso
    const name = lang.langLabel.padEnd(15)
    const native = lang.nativeSpeakers_k?.toLocaleString() || '-'
    const countries = Array.isArray(lang.countries) ? lang.countries.slice(0, 3).join(', ') + (lang.countries.length > 3 ? '...' : '') : '-'
    
    console.log(`${iso}\t${name}\t${native}\t${countries}`)
  }
  
  console.log(`\nFull data written to ${outputPath}`)
  console.log(`Retrieved ${simplifiedData.length} unique languages`)
}

fetchWikidataSpeakers().catch(console.error)
