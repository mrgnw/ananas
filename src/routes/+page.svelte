<script>
	import TranslationList from '$components/TranslationList.svelte';
	import { Textarea } from "$components/ui/textarea";
	import { Button } from "$components/ui/button";

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	let input_text = '';

	let translationHistory = [
		{ en: 'hiya', es: 'hola', ru: 'привет', it: 'ciao', ca: 'hola', de: 'hallo' },
	];
	let is_loading = false;
	$: is_ready = input_text.length > 0 && !is_loading;

	async function handleSubmit() {
		is_loading = true; // Start loading
		const text = input_text;
		const apiUrl = 'https://translate.xces.workers.dev';

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					api_key: OPENAI_API_KEY
				},
				body: JSON.stringify({ text })
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();

			translationHistory = [...translationHistory, data];
			// Clear input text
			input_text = '';
		} catch (error) {
			console.error('Error fetching translation:', error);
		} finally {
			is_loading = false;
		} // Done loading
	}
</script>
<div>
<form>

	<div class="grid ">
		<div>
			<Textarea bind:value={input_text} placeholder="Enter text to translate" />
		</div>
		<div>
			<Button on:click={handleSubmit} disabled={!is_ready}>
				{is_loading ? 'Translating...' : 'Translate'}
			</Button>
		</div>
	</div>

</form>
</div>
<TranslationList {translationHistory} />

<style>
	:root {
		font-size: 1.5em;
		padding: .8rem;
	}

	form {
		padding-bottom: 1em;
	}
	Button {
    width: auto;
  }
	/* on mobile, put form on bottom */
	@media (max-width: 640px) {
		form {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			background-color: white;
			box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
			padding: 0.4em;
			
		}
		Button {
      width: 90%;
			margin-top: .5em;
			margin-left: 5%;
    }
	}
</style>
