<script lang="ts">
    import { CheckCircle2, UserX } from 'lucide-svelte';
    import "../app.pcss";
    import { Toaster } from 'svelte-sonner';

    let { data } = $props();
</script>

<div class="min-h-screen">
    <header class="border-b">
        <div class="container mx-auto px-4 py-2 flex justify-between items-center">
            <a href="/" class="font-bold text-xl">Ananas</a>
            <div class="flex items-center gap-2">
                {#if data.user}
                    <CheckCircle2 class="text-green-500 w-5 h-5" />
                    <span class="text-sm text-muted-foreground">{data.user.email}</span>
                {:else}
                    <UserX class="text-gray-400 w-5 h-5" />
                    <a href="/auth" class="text-sm text-muted-foreground hover:text-foreground">Sign in</a>
                {/if}
            </div>
        </div>
    </header>

    <main>
        <slot />
    </main>
</div>

<Toaster />