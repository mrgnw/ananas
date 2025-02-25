<script lang="ts">
	import type { PageData } from './$types';
	import NewLang from '$jibs/NewLang.svelte';
	
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<div class="container mx-auto space-y-6 p-4">
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-bold">Translate</h1>
	</div>

	<NewLang />
</div>