import { z } from "zod";
import { askModelForJson } from "./openrouter";
import { placeholdersIn } from "./placeholders";

const INSTRUCTIONS = `You fill [Check: …] placeholders in a Draft article for the IT team at Northwake Therapeutics, using only the IT team notes.

For each numbered placeholder, decide whether one note states that exact fact. If it does, give the fact worded to replace the placeholder in its sentence, and the number of the note that states it. If no note states it, give null for both. Never use general knowledge, guess, or work a fact out from a note on a nearby topic.`;

const replySchema = z.strictObject({
  fills: z.array(
    z.strictObject({
      placeholder: z.number().int(),
      fact: z.string().nullable(),
      noteNumber: z.number().int().nullable(),
    }),
  ),
});

/** Whether the cited note backs the fact: it exists and states every number in the fact. */
const backs = (note: string | undefined, fact: string) =>
  !!note && (fact.match(/\d+/g) ?? []).every((n) => note.includes(n));

/**
 * Runs the Fill from IT notes AI call on a draft. Only placeholders a note
 * backs are filled. The rest, and all other text, come back unchanged. Makes
 * no call, and skips `beforeCall`, when there are no closed placeholders to fill.
 */
export async function fillFromNotes(
  {
    title,
    body,
    notes,
  }: {
    title: string;
    body: string;
    notes: string[];
  },
  beforeCall: () => Promise<void>,
) {
  const placeholders = [
    ...new Set(placeholdersIn(`${title}\n${body}`).filter((p) => p.endsWith("]"))),
  ];
  let filledCount = 0;
  if (!placeholders.length) return { title, body, filledCount };
  await beforeCall();
  const { fills } = await askModelForJson(replySchema, [
    { role: "system", content: INSTRUCTIONS },
    {
      role: "user",
      content: JSON.stringify({
        itTeamNotes: notes.map((text, i) => ({ number: i + 1, text })),
        draft: { title, body },
        placeholders: placeholders.map((text, i) => ({ number: i + 1, text })),
      }),
    },
  ]);
  for (const { placeholder, fact, noteNumber } of fills) {
    const text = placeholders[placeholder - 1];
    const value = fact?.trim();
    if (!text || !value || /[[\]]/.test(value)) continue;
    if (!noteNumber || !backs(notes[noteNumber - 1], value)) continue;
    if (!`${title}\n${body}`.includes(text)) continue;
    // A function keeps "$" in a fact, such as "$325", from being read as a pattern.
    title = title.replaceAll(text, () => value);
    body = body.replaceAll(text, () => value);
    filledCount++;
  }
  return { title, body, filledCount };
}
