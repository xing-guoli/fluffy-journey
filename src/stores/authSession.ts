import { ref } from "vue";
import type { PublicUser } from "../types/user";

const STORAGE_KEY = "demo_auth_user";

/** Current user: reactive global + sessionStorage cache. */
export const authUser = ref<PublicUser | null>(null);

export function initAuthSession(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    authUser.value = raw ? (JSON.parse(raw) as PublicUser) : null;
  } catch {
    authUser.value = null;
  }
}

export function setAuthUser(user: PublicUser): void {
  authUser.value = user;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  authUser.value = null;
  sessionStorage.removeItem(STORAGE_KEY);
}
