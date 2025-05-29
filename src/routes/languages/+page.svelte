<script>
	import { userStore } from '$lib/stores/user.svelte.js';
	import { getAllLanguages, filterLanguages } from '$lib/utils/languages.js';
	import { getLanguageSuggestions } from '$lib/utils/languageSuggestions.ts';
	import { flip } from 'svelte/animate';
	import PageWrapper from '$lib/components/layout/PageWrapper.svelte';

	let filter = $state('');
	let { data } = $props();
	let { languages = [], country_languages = [], ip_country } = data;

	let allLanguages = $state(languages);
	let showSuggestions = $state(true);
	
	// Get language suggestions
	let suggestions = $derived(() => {
		if (!showSuggestions || userStore.user?.selectedLanguages?.length > 0) return [];
		return getLanguageSuggestions(ip_country);
	});

	// userLanguages: allLanguages that are in userStore.user.selectedLanguages (no filter applied)
	let userLanguages = $derived.by(() =>
		allLanguages.filter((lang) => (userStore.user?.selectedLanguages ?? []).includes(lang.code))
	);
	let otherLanguages = $derived.by(() =>
		allLanguages.filter((lang) => !(userStore.user?.selectedLanguages ?? []).includes(lang.code))
	);

	function formatSpeakers(n) {
		if (!n) return '';
		return (n / 1000).toFixed(0) + 'M';
	}
</script>

<PageWrapper>
	<div class="filter-bar">
		<input
			class="language-filter-input"
			type="text"
			placeholder="Filter languages..."
			bind:value={filter}
			autocomplete="off"
		/>
	</div>

	{#if suggestions.length > 0}
		<div class="suggestions-section">
			<h3>Suggested for you</h3>
			<div class="suggestions-list">
				{#each suggestions as suggestion}
					<button 
						class="suggestion-item" 
						onclick={() => {
							userStore.addLanguage(suggestion.code);
							showSuggestions = false;
						}}
					>
						<span class="suggestion-name">{suggestion.name}</span>
						{#if suggestion.nativeName !== suggestion.name}
							<span class="suggestion-native">{suggestion.nativeName}</span>
						{/if}
						<span class="suggestion-reason">{suggestion.reason === 'primary' ? 'Browser language' : suggestion.reason === 'country_primary' ? 'Local language' : 'Suggested'}</span>
					</button>
				{/each}
			</div>
			<button class="dismiss-suggestions" onclick={() => showSuggestions = false}>
				× Dismiss suggestions
			</button>
		</div>
	{/if}

	<ul class="languages-list">
		{#each userLanguages as lang (lang.code)}
			<li
				class="language-item selected"
				animate:flip={{ duration: 222 }}
				onclick={() => userStore.removeLanguage(lang.code)}
				tabindex="0"
				aria-label={`Remove ${lang.name}`}
			>
				<span class="lang-action">–</span>
				<span class="lang-speakers">{formatSpeakers(lang.speakers)}</span>
				<span class="lang-label">{lang.name}</span>
				{#if lang.nativeName && lang.nativeName !== lang.name}
					<span class="lang-native">{lang.nativeName}</span>
				{/if}
			</li>
		{/each}

		{#if userLanguages.length && filterLanguages(otherLanguages, filter).length}
			<li
				class="language-separator"
				style="margin: 0.5em 0; border-bottom: 1px solid #eee; list-style: none;"
			></li>
		{/if}

		{#each filterLanguages(otherLanguages, filter) as lang (lang.code)}
			<li
				class="language-item"
				animate:flip={{ duration: 222 }}
				onclick={() => userStore.addLanguage(lang.code)}
				tabindex="0"
				aria-label={`Add ${lang.name}`}
			>
				<span class="lang-action">+</span>
				<span class="lang-speakers">{formatSpeakers(lang.speakers)}</span>
				<span class="lang-label">{lang.name}</span>
				{#if lang.nativeName && lang.nativeName !== lang.name}
					<span class="lang-native">{lang.nativeName}</span>
				{/if}
			</li>
		{/each}
	</ul>
</PageWrapper>

<style>
	.suggestions-section {
		max-width: 480px;
		margin: 1rem auto;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
	}
	
	.suggestions-section h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
	}
	
	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.suggestion-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}
	
	.suggestion-item:hover {
		background: #f3f4f6;
		border-color: #6366f1;
	}
	
	.suggestion-name {
		font-weight: 600;
		color: #111827;
	}
	
	.suggestion-native {
		color: #6b7280;
		font-style: italic;
	}
	
	.suggestion-reason {
		margin-left: auto;
		font-size: 0.75rem;
		color: #9ca3af;
		background: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 12px;
	}
	
	.dismiss-suggestions {
		font-size: 0.875rem;
		color: #6b7280;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0;
		transition: color 0.15s ease;
	}
	
	.dismiss-suggestions:hover {
		color: #374151;
	}

	.languages-list {
		max-width: 480px;
		margin: 0 auto;
		padding: 0;
		list-style: none;
	}
	.language-item {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.15em 0.5em;
		border-radius: 5px;
		margin-bottom: 0.1em;
		font-size: 1em;
		min-height: 32px;
		transition:
			background 0.12s,
			box-shadow 0.12s;
		will-change: transform, opacity;
		cursor: pointer;
		outline: none;
	}
	.language-item:hover,
	.language-item:focus {
		background: #f6f8fa;
		box-shadow: 0 0 0 2px #6366f1;
	}

	.lang-label {
		font-weight: 600;
		margin-left: 0.3em;
	}
	.lang-native {
		color: #888;
		margin-left: 0.3em;
		font-size: 0.97em;
	}
	.lang-speakers {
		color: #aaa;
		font-size: 0.97em;
		min-width: 2.5em;
		text-align: right;
		margin-left: 0.2em;
		margin-right: 0.2em;
	}
	.lang-label {
		font-weight: 600;
		font-size: 1.05em;
		display: block;
	}
	.lang-native {
		display: block;
		font-style: italic;
		color: #888;
		font-size: 0.97em;
		margin-top: -0.15em;
		margin-bottom: 0.1em;
		margin-left: 0.2em;
	}

	.filter-bar {
		display: flex;
		align-items: center;
		max-width: 420px;
		margin: 0.7rem auto 0.5rem auto;
		padding: 0 0.5rem;
		border-bottom: 2px solid #e5e7eb;
		background: none;
	}
	.language-filter-input {
		flex: 1;
		border: none;
		outline: none;
		background: none;
		font-size: 1.15em;
		padding: 0em 0 0em 0;
		color: #222;
		transition:
			box-shadow 0.15s,
			border-color 0.15s;
	}
	.language-filter-input:focus {
		box-shadow: 0 2px 0 0 #6366f1;
		border-bottom: 2px solid #6366f1;
	}
</style>
