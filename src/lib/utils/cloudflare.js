import { getCountryInfo } from '$lib/utils/languages.js';

/**
 * Extract Cloudflare data from a request
 * @param {Request} request - The request object
 * @returns {Object} Cloudflare data including country code and country info
 */
export function getCloudflareData(request) {
    const { headers } = request;
    
    // Capture all headers as an object for debugging
    const allHeaders = {};
    headers.forEach((value, key) => {
        allHeaders[key] = value;
    });
    
    // Log all headers to server console
    console.log('[SERVER] All request headers:', allHeaders);
    
    const ip_country = headers.get('cf-ipcountry') || '';
    const accept_language = headers.get('accept-language') || '';
    
    // Get country information from our database
    const countryInfo = getCountryInfo(ip_country);
    const country_phone = countryInfo ? countryInfo.phone : null;
    
    return {
        ip_country,
        country_phone,
        accept_language,
        countryInfo,
        // Include all headers for client-side debugging
        headers: allHeaders
    };
}
