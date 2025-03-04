<script lang="ts">
	import type { PageData } from './$types';
	import NewLang from '$jibs/NewLang.svelte';
	
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<div class="container mx-auto p-4 max-w-5xl">
	<NewLang />
</div>