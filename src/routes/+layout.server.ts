import { getCloudflareData } from '$lib/utils/cloudflare.js';
import { initDB } from '$lib/server/db';
import { getUserPreferences } from '$lib/server/user-preferences';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request, params = {}, locals, platform }) => {
  // Get Cloudflare data
  const cloudflareData = getCloudflareData(request);
  
  // Log what we're passing to the client
  console.log('[LAYOUT SERVER] Headers being passed to client:', 
    Object.keys(cloudflareData.allHeaders).length, 'headers');
  
  // Simple test data instead of SQLite database
  const testQueryResult = { fruit: 'banana' };
  
  // Get authentication state from locals
  console.log('[LAYOUT SERVER] Auth check:', {
    localsUser: locals.user ? 'EXISTS' : 'NULL',
    userId: locals.user?.id,
    userEmail: locals.user?.email
  });
  
  const user = locals.user ? {
    id: locals.user.id,
    email: locals.user.email,
    username: locals.user.username
  } : null;
  
  // Get user preferences if user is logged in
  let userPreferences = null;
  if (user && platform?.env?.DB) {
    try {
      const db = initDB(platform.env.DB);
      userPreferences = await getUserPreferences(db, user.id);
      console.log('[LAYOUT SERVER] Loaded user preferences:', {
        userId: user.id,
        selectedLanguages: userPreferences?.selected_languages,
        translators: userPreferences?.translators
      });
    } catch (error) {
      console.error('[LAYOUT SERVER] Error loading user preferences:', error);
    }
  } else {
    console.log('[LAYOUT SERVER] No user or DB available for preferences');
  }
  
  // Format JSON without Prism
  const propsJson = JSON.stringify({
    ip_country: cloudflareData.ip_country,
    country_phone: cloudflareData.country_phone,
    accept_language: cloudflareData.accept_language,
    countryInfo: cloudflareData.countryInfo,
    allHeaders: cloudflareData.allHeaders,
    testQueryResult,
    slug: params.slug,
    user,
    userPreferences
  }, null, 2);
  // No Prism highlighting
  const highlightedPropsJson = '';

  // In SvelteKit, returned objects are serialized with devalue
  // Make sure we return allHeaders directly at the top level for accessibility
  return {
    ip_country: cloudflareData.ip_country,
    country_phone: cloudflareData.country_phone,
    accept_language: cloudflareData.accept_language,
    countryInfo: cloudflareData.countryInfo,
    allHeaders: cloudflareData.allHeaders,
    testQueryResult,
    // Don't nest under cloudflareData as it makes access more complex
    slug: params.slug,
    // Authentication data
    user,
    // User preferences
    userPreferences,
    highlightedPropsJson
  };
};
