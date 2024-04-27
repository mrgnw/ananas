<script>
	export let value = '';
  $: isValid = value.startsWith('sk-') && value.length === 51;
	let pattern = "sk-[a-zA-Z0-9]{48,48}";

</script>

<div>
	<input type="text" 
		pattern
		bind:value 
		size="50"
		placeholder="Enter your API key" 
		class:valid-key={isValid} 
		class:invalid-key={!isValid} 
	/>
</div>


<style>
	input {
		font-family: monospace;
	}
  .valid-key {
    border-color: green;
  }

  .invalid-key {
    border-color: red;
  }
</style>