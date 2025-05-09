import { languages } from 'countries-list'
import languageData from '$lib/data/wikidata-languages.json'
import countriesData from '$lib/data/wikidata-countries.json'

export function getCountryLanguages() {
    return Object.keys(languages).sort()
}

export const defaultLanguages = {
    eng: { label: 'English', native: 'English', rtl: false, display: true },
    rus: { label: 'Russian', native: 'Русский', rtl: false, display: true },
    jpn: { label: 'Japanese', native: '日本語', rtl: false, display: true },
    spa: { label: 'Spanish', native: 'Español', rtl: false, display: true },
    ita: { label: 'Italian', native: 'Italiano', rtl: false, display: true },
    cat: { label: 'Catalan', native: 'Català', rtl: false, display: true }
}

export function getAllLanguages() {
    return languageData
        .map(({ iso: code, langLabel: name, nativeNames, nativeSpeakers_k }) => ({
            code,
            name,
            nativeName: nativeNames?.[0] || name,
            speakers: nativeSpeakers_k || 0,
        }))
        .sort((a, b) => b.speakers - a.speakers);
}

export function getLanguageName(code) {
    if (!code) return '';
    const wikiLang = languageData.find(l => l.iso === code)
    if (wikiLang) return wikiLang.nativeNames?.[0] || wikiLang.langLabel
    if (defaultLanguages[code]) return defaultLanguages[code].native
    if (languages[code]) return languages[code].native || languages[code].name
    return code.toUpperCase()
}

export function getEnglishName(code) {
    if (!code) return '';
    const normCode = code.toLowerCase();
    const wikiLang = languageData.find(l => l.iso === normCode);
    if (wikiLang) return wikiLang.langLabel;
    if (defaultLanguages[normCode]) return defaultLanguages[normCode].label;
    if (languages[normCode]) return languages[normCode].name;
    if (normCode.length === 3) {
        const twoLetter = Object.keys(languages).find(k => languages[k].iso639_3 === normCode);
        if (twoLetter && languages[twoLetter]) return languages[twoLetter].name;
    }
    return code.toUpperCase();
}

export function getLanguageInfo(code) {
    if (!code) return null
    const wikiLang = languageData.find(l => l.iso === code)
    return wikiLang ? { ...wikiLang, rtl: wikiLang.rtl || false } : null
}

export function getCountryInfo(countryCode) {
    if (!countryCode) return null
    return countriesData.find(country => country.iso === countryCode.toLowerCase())
}

export function isLocalLanguage(iso3_lang, countryIso2) {
    if (!iso3_lang || !countryIso2) return 0;
    const country = countriesData.find(c => c.iso === countryIso2.toLowerCase());
    if (!country || !country.languages) return 0;
    return country.languages.some(lang => lang.iso === iso3_lang) ? 1 : 0;
}

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

function sortLanguages(codes, userCountry = null) {
    return codes.sort((a, b) => {
        const langA = languageData.find(l => l.iso === a)
        const langB = languageData.find(l => l.iso === b)
        if (userCountry) {
            const aInCountry = langA?.countries?.includes(userCountry) || false
            const bInCountry = langB?.countries?.includes(userCountry) || false
            if (aInCountry !== bInCountry) return aInCountry ? -1 : 1
        }
        const speakersA = langA?.nativeSpeakers_k || 0
        const speakersB = langB?.nativeSpeakers_k || 0
        return speakersB - speakersA
    })
}

export function filterLanguages(languageOptions, filter) {
    if (!filter.trim()) return [...languageOptions];
    const f = filter.trim().toLowerCase();
    const exact = [];
    const starts = [];
    const partial = [];
    for (const lang of languageOptions) {
        const name = lang.name?.toLowerCase() || '';
        const native = lang.nativeName?.toLowerCase() || '';
        const code2 = lang.code?.toLowerCase() || '';
        const code3 = lang.iso3?.toLowerCase?.() || '';
        if (name === f || native === f || code2 === f || code3 === f) {
            exact.push(lang);
        } else if (name.startsWith(f) || native.startsWith(f) || code2.startsWith(f) || code3.startsWith(f)) {
            starts.push(lang);
        } else if (name.includes(f) || native.includes(f) || code2.includes(f) || code3.includes(f)) {
            partial.push(lang);
        }
    }
    return [...exact, ...starts, ...partial];
}
