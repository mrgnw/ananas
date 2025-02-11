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
  "20672087": "safe",
  "20672088": "definitely endangered"
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

    // Case-insensitive deduplication for native names
    const dedupeNames = (names) => {
      const seen = new Map()
      return names
        .filter(Boolean)
        .map(name => {
          // Normalize by removing all case differences
          const normalized = name.toLowerCase()
          
          // If we haven't seen this name before or the new version looks better
          if (!seen.has(normalized) || shouldPreferName(name, seen.get(normalized))) {
            seen.set(normalized, name)
          }
          return seen.get(normalized)
        })
        .filter((name, index, arr) => arr.indexOf(name) === index)
        .sort()
    }

    // Helper to decide which version of a name to keep
    const shouldPreferName = (newName, existingName) => {
      // If it's a CamelCase vs lowercase difference (e.g., ChiShona vs chiShona),
      // prefer the one that follows proper capitalization (first letter capital)
      if (newName.charAt(0).toUpperCase() === newName.charAt(0) &&
          existingName.charAt(0).toLowerCase() === existingName.charAt(0)) {
        return true
      }
      
      // For other cases, prefer the one with more uppercase letters
      const newUpperCount = newName.replace(/[^A-Z]/g, '').length
      const existingUpperCount = existingName.replace(/[^A-Z]/g, '').length
      return newUpperCount > existingUpperCount
    }

    // Then add remaining properties in alphabetical order
    const sortedProps = Object.entries({
      countries: [...new Set(lang.countries?.value.split('|').filter(Boolean))]?.sort() || [],
      ethnologueStatus: lang.ethnologueStatus?.value ? ETHNOLOGUE_STATUS[lang.ethnologueStatus.value] : null,
      langLabel: lang.langLabel.value,
      nativeNames: dedupeNames(lang.nativeNames?.value.split(', ') || []),
      nativeSpeakers_k: parseInt(lang.nativeSpeakers_k.value),
      ...(lang.rtl?.value === "true" ? { rtl: true } : {}),
      unescoStatus: lang.unescoStatus?.value ? UNESCO_STATUS[lang.unescoStatus.value] : null,
      writingSystems: [...new Set(lang.writingSystems?.value.split(', ').filter(Boolean))]?.sort() || []
    }).sort(([a], [b]) => a.localeCompare(b))

    return Object.assign(obj, Object.fromEntries(sortedProps))
  })

  // Write to file
  const outputPath = path.join(OUTPUT_DIR, 'wikidata-languages.json')
  fs.writeFileSync(outputPath, JSON.stringify(languages, null, 2))
  console.log(`Wrote ${languages.length} languages to ${outputPath}`)
}

fetchWikidataSpeakers().catch(console.error)
