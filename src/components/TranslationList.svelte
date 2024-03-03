<script>
	import { createTable, Render, Subscribe } from "svelte-headless-table";
  import { readable } from "svelte/store";
	import * as Table from "$components/ui/table";

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

<div class="rounded-md border">
  <Table.Root {...$tableAttrs}>
    <Table.Header>
      {#each $headerRows as headerRow}
        <Subscribe rowAttrs={headerRow.attrs()}>
          <Table.Row>
            {#each headerRow.cells as cell (cell.id)}
              <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
                <Table.Head {...attrs}>
                  <Render of={cell.render()} />
                </Table.Head>
              </Subscribe>
            {/each}
          </Table.Row>
        </Subscribe>
      {/each}
    </Table.Header>
    <Table.Body {...$tableBodyAttrs}>
      {#each $pageRows as row (row.id)}
        <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
          <Table.Row {...rowAttrs}>
            {#each row.cells as cell (cell.id)}
              <Subscribe attrs={cell.attrs()} let:attrs>
                <Table.Cell {...attrs}>
                  <Render of={cell.render()} />
                </Table.Cell>
              </Subscribe>
            {/each}
          </Table.Row>
        </Subscribe>
      {/each}
    </Table.Body>
  </Table.Root>
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