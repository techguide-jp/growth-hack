// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SessionInfo, SessionUser } from "$lib/shared/session";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: SessionUser | null;
      session: SessionInfo | null;
      isOnboarded: boolean;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
