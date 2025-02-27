import { getCloudflareData } from '$lib/utils/cloudflare.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ request }) {
    // Get Cloudflare data including country and country info
    const cloudflareData = getCloudflareData(request);
    
    return {
        ...cloudflareData
    };
}
