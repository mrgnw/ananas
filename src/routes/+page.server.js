import {countries} from 'countries-list';

export const load = async ({ request }) => {
	const { headers } = request;
	const ip_country = headers.get('cf-ipcountry');
	const accept_language = headers.get('accept_language');
	const country = Object.entries(countries).find(([code, c]) => code === ip_country)?.[1];
	// const country_phone = country ? country.phone : null;
	const country_languages = country ? country.languages : null;
	
	return {
		ip_country,
		// country_phone,
		accept_language,
		country_languages
	};
};