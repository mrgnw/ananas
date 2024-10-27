<script lang="ts">
import "../app.pcss";
import type { LayoutData } from './$types';

let { data, children } = $props<{ data: LayoutData }>();
</script>
<svelte:head>
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="manifest" href="/manifest.webmanifest">
</svelte:head>

<nav>
    {#if data.user}
        <span>Welcome, {data.user.name}</span>
        <form method="POST" action="/logout">
            <button type="submit">Logout</button>
        </form>
    {:else}
        <a href="/login">Login</a>
    {/if}
</nav>

{@render children()}
