#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '../src/lib/data')

const SPARQL_QUERY = fs.readFileSync(path.join(__dirname, 'languages.sql'), 'utf-8')

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
      } else if (key === 'writingSystems' || key === 'families' || key === 'nativeNames') {
        simplified[key] = value.value.split(', ').filter(Boolean)
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
  console.log('\nTop languages by native speakers:')
  console.log('ISO\tLanguage\tNative Speakers\tCountries')
  console.log('-'.repeat(100))
  
  for (const lang of simplifiedData.slice(0, 10)) {
    const iso = lang.iso
    const name = lang.langLabel.padEnd(15)
    const native = lang.nativeSpeakers?.toLocaleString() || '-'
    const countries = Array.isArray(lang.countries) ? lang.countries.slice(0, 3).join(', ') + (lang.countries.length > 3 ? '...' : '') : '-'
    
    console.log(`${iso}\t${name}\t${native}\t${countries}`)
  }
  
  console.log(`\nFull data written to ${outputPath}`)
  console.log(`Retrieved ${simplifiedData.length} unique languages`)
}

fetchWikidataSpeakers().catch(console.error)
