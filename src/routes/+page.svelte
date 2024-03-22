<script>
  import { onMount } from 'svelte';
  import TranslationList from '$components/TranslationList.svelte';
  import { Input } from "$components/ui/input";
  import { Button } from "$components/ui/button";

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  let input_text = '';

  let example = { en: 'hiya', es: 'hola', ru: 'привет', it: 'ciao', ca: 'hola', de: 'hallo' };
  let is_loading = false;
  let translationHistory = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('translations')) || [example] : [example];
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

  if (typeof window !== 'undefined') {
    onMount(() => {
      translationHistory = JSON.parse(localStorage.getItem('translations')) || [example];
    });
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
<div class="card-list">
<TranslationList {translationHistory}/>
</div>
</div>

<style>
	:root {
		font-size: 1.5em;
	}
	.grid {
    display: grid;
    gap: .5em; /* Add space between grid items */
  }

	form {
	`padding`-bottom: 1em;
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
		margin-top: 1em;
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
			margin-top: 0em;
    }
    .grid div {
      width: 100%;
    }
    Button {
      width: 100%;
    }
  }
</style>
