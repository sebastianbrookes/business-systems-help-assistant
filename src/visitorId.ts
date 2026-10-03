const STORAGE_KEY = "northwake-help:visitor-id";

function loadOrCreateVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/** This browser's Visitor ID, created on the first visit. Send it with every call. */
export const visitorId = loadOrCreateVisitorId();
