// A state machine to manage the translation app UI state

// Define the machine states
export const STATES = {
  IDLE: 'idle',
  EXAMPLE_TYPING: 'example_typing',
  USER_TYPING: 'user_typing',
  TRANSLATING: 'translating',
  SUCCESS: 'success',
  ERROR: 'error'
};

function createTranslationStateMachine() {
  // Private state
  let _currentState = STATES.IDLE;
  let _previousState = null;
  let _context = {
    error: null,
    lastTranslation: null,
    examplesPaused: false,
    debugInfo: null // Added for debugging
  };
  
  // Subscribers
  const subscribers = new Set();
  
  // Send updates to subscribers
  function notify() {
    const state = getState();
    subscribers.forEach(subscriber => subscriber(state));
  }
  
  // Get current state
  function getState() {
    return {
      currentState: _currentState,
      previousState: _previousState,
      context: { ..._context }
    };
  }
  
  // State transitions
  function transition(newState, contextUpdates = {}) {
    // Don't transition to the same state unless forced
    if (newState === _currentState && !contextUpdates.force) {
      return;
    }

    console.log(`State transition: ${_currentState} -> ${newState}`, contextUpdates);
    
    _previousState = _currentState;
    _currentState = newState;
    
    // Update context with new values
    _context = {
      ..._context,
      ...contextUpdates
    };
    
    // Remove the force flag if it was present
    if (_context.force) {
      delete _context.force;
    }
    
    notify();
  }
  
  // Exported store
  return {
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(getState());
      
      return () => {
        subscribers.delete(subscriber);
      };
    },
    
    // Actions to trigger state transitions
    actions: {
      // Start/resume example typing
      startExamples() {
        if (_currentState === STATES.IDLE || _currentState === STATES.SUCCESS) {
          transition(STATES.EXAMPLE_TYPING, { examplesPaused: false });
        }
      },
      
      // Pause example typing
      pauseExamples() {
        if (_currentState === STATES.EXAMPLE_TYPING) {
          transition(STATES.IDLE, { examplesPaused: true });
        }
      },
      
      // Toggle example typing
      toggleExamples() {
        const isPaused = _context.examplesPaused;
        if (isPaused) {
          this.startExamples();
        } else if (_currentState === STATES.EXAMPLE_TYPING) {
          this.pauseExamples();
        }
        return !isPaused;
      },
      
      // User has started typing
      userTyping(debugText) {
        if (_currentState === STATES.IDLE || _currentState === STATES.EXAMPLE_TYPING) {
          // Added optional debug parameter to track text being typed
          transition(STATES.USER_TYPING, { 
            examplesPaused: true,
            debugInfo: debugText ? { textLength: debugText.length, text: debugText } : null
          });
        }
      },
      
      // User has submitted a translation request
      startTranslating(textToTranslate) {
        // Adding the text to context for debugging
        transition(STATES.TRANSLATING, {
          debugInfo: textToTranslate ? 
            { textLength: textToTranslate.length, textValue: textToTranslate } : 
            { note: 'No text provided to startTranslating' }
        });
      },
      
      // Translation completed successfully
      translationSuccess(result) {
        transition(STATES.SUCCESS, { lastTranslation: result });
      },
      
      // Translation failed
      translationError(error) {
        transition(STATES.ERROR, { error });
      },
      
      // Reset to idle state
      reset() {
        transition(STATES.IDLE, { error: null, lastTranslation: null });
      },
      
      // Add debug info
      addDebugInfo(info) {
        _context.debugInfo = info;
        notify();
      }
    },
    
    // Helper methods to check current state
    is: {
      idle: () => _currentState === STATES.IDLE,
      exampleTyping: () => _currentState === STATES.EXAMPLE_TYPING,
      userTyping: () => _currentState === STATES.USER_TYPING,
      translating: () => _currentState === STATES.TRANSLATING,
      success: () => _currentState === STATES.SUCCESS,
      error: () => _currentState === STATES.ERROR
    },
    
    // Get current state values
    get state() {
      return _currentState;
    },
    
    get context() {
      return { ..._context };
    },
    
    get examplesPaused() {
      return _context.examplesPaused;
    }
  };
}

// Create and export the store
export const translationStateMachine = createTranslationStateMachine();
