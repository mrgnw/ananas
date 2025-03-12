import { browser } from '$app/environment';
import { examplePhrases } from '$lib/example';

function createExampleTyperStore() {
  // Private state
  let _isTyping = false;
  let _typingInterval = null;
  let _userHasTyped = false;
  let _userHasEverTyped = false;
  let _textIsFromExample = false;
  let _cycleInterval = null;
  let _examplesPaused = false;
  let _currentText = '';
  let _translationHistoryLength = 0;
  
  // Store subscribers
  const subscribers = new Set();
  
  // Helper function to safely clear timers
  function clearTimer(timer) {
    if (timer) {
      clearTimeout(timer);
      return null;
    }
    return timer;
  }
  
  // Update state and notify subscribers
  function update(newState) {
    let changed = false;
    
    for (const [key, value] of Object.entries(newState)) {
      const privateKey = `_${key}`;
      if (privateKey in this && this[privateKey] !== value) {
        this[privateKey] = value;
        changed = true;
      }
    }
    
    if (changed) {
      notify();
    }
  }
  
  // Notify all subscribers of state changes
  function notify() {
    const state = getState();
    subscribers.forEach(subscriber => subscriber(state));
  }
  
  // Get the current public state object
  function getState() {
    return {
      isTyping: _isTyping,
      typingInterval: _typingInterval,
      userHasTyped: _userHasTyped,
      userHasEverTyped: _userHasEverTyped,
      textIsFromExample: _textIsFromExample,
      examplesPaused: _examplesPaused,
    };
  }
  
  // Update external dependencies
  function updateDependencies(text, historyLength) {
    if (_currentText !== text || _translationHistoryLength !== historyLength) {
      _currentText = text;
      _translationHistoryLength = historyLength;
    }
  }
  
  // Simple typewriter function that updates a variable one letter at a time
  function typeLetters(newText, setText) {
    if (_isTyping) return;
    
    update.call(this, { 
      isTyping: true,
      textIsFromExample: true 
    });
    
    _typingInterval = clearTimer(_typingInterval);
    setText('');
    let i = 0;

    function typeNext() {
      _typingInterval = setTimeout(
        () => {
          if (i < newText.length) {
            setText(newText.substring(0, ++i));
            typeNext();
          } else {
            _typingInterval = clearTimer(_typingInterval);
            update.call(this, { isTyping: false });
            // Keep textIsFromExample true after typing completes
          }
        },
        30 + Math.floor(Math.random() * 40)
      );
    }
    
    typeNext = typeNext.bind(this);
    typeNext();
  }

  // Function to cycle to the next example
  function cycleExamples(setText) {
    // Only show examples if not paused and no history and user hasn't typed
    if (!_examplesPaused && _translationHistoryLength === 0 && 
        !_userHasTyped && (!_userHasEverTyped || _currentText.trim() === '')) {
      const randomExample = examplePhrases[Math.floor(Math.random() * examplePhrases.length)];
      typeLetters.call(this, randomExample, setText);
    }
  }
  
  // Mark that user has typed and stop examples
  function markUserTyped() {
    update.call(this, {
      userHasTyped: true,
      userHasEverTyped: true,
      examplesPaused: true,
      textIsFromExample: false
    });
    
    _cycleInterval = clearTimer(_cycleInterval);
  }
  
  // Toggle play/pause for examples
  function toggleExamples(setText) {
    // If user has ever typed, don't allow unpausing
    if (_userHasEverTyped) {
      update.call(this, { examplesPaused: true });
      return;
    }
    
    // Normal toggle behavior only if user has never typed
    update.call(this, { examplesPaused: !_examplesPaused });
    
    if (_examplesPaused) {
      _cycleInterval = clearTimer(_cycleInterval);
    } else {
      if (!_cycleInterval && _translationHistoryLength === 0) {
        cycleExamples.call(this, setText);
        _cycleInterval = setInterval(() => cycleExamples.call(this, setText), 5000);
      }
    }
  }
  
  // Complete typing animation quickly
  function completeTypingQuickly(setText) {
    if (_isTyping && _typingInterval) {
      console.log('Completing typing animation quickly');
      _typingInterval = clearTimer(_typingInterval);
      
      // Find matching example or use current text
      const targetText = (_currentText && examplePhrases.find((ex) => ex.startsWith(_currentText))) || '';
      if (!targetText) {
        update.call(this, { isTyping: false });
        return;
      }
      
      // Type remaining text at 5ms per character
      let i = _currentText.length;
      
      // finish typing quickly (5ms per character)
      _typingInterval = setInterval(() => {
        if (i < targetText.length) {
          // Add the next letter at ultra fast speed
          setText(targetText.substring(0, i + 1));
          i++;
        } else {
          // Once we've completed the entire example, stop typing
          _typingInterval = clearTimer(_typingInterval);
          update.call(this, { isTyping: false });
        }
      }, 5);
    }
  }
  
  // Handle input focus
  function handleInputFocus(setText) {
    // Pause examples during input focus
    update.call(this, { examplesPaused: true });
    
    // Clear the cycling interval to prevent new examples
    _cycleInterval = clearTimer(_cycleInterval);
    
    completeTypingQuickly.call(this, setText);
  }
  
  // Restart examples when appropriate
  function restartExamplesIfNeeded(setText) {
    // Only restart examples if there's no history and text is empty
    if (_translationHistoryLength === 0 && _currentText.trim().length === 0) {
      // Reset all flags that might prevent examples from showing
      update.call(this, {
        userHasTyped: false,
        userHasEverTyped: false,
        textIsFromExample: false,
        examplesPaused: false
      });
      
      // Start one example after a 4-second delay
      setTimeout(() => {
        if (!_isTyping && _translationHistoryLength === 0) {
          cycleExamples.call(this, setText);
          
          // Set up cycling interval if not already cycling
          if (!_cycleInterval) {
            _cycleInterval = setInterval(() => cycleExamples.call(this, setText), 5000);
          }
        }
      }, 4000);
      
      console.log('Examples restarted - all typing flags reset - examples will start in 4 seconds');
    }
  }
  
  // Handle input blur
  function handleInputBlur(setText) {
    // If there's no history AND text is empty, try to restart examples
    if (_translationHistoryLength === 0 && _currentText.trim().length === 0) {
      restartExamplesIfNeeded.call(this, setText);
    } else {
      // If user has typed, ensure examples remain paused
      update.call(this, { examplesPaused: true });
    }
  }
  
  // Handle user input
  function handleUserInput() {
    // If this is user-initiated input (not our example typing), 
    // mark that the user has typed
    if (!_isTyping) {
      markUserTyped.call(this);
    }
  }
  
  // Initialize examples with a timeout
  function initializeExamples(setText) {
    if (browser && _translationHistoryLength === 0 && !_userHasTyped && 
        (!_userHasEverTyped || _currentText.trim() === '')) {
      console.log('Page fully loaded with empty history, initializing examples');
      
      // Type the first example after a short delay to ensure page is fully rendered
      const timeout = setTimeout(() => {
        console.log('Starting first example');
        cycleExamples.call(this, setText);
        
        // Set up cycling interval
        if (!_cycleInterval) {
          console.log('Setting up cycling interval');
          _cycleInterval = setInterval(() => cycleExamples.call(this, setText), 5000);
        }
      }, 1000);
      
      return () => {
        console.log('Cleaning up intervals');
        clearTimeout(timeout);
        _cycleInterval = clearTimer(_cycleInterval);
        _typingInterval = clearTimer(_typingInterval);
      };
    }
    return () => {};
  }
  
  // Cleanup on destroy
  function cleanup() {
    _cycleInterval = clearTimer(_cycleInterval);
    _typingInterval = clearTimer(_typingInterval);
  }
  
  return {
    // Standard Svelte store subscribe method
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(getState());
      
      return () => {
        subscribers.delete(subscriber);
        cleanup();
      };
    },
    
    // Methods
    updateDependencies,
    markUserTyped: function() {
      markUserTyped.call(this);
    },
    toggleExamples: function(setText) {
      toggleExamples.call(this, setText);
    },
    handleInputFocus: function(setText) {
      handleInputFocus.call(this, setText);
    },
    handleInputBlur: function(setText) {
      handleInputBlur.call(this, setText);
    },
    handleUserInput: function() {
      handleUserInput.call(this);
    },
    initializeExamples: function(setText) {
      return initializeExamples.call(this, setText);
    },
    restartExamplesIfNeeded: function(setText) {
      restartExamplesIfNeeded.call(this, setText);
    },
    reset: function() {
      update.call(this, {
        isTyping: false,
        userHasTyped: false,
        userHasEverTyped: false,
        textIsFromExample: false,
        examplesPaused: false
      });
      
      _cycleInterval = clearTimer(_cycleInterval);
      _typingInterval = clearTimer(_typingInterval);
      _currentText = '';
      _translationHistoryLength = 0;
    }
  };
}

// Create and export the store
export const exampleTyper = createExampleTyperStore();
