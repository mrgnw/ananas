<script>
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator,
		DropdownMenuLabel,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
		DropdownMenuCheckboxItem
	} from '$lib/components/ui/dropdown-menu';
	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';

	import DropdownMenuLabel from '@/components/ui/dropdown-menu/dropdown-menu-label.svelte';
	import { DropdownMenu, DropdownMenu } from 'bits-ui';
	import { Check, Eye } from 'lucide-svelte';

	let { user_langs } = $props();

	let languageDropdownOpen = $state(false);
	let languageDropdownHoverTimeout;
	function setLanguageDropdownOpen(isOpen) {
		clearTimeout(languageDropdownHoverTimeout);
		languageDropdownOpen = isOpen;
	}

	// Add this function to handle checkbox clicks without closing the dropdown
	function handleCheckboxClick(event, key) {
		// Prevent the default behavior which would close the dropdown
		event.stopPropagation();
		// Toggle the language display
		translateLanguages.toggleLanguageDisplay(key);
	}
	function handleKeyDown(event, callback) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			callback();
		}
	}
</script>

<DropdownMenu open={languageDropdownOpen} onOpenChange={setLanguageDropdownOpen} class="sm:hidden">
	<DropdownMenuTrigger
		class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
	>
		<Eye class="h-4 w-4" />
		<span class="sr-only">Toggle language visibility</span>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="start" class="dropdown-menu-content">
		<DropdownMenuLabel>Visible Languages</DropdownMenuLabel>

		<!-- Language visibility toggles -->
		<div class="max-h-[200px] overflow-y-auto">
			{#each Object.entries(user_langs) as [key, meta]}
				<!-- class {getLanguageColors(key, meta.display, 'dropdown')} -->
				<div
					class="touch-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
					onclick={(e) => handleCheckboxClick(e, key)}
					onkeydown={(e) => handleKeyDown(e, () => handleCheckboxClick(e, key))}
					tabindex="0"
					role="checkbox"
					aria-checked={meta.display}
				>
					<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
						{#if meta.display}
							<Check class="h-4 w-4" />
						{/if}
					</span>
					<span>{meta.native} ({key})</span>
				</div>
			{/each}
		</div>
	</DropdownMenuContent>
</DropdownMenu>
