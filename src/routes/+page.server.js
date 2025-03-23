import { env } from '$env/dynamic/private';
import { getCloudflareData } from '$lib/utils/cloudflare.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    // Get Cloudflare data for this page request
    const cloudflareData = getCloudflareData(request);
    
    console.log('[PAGE SERVER] User country:', cloudflareData.ip_country);
    
    return {
        ...cloudflareData
    };
}
