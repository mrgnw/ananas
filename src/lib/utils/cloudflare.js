import { getCountryInfo } from '$lib/utils/languages.js';

/**
 * Extract Cloudflare data from a request
 * @param {Request} request - The request object
 * @returns {Object} Cloudflare data including country code and country info
 */
export function getCloudflareData(request) {
    const { headers } = request;
    
    // Capture all headers as a plain object for debugging
    // Using a plain object ensures it can be properly serialized
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
    
    // Make sure we return a serializable plain object with all data
    return {
        ip_country,
        country_phone,
        accept_language,
        countryInfo,
        allHeaders // Renamed from headers to allHeaders for clarity
    };
}

/**
 * Get the Relying Party ID for WebAuthn operations
 * @param {Object} platform - SvelteKit platform object containing env variables
 * @returns {string} - The RPID to use for WebAuthn
 */
export function getRpId(platform) {
    const projectDomain = 'ananas-8ek.pages.dev';
    
    // Priority order:
    // 1. WEBAUTHN_RP_ID environment variable (always takes precedence)
    // 2. For non-main branches: CF_PAGES_BRANCH specific preview URL
    // 3. For main branch: base project domain
    // 4. Localhost fallback for local development
    
    const rpId = platform?.env?.WEBAUTHN_RP_ID || 
                process.env.WEBAUTHN_RP_ID;
                
    if (rpId) {
        return rpId;
    }
    
    if (platform?.env?.CF_PAGES_BRANCH && platform.env.CF_PAGES_BRANCH !== 'main') {
        return `${platform.env.CF_PAGES_BRANCH}.${projectDomain}`;
    }
    
    return projectDomain || 'localhost';
}
