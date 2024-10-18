import type { Actions } from './$types'
import { Passlock, TokenVerifier } from '@passlock/sveltekit'
import { PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public'
import { PASSLOCK_API_KEY } from '$env/static/private'

const tokenVerifier = new TokenVerifier({
  tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
  apiKey: PASSLOCK_API_KEY
})

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