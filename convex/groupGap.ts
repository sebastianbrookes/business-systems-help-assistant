import { v, type Infer } from "convex/values";
import { z } from "zod";
import type { Doc, Id } from "./_generated/dataModel";
import { askModelForJson } from "./openrouter";

const INSTRUCTIONS = `You sort Gaps for the IT team at Northwake Therapeutics, a biotech. A Gap is an Employee question the Help articles failed to answer. A Gap group holds Gaps that ask the same thing in different words.

Put the Gap in the existing group that asks the same thing, and set newGroupTitle to null. If no group asks the same thing, set gapGroupId to null and name a new group. A title is a short sentence-case phrase naming the task, such as "Sending samples between Cambridge and Durham".`;

function replySchema(groupIds: string[]) {
  return z
    .strictObject({
      gapGroupId: groupIds.length ? z.enum(groupIds).nullable() : z.null(),
      newGroupTitle: z.string().trim().min(1).nullable(),
    })
    .refine((r) => (r.gapGroupId === null) !== (r.newGroupTitle === null), {
      message: "Choose a group or name a new one",
    });
}

export const groupingValidator = v.union(
  v.object({ gapGroupId: v.id("gapGroups") }),
  v.object({ newGroupTitle: v.string() }),
);
export type Grouping = Infer<typeof groupingValidator>;

/** Runs the grouping AI call, which places a Gap in one of `groups` or names a new one. */
export async function groupGap(
  gap: Pick<Doc<"questions">, "text" | "answer" | "gapReason" | "didntHelp">,
  groups: Doc<"gapGroups">[],
): Promise<Grouping> {
  const reply = await askModelForJson(
    replySchema(groups.map((g) => g._id)),
    [
      { role: "system", content: INSTRUCTIONS },
      {
        role: "user",
        content: JSON.stringify({
          gapGroups: groups.map((g) => ({ id: g._id, title: g.title })),
          gap: {
            question: gap.text,
            assistantAnswer: gap.answer,
            gapReason: gap.didntHelp ? "didntHelp" : gap.gapReason,
          },
        }),
      },
    ],
  );
  return reply.gapGroupId
    ? { gapGroupId: reply.gapGroupId as Id<"gapGroups"> }
    : { newGroupTitle: reply.newGroupTitle! };
}
