<script>
	import TranslationList from '$components/TranslationList.svelte';

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	let input_text = '';

	let translationHistory = [
		{ en: 'hiya', es: 'hola', ru: 'привет', it: 'ciao' },
		{
			en: "You can't have your cake and eat it too",
			es: 'No se puede tener el pastel y comérselo también',
			ru: 'Раз и навсегда: нельзя и на торте сесть, и съесть',
			it: 'Non puoi avere la botte piena e la moglie ubriaca'
		},
		{
			en: 'Excuse me sir, can you tell me the time?',
			es: 'Disculpe señor, ¿puede decirme la hora?',
			ru: 'Извините, господин, можете ли вы сказать мне время?',
			it: "Scusi signore, può dirmi l'ora?"
		}
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

<form on:submit|preventDefault={handleSubmit}>
	<button type="submit" disabled={!is_ready}>Translate</button>
	<input type="text" bind:value={input_text} id="input_text" />
</form>

<TranslationList {translationHistory} />

<style>
	:root {
		font-size: 24px; /* Adjust this value to your preference */
	}
	form {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		margin-bottom: 2rem;
	}
	input[type='text'] {
		flex-grow: 1;
		font-size: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1rem;
	}
	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
</style>
