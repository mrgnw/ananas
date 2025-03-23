<script>
    // Import the page data using Svelte store
    import { page } from '$app/stores';
    
    // Props
    /** @type {Object} */
    let { headers } = $props();
    
    // Use passed headers or fallback to headers from page data
    const displayHeaders = $derived(headers || page.data?.headers);
    
    // Function to format the headers for display
    function formatHeaders(headers) {
        if (!headers) return 'No headers available';
        
        try {
            return JSON.stringify(headers, null, 2);
        } catch (e) {
            return 'Error formatting headers: ' + e.message;
        }
    }
</script>

<div class="header-debug">
    <details>
        <summary>Debug: HTTP Headers ({displayHeaders ? Object.keys(displayHeaders).length : 0})</summary>
        <div class="headers-container">
            {#if displayHeaders}
                <div class="search-container">
                    <input 
                        type="text" 
                        placeholder="Search headers..." 
                        id="header-search"
                        on:input={(e) => {
                            const value = e.target.value.toLowerCase();
                            const items = document.querySelectorAll('.header-item');
                            items.forEach(item => {
                                const text = item.textContent.toLowerCase();
                                item.style.display = text.includes(value) ? 'block' : 'none';
                            });
                        }}
                    />
                </div>
                
                <div class="headers-list">
                    {#each Object.entries(displayHeaders) as [key, value]}
                        <div class="header-item">
                            <strong>{key}:</strong> {value}
                        </div>
                    {/each}
                </div>
                
                <div class="raw-json">
                    <h4>Raw JSON:</h4>
                    <pre>{formatHeaders(displayHeaders)}</pre>
                </div>
            {:else}
                <p>No headers available</p>
            {/if}
        </div>
    </details>
</div>

<style>
    .header-debug {
        margin: 1rem 0;
        font-family: monospace;
        font-size: 14px;
    }

    details {
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 0.5rem;
        background-color: #f8f9fa;
    }

    summary {
        cursor: pointer;
        padding: 0.5rem;
        font-weight: bold;
        user-select: none;
    }

    .headers-container {
        padding: 1rem;
        max-height: 500px;
        overflow-y: auto;
    }

    .search-container {
        margin-bottom: 1rem;
    }

    input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .headers-list {
        margin-bottom: 1rem;
    }

    .header-item {
        padding: 0.25rem 0;
        border-bottom: 1px solid #eee;
    }

    .raw-json {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #ddd;
    }

    pre {
        background-color: #f1f1f1;
        padding: 0.5rem;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
    }
</style>
