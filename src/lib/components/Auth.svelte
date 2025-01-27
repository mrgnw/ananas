<!-- Auth.svelte -->
<script lang="ts">
    import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
    import { state } from '$lib/state';

    let username = '';
    let error = '';
    let success = '';

    // Convert base64url to Uint8Array
    function base64urlToUint8Array(base64url: string): Uint8Array {
        const padding = '='.repeat((4 - base64url.length % 4) % 4);
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    async function register() {
        try {
            console.log('Starting registration...');
            const resp = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            if (!resp.ok) {
                const error = await resp.json();
                throw new Error(error.error || 'Registration failed');
            }

            const options = await resp.json();
            console.log('Registration options:', options);

            // Convert userID from base64url to Uint8Array
            options.user.id = base64urlToUint8Array(options.user.id);

            // No need to decode challenge, startRegistration handles it
            const credential = await startRegistration(options);
            console.log('Registration credential:', credential);

            const verificationResp = await fetch('/auth/register', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...credential,
                    username
                })
            });

            if (!verificationResp.ok) {
                const error = await verificationResp.json();
                throw new Error(error.error || 'Registration verification failed');
            }

            const verification = await verificationResp.json();
            if (verification.verified) {
                alert('Registration successful!');
                state.user = username;
            } else {
                throw new Error('Registration verification failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message);
        }
    }

    async function authenticate() {
        try {
            console.log('Starting authentication...');
            const resp = await fetch('/auth/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            if (!resp.ok) {
                const error = await resp.json();
                throw new Error(error.error || 'Authentication failed');
            }

            const options = await resp.json();
            console.log('Authentication options:', options);

            // No need to decode challenge or allowCredentials, startAuthentication handles it
            const credential = await startAuthentication(options);
            console.log('Authentication credential:', credential);

            const verificationResp = await fetch('/auth/authenticate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...credential,
                    username
                })
            });

            if (!verificationResp.ok) {
                const error = await verificationResp.json();
                throw new Error(error.error || 'Authentication verification failed');
            }

            const verification = await verificationResp.json();
            if (verification.verified) {
                alert('Authentication successful!');
                state.user = username;
            } else {
                throw new Error('Authentication verification failed');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            alert(error.message);
        }
    }
</script>

<div class="flex flex-col gap-4 w-full max-w-sm mx-auto p-4">
    <h2 class="text-2xl font-bold text-center">Passkey Authentication</h2>
    
    {#if !$state.user}
        <div class="flex flex-col gap-4">
            <input
                type="email"
                placeholder="Email"
                bind:value={username}
                class="px-4 py-2 border rounded"
            />
            <button
                on:click={register}
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Register
            </button>
            <button
                on:click={authenticate}
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
                Sign In
            </button>
        </div>
    {:else}
        <div class="text-center">
            <p>Signed in as {$state.user}</p>
            <button
                on:click={() => state.user = null}
                class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Sign Out
            </button>
        </div>
    {/if}
</div>
