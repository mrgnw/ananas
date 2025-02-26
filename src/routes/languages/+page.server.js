import { getAllLanguages, getRecommendedLanguages } from '$lib/utils/languages.js';
import countryData from '$lib/data/wikidata-countries.json';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    // Get country from Cloudflare request.cf object
    // This will be undefined in dev, but available in production on Cloudflare
    const country = request?.cf?.country || 'FR'; // Using FR as example in dev

    // Log available countries and recommendations for testing
    if (process.env.NODE_ENV === 'development') {
        console.log('\nAvailable country codes:');
        console.log(countryData.map(c => `${c.iso.toUpperCase()}: ${c.name}`).join('\n'));
        
        console.log('\nRecommended languages for', country);
        const recommendations = getRecommendedLanguages(country);
        console.log(recommendations);
    }

    // Get all languages on the server side
    const languages = getAllLanguages();

    return {
        country,
        languages
    };
}