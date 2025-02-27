import { getCloudflareData } from '$lib/utils/cloudflare.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ request }) {
    // Extract headers directly
    const { headers } = request;
    const ip_country = headers.get('cf-ipcountry') || '';
    
    // Log the country code for debugging
    console.log('[LAYOUT SERVER] Cloudflare country:', ip_country);
    
    return {
        ip_country
    };
}
