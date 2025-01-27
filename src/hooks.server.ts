import { type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const handleSession: Handle = async ({ event, resolve }) => {
    const session = event.cookies.get('session');
    
    if (!session) {
        event.locals.user = null;
        return resolve(event);
    }

    // Get user from DB using session
    const user = await event.platform?.env.DB.prepare(
        'SELECT users.* FROM users JOIN sessions ON users.id = sessions.user_id WHERE sessions.id = ?'
    ).bind(session).first();

    event.locals.user = user || null;
    return resolve(event);
};

export const handle = sequence(handleSession);
