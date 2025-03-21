import { getCloudflareData } from '$lib/utils/cloudflare.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
  const session = await locals.getSession();
  const cloudflareData = getCloudflareData(request);

  console.log('[LAYOUT SERVER] Cloudflare country:', cloudflareData.ip_country);

  return {
    session,
    ...cloudflareData
  };
};
