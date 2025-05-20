import { getCloudflareData } from '$lib/utils/cloudflare.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-json.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    try {
        // Get Cloudflare data for this page request
        const cloudflareData = getCloudflareData(request) || {};
        console.log('[PAGE SERVER] Cloudflare data:', cloudflareData);
        // Example: highlight some JSON server-side
        const json = JSON.stringify(cloudflareData, null, 2);
        const highlighted = Prism.highlight(json, Prism.languages.json, 'json');
        return {
            ...cloudflareData,
            highlightedPropsJson: highlighted
        };
    } catch (e) {
        console.error('[PAGE SERVER] Error:', e);
        // Return safe fallback so page does not 500
        return { highlightedPropsJson: '' };
    }
}
