import { getCountryInfo } from '$lib/utils/languages.js';

/**
 * Extract Cloudflare data from a request
 * @param {Request} request - The request object
 * @returns {Object} Cloudflare data including country code and country info
 */
export function getCloudflareData(request) {
    const { headers } = request;
    
    // Get the critical headers directly, similar to textme implementation
    const ip_country = headers.get('cf-ipcountry') || '';
    const accept_language = headers.get('accept-language') || '';
    
    // For debugging, but much simpler
    console.log('[SERVER] Cloudflare headers:', {
        ip_country,
        accept_language
    });
    
    // Get country information from our database
    const countryInfo = getCountryInfo(ip_country);
    const country_phone = countryInfo ? countryInfo.phone : null;
    
    return {
        ip_country,
        country_phone,
        accept_language,
        countryInfo
    };
}
