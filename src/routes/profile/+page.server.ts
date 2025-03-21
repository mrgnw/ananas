import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  // If user isn't logged in, redirect to login page
  if (!session?.user) {
    throw redirect(303, '/login');
  }

  return {
    session
  };
};
