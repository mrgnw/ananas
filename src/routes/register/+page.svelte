<!-- src/routes/register/+page.svelte -->
<script lang="ts">
  import { register } from '@passlock/sveltekit';
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "$lib/components/ui/card";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { Key } from "lucide-svelte";

  export let data;
  const { PUBLIC_PASSLOCK_TENANCY_ID, PUBLIC_PASSLOCK_CLIENT_ID } = data;

  const { onSubmit } = register({ 
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID, 
    clientId: PUBLIC_PASSLOCK_CLIENT_ID
  });

  let email = $state('');
  let errorMessage = $state('');

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!email) {
      errorMessage = "Please enter your email address.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMessage = "Please enter a valid email address.";
      return;
    }

    errorMessage = '';
    onSubmit(event);
  }
</script>

<div class="container mx-auto flex items-center justify-center min-h-screen">
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-2xl font-bold">🍍 Ananas</CardTitle>
      <CardDescription>Register to save your languages & translations</CardDescription>
    </CardHeader>
    <CardContent>
      <form method="POST" onsubmit={handleSubmit}>
        <div class="space-y-4">
          <div class="space-y-2">
            <Input 
              name="email" 
              type="email" 
              id="email" 
              placeholder="Enter your email" 
              bind:value={email}
            />
          </div>
          {#if errorMessage}
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          {/if}
          <Button type="submit" class="w-full" onclick={onSubmit}>
            <Key class="mr-2 h-4 w-4" />
            Register
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
