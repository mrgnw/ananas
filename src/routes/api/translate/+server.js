import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const OPENAI_API_KEY = env.VITE_OPENAI_API_KEY;
const apiUrl = 'https://ananas-api.xces.workers.dev';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { text, tgt_langs } = await request.json();

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				api_key: OPENAI_API_KEY
			},
			body: JSON.stringify({
				text,
				tgt_langs: tgt_langs
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error fetching translation:', error);
		return json({ error: 'Translation failed' }, { status: 500 });
	}
}
