<script lang="ts">
	import { toast } from 'svelte-sonner';

    // Define the expected shape of the API response
    type ApiResponse = 
        | { success: true; fruit: string } 
        | { success: false; error: string };

	// State for loading indicator
	let loading = $state(false);

	// Function to handle the button click
	async function handleQueryClick() {
		loading = true;
		try {
			const response = await fetch('/api/banana', { 
				method: 'POST' 
			});

			// Cast the JSON response to our defined type
			const result = await response.json() as ApiResponse;

			if (!response.ok || !result.success) {
				// Handle HTTP errors or application-level errors from the API
				// Check if success is false before accessing error
				const errorMessage = !result.success ? result.error : `HTTP Error: ${response.statusText}`;
				toast.error(`Database query failed: ${errorMessage}`);
				console.error('Query failed:', result, response);
			} else {
				// Success case (TypeScript now knows result.success is true here)
				toast.success(`Database query successful! Result: ${result.fruit}`);
			}
		} catch (error: any) {
			// Handle network errors or unexpected issues
			console.error('Fetch error:', error);
			toast.error(`An error occurred: ${error.message || 'Unknown fetch error'}`);
		} finally {
			loading = false;
		}
	}

</script>

<h1>Test Database Connection</h1>

<p>Click the button below to run a simple query (`SELECT 'banana'`) against the database.</p>

<button onclick={handleQueryClick} disabled={loading}>
	{#if loading}
		Querying...
	{:else}
		Query for Banana
	{/if}
</button>

<style>
	button {
		padding: 0.6em 1.2em;
		font-size: 1em;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		border-radius: 8px;
		transition: border-color 0.25s;
		background-color: #eee;
		color: #333;
		min-width: 150px; /* Prevent layout shift when text changes */
		min-height: 2.8em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	button:hover {
		border-color: #646cff;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	button:focus,
	button:focus-visible {
		outline: 4px auto -webkit-focus-ring-color;
	}

	/* Basic page styling */
	h1 {
		margin-bottom: 1rem;
	}
	p {
		margin-bottom: 1.5rem;
	}
</style>
