import { languages } from 'countries-list'

// Import JSON data directly - Vite handles JSON imports natively
import languageData from '$lib/data/wikidata-languages.json'
import countriesData from '$lib/data/wikidata-countries.json'

// Todo: language statistic by region
// language statisticts https://www.simonandsimon.co.uk/blog/global-language-statistics-by-country
// TODO: language recommendation by language selection

// Get all languages from countries-list
export function getCountryLanguages() {
    return Object.keys(languages).sort()
}

// Default languages from NewLang.svelte - using 3-character ISO codes
export const defaultLanguages = {
    eng: { label: 'English', native: 'English', rtl: false, display: true },
    rus: { label: 'Russian', native: 'Русский', rtl: false, display: true },
    jpn: { label: 'Japanese', native: '日本語', rtl: false, display: true },
    spa: { label: 'Spanish', native: 'Español', rtl: false, display: true },
    ita: { label: 'Italian', native: 'Italiano', rtl: false, display: true },
    cat: { label: 'Catalan', native: 'Català', rtl: false, display: true }
}

// Get all available languages from Wikidata
export function getAllLanguages() {
    return languageData.map(({ iso: code, langLabel: name, nativeNames, nativeSpeakers_k }) => ({
        code,
        name,
        nativeName: nativeNames?.[0] || name,
        speakers: nativeSpeakers_k || 0,
    }));
}

// Convert language code to name using countries-list data
export function getLanguageName(code) {
    if (!code) return '';
    
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
    if (!code) return '';
    
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
    if (!code) return null
    const wikiLang = languageData.find(l => l.iso === code)
    return wikiLang ? {
        ...wikiLang,
        rtl: wikiLang.rtl || false
    } : null
}

// Get country information by ISO code
export function getCountryInfo(countryCode) {
    if (!countryCode) return null
    return countriesData.find(country => country.iso === countryCode.toLowerCase())
}

// Search languages with smart ranking
export function searchLanguages(query, country = null) {
    if (!query && !country) return getAllLanguages()
    
    const searchStr = query.toLowerCase()
    return getAllLanguages().filter(lang => {
        const matchesSearch = !query || 
            lang.code.toLowerCase().includes(searchStr) ||
            lang.name.toLowerCase().includes(searchStr) ||
            lang.nativeName.toLowerCase().includes(searchStr)
            
        const matchesCountry = !country || 
            languageData.find(l => l.iso === lang.code)?.countries?.includes(country)
            
        return matchesSearch && matchesCountry
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
