import { getCountryInfo } from '$lib/utils/languages.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  // Get ip_country from parent layout data
  const parentData = await parent();
  const ip_country = parentData.ip_country;
  const countryInfo = getCountryInfo(ip_country);
  const country_languages = countryInfo?.languages || [];
  return { country_languages };
};
