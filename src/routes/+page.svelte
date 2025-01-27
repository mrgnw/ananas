<script lang="ts">
	import type { PageData } from './$types';
	import NewLang from '$jibs/NewLang.svelte';
	import Auth from '$lib/components/Auth.svelte';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();


</script>

<div class="container mx-auto py-8">
    <Auth />
    <NewLang></NewLang>
</div>