<script>
	// Props using Svelte 5 runes
	let {
		isPaused = false,
		onClick,
		size = 'md',
		className = ''
	} = $props();

	// Compute button and icon sizes based on the size prop
	let buttonSize = $derived(getButtonSize(size));
	let iconSize = $derived(getIconSize(size));

	function getButtonSize(sizeValue) {
		if (sizeValue === 'sm') return 'h-7 w-7';
		if (sizeValue === 'lg') return 'h-12 w-12';
		return 'h-10 w-10';
	}

	function getIconSize(sizeValue) {
		if (sizeValue === 'sm') return '16';
		if (sizeValue === 'lg') return '20';
		return '18';
	}
</script>

<button
	class="flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 shrink-0 {buttonSize} {className}"
	on:click={onClick}
	title={isPaused ? 'Play examples' : 'Pause examples'}
>
	{#if isPaused}
		<svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
	{/if}
</button>
