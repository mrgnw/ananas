import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const OPENAI_API_KEY = env.VITE_OPENAI_API_KEY;
const API_BACKEND = env.API_BACKEND || 'https://ananas-api.xces.workers.dev';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { text, tgt_langs, userId, translators } = await request.json();

		// Use translators from request, with simple fallback
		const userTranslators = translators || ['deepl', 'google'];

		// Log the translation attempt
		console.log('🔍 SvelteKit API received:', {
			userId: userId || 'unauthenticated',
			textLength: text?.length || 0,
			targetLanguages: tgt_langs,
			translators: userTranslators,
			rawTranslators: translators,
			timestamp: new Date().toISOString()
		});

		const response = await fetch(API_BACKEND, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				api_key: OPENAI_API_KEY
			},
			body: JSON.stringify({
				text,
				tgt_langs: tgt_langs,
				translators: userTranslators
			})
		});

		if (!response.ok) {
			console.error('🚨 Translation API error:', {
				status: response.status,
				statusText: response.statusText,
				userId: userId || 'unauthenticated'
			});
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		
		// Log successful translation
		console.log('✅ Translation successful:', {
			userId: userId || 'unauthenticated',
			resultLanguages: Object.keys(data).filter(key => !['metadata', 'errors'].includes(key)),
			hasErrors: !!data.errors,
			timestamp: new Date().toISOString()
		});
		
		return json(data);
	} catch (error) {
		console.error('Error fetching translation:', error);
		return json({ error: 'Translation failed' }, { status: 500 });
	}
}
