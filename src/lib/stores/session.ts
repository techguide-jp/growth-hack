import { derived, writable } from "svelte/store";
import type { SessionState } from "$lib/shared/session";

const emptySessionState: SessionState = {
  user: null,
  session: null,
  isOnboarded: false,
};

const sessionState = writable<SessionState>(emptySessionState);

export const session = {
  subscribe: sessionState.subscribe,
};

export const sessionUser = derived(
  sessionState,
  ($sessionState) => $sessionState.user,
);
export const sessionInfo = derived(
  sessionState,
  ($sessionState) => $sessionState.session,
);
export const sessionIsOnboarded = derived(
  sessionState,
  ($sessionState) => $sessionState.isOnboarded,
);

export function setSessionState(nextState: SessionState) {
  sessionState.set(nextState);
}

export function clearSessionState() {
  sessionState.set(emptySessionState);
}
