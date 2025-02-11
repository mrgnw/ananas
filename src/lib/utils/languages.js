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

// Get all available languages from Wikidata
export function getAllLanguages() {
    return languageData.map(l => l.iso).sort()
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

// Get language info from wikidata
export function getLanguageInfo(code) {
    return languageData.find(l => l.iso === code)
}

// Search languages with smart ranking
export function searchLanguages(query, country) {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
    
    return getAllLanguages()
        .filter(code => {
            if (!searchTerms.length) return true
            
            const info = getLanguageInfo(code)
            if (!info) return false
            
            // Check for exact ISO code matches first
            if (searchTerms.some(term => 
                term === info.iso?.toLowerCase() || 
                term === info.iso1?.toLowerCase()
            )) {
                return true
            }
            
            // Then check other fields
            const searchableText = [
                getEnglishName(code)?.toLowerCase(),
                getLanguageName(code)?.toLowerCase(),
                ...(info.countries || []).map(c => c.toLowerCase()),
                ...(info.writingSystems || []).map(w => w.toLowerCase())
            ].filter(Boolean).join(' ')
            
            return searchTerms.every(term => searchableText.includes(term))
        })
        .sort((a, b) => {
            const infoA = getLanguageInfo(a)
            const infoB = getLanguageInfo(b)
            
            // Sort by native speakers if available
            if (infoA?.nativeSpeakers_k && infoB?.nativeSpeakers_k) {
                return infoB.nativeSpeakers_k - infoA.nativeSpeakers_k
            }
            
            // Fall back to alphabetical sort by name
            return getEnglishName(a).localeCompare(getEnglishName(b))
        })
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
