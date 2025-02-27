import { getCloudflareData } from '$lib/utils/cloudflare.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ request }) {
    // Get Cloudflare data including all headers
    const cloudflareData = getCloudflareData(request);
    
    // Log for debugging
    console.log('[LAYOUT SERVER] Cloudflare country:', cloudflareData.ip_country);
    
    return cloudflareData;
}
