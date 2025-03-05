<script>
  // IlluminatedInput component
  // A fancy input with shiny illumination animation
  
  // Props definition with bindable value
  const { value = $bindable(''), class: className = "", ...props } = $props();

  // Pass all regular input props to the actual input element
</script>

<div class="illuminated-input-container">
  <input 
    class="illuminated-input {className}" 
    {...props}
    {value}
    aria-label={props['aria-label'] || 'Search input'}
  />
  <div class="shine"></div>
</div>

<style>
  .illuminated-input-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .illuminated-input {
    width: 100%;
    padding: 12px 16px;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: 
      inset 0 1px 3px rgba(0, 0, 0, 0.05),
      0 0 8px rgba(82, 168, 236, 0);
  }

  .illuminated-input:focus {
    border-color: rgba(82, 168, 236, 0.6);
    box-shadow: 
      inset 0 1px 1px rgba(0, 0, 0, 0.075),
      0 0 8px rgba(82, 168, 236, 0.6);
  }

  .shine {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-100%);
    animation: shine 3s infinite;
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 0.8;
    }
    50% {
      transform: translateX(100%) rotate(0deg);
      opacity: 0.2;
    }
    100% {
      transform: translateX(100%) rotate(0deg);
      opacity: 0;
    }
  }

  /* Add a more dramatic shining effect when the input is focused */
  .illuminated-input:focus + .shine {
    animation: shine-focused 2s infinite;
  }

  @keyframes shine-focused {
    0% {
      transform: translateX(-100%);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    50% {
      transform: translateX(100%);
      opacity: 0.6;
    }
    100% {
      transform: translateX(100%);
      opacity: 0;
    }
  }
</style>
