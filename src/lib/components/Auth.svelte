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
                const errorData = await resp.json().catch(() => ({ error: resp.statusText }));
                throw new Error(errorData.error || 'Registration failed');
            }

            const options = await resp.json();
            console.log('Registration options:', options);

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
                const errorData = await verificationResp.json().catch(() => ({ error: verificationResp.statusText }));
                throw new Error(errorData.error || 'Registration verification failed');
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
                const errorData = await resp.json().catch(() => ({ error: resp.statusText }));
                throw new Error(errorData.error || 'Authentication failed');
            }

            const options = await resp.json();
            console.log('Authentication options:', options);

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
                const errorData = await verificationResp.json().catch(() => ({ error: verificationResp.statusText }));
                throw new Error(errorData.error || 'Authentication verification failed');
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
