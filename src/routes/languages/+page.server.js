/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
    // Get country from Cloudflare request.cf object
    // This will be undefined in dev, but available in production on Cloudflare
    const country = request?.cf?.country || null
    return { country }
}
