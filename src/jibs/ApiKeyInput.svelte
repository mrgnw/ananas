<script>
	export let value = '';
  function apiKeyIsValid(form_value) {
		return form_value.startsWith('sk-') && form_value.length === 51;
	}
	$: isValid = apiKeyIsValid(value);

</script>

<div>
	<!-- This should work, no? -->
	<!-- pattern="sk-[a-zA-Z0-9]{48,48}" -->
  <input type="text" 
	bind:value 
	placeholder="Enter your API key" 
	class:valid-key={isValid} 
	class:invalid-key={!isValid} 
	/>
</div>


<style>
  .valid-key {
    border-color: green;
  }

  .invalid-key {
    border-color: red;
  }
</style>