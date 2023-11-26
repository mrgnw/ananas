<script>
	import TranslationList from '$components/TranslationList.svelte';
	
	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	let userApiKey = '';
	let using_api_key;
	function apiKeyIsValid(key) {
		console.log(key);
    return key.startsWith('sk-') && key.length === 51;
  }
	
	$: using_api_key = apiKeyIsValid(userApiKey) ? userApiKey : OPENAI_API_KEY;

	function obscureKey(){
		return `${OPENAI_API_KEY.substring(0, 7)}…`;
	}
	$: using_default = using_api_key === OPENAI_API_KEY;

	let inputText = '';

	let translationHistory = [
    {en: "hiya", es: "hola", ru: "привет", it: "ciao"},
    {en: "Let's grab a coffee sometime", es: "Tomemos un café en algún momento", ru: "Давайте выпьем кофе когда-нибудь", it: "Prendiamo un caffè qualche volta"},
  ];
	let isLoading = false; // Track loading state

	async function handleSubmit() {
		isLoading = true; // Start loading
		const text = inputText;
		const apiUrl = 'https://translate.xces.workers.dev';

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					api_key: using_api_key
				},
				body: JSON.stringify({ text })
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();
			// console.log(data)
			translationHistory = [...translationHistory, data];
			// Clear input text
			inputText = '';
		} catch (error) {
			console.error('Error fetching translation:', error);
		} finally {
			isLoading = false;
		} // Done loading
	}
</script>

<!-- <ApiKeyInput bind:value={userApiKey} /> -->
<!-- <h1>{using_api_key.slice(0,8)}</h1> -->

<form on:submit|preventDefault={handleSubmit}>
	<label for="inputText">Enter Text:</label>
	<textarea bind:value={inputText} id="inputText" rows="4" />
	<button type="submit" disabled={isLoading}>Translate</button>
</form>

<h2>Translation History:</h2>
<TranslationList {translationHistory} />
