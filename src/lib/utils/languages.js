import { languages } from 'countries-list'

// Get all languages from countries-list
export function getCountryLanguages() {
    return Object.keys(languages).sort()
}

// Default languages from NewLang.svelte
export const defaultLanguages = {
    en: { label: 'English', native: 'English', rtl: false },
    ru: { label: 'Russian', native: 'Русский', rtl: false },
    ja: { label: 'Japanese', native: '日本語', rtl: false },
    es: { label: 'Spanish', native: 'Español', rtl: false },
    it: { label: 'Italian', native: 'Italiano', rtl: false },
    scn: { label: 'Sicilian', native: 'Sicilianu', rtl: false }
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
