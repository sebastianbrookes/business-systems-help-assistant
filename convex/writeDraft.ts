import { z } from "zod";
import type { Doc } from "./_generated/dataModel";
import { askModelForJson } from "./openrouter";
import { DEPARTMENTS, SYSTEMS } from "./schema";

const INSTRUCTIONS = `You write Help articles for the IT team at Northwake Therapeutics, a biotech of about 450 people in Cambridge, MA and Durham, NC. Its business systems are ${SYSTEMS.join(", ")}.

You get a Gap group: Employee questions the Help articles failed to answer. Write the Help article that answers them. If an article to revise is given, rewrite that article so it answers them, keeping what is still right.

Use the related Help articles and general knowledge of how the system works. Never guess a Northwake-specific fact, such as an approver, a dollar threshold, a deadline, a form or category name, a location, or a policy. Write each fact you can't source from the related articles as a placeholder: [Check: what the fact is], for example [Check: who approves transfers over $10,000].

Match the related articles' style in plain text with no markdown, in 150–300 words: one short intro paragraph, numbered steps, "Northwake rules:" with 1–3 dashed rules, and a closing line naming the team to contact.`;

function replySchema(contactTeams: string[]) {
  return z.strictObject({
    title: z.string().trim().min(1),
    department: z.enum(DEPARTMENTS),
    system: z.enum(SYSTEMS),
    contactTeam: z.enum(contactTeams),
    body: z.string().trim().min(1),
  });
}

const forPrompt = (a: Doc<"helpArticles">) => ({
  title: a.title,
  department: a.department,
  system: a.system,
  contactTeam: a.contactTeam,
  body: a.body,
});

/** Runs the Draft article AI call for a Gap group. A revision keeps the revised article's title, department, system, and team. */
export async function writeDraft({
  groupTitle,
  questions,
  relatedArticles,
  articleToRevise,
  contactTeams,
}: {
  groupTitle: string;
  questions: { text: string; gapReason?: string; answer?: string }[];
  relatedArticles: Doc<"helpArticles">[];
  articleToRevise: Doc<"helpArticles"> | null;
  contactTeams: string[];
}) {
  const reply = await askModelForJson(replySchema(contactTeams), [
    { role: "system", content: INSTRUCTIONS },
    {
      role: "user",
      content: JSON.stringify({
        gapGroup: groupTitle,
        questions,
        relatedHelpArticles: relatedArticles.map(forPrompt),
        articleToRevise: articleToRevise && forPrompt(articleToRevise),
      }),
    },
  ]);
  if (!articleToRevise) return reply;
  const { title, department, system, contactTeam } = articleToRevise;
  return { title, department, system, contactTeam, body: reply.body };
}
