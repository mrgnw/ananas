<script lang="ts">
    import { startRegistration } from '@simplewebauthn/browser';
    import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
    import { goto } from '$app/navigation';

    let email = $state('');
    let errorMessage = $state<string | null>(null);
    let isLoading = $state(false);

    async function handleRegister() {
        if (!email) {
            errorMessage = 'Please enter your email.';
            return;
        }
        errorMessage = null;
        isLoading = true;

        try {
            // 1. Get registration options from the server
            const respOptions = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (!respOptions.ok) {
                const err = await respOptions.json() as { error?: string };
                throw new Error(err.error || `Failed to get registration options (${respOptions.status})`);
            }

            const options = await respOptions.json() as PublicKeyCredentialCreationOptionsJSON;

            // 2. Start the browser's passkey creation process
            const attestationResponse = await startRegistration(options);

            // 3. Send the attestation response to the server for verification
            const respVerify = await fetch('/api/auth/register/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...attestationResponse, userId: options.user.id }) // Include userId from options
            });

            if (!respVerify.ok) {
                const err = await respVerify.json() as { error?: string };
                throw new Error(err.error || `Registration verification failed (${respVerify.status})`);
            }

            const verificationResult = await respVerify.json() as { success: boolean; verified: boolean };

            if (verificationResult.success && verificationResult.verified) {
                console.log('Registration successful!');
                // Registration and login (via cookie) successful, redirect to home or dashboard
                await goto('/'); // Redirect to homepage after successful registration
            } else {
                throw new Error('Registration verification failed on the server.');
            }

        } catch (error: any) {
            console.error('Registration failed:', error);
            errorMessage = error.message || 'An unknown error occurred during registration.';
            // Handle specific SimpleWebAuthn errors if needed
            if (error.name === 'InvalidStateError') {
                errorMessage = 'Authenticator was probably already registered by user';
            }
        } finally {
            isLoading = false;
        }
    }

</script>

<h1>Register New Account</h1>

<form onsubmit={event => { event.preventDefault(); handleRegister(); }}>
    <div>
        <label for="email">Email:</label>
        <input id="email" type="email" bind:value={email} required disabled={isLoading} />
    </div>
    <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register with Passkey'}
    </button>
</form>

{#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
{/if}

<style>
    form div {
        margin-bottom: 1rem;
    }
    label {
        display: block;
        margin-bottom: 0.25rem;
    }
</style>
