import { getCountryInfo } from '$lib/utils/languages.js';

/**
 * Extract Cloudflare data from a request
 * @param {Request} request - The request object
 * @returns {Object} Cloudflare data including country code and country info
 */
export function getCloudflareData(request) {
    const { headers } = request;
    
    // Convert headers to object for easier debugging
    const allHeaders = {};
    headers.forEach((value, key) => {
        allHeaders[key] = value;
    });
    
    const ip_country = headers.get('cf-ipcountry') || '';
    const accept_language = headers.get('accept-language') || '';
    
    // Log the Cloudflare headers for debugging
    console.log('[SERVER] All headers:', allHeaders);
    console.log('[SERVER] Cloudflare headers:', {
        ip_country,
        accept_language
    });
    
    // Get country information from our database
    const countryInfo = getCountryInfo(ip_country);
    const country_phone = countryInfo ? countryInfo.phone : null;
    
    console.log('[SERVER] Country info:', countryInfo ? 
        { name: countryInfo.name, languages: countryInfo.languages?.length || 0 } : 
        'Not found');

    return {
        ip_country,
        country_phone,
        accept_language,
        countryInfo,
        allHeaders
    };
}
