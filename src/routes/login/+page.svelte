<script lang="ts">
  import { enhance } from '$app/forms'
  import { login } from '@passlock/sveltekit'

  export let data;
  const { PUBLIC_PASSLOCK_TENANCY_ID, PUBLIC_PASSLOCK_CLIENT_ID } = data;

  const { onSubmit } = login({ 
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID, 
    clientId: PUBLIC_PASSLOCK_CLIENT_ID
  })
</script>

<form method="post" use:enhance={onSubmit}>
  Email:
  <input type="text" name="email" />
  <br />

  <button type="submit">Login</button>
</form>
