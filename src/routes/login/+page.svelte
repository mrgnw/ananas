<script lang="ts">
    import { startAuthentication } from '@simplewebauthn/browser';
    import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
    import { goto } from '$app/navigation';

    let email = $state('');
    let errorMessage = $state<string | null>(null);
    let isLoading = $state(false);

    async function handleLogin() {
        if (!email) {
            errorMessage = 'Please enter your email.';
            return;
        }
        errorMessage = null;
        isLoading = true;

        try {
            // 1. Get authentication options from the server
            const respOptions = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (!respOptions.ok) {
                const err = await respOptions.json() as { error?: string };
                throw new Error(err.error || `Failed to get login options (${respOptions.status})`);
            }

            const options = await respOptions.json() as PublicKeyCredentialRequestOptionsJSON;

            // 2. Start the browser's passkey authentication process
            const assertionResponse = await startAuthentication(options);

            // 3. Send the assertion response to the server for verification
            // We need to send the original challenge *and* the userId associated with it
            // The server stored this association when generating options
            const respVerify = await fetch('/api/auth/login/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Body structure matches what verifyAuthenticationResponse expects
                body: JSON.stringify(assertionResponse) 
            });

            if (!respVerify.ok) {
                const err = await respVerify.json() as { error?: string };
                throw new Error(err.error || `Login verification failed (${respVerify.status})`);
            }

            const verificationResult = await respVerify.json() as { success: boolean; verified: boolean };

            if (verificationResult.success && verificationResult.verified) {
                console.log('Login successful!');
                // Login successful, redirect to home or dashboard
                await goto('/'); // Redirect to homepage after successful login
            } else {
                throw new Error('Login verification failed on the server.');
            }

        } catch (error: any) {
            console.error('Login failed:', error);
            errorMessage = error.message || 'An unknown error occurred during login.';
            // Handle specific SimpleWebAuthn errors if needed, e.g., NotAllowedError for cancellation
            if (error.name === 'NotAllowedError') {
                 errorMessage = 'Authentication cancelled or not allowed.';
            }
        } finally {
            isLoading = false;
        }
    }

</script>

<h1>Login</h1>

<form onsubmit={event => { event.preventDefault(); handleLogin(); }}>
    <div>
        <label for="email">Email:</label>
        <input id="email" type="email" bind:value={email} required disabled={isLoading} />
    </div>
    <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login with Passkey'}
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
