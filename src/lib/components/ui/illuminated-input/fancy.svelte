<script>
  // FancyIlluminatedInput component
  // A fancy input with smooth edge illumination animation 
  
  // Props definition with bindable value
  const { value = $bindable(''), class: className = "", ...props } = $props();

  // Pass all regular input props to the actual input element
</script>

<div class="fancy-input-container">
  <input 
    class="fancy-input {className}" 
    {...props}
    {value}
    aria-label={props['aria-label'] || 'Search input'}
  />
  <div class="glow-border"></div>
</div>

<style>
  .fancy-input-container {
    position: relative;
    width: 100%;
    height: 40px;
  }

  .fancy-input {
    width: 100%;
    height: 100%;
    padding: 0 16px;
    font-size: 1rem;
    background: white;
    border: 1px solid rgba(229, 231, 235, 1);
    border-radius: 9999px; /* Full rounded */
    outline: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    position: relative;
    z-index: 2;
  }

  .fancy-input:focus {
    border-color: rgba(82, 168, 236, 0.4);
    box-shadow: 0 0 0 1px rgba(82, 168, 236, 0.2);
  }

  /* Glow border that follows the rounded edges */
  .glow-border {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
  }

  .glow-border::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 9999px;
    background: conic-gradient(
      from 0deg at 50% 50%,
      rgba(116, 116, 255, 0) 0%,
      rgba(116, 116, 255, 0.2) 25%, 
      rgba(64, 158, 255, 0.2) 50%,
      rgba(116, 116, 255, 0.2) 75%,
      rgba(116, 116, 255, 0) 100%
    );
    opacity: 0;
    transform: scale(1.01);
    animation: rotate-glow 12s linear infinite;
    transition: opacity 0.3s ease;
  }

  .fancy-input:focus ~ .glow-border::before {
    opacity: 1;
    animation: rotate-glow 6s linear infinite;
  }

  /* Subtle animation that follows the rounded edges */
  @keyframes rotate-glow {
    0% {
      transform: scale(1.01) rotate(0deg);
    }
    100% {
      transform: scale(1.01) rotate(360deg);
    }
  }
</style>
