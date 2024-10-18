<!-- src/routes/register/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import { register } from '@passlock/sveltekit'
	import {
    PUBLIC_PASSLOCK_TENANCY_ID,
    PUBLIC_PASSLOCK_CLIENT_ID
  } from '$env/static/public'

  const { onSubmit } = register({ 
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID, 
    clientId: PUBLIC_PASSLOCK_CLIENT_ID, 
  })
</script>

<form method="post" use:enhance={onSubmit}>
  Email:
  <input type="text" name="email" />
  <br />

  <!-- First name:
  <input type="text" name="givenName" />
  <br />

  Last name:
  <input type="text" name="familyName" />
  <br /> -->

  <button type="submit">Register</button>
</form>