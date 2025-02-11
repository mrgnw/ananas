#!/usr/bin/env bun
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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
  const languages = data.results.bindings.map(lang => {
    // First create object with iso codes first
    const obj = {
      iso: lang.iso.value,
      iso1: lang.iso1?.value || null
    }

    // Then add remaining properties in alphabetical order
    const sortedProps = Object.entries({
      countries: lang.countries?.value.split('|').filter(Boolean).sort() || [],
      ethnologueStatus: lang.ethnologueStatus?.value ? ETHNOLOGUE_STATUS[lang.ethnologueStatus.value] : null,
      langLabel: lang.langLabel.value,
      nativeNames: lang.nativeNames?.value.split(', ').filter(Boolean).sort() || [],
      nativeSpeakers_k: parseInt(lang.nativeSpeakers_k.value),
      unescoStatus: lang.unescoStatus?.value ? UNESCO_STATUS[lang.unescoStatus.value] : null,
      writingSystems: lang.writingSystems?.value.split(', ').filter(Boolean).sort() || []
    }).sort(([a], [b]) => a.localeCompare(b))

    return Object.assign(obj, Object.fromEntries(sortedProps))
  })

  // Write to file
  const outputPath = path.join(OUTPUT_DIR, 'wikidata-languages.json')
  fs.writeFileSync(outputPath, JSON.stringify(languages, null, 2))
  console.log(`Wrote ${languages.length} languages to ${outputPath}`)
}

fetchWikidataSpeakers().catch(console.error)
