import { getCountryInfo } from '$lib/utils/languages.js';

/**
 * Extract Cloudflare data from a request
 * @param {Request} request - The request object
 * @returns {Object} Cloudflare data including country code and country info
 */
export function getCloudflareData(request) {
    const { headers } = request;
    const ip_country = headers.get('cf-ipcountry') || '';
    const accept_language = headers.get('accept-language') || '';
    
    // Log the Cloudflare headers for debugging
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

    // For development testing only - override with a sample country
    let dev_country = null;
    if (!ip_country && process.env.NODE_ENV !== 'production') {
        try {
            const url = new URL(request.url);
            dev_country = url.searchParams.get('country') || 'US'; // Default to US for testing
            console.log(`[DEV] Using test country: ${dev_country}`);
        } catch (error) {
            console.error('Error parsing URL:', error);
        }
    }

    return {
        ip_country: ip_country || dev_country || '',
        country_phone,
        accept_language,
        countryInfo,
        // Additional info for debugging
        source: process.env.NODE_ENV !== 'production' && !ip_country ? 'development override' : 'Cloudflare'
    };
}
