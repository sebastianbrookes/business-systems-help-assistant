/**
 * Every [Check: …] placeholder left in the text, including an unclosed one.
 * Any placeholder blocks approval. Shared by the server and the UI.
 */
export const placeholdersIn = (text: string) =>
  text.match(/\[Check:[^\]]*\]?/gi) ?? [];
