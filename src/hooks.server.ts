import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionData = event.cookies.get('session');
    
    if (sessionData) {
        try {
            event.locals.user = JSON.parse(sessionData);
        } catch {
            event.cookies.delete('session', { path: '/' });
        }
    }

    return resolve(event);
};
