<script lang="ts">
	import { toast } from 'svelte-sonner';

	// Define the expected shape of the API response
	type ApiResponse = 
		| { success: true; count: number } // Updated for counter
		| { success: false; error: string };

	// State for loading indicator (shared for simplicity)
	let loading = $state(false);

	// Function to handle the counter increment button click
	async function handleIncrementClick() {
		loading = true;
		try {
			const response = await fetch('/api/banana', { 
				method: 'POST' 
			});

			// Cast the JSON response to our defined type
			const result = await response.json() as ApiResponse;

			if (!response.ok || !result.success) {
				const errorMessage = !result.success ? result.error : `HTTP Error: ${response.statusText}`;
				toast.error(`Counter update failed: ${errorMessage}`);
				console.error('Query failed:', result, response);
			} else {
				// Success: Show the new count
				toast.success(`Counter updated! New count: ${result.count}`);
			}
		} catch (error: any) {
			console.error('Fetch error:', error);
			toast.error(`An error occurred: ${error.message || 'Unknown fetch error'}`);
		} finally {
			loading = false;
		}
	}

</script>

<h1>Test Database Connection</h1>

<p>Click the button below to test database operations.</p>

<div class="flex gap-4">
	<!-- Button for the new Increment Counter functionality -->
	<button onclick={handleIncrementClick} disabled={loading}>
		{#if loading}
			Updating...
		{:else}
			Increment Counter
		{/if}
	</button>
</div>

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
