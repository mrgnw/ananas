import { writable } from 'svelte/store';
import { translateLanguages } from './stores/translateLanguages.svelte.js';

// Create a writable store that syncs with translateLanguages
function createLanguagesStore() {
    const { subscribe, set, update } = writable<string[]>([]);

    return {
        subscribe,
        update: (fn: (value: string[]) => string[]) => {
            update(fn);
            // Sync with translateLanguages store
            const newValue = fn([]);
            newValue.forEach(code => {
                if (!translateLanguages.languages[code]) {
                    translateLanguages.addLanguage(code, {
                        label: code,
                        native: code,
                        rtl: false,
                        display: true
                    });
                }
            });
        },
        set: (value: string[]) => {
            set(value);
            // Sync with translateLanguages store
            value.forEach(code => {
                if (!translateLanguages.languages[code]) {
                    translateLanguages.addLanguage(code, {
                        label: code,
                        native: code,
                        rtl: false,
                        display: true
                    });
                }
            });
        }
    };
}

export const languages = createLanguagesStore();

// Initialize the store with current translateLanguages values
languages.set(Object.keys(translateLanguages.languages)); 