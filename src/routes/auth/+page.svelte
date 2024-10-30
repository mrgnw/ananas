<script lang="ts">
	import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
	import { toast } from 'svelte-sonner';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Label } from "$lib/components/ui/label";
	import { goto } from '$app/navigation';
	
	let isLoading = $state(false);
	let email = $state('');

	async function handleRegistration() {
		if (!email || !email.includes('@')) {
			toast.error('Please enter a valid email address');
			return;
		}

		isLoading = true;
		try {
			const resp = await fetch('/api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
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
		if (!email || !email.includes('@')) {
			toast.error('Please enter a valid email address');
			return;
		}

		isLoading = true;
		try {
			const resp = await fetch('/api/generate-authentication-options', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});
			const options = await resp.json();
			
			const asseResp = await startAuthentication(options);
			
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
				goto('/');
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
			<CardDescription>Register or login using your passkey</CardDescription>
		</CardHeader>
		<CardContent class="grid gap-4">
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input 
					id="email"
					type="email" 
					placeholder="Enter your email" 
					bind:value={email}
					autocomplete="email webauthn"
				/>
			</div>
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

<!-- <Toaster /> -->

