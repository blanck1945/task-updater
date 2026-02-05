const EDIT_KEY_STORAGE = "my-status-edit-keys";

export function getStoredEditKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EDIT_KEY_STORAGE);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function setStoredEditKey(slug: string, editKey: string) {
  const keys = getStoredEditKeys();
  keys[slug] = editKey;
  localStorage.setItem(EDIT_KEY_STORAGE, JSON.stringify(keys));
}

export function getEditKeyForSlug(slug: string): string | null {
  return getStoredEditKeys()[slug] ?? null;
}

export function clearEditKey(slug: string) {
  const keys = getStoredEditKeys();
  delete keys[slug];
  localStorage.setItem(EDIT_KEY_STORAGE, JSON.stringify(keys));
}
