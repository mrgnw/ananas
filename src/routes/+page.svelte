<script>
	import { onMount } from 'svelte';
	import Cards from '$jibs/Cards.svelte';
	import LanguagePicker from '$jibs/LanguagePicker.svelte';

	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";


	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
	// let languages = ['en', 'es', 'ca', 'it', 'ru', 'de'];
	let all_languages = new Map([
		['en', 0],
		['es', 1],
		['pt', 0],
		['ca', 0],
		['it', 1],
		['ru', 0],
		['de', 0],
		['ar', 0]
	]);

	let languages = $state(all_languages);
	let language_selections = $derived(
		Array.from(languages).filter(([key, value]) => value === 1).map(([key]) => key)
	)

	let input_text = $state('');

	let example = { en: 'hiya', es: 'hola', pt: 'olá', ru: 'привет', ar: 'مرحبا', it: 'ciao', ca: 'hola', de: 'hallo' };
	let translationHistory = $state([]);

	onMount(() => {
		const storedTranslations = JSON.parse(localStorage.getItem('translations'));
		if (storedTranslations && storedTranslations.length > 0) {
			translationHistory = storedTranslations;
		} else {
			translationHistory = [example];
		}
	});

	let is_loading = $state(false);
	let is_ready = $derived(input_text.length > 0 && !is_loading);


	$effect(() => {
		console.log('is_ready', is_ready);
	});

	async function handleSubmit() {
		is_loading = true; // Start loading
		const text = input_text;
		const apiUrl = 'https://translate.xces.workers.dev';

		// Extract only languages with a value of 1 (indicating selection)
		const selectedLanguages = Array.from(all_languages.entries())
			.map(([key, _]) => key);

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api_key': OPENAI_API_KEY
				},
				body: JSON.stringify({ text, languages: selectedLanguages })
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
	<form on:submit|preventDefault={handleSubmit}>
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

	<LanguagePicker bind:languages />
	<div class="card-list">
		<Cards bind:languages bind:translationHistory />
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

		Button {
			width: 100%;
		}
	}
</style>