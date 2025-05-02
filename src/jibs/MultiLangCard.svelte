<script>
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { getColorByIndex } from '$lib/colors';
	import { Copy, Trash2 } from 'lucide-svelte';
	import { userStore } from '$lib/stores/user.svelte.js';

	let { translation, show_langs, truncate_lines, onDelete = null, ...props } = $props();

	const deleteTranslation = () => {
		if (onDelete) {
			onDelete(translation);
		}
	};

	/**
	 * @param {string} text
	 */
	const copyToClipboard = async (text) => {
		try {
			if (browser && navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
				toast.success('Copied to clipboard!');
			} else {
				// Fallback for environments where Clipboard API is not available
				const textArea = document.createElement('textarea');
				textArea.value = text;
				document.body.appendChild(textArea);
				textArea.select();
				try {
					document.execCommand('copy');
					toast.success('Copied to clipboard!');
				} catch (err) {
					console.error('Failed to copy text:', err);
					toast.error('Failed to copy text. Please copy manually.');
				}
				document.body.removeChild(textArea);
			}
		} catch (err) {
			console.error('Failed to copy text:', err);
			toast.error('Failed to copy text. Please copy manually.');
		}
	};
</script>

<div class="group w-full">
	<Card class="transition-shadow hover:shadow-md relative">
		<CardContent class="p-2 sm:p-3">
			<div class="relative">
				{#each userStore.user.selectedLanguages as lang, i}
					{#if translation.translations[lang]}
						{@const sourceLang = translation.translations.metadata?.src_lang || 'eng'}
						{@const isSourceLang = lang === sourceLang}

						<!-- Streamlined layout with minimal nesting -->
						<div class="relative group mb-1 last:mb-0">
							<!-- Border as pseudo-element to avoid layout impact -->
							<div class="absolute left-0 top-0 bottom-0 w-0.5 {isSourceLang ? 'bg-blue-300' : 'bg-gray-100'} group-hover:bg-blue-200 transition-colors"></div>
							
							<!-- Translation text with padding for copy button -->
							<div class="pl-4 text-sm {getColorByIndex(i, true)} {truncate_lines ? 'line-clamp-3' : ''} break-words">
								{translation.translations[lang]}
							</div>
							
							<!-- Copy button absolutely positioned -->
							<button
								class="absolute left-0.5 top-0.5 text-gray-400 opacity-0 transition-opacity hover:text-blue-500 group-hover:opacity-100"
								aria-label="Copy translation"
								onclick={() => copyToClipboard(translation.translations[lang])}
							>
								<Copy class="h-2.5 w-2.5" />
							</button>
						</div>
					{/if}
				{/each}
			</div>
		</CardContent>
		
		<!-- Delete button - moved outside the translations container -->
		<div class="absolute bottom-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
			<button
				class="icon-button rounded-full border border-gray-100 bg-white p-1 text-gray-400 shadow-md hover:text-red-500"
				aria-label="Delete translation"
				onclick={deleteTranslation}
			>
				<Trash2 class="h-2.5 w-2.5" />
			</button>
		</div>
	</Card>
</div>
