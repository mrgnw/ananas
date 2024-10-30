<script lang="ts">
	import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
	import { toast } from 'svelte-sonner';

	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleRegistration() {
			isLoading = true;
			errorMessage = '';
			successMessage = '';

			try {
					const resp = await fetch('/api/register', {
							method: 'POST',
							headers: {
									'Content-Type': 'application/json',
							},
							body: JSON.stringify({ username: 'user', password: 'pass' }), // Replace with actual user input
					});
					const data = await resp.json();
					const attResp = await startRegistration(data.registrationOptions);
					const verificationResp = await fetch('/api/verify-registration', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(attResp),
					});
					const verificationJSON = await verificationResp.json();

					if (verificationJSON.verified) {
							successMessage = 'Registration successful!';
							toast.success(successMessage);
					} else {
							errorMessage = 'Registration failed.';
							toast.error(errorMessage);
					}
			} catch (error) {
					console.error('Registration error:', error);
					errorMessage = 'Registration failed.';
					toast.error(errorMessage);
			} finally {
					isLoading = false;
			}
	}

	async function handleAuthentication() {
			isLoading = true;
			errorMessage = '';
			successMessage = '';

			try {
					const resp = await fetch('/api/generate-authentication-options', {
							method: 'POST',
					});
					const options = await resp.json();
					const asseResp = await startAuthentication(options, true);
					const verificationResp = await fetch('/api/verify-authentication', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(asseResp),
					});
					const verificationJSON = await verificationResp.json();

					if (verificationJSON && verificationJSON.verified) {
							successMessage = 'Login successful!';
							toast.success(successMessage);
					} else {
							errorMessage = 'Login failed.';
							toast.error(errorMessage);
					}
			} catch (error) {
					console.error('Authentication error:', error);
					errorMessage = 'Login failed.';
					toast.error(errorMessage);
			} finally {
					isLoading = false;
			}
	}
</script>

<div>
	<Button on:click={handleRegistration} disabled={isLoading}>
			Register with Passkey
	</Button>
	<Button on:click={handleAuthentication} disabled={isLoading}>
			Login with Passkey
	</Button>
</div>

{#if successMessage}
	<p class="text-green-500">{successMessage}</p>
{/if}

{#if errorMessage}
	<p class="text-red-500">{errorMessage}</p>
{/if}