import { getCloudflareData } from '$lib/utils/cloudflare.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request, params = {}, locals }) => {
  // Get Cloudflare data
  const cloudflareData = getCloudflareData(request);
  
  // Log what we're passing to the client
  console.log('[LAYOUT SERVER] Headers being passed to client:', 
    Object.keys(cloudflareData.allHeaders).length, 'headers');
  
  // Simple test data instead of SQLite database
  const testQueryResult = { fruit: 'banana' };
  
  // Get authentication state from locals
  const user = locals.user ? {
    id: locals.user.id,
    email: locals.user.email,
    username: locals.user.username
  } : null;
  
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
    user
  };
};
