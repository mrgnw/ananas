import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const session = cookies.get('session');
    const userEmail = cookies.get('user');

    return {
        user: session === 'authenticated' ? { email: userEmail } : null
    };
};
