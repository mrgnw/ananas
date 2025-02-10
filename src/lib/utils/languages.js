import { languages } from 'countries-list'
import languageData from '$lib/data/wikidata-languages.json'

// Todo: language statistic by region
// language statisticts https://www.simonandsimon.co.uk/blog/global-language-statistics-by-country
// TODO: language recommendation by language selection

// Get all languages from countries-list
export function getCountryLanguages() {
    return Object.keys(languages).sort()
}

// Default languages from NewLang.svelte
export const defaultLanguages = {
    en: { label: 'English', native: 'English', rtl: false },
    ru: { label: 'Russian', native: 'Русский'},
    ja: { label: 'Japanese', native: '日本語'},
    es: { label: 'Spanish', native: 'Español'},
    it: { label: 'Italian', native: 'Italiano'},
    scn: { label: 'Sicilian', native: 'Sicilianu'}
}

// Get all available languages (both from countries and defaults)
export function getAllLanguages() {
    const countryLanguages = getCountryLanguages()
    return [...new Set([...countryLanguages, ...Object.keys(defaultLanguages)])].sort()
}

// Convert language code to name using countries-list data
export function getLanguageName(code) {
    const wikiLang = languageData.find(l => l.iso === code)
    if (wikiLang) {
        return wikiLang.nativeNames?.[0] || wikiLang.langLabel
    }
    if (defaultLanguages[code]) {
        return defaultLanguages[code].native
    }
    if (languages[code]) {
        return languages[code].native || languages[code].name
    }
    return code.toUpperCase()
}

// Get English name of language if available
export function getEnglishName(code) {
    const wikiLang = languageData.find(l => l.iso === code)
    if (wikiLang) {
        return wikiLang.langLabel
    }
    if (defaultLanguages[code]) {
        return defaultLanguages[code].label
    }
    if (languages[code]) {
        return languages[code].name
    }
    return code.toUpperCase()
}

// Search languages with smart ranking
export function searchLanguages(query, userCountry = null) {
    const allLanguages = getAllLanguages()
    if (!query) {
        return sortLanguages(allLanguages, userCountry)
    }

    const results = []
    const lowerQuery = query.toLowerCase()

    for (const code of allLanguages) {
        const englishName = getEnglishName(code).toLowerCase()
        const nativeName = getLanguageName(code).toLowerCase()
        
        // Exact matches
        if (code.toLowerCase() === lowerQuery || englishName === lowerQuery || nativeName === lowerQuery) {
            results.push({ code, score: 1 })
            continue
        }

        // Starts with matches
        if (code.toLowerCase().startsWith(lowerQuery) || englishName.startsWith(lowerQuery) || nativeName.startsWith(lowerQuery)) {
            results.push({ code, score: 0.8 })
            continue
        }

        // Contains matches
        if (code.toLowerCase().includes(lowerQuery) || englishName.includes(lowerQuery) || nativeName.includes(lowerQuery)) {
            results.push({ code, score: 0.6 })
        }
    }

    // Sort by search score first, then by country and speakers
    const searchResults = results.sort((a, b) => b.score - a.score).map(r => r.code)
    return sortLanguages(searchResults, userCountry)
}

// Sort languages by country and native speakers
function sortLanguages(codes, userCountry = null) {
    return codes.sort((a, b) => {
        const langA = languageData.find(l => l.iso === a)
        const langB = languageData.find(l => l.iso === b)
        
        // If we have country data, prioritize languages from user's country
        if (userCountry) {
            const aInCountry = langA?.countries?.includes(userCountry) || false
            const bInCountry = langB?.countries?.includes(userCountry) || false
            if (aInCountry !== bInCountry) {
                return aInCountry ? -1 : 1
            }
        }
        
        // Then sort by number of native speakers
        const speakersA = langA?.nativeSpeakers_k || 0
        const speakersB = langB?.nativeSpeakers_k || 0
        return speakersB - speakersA
    })
}
