import type { Handle } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/schema';
import { dev } from '$app/environment';

const SESSION_COOKIE_NAME = 'auth_session';

export const handle: Handle = async ({ event, resolve }) => {
    // 1. Ensure DB platform binding exists
    if (!event.platform?.env?.DB) {
        console.error('FATAL: D1 Database binding (event.platform.env.DB) not found!');
        // In dev mode, maybe allow proceeding without DB? Or always fail?
        // Throwing 500 seems safer as the app is unusable without DB.
        throw new Error('D1 Database binding not found. Ensure wrangler.toml is configured correctly.');
    }

    // 2. Initialize Drizzle and make it available in locals
    const db = drizzle(event.platform.env.DB, { schema });
    event.locals.db = db;

    // 3. Read session cookie
    const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

    if (!sessionId) {
        // No session ID in cookie
        event.locals.user = null;
    } else {
        // 4. Validate session ID by fetching user
        try {
            const user = await db
                .select({
                    id: schema.users.id,
                    username: schema.users.username,
                    email: schema.users.email,
                    // Add other user fields needed globally
                })
                .from(schema.users)
                .where(eq(schema.users.id, sessionId))
                .get();

            if (user) {
                event.locals.user = user;
            } else {
                // Invalid session ID (user not found), clear cookie and set user to null
                event.locals.user = null;
                event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
            }
        } catch (error) {
            console.error('Error validating session:', error);
            event.locals.user = null;
            // Consider clearing the cookie here too, in case of DB errors
            event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
        }
    }

    // 5. Resolve the request
    const response = await resolve(event);
    return response;
};
