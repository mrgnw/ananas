import { languages } from 'countries-list'
import languageData from '$lib/data/wikidata-languages.json'
import countryData from '$lib/data/wikidata-countries.json'

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
    return languageData.map(lang => ({
        code: lang.iso,
        name: lang.langLabel,
        nativeName: lang.nativeNames?.[0] || lang.langLabel,
        speakers: lang.speakers
    }))
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

// Get recommended languages for a country based on Wikidata data
export function getRecommendedLanguages(countryCode) {
    if (!countryCode) return [];
    
    // Find country in our Wikidata data
    const country = countryData.find(c => c.iso.toLowerCase() === countryCode.toLowerCase());
    if (!country) return [];
    
    // Get languages from country data, sorted by number of speakers
    const recommendedLanguages = country.languages
        .filter(lang => lang.iso) // Only include languages with ISO codes
        .sort((a, b) => (b.speakers || 0) - (a.speakers || 0))
        .map(lang => lang.iso);
        
    return recommendedLanguages;
}

// Sort languages by country and native speakers
export function sortLanguages(codes, userCountry = null) {
    // Handle undefined or null codes
    if (!codes) return [];
    
    // Get recommended languages for user's country
    const recommendedLanguages = getRecommendedLanguages(userCountry);
    
    return [...codes].sort((a, b) => {
        const aInfo = getLanguageInfo(a);
        const bInfo = getLanguageInfo(b);
        
        // First priority: recommended languages for user's country
        const aRecommendedIndex = recommendedLanguages.indexOf(a);
        const bRecommendedIndex = recommendedLanguages.indexOf(b);
        if (aRecommendedIndex !== -1 || bRecommendedIndex !== -1) {
            if (aRecommendedIndex === -1) return 1;
            if (bRecommendedIndex === -1) return -1;
            return aRecommendedIndex - bRecommendedIndex;
        }
        
        // Second priority: total number of speakers globally
        const aSpeakers = aInfo?.speakers_m || 0;
        const bSpeakers = bInfo?.speakers_m || 0;
        if (aSpeakers !== bSpeakers) {
            return bSpeakers - aSpeakers;
        }
        
        // Third priority: alphabetical by English name
        return (aInfo?.name || '').localeCompare(bInfo?.name || '');
    });
}
