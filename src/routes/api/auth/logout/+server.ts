import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

const SESSION_COOKIE_NAME = 'auth_session';

// Clear the session cookie to log the user out
export const POST: RequestHandler = async ({ cookies }) => {
    cookies.delete(SESSION_COOKIE_NAME, {
        path: '/',
    });

    return json({ success: true });
};
