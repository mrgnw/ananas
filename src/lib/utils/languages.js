import { languages } from 'countries-list'
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
    if (defaultLanguages[code]) {
        return defaultLanguages[code].label
    }
    if (languages[code]) {
        return languages[code].name
    }
    return code.toUpperCase()
}

// Search languages with smart ranking
export function searchLanguages(query) {
    if (!query) return getAllLanguages()
    
    query = query.toLowerCase()
    
    return getAllLanguages()
        .filter(code => {
            const native = getLanguageName(code).toLowerCase()
            const english = getEnglishName(code).toLowerCase()
            return code === query || 
                   code.startsWith(query) || 
                   native.includes(query) || 
                   english.includes(query)
        })
        .sort((a, b) => {
            const aName = getLanguageName(a).toLowerCase()
            const bName = getLanguageName(b).toLowerCase()
            const aEnglish = getEnglishName(a).toLowerCase()
            const bEnglish = getEnglishName(b).toLowerCase()

            // Exact code match
            if (a === query) return -1
            if (b === query) return 1

            // Code starts with
            if (a.startsWith(query) && !b.startsWith(query)) return -1
            if (b.startsWith(query) && !a.startsWith(query)) return 1

            // Name starts with
            const aStartsWith = aName.startsWith(query) || aEnglish.startsWith(query)
            const bStartsWith = bName.startsWith(query) || bEnglish.startsWith(query)
            if (aStartsWith && !bStartsWith) return -1
            if (bStartsWith && !aStartsWith) return 1

            // Both match similarly, maintain alphabetical order
            return aName.localeCompare(bName)
        })
}
