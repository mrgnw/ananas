import { getAllLanguages, getRecommendedLanguages } from '$lib/utils/languages.js';
import countryData from '$lib/data/wikidata-countries.json';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    // Get country from Cloudflare request.cf object
    // In dev, default to US since it has many languages
    const country = request?.cf?.country || (process.env.NODE_ENV === 'development' ? 'US' : undefined);
    
    // Get all languages on the server side
    const languages = getAllLanguages();
    console.log('Server: getAllLanguages returned', languages?.length, 'languages');

    // Log available countries and recommendations for testing
    if (process.env.NODE_ENV === 'development') {
        console.log('\nUsing country code:', country);
        
        console.log('\nAvailable country codes:');
        const countryList = countryData.map(c => `${c.iso.toUpperCase()}: ${c.name}`).join('\n');
        console.log(countryList);
        
        console.log('\nCountry data for', country);
        const countryInfo = countryData.find(c => c.iso === country?.toLowerCase());
        console.log(countryInfo);
        
        console.log('\nRecommended languages for', country);
        const recommendations = getRecommendedLanguages(country);
        console.log(recommendations);
    }

    return {
        country,
        languages
    };
}