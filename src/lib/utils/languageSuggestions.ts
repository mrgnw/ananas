import { browser } from '$app/environment';
import { getAllLanguages, getLanguageInfo } from './languages.js';
import languageData from '$lib/data/wikidata-languages.json';
import countriesData from '$lib/data/wikidata-countries.json';

/**
 * Maps ISO 639-1 (2-letter) codes to ISO 639-3 (3-letter) codes
 * Browser languages are usually 2-letter, but our data uses 3-letter codes
 */
const iso1ToIso3Map = new Map();
languageData.forEach(lang => {
  if (lang.iso1) {
    iso1ToIso3Map.set(lang.iso1, lang.iso);
  }
});

/**
 * Converts browser language code (like 'en-US', 'zh-CN') to our 3-letter ISO code
 */
function browserLangToIso3(browserLang: string): string | null {
  if (!browserLang) return null;
  
  // Extract just the language part (before any region/script info)
  const langPart = browserLang.split('-')[0].toLowerCase();
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'zh': 'zho', // Chinese - we'll default to general Chinese
    'no': 'nor', // Norwegian
    'he': 'heb', // Hebrew
    'yi': 'yid', // Yiddish
    'iw': 'heb', // Hebrew (old code)
    'in': 'ind', // Indonesian (old code)
    'ji': 'yid', // Yiddish (old code)
  };
  
  if (specialCases[langPart]) {
    return specialCases[langPart];
  }
  
  // Try direct lookup in our map
  const iso3 = iso1ToIso3Map.get(langPart);
  if (iso3) return iso3;
  
  // If it's already 3 letters, check if it's valid
  if (langPart.length === 3) {
    const found = languageData.find(lang => lang.iso === langPart);
    return found ? langPart : null;
  }
  
  return null;
}

/**
 * Gets browser/OS language preferences
 */
function getBrowserLanguages(): string[] {
  if (!browser) return [];
  
  const languages: string[] = [];
  
  // Get all browser languages in order of preference
  if (navigator.languages) {
    languages.push(...navigator.languages);
  } else if (navigator.language) {
    languages.push(navigator.language);
  }
  
  return languages;
}

/**
 * Suggests languages based on browser/OS preferences
 */
export function suggestLanguagesFromBrowser(): Array<{
  code: string;
  name: string;
  nativeName: string;
  reason: 'primary' | 'secondary' | 'fallback';
  confidence: number;
}> {
  const browserLangs = getBrowserLanguages();
  const suggestions: Array<{
    code: string;
    name: string;
    nativeName: string;
    reason: 'primary' | 'secondary' | 'fallback';
    confidence: number;
  }> = [];
  
  console.log('Browser language detection:', {
    browserLangs,
    navigatorLanguages: browser ? navigator.languages : 'not in browser',
    navigatorLanguage: browser ? navigator.language : 'not in browser'
  });
  
  const seenCodes = new Set<string>();
  
  // Primary suggestions from browser preferences
  browserLangs.forEach((browserLang, index) => {
    const iso3 = browserLangToIso3(browserLang);
    console.log(`Processing browser lang: ${browserLang} -> ${iso3}`);
    
    if (iso3 && !seenCodes.has(iso3)) {
      const langInfo = getLanguageInfo(iso3);
      console.log(`Language info for ${iso3}:`, langInfo);
      
      if (langInfo) {
        suggestions.push({
          code: iso3,
          name: langInfo.langLabel,
          nativeName: langInfo.nativeNames?.[0] || langInfo.langLabel,
          reason: index === 0 ? 'primary' : 'secondary',
          confidence: Math.max(0.9 - (index * 0.1), 0.3)
        });
        seenCodes.add(iso3);
      }
    }
  });
  
  // Add English as fallback if not already suggested
  if (!seenCodes.has('eng')) {
    const engInfo = getLanguageInfo('eng');
    if (engInfo) {
      suggestions.push({
        code: 'eng',
        name: engInfo.langLabel,
        nativeName: engInfo.nativeNames?.[0] || engInfo.langLabel,
        reason: 'fallback',
        confidence: 0.5
      });
    }
  }
  
  console.log('Final browser suggestions:', suggestions);
  return suggestions.slice(0, 5); // Limit to top 5 suggestions
}

