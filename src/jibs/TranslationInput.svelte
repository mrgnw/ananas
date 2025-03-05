<script>
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Languages } from 'lucide-svelte';

	// Props
	export let text;
	export let is_loading;
	export let is_ready;
	export let handleSubmit;
	export let getRandomExample;
	export let variant = 'desktop'; // 'desktop' or 'mobile'

	// Keyboard event handler for accessibility
	function handleKeyDown(event) {
		if (event.key === 'Enter' && is_ready) {
			event.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="flex items-center gap-2">
	<div class="relative flex-1 overflow-hidden rounded-full border border-gray-100 border-gray-200 shadow-md">
		<div class="flex items-center">
			<Input
				type="text"
				placeholder="Enter text from any language..."
				bind:value={text}
				disabled={is_loading}
				class="w-full rounded-full border-0 bg-white py-{variant === 'mobile' ? '3' : '2.5'} pl-4 pr-4 focus:ring-0 {is_loading ? 'opacity-75' : ''}"
				onkeydown={handleKeyDown}
			/>

			<Button
				onclick={handleSubmit}
				disabled={!is_ready}
				class="mr-1 h-auto rounded-full p-2"
				variant={is_ready ? 'default' : 'ghost'}
				type="submit"
			>
				{#if is_loading}
					<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-send"
					>
						<path d="m22 2-7 20-4-9-9-4Z" />
						<path d="M22 2 11 13" />
					</svg>
				{/if}
				<span class="sr-only">{is_loading ? 'Translating...' : 'Translate'}</span>
			</Button>
		</div>
	</div>

	<div class="flex items-center gap-0.5">
		<!-- Languages Quick Access -->
		<a
			href="/languages"
			class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
			title="Manage languages"
		>
			<Languages class="h-5 w-5 text-gray-700" />
			<span class="sr-only">Manage languages</span>
		</a>
	</div>
</div>
