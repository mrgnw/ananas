<script lang="ts">
	import Corbado from '@corbado/web-js';
	import { onMount } from 'svelte';
    import type { SessionUser } from "@corbado/types";
 
	let user: SessionUser | null;
 
    const handleLogout = () => {
        user = null;
        Corbado.logout();
				redirect(302, "/");
    }
 
	onMount(async () => {
        await Corbado.load({
            projectId: "pro-4370035767074657014",
            darkMode: "off",
        });
		if (Corbado.user) {
			user = Corbado.user;
		} else {
			// handle not authenticated user
		}
	});
</script>
 
<div>
    {#if user }
        <h1>Profile Page</h1>
        <p>
            User-ID: { user.sub } <br />
            Email: { user.email }
        </p>
        <button on:click={handleLogout}>Logout</button>
    {/if}
</div>