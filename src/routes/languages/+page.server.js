import { getAllLanguages } from '$lib/utils/languages.js';
import { getCountryInfo } from '$lib/utils/languages.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request, parent }) {
    // Get parent data (from layout)
    const parentData = await parent();
    const { ip_country } = parentData;
    
    // Get country info based on IP country
    const countryInfo = getCountryInfo(ip_country);
    
    // Get all languages on the server side
    const languages = getAllLanguages();
    
    console.log('[LANGUAGES SERVER] Country info for', ip_country, countryInfo ? 
        { name: countryInfo?.name, languages: countryInfo?.languages?.length || 0 } : 
        'Not found');

    return {
        languages,
        countryInfo
    };
}