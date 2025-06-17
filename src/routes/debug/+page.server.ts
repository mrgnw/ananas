import { codeToHtml } from 'shiki';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, request, locals, params }) => {
  // Get all the data we want to highlight
  const props = {
    ip_country: locals.ip_country || null,
    accept_language: request.headers.get('accept-language'),
    countryInfo: locals.countryInfo || null,
    allHeaders: Object.fromEntries(request.headers.entries()),
    testQueryResult: {
      fruit: url.searchParams.get('fruit') || 'banana'
    },
    user: locals.user || null,
    userPreferences: locals.userPreferences || null
  };

  // Highlight the JSON
  const highlightedPropsJson = await codeToHtml(
    JSON.stringify(props, null, 2),
    {
      lang: 'json',
      theme: 'github-light'
    }
  );

  return {
    ...props,
    highlightedPropsJson
  };
};