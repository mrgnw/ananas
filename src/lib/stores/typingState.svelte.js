import { writable } from 'svelte/store';

// Create stores for tracking typing state
export const userHasTyped = writable(false);
export const userHasEverTyped = writable(false);
export const isTyping = writable(false);
export const examplesPaused = writable(false);

// Debug logs with timestamps
function logWithTimestamp(message, value) {
    console.log(`[${new Date().toISOString()}] ${message}`, value);
}

// Helper functions to update the state
export function markUserTyped() {
    userHasTyped.set(true);
    userHasEverTyped.set(true);
    examplesPaused.set(true);
    logWithTimestamp('👇 ', true);
}

export function resetTypingFlags() {
    userHasTyped.set(false);
    userHasEverTyped.set(false);
    logWithTimestamp('Typing flags reset', { userHasTyped: false, userHasEverTyped: false });
}

export function clearUserHasTyped() {
    userHasTyped.set(false);
    logWithTimestamp('👇 reset', false);
}
