<script lang="ts">
	import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
	import { toast } from 'svelte-sonner';
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	
	let isLoading = $state(false);

	async function handleRegistration() {
		isLoading = true;
		try {
			const resp = await fetch('/api/register', {
				method: 'POST',
			});
			const options = await resp.json();
			
			const attResp = await startRegistration(options);
			
			const verificationResp = await fetch('/api/verify-registration', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(attResp),
			});
			
			const verificationJSON = await verificationResp.json();
			
			if (verificationJSON.verified) {
				toast.success('Registration successful!');
			} else {
				toast.error('Registration failed: ' + (verificationJSON.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Registration error:', error);
			toast.error(error instanceof Error ? error.message : 'Registration failed');
		} finally {
			isLoading = false;
		}
	}

	async function handleAuthentication() {
		isLoading = true;
		try {
			const resp = await fetch('/api/generate-authentication-options', {
				method: 'POST',
			});
			const options = await resp.json();
			
			const asseResp = await startAuthentication(options, true);
			
			const verificationResp = await fetch('/api/verify-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(asseResp),
			});
			
			const verificationJSON = await verificationResp.json();
			
			if (verificationJSON.verified) {
				toast.success('Login successful!');
			} else {
				toast.error('Login failed: ' + (verificationJSON.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Authentication error:', error);
			toast.error(error instanceof Error ? error.message : 'Authentication failed');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center">
	<Card class="w-[350px]">
		<CardHeader>
			<CardTitle>Authentication</CardTitle>
		</CardHeader>
		<CardContent class="grid gap-4">
			<Button 
				on:click={handleRegistration} 
				disabled={isLoading}
			>
				Register with Passkey
			</Button>
			<Button 
				on:click={handleAuthentication} 
				disabled={isLoading}
				variant="outline"
			>
				Login with Passkey
			</Button>
		</CardContent>
	</Card>
</div>