/**
 * Future: Suggest languages based on country (from Cloudflare geo IP)
 */
export function suggestLanguagesFromCountry(countryCode: string): Array<{
  code: string;
  name: string;
  nativeName: string;
  reason: 'country_primary' | 'country_secondary';
  confidence: number;
}> {
  if (!countryCode) return [];
  
  const country = countriesData.find(c => c.iso === countryCode.toLowerCase());
  if (!country?.languages) return [];
  
  const suggestions = country.languages
    .slice(0, 3) // Top 3 languages for the country
    .map((lang, index) => {
      const langInfo = getLanguageInfo(lang.iso);
      if (!langInfo) return null;
      
      return {
        code: lang.iso,
        name: langInfo.langLabel,
        nativeName: langInfo.nativeNames?.[0] || langInfo.langLabel,
        reason: index === 0 ? 'country_primary' : 'country_secondary' as const,
        confidence: Math.max(0.8 - (index * 0.15), 0.4)
      };
    })
    .filter(Boolean) as Array<{
      code: string;
      name: string;
      nativeName: string;
      reason: 'country_primary' | 'country_secondary';
      confidence: number;
    }>;
  
  return suggestions;
}

/**
 * Combines browser and country-based suggestions
 */
export function getLanguageSuggestions(countryCode?: string): Array<{
  code: string;
  name: string;
  nativeName: string;
  reason: 'primary' | 'secondary' | 'fallback' | 'country_primary' | 'country_secondary';
  confidence: number;
}> {
  const browserSuggestions = suggestLanguagesFromBrowser();
  const countrySuggestions = countryCode ? suggestLanguagesFromCountry(countryCode) : [];
  
  // Merge and deduplicate, prioritizing browser preferences
  const combined = [...browserSuggestions];
  const seenCodes = new Set(browserSuggestions.map(s => s.code));
  
  countrySuggestions.forEach(suggestion => {
    if (!seenCodes.has(suggestion.code)) {
      combined.push(suggestion);
      seenCodes.add(suggestion.code);
    }
  });
  
  // Sort by confidence (highest first)
  return combined.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

/**
 * Gets automatic language suggestions for new users
 */
export function getAutoLanguageSelection(countryCode?: string): string[] {
  const suggestions = getLanguageSuggestions(countryCode);
  
  console.log('Auto language selection debug:', {
    countryCode,
    allSuggestions: suggestions,
    browserLanguages: browser ? (navigator.languages || [navigator.language]) : [],
    highConfidence: suggestions.filter(s => s.confidence > 0.7),
    mediumConfidence: suggestions.filter(s => s.confidence > 0.5)
  });
  
  // Combine browser and country suggestions
  const browserSuggestions = suggestions.filter(s => 
    s.reason === 'primary' || s.reason === 'secondary' || s.reason === 'fallback'
  );
  
  const countrySuggestions = suggestions.filter(s => 
    s.reason.startsWith('country_') && s.confidence > 0.6
  );
  
  // Start with all high-confidence browser suggestions
  const selected = browserSuggestions
    .filter(s => s.confidence > 0.3)
    .map(s => s.code);
    
  // Add country suggestions if they're not already included
  countrySuggestions.forEach(suggestion => {
    if (!selected.includes(suggestion.code)) {
      selected.push(suggestion.code);
    }
  });
  
  // If still no suggestions, fall back to any browser suggestions
  if (selected.length === 0) {
    return browserSuggestions
      .map(s => s.code)
      .slice(0, 2);
  }
  
  return selected;
}