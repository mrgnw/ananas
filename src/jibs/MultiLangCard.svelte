<script>
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { getLanguageColors } from '$lib/colors';
	import { Copy, Trash2 } from 'lucide-svelte';

	let { translation, show_langs, truncate_lines, onDelete, ...props } = $props();

	const deleteTranslation = () => {
		if (onDelete) {
			onDelete(translation);
		}
	};

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
		<CardContent class="p-3">
			<div class="relative">
				{#each show_langs as lang}
					{#if translation.translations[lang]}
						{@const sourceLang = translation.translations.metadata?.src_lang || 'eng'}
						{@const isSourceLang = lang === sourceLang}

						<div
							class="group relative border-l-2 pl-2.5 {isSourceLang
								? 'border-blue-300'
								: 'border-gray-100'} mb-2 transition-colors last:mb-0 hover:border-blue-200"
						>
							<div
								class="text-sm {getLanguageColors(
									lang,
									true,
									'dropdown'
								)} pr-6 pt-0.5 {truncate_lines ? 'line-clamp-3' : ''}"
							>
								{translation.translations[lang]}
							</div>
							<button
								class="absolute right-0 top-0 p-1 text-gray-400 opacity-0 transition-opacity hover:text-blue-500 group-hover:opacity-100"
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
		<div class="absolute bottom-1 right-1 z-10">
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
