import { getCloudflareData } from '$lib/utils/cloudflare.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ request }) {
    // Extract headers directly
    const { headers } = request;
    const ip_country = headers.get('cf-ipcountry') || '';
    const accept_language = headers.get('accept-language') || '';
    
    console.log('[LAYOUT SERVER] Cloudflare headers:', {
        ip_country,
        accept_language
    });
    
    return {
        ip_country,
        accept_language
    };
}
