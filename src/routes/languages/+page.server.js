import { getAllLanguages } from '$lib/utils/languages.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    // Get country from Cloudflare request.cf object
    // This will be undefined in dev, but available in production on Cloudflare
    let country = request?.cf?.country || null;
    
    // For development testing only - override with a sample country
    // In development, we can test with different countries by changing the URL param
    // e.g. /languages?country=US
    if (!country && process.env.NODE_ENV !== 'production') {
        const url = new URL(request.url);
        country = url.searchParams.get('country') || 'US'; // Default to US for testing
        console.log(`[DEV] Using test country: ${country}`);
    }

    // Get all languages on the server side
    const languages = getAllLanguages();

    return {
        country,
        languages
    };
}