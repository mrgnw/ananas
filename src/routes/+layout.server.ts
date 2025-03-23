import { getCloudflareData } from '$lib/utils/cloudflare.js';
import { Database } from 'bun:sqlite';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request, params = {} }) => {
  // Get Cloudflare data
  const cloudflareData = getCloudflareData(request);
  
  console.log('[LAYOUT SERVER] Headers received:', cloudflareData.headers);
  console.log('[LAYOUT SERVER] Cloudflare country:', cloudflareData.ip_country);

  // Test the database connection and log the result
  const db = new Database(process.env.DATABASE_URL || ':memory:');
  const testQuery = db.query("SELECT 'banana' AS fruit");
  const result = testQuery.get();
  
  return {
    ...cloudflareData,
    testQueryResult: result,
    // Include the slug like textme does (if available)
    slug: params.slug,
    // Keep the headers for debugging
    headers: cloudflareData.headers
  };
};
