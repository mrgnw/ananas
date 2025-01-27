<!-- Auth.svelte -->
<script lang="ts">
    import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
    import { state } from '$lib/state';

    let username = '';
    let error = '';
    let success = '';

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
                type="text"
                bind:value={username}
                placeholder="Username"
                class="px-4 py-2 border rounded"
            />
            
            <button
                on:click={() => {
                    console.log('Register button clicked');
                    register();
                }}
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Register with Passkey
            </button>
            
            <button
                on:click={() => {
                    console.log('Authenticate button clicked');
                    authenticate();
                }}
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
                Sign in with Passkey
            </button>
        </div>
    {:else}
        <div class="text-center">
            <p class="mb-4">Signed in as {$state.user}</p>
            <button
                on:click={() => state.user = null}
                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Sign Out
            </button>
        </div>
    {/if}
    
    {#if error}
        <p class="text-red-500 text-center">{error}</p>
    {/if}
    
    {#if success}
        <p class="text-green-500 text-center">{success}</p>
    {/if}
</div>
