<script>
	import { languages } from "countries-list";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Toaster } from "svelte-sonner";
	import { toast } from "svelte-sonner";
	import { Languages, Search } from "lucide-svelte";
	import { dndzone } from "svelte-dnd-action";
	import _ from "underscore";

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	let text = $state("");
	let show_original = $state(true);
	
	let user_langs = $state({
		'en': { label: 'English', native: 'English', rtl: false, display: true },
		'ru': { label: 'Russian', native: 'Русский', rtl: false, display: true },
		'ja': { label: 'Japanese', native: '日本語', rtl: false, display: true },
		'es': { label: 'Spanish', native: 'Español', rtl: false, display: true },
	});
	let tgt_langs = $derived(Object.keys(user_langs));
	let show_langs = $derived(
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);
	let is_loading = $state(false);
	let is_ready = $derived(
		text.length > 0
		&& tgt_langs.length > 0
		&& !is_loading
	);

	let translations = $state([{
		text: "Ahoy",
		translations: {
			// todo: "original": "Ahoy" ?
			"en": "Hello",
			"es": "Hola",
			"ru": "Привет",
			"it": "Ciao",
			"de": "Hallo",
			"ca": "Hola"
		}
	}]);

	function langs_not_in_tgt(translation) {
		return Object.keys(translation.translations).filter(lang => !tgt_langs.includes(lang));
	}

	function toggle_display(key) {
		if (key === 'original') {
			show_original = !show_original;
		} else {
			user_langs[key].display = !user_langs[key].display;
		}
		console.log('toggling', key);
	}

	async function handleSubmit() {
		is_loading = true;
		const apiUrl = 'https://translate.xces.workers.dev';

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api_key': OPENAI_API_KEY
				},
				body: JSON.stringify({
					text,
					tgt_langs
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();

			translations = [{
				text,
				translations: data
			}, ...translations];

			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('translations', JSON.stringify(translations));
			}
			text = '';
			toast.success("Translation successful!");
		} catch (error) {
			console.error('Error fetching translation:', error);
			toast.error("Translation failed. Please try again.");
		} finally {
			is_loading = false;
		}
	}

</script>

<div class="container mx-auto p-4 space-y-6">
	<h1 class="text-2xl font-bold mb-4">Multi-Language Translator</h1>
	<!-- <pre><code>{JSON.stringify(langs, null, 2)}</code></pre> -->
	<div class="space-y-4">
		<Input type="text" placeholder="Enter text to translate" bind:value={text} />
		<div class="flex flex-wrap gap-2 items-center">
			<Badge onclick={()=> toggle_display('original')}
			variant={show_original ? 'default' : 'outline'}>
				original
			</Badge>
			{#each Object.entries(user_langs) as [key, meta]}
			<Badge 
				variant={meta.display ? 'default' : 'outline'}
				class="cursor-pointer" 
				onclick={()=> toggle_display(key)}
			>
				{meta.native}
			</Badge>
			{/each}
		</div>
		<Button onclick={handleSubmit} disabled={!is_ready}>
			<Languages class="mr-2 h-4 w-4" />
			{is_loading ? 'Translating...' : 'Translate'}
		</Button>
	</div>

	<div class="space-y-4">
		<h2 class="text-xl font-semibold">Translation History</h2>
		{#each translations as translation}
		<Card>
			<CardContent>
				<div class="space-y-2">
					{#if show_original}
						<p title="original"><strong>{translation.text}</strong></p>
					{/if}
					{#each show_langs as langKey}
						{#if translation.translations[langKey]}
							<p>{translation.translations[langKey]}</p>
						{/if}
					{/each}
					<p>
						{langs_not_in_tgt(translation).join('•')}
					</p> 
				</div>
			</CardContent>
		</Card>
		{/each}
	</div>
</div>

<Toaster />
