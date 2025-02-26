import { getAllLanguages, getCountryInfo } from '$lib/utils/languages.js';

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

    // Log the Cloudflare headers for debugging
    console.log('[SERVER] Cloudflare country code:', country);
    
    if (request.cf) {
        console.log('[SERVER] Full Cloudflare data:', {
            country: request.cf.country,
            continent: request.cf.continent,
            city: request.cf.city,
            region: request.cf.region,
            timezone: request.cf.timezone
        });
    } else {
        console.log('[SERVER] No Cloudflare data available in request');
    }

    // Get country information
    const countryInfo = getCountryInfo(country);
    console.log('[SERVER] Country info:', countryInfo ? 
        { name: countryInfo.name, languages: countryInfo.languages?.length || 0 } : 
        'Not found');

    // Get all languages on the server side
    const languages = getAllLanguages();

    return {
        country,
        countryData: {
            code: country,
            source: process.env.NODE_ENV !== 'production' && !request.cf ? 'development override' : 'Cloudflare'
        },
        languages
    };
}