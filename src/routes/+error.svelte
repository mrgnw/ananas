<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="container mx-auto p-4">
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <h1 class="text-xl font-bold">Error {$page.status}</h1>
        <p>{$page.error?.message}</p>
    </div>
</div> 