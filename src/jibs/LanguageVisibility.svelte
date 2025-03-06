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
	import { Check, Eye, Globe } from 'lucide-svelte';
	import { getLanguageColors } from '$lib/colors';

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

	// Count visible languages
	let visibleCount = $derived(
		Object.values(user_langs).filter(lang => lang.display).length
	);
</script>

<DropdownMenu open={languageDropdownOpen} onOpenChange={setLanguageDropdownOpen}>
	<DropdownMenuTrigger
		class="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 transition-colors relative"
	>
		<Globe class="h-4 w-4 text-gray-700" />
		{#if visibleCount > 0}
			<span class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">{visibleCount}</span>
		{/if}
		<span class="sr-only">Toggle language visibility</span>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="dropdown-menu-content w-64">
		<DropdownMenuLabel class="px-2 py-1.5 text-sm font-medium text-gray-700">Visible Languages</DropdownMenuLabel>
		<DropdownMenuSeparator />

		<!-- Language visibility toggles -->
		<div class="max-h-[250px] overflow-y-auto">
			{#each Object.entries(user_langs) as [key, meta]}
				<div
					class="touch-item relative flex cursor-pointer select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-50 {meta.display ? getLanguageColors(key, true, 'dropdown') : 'text-gray-700'}"
					onclick={(e) => handleCheckboxClick(e, key)}
					onkeydown={(e) => handleKeyDown(e, () => handleCheckboxClick(e, key))}
					tabindex="0"
					role="checkbox"
					aria-checked={meta.display}
				>
					<span class="absolute left-2 flex h-4 w-4 items-center justify-center {meta.display ? 'text-blue-500' : 'text-gray-300'}">
						<Check class="h-4 w-4" />
					</span>
					<span>{meta.native} <span class="text-xs text-gray-500">({key})</span></span>
				</div>
			{/each}
		</div>
	</DropdownMenuContent>
</DropdownMenu>
