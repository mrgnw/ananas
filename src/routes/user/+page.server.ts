import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  // If user is logged in, redirect to profile page
  if (session?.user) {
    throw redirect(303, '/user/profile');
  }

  return {};
};
