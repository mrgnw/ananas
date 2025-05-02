<script>
  import { Play, Pause } from 'lucide-svelte';
  
  // Props
  let { 
    isPaused = true,
    onClick,
    size = 'md' // 'sm', 'md', or 'lg'
  } = $props();
  
  // Derive button size based on the size prop
  let buttonClass = $derived(
    size === 'lg' ? 'h-12 w-12' : 
    size === 'sm' ? 'h-8 w-8' : 
    'h-10 w-10'
  );
  
  let iconSize = $derived(
    size === 'lg' ? 20 :
    size === 'sm' ? 14 : 
    16
  );
</script>

<button 
  class="flex items-center justify-center {buttonClass} rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
  onclick={onClick}
  aria-label={isPaused ? "Show examples" : "Pause examples"}
>
  {#if isPaused}
    <Play size={iconSize} />
  {:else}
    <Pause size={iconSize} />
  {/if}
</button>
