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

/** Starts over: the next page load gets a new Visitor ID. The old ID's activity stays saved. */
export function startOver() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
