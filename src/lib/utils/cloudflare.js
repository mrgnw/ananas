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
 * @param {URL} [url] - The request URL (optional)
 * @returns {string} - The RPID to use for WebAuthn
 */
export function getRpId(platform, url = null) {
    const projectDomain = 'ananas-dev.xces.workers.dev';
    
    // Priority order:
    // 1. WEBAUTHN_RP_ID environment variable (always takes precedence)
    // 2. For Workers: preview URLs or custom domains
    // 3. For main deployment: workers.dev subdomain
    // 4. Localhost fallback for local development
    
    // Log available environment variables for debugging
    console.log('[WEBAUTHN DEBUG] Environment variables:');
    console.log('- platform?.env?.WEBAUTHN_RP_ID:', platform?.env?.WEBAUTHN_RP_ID);
    console.log('- platform?.env?.CF_PAGES_BRANCH:', platform?.env?.CF_PAGES_BRANCH);
    
    // First priority: explicitly set WEBAUTHN_RP_ID environment variable
    const envRpId = platform?.env?.WEBAUTHN_RP_ID;
                
    if (envRpId) {
        // Remove any path component - RPID must be a domain only
        let cleanRpId = envRpId;
        if (cleanRpId.includes('/')) {
            cleanRpId = cleanRpId.split('/')[0];
        }
        console.log('[WEBAUTHN DEBUG] Using WEBAUTHN_RP_ID from env (cleaned):', cleanRpId);
        return cleanRpId;
    }
    
    // Get hostname from URL if available
    const hostname = url?.hostname || null;
    
    // For localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('[WEBAUTHN DEBUG] Using localhost RPID');
        return 'localhost';
    }
    
    // For Cloudflare Workers deployments
    if (hostname && (hostname.endsWith('.workers.dev') || hostname.endsWith('.pages.dev'))) {
        // Extract the base domain (e.g., "ananas.workers.dev" from "branch.ananas.workers.dev")
        const parts = hostname.split('.');
        
        if (parts.length >= 3) {
            // This is a subdomain like branch.ananas.workers.dev
            // We'll use the registrable domain (ananas.workers.dev) as RPID
            // This ensures compatibility with WebAuthn's domain rules
            const registrableDomain = parts.slice(parts.length - 3).join('.');
            console.log('[WEBAUTHN DEBUG] Using registrable domain as RPID:', registrableDomain);
            return registrableDomain;
        } else {
            // This is already the base domain like ananas.workers.dev
            console.log('[WEBAUTHN DEBUG] Using hostname as RPID:', hostname);
            return hostname;
        }
    }
    
    // For production domain
    if (hostname && hostname.includes('.')) {
        // Extract the registrable domain (e.g., "anani.app" from "auth.anani.app")
        const parts = hostname.split('.');
        if (parts.length > 2) {
            // This has subdomains, use the registrable domain
            const registrableDomain = parts.slice(parts.length - 2).join('.');
            console.log('[WEBAUTHN DEBUG] Using registrable domain as RPID:', registrableDomain);
            return registrableDomain;
        } else {
            // Already a registrable domain
            console.log('[WEBAUTHN DEBUG] Using hostname as RPID:', hostname);
            return hostname;
        }
    }
    
    // Fallback to project domain
    console.log('[WEBAUTHN DEBUG] Using default project domain as RPID:', projectDomain);
    return projectDomain;
}
