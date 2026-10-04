/** A [Check: …] placeholder, including an unclosed one. */
export const PLACEHOLDER = /\[Check:[^\]]*\]?/gi;

/**
 * Every [Check: …] placeholder left in the text, including an unclosed one.
 * Any placeholder blocks approval. Shared by the server and the UI.
 */
export const placeholdersIn = (text: string) => text.match(PLACEHOLDER) ?? [];
