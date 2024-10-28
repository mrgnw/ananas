// src/routes/register/+page.server.ts
import type { Actions, PageServerLoad } from './$types'
import { TokenVerifier } from '@passlock/sveltekit'
import { PUBLIC_PASSLOCK_TENANCY_ID, PUBLIC_PASSLOCK_CLIENT_ID } from '$env/static/public'
import { PASSLOCK_API_KEY } from '$env/static/private'
import { Passlock } from '@passlock/sveltekit'

const tokenVerifier = new TokenVerifier({
  tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
  apiKey: PASSLOCK_API_KEY
})

export const load: PageServerLoad = async () => {
  return {
    PUBLIC_PASSLOCK_TENANCY_ID,
    PUBLIC_PASSLOCK_CLIENT_ID
  };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData()
    const token = formData.get('token') as string
    const result = await tokenVerifier.exchangeToken(token)

    if (Passlock.isPrincipal(result)) {
      console.log(result)
    } else {
      console.error(result.message)
    }
  }
}
