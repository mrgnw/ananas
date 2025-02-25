// Map of country names to ISO 3166-1 alpha-2 codes
const countryNameToCode: Record<string, string> = {
    'People\'s Republic of China': 'CN',
    'Taiwan': 'TW',
    'United States': 'US',
    'United Kingdom': 'GB',
    'Japan': 'JP',
    'Korea': 'KR',
    'South Korea': 'KR',
    'North Korea': 'KP',
    'France': 'FR',
    'Germany': 'DE',
    'Italy': 'IT',
    'Spain': 'ES',
    'Russia': 'RU',
    'Brazil': 'BR',
    'India': 'IN',
    'Indonesia': 'ID',
    'Vietnam': 'VN',
    'Thailand': 'TH',
    'Turkey': 'TR',
    'Iran': 'IR',
    'Saudi Arabia': 'SA',
    'Egypt': 'EG',
    'Nigeria': 'NG',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Mexico': 'MX',
    'Philippines': 'PH',
    'Ethiopia': 'ET',
    'Malaysia': 'MY',
    'Ukraine': 'UA',
    // Add more as needed
};

/**
 * Convert a country code to an emoji flag
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Emoji flag for the country
 */
export function getCountryFlag(countryCode: string): string {
    const base = 127397; // Regional Indicator Symbol Letter A
    const chars = countryCode.toUpperCase().split('');
    return String.fromCodePoint(
        ...chars.map(char => char.charCodeAt(0) + base)
    );
}

/**
 * Get the primary flag emoji for a language based on its ISO code
 * @param iso - ISO 639-3 code
 * @param countries - Array of country names
 * @returns An emoji flag or undefined if no matching country found
 */
export function getLanguageFlag(iso: string, countries: string[]): string | undefined {
    if (!countries.length) return undefined;
    
    // Get the first country that has a known country code
    for (const country of countries) {
        const countryCode = countryNameToCode[country];
        if (countryCode) {
            return getCountryFlag(countryCode);
        }
    }
    
    return undefined;
}

/**
 * Language to flag mapping
 * Key: ISO code
 * Value: Emoji flag
 */
export const languageFlags: Record<string, string> = {
    // Some common overrides where we want to specify a particular flag
    'en': getCountryFlag('GB'), // English -> UK flag
    'es': getCountryFlag('ES'), // Spanish -> Spain flag
    'pt': getCountryFlag('PT'), // Portuguese -> Portugal flag
    'zh': getCountryFlag('CN'), // Chinese -> China flag
    'ja': getCountryFlag('JP'), // Japanese -> Japan flag
    'ko': getCountryFlag('KR'), // Korean -> South Korea flag
    'hi': getCountryFlag('IN'), // Hindi -> India flag
    'ar': getCountryFlag('SA'), // Arabic -> Saudi Arabia flag
    'bn': getCountryFlag('BD'), // Bengali -> Bangladesh flag
    'ru': getCountryFlag('RU'), // Russian -> Russia flag
    // Add more manual mappings as needed
};

/**
 * Get a flag emoji for a language
 * @param iso - ISO code (639-3 or 639-1)
 * @param countries - Optional array of countries where the language is spoken
 * @returns An emoji flag or undefined if no flag could be determined
 */
export function getFlag(iso: string, countries?: string[]): string | undefined {
    // Check for manual override first
    if (iso in languageFlags) {
        return languageFlags[iso];
    }
    
    // If countries are provided, try to get a flag based on the countries
    if (countries?.length) {
        return getLanguageFlag(iso, countries);
    }
    
    return undefined;
}