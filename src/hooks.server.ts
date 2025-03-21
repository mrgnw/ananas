import { handle } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';

export const handleAuth: Handle = async ({ event, resolve }) => {
	// Perform other tasks before authentication handlers run
	const response = await resolve(event);
	return response;
};

export const handle: Handle = async ({ event, resolve }) => {
	// Auth handle
	await handleAuth({ event, resolve });
	return handle({ event, resolve });
};
