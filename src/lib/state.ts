import { writable } from 'svelte/store';

interface State {
    user: string | null;
}

export const state = writable<State>({
    user: null
});
