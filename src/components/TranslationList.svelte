<script>
	import { createTable, Render, Subscribe } from "svelte-headless-table";
  import { readable } from "svelte/store";

  /**
	 * @type {string[]}
	 */
   export let translationHistory =  [];
  
	export let languages = ['en', 'es', 'ru', 'it', 'ca', 'de'];
	$: if (translationHistory.length > 0) {
		languages = Object.keys(translationHistory[0]);
	}

	const table = createTable(readable(translationHistory));
	const columns = table.createColumns(
		languages.map(lang => (table.column({ accessor: lang, header: lang })))
	);
	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
    table.createViewModel(columns);

</script>

<div class="rounded-md border" style="overflow-x: auto;">
  <table>
		<thead>
			<tr>
				{#each languages as language (language)}
					<th>{language}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each translationHistory as translation (translation)}
				<tr>
					{#each languages as language (language)}
						<td>{translation[language]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
</style>