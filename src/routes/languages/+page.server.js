import { getAllLanguages } from '$lib/utils/languages.js';
import { getCloudflareData } from '$lib/utils/cloudflare.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    // Get Cloudflare data including country and country info
    const cloudflareData = getCloudflareData(request);
    
    // Get all languages on the server side
    const languages = getAllLanguages();

    return {
        ...cloudflareData,
        languages
    };
}