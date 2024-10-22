<script lang="ts">
  import { enhance } from '$app/forms';
  import { login } from '@passlock/sveltekit';
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "$lib/components/ui/card";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { Toaster } from "svelte-sonner";
  import { Key } from "lucide-svelte";

  export let data;
  const { PUBLIC_PASSLOCK_TENANCY_ID, PUBLIC_PASSLOCK_CLIENT_ID } = data;

  const { onSubmit } = login({ 
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID, 
    clientId: PUBLIC_PASSLOCK_CLIENT_ID
  });

  let email = '';
  let errorMessage = '';

  function handleSubmit() {
    if (!email) {
      errorMessage = "Please enter your email address.";
      return;
    }

    if (!isValidEmail(email)) {
      errorMessage = "Please enter a valid email address.";
      return;
    }

    console.log("Authenticating with passkey for:", email);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
</script>

<div class="container mx-auto flex items-center justify-center min-h-screen">
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-2xl font-bold">🍍 Ananas</CardTitle>
      <CardDescription>Stay fresh with all of your languages</CardDescription>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={handleSubmit}>
        <div class="space-y-4">
          <div class="space-y-2">
            <Input type="email" id="email" placeholder="Enter your email" bind:value={email} />
          </div>
          {#if errorMessage}
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          {/if}
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex flex-col space-y-4">
      <Button type="submit" class="w-full" on:click={handleSubmit}>
        <Key class="mr-2 h-4 w-4" />
        Sign In with Passkey
      </Button>
      
    </CardFooter>
  </Card>
</div>

<Toaster />
