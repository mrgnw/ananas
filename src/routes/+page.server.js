import { getCloudflareData } from '$lib/utils/cloudflare.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    try {
        // Get Cloudflare data for this page request
        const cloudflareData = getCloudflareData(request) || {};
        console.log('[PAGE SERVER] Cloudflare data:', cloudflareData);
        // Format JSON without Prism
        const json = JSON.stringify(cloudflareData, null, 2);
        return {
            ...cloudflareData,
            highlightedPropsJson: '' // No more Prism highlighting
        };
    } catch (e) {
        console.error('[PAGE SERVER] Error:', e);
        // Return safe fallback so page does not 500
        return { highlightedPropsJson: '' };
    }
}
