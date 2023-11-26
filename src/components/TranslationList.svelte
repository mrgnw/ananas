<script>
  export let translationHistory =  [];
  
	export let languages = ['en', 'es', 'ru', 'it'];
	$: if (translationHistory.length > 0) {
		languages = Object.keys(translationHistory[0]);
	}

	$: console.log(translationHistory);

</script>

<table>
	<tbody>
		{#each languages as language (language)}
			<tr>
				<th>{language}</th>
				{#each translationHistory as translation (translation)}
					<td>{translation[language]}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}
</style>
