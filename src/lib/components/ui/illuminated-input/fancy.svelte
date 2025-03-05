<script>
  // FancyIlluminatedInput component
  // A fancy input with advanced shiny illumination animation
  
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
  <div class="glow"></div>
  <div class="shine"></div>
  <div class="border-animation"></div>
</div>

<style>
  .fancy-input-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    border-radius: 8px;
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .fancy-input {
    width: 100%;
    padding: 12px 16px;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(100, 100, 255, 0.2);
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: 
      inset 0 1px 3px rgba(0, 0, 0, 0.05),
      0 0 8px rgba(82, 168, 236, 0);
    z-index: 1;
    position: relative;
  }

  .fancy-input:focus {
    border-color: rgba(82, 168, 236, 0.6);
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 
      inset 0 1px 1px rgba(0, 0, 0, 0.075),
      0 0 8px rgba(82, 168, 236, 0.6);
  }

  /* Shiny reflection effect */
  .shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    pointer-events: none;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.7) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    opacity: 0;
    transform-origin: center;
    animation: move-shine 6s infinite ease-in-out;
  }

  @keyframes move-shine {
    0%, 100% {
      transform: translate(-50%, -50%) scale(0.2);
      opacity: 0;
    }
    50% {
      transform: translate(50%, 50%) scale(0.4);
      opacity: 0.3;
    }
  }

  /* Glowing effect */
  .glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    background: linear-gradient(
      90deg,
      rgba(120, 85, 255, 0) 0%,
      rgba(120, 85, 255, 0.2) 50%,
      rgba(120, 85, 255, 0) 100%
    );
    transform: translateX(-100%);
    animation: glow 4s infinite;
  }

  @keyframes glow {
    0% {
      transform: translateX(-100%);
      opacity: 0;
    }
    20% {
      opacity: 0.8;
    }
    60% {
      transform: translateX(100%);
      opacity: 0.2;
    }
    100% {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  /* Border animation */
  .border-animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    border-radius: 8px;
    overflow: hidden;
  }

  .border-animation::before {
    content: '';
    position: absolute;
    top: -150%;
    left: -50%;
    width: 200%;
    height: 300%;
    background: conic-gradient(
      from 0deg at 50% 50%,
      rgba(64, 158, 255, 0) 0%,
      rgba(64, 158, 255, 0.8) 25%,
      rgba(144, 79, 255, 0.8) 50%,
      rgba(64, 158, 255, 0.8) 75%,
      rgba(64, 158, 255, 0) 100%
    );
    animation: rotate-border 8s linear infinite;
  }

  @keyframes rotate-border {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* Adjust animations when the input is focused */
  .fancy-input:focus ~ .glow {
    animation: glow 2.5s infinite;
  }

  .fancy-input:focus ~ .shine {
    animation: move-shine 4s infinite ease-in-out;
  }

  .fancy-input:focus ~ .border-animation::before {
    animation: rotate-border 4s linear infinite;
  }
</style>
