import { writable } from 'svelte/store';

// Create stores for tracking typing state
export const userHasTyped = writable(false);
export const userHasEverTyped = writable(false);
export const isTyping = writable(false);
export const examplesPaused = writable(false);
export const textIsFromExample = writable(false);

// Debug logs with timestamps
function logWithTimestamp(message, value) {
    console.log(`[${new Date().toISOString()}] ${message}`, value);
}

// Helper functions to update the state
export function markUserTyped() {
    userHasTyped.set(true);
    userHasEverTyped.set(true);
    examplesPaused.set(true);
    textIsFromExample.set(false); // User typed, not an example
    logWithTimestamp('User typed content', true);
}

export function markExampleTyped() {
    textIsFromExample.set(true);
    logWithTimestamp('Example text being typed', true);
}

export function resetTypingFlags() {
    userHasTyped.set(false);
    userHasEverTyped.set(false);
    textIsFromExample.set(false);
    logWithTimestamp('Typing flags reset', { userHasTyped: false, userHasEverTyped: false, textIsFromExample: false });
}

export function clearUserHasTyped() {
    userHasTyped.set(false);
    logWithTimestamp('User typing flag reset', false);
}
