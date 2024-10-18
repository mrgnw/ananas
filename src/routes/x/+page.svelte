<script>
	import Cards from '$jibs/Cards.svelte';
	import LanguagePicker from '$jibs/LanguagePicker.svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { createTranslateLanguages } from '$lib/translateLanguages.svelte.js';

	
	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
	const { languages } = createTranslateLanguages();

	let input_text = $state('');
	let example = { en: 'hiya', es: 'hola', pt: 'olá', ru: 'привет', ar: 'مرحبا', it: 'ciao', ca: 'hola', de: 'hallo' };
	let translationHistory = $state([]);
	let tgt_langs = $state([]);

	function get_browser_languages() {
		console.log('browser languages', navigator.languages);
		var browser_languages = new Set(navigator.languages.map(lang => lang.split('-')[0]));
		return browser_languages;
	}
	$effect(() => {
		if (tgt_langs.length === 0) {
			tgt_langs = get_browser_languages();
			
		}
		
	});

	let is_loading = $state(false);
	let is_ready = $derived(input_text.length > 0 && !is_loading);

	$effect(() => {
		const storedTranslations = JSON.parse(localStorage.getItem('translations'));
		if (storedTranslations && storedTranslations.length > 0) {
			translationHistory = storedTranslations;
		} else {
			translationHistory = [example];
		}
	});
	

	async function handleSubmit() {
		is_loading = true; // Start loading
		const text = input_text;
		const apiUrl = 'https://translate.xces.workers.dev';

		// Extract only languages with a value of 1 (indicating selection)
		const selected_languages = Array.from(all_languages.entries())
			.map(([key, _]) => key);
		console.debug('selected_languages', selected_languages)
		
		const tgt_langs = Array.from(all_languages.entries())
			.map(([key, _]) => key);

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api_key': OPENAI_API_KEY
				},
				body: JSON.stringify({ text, tgt_langs })
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();

			translationHistory = [data, ...translationHistory];
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('translations', JSON.stringify(translationHistory));
			}
			// Clear input text
			input_text = '';
		} catch (error) {
			console.error('Error fetching translation:', error);
		} finally {
			is_loading = false;
		} // Done loading
	}

</script>

<div class="container">
	<form onsubmit={handleSubmit}>
		<div class="grid ">
			<div>
				<Input bind:value={input_text} placeholder="Enter text to translate" />
			</div>
			<div>
				<Button on:click={handleSubmit} disabled={!is_ready}>
					{is_loading ? 'Translating...' : 'Translate'}
				</Button>
			</div>
		</div>
	</form>

	<LanguagePicker bind:tgt_langs />
	<div class="card-list">
		<Cards bind:tgt_langs bind:translationHistory />
	</div>

</div>

<style>
	:root {
		font-size: 1.5em;
	}

	.grid {
		display: grid;
		gap: .5em;
	}

	form {
		padding-bottom: 1em;
	}

	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	form {
		order: 1;
		position: sticky;
		bottom: 0;
	}

	.card-list {
		order: 2;
		flex-grow: 1;
		overflow: auto;
	}

	.container {
		padding: .5em;
	}

	@media (max-width: 640px) {
		form {
			order: 2;
			width: 100%;
		}

		.card-list {
			order: 1;
			width: 100%;

		}

		.grid div {
			width: 100%;
		}
	}
</style>