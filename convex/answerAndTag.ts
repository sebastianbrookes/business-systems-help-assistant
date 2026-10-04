import { z } from "zod";
import type { Doc, Id } from "./_generated/dataModel";
import { askModelForJson } from "./openrouter";
import { DEPARTMENTS, GAP_REASONS, OUTCOMES, SYSTEMS } from "./schema";

const OFF_TOPIC_DECLINE =
  "Sorry, I can only help with getting things done in Northwake's business systems.";

const INSTRUCTIONS = `You are the help assistant for Northwake Therapeutics, a biotech. Employees ask how to get things done in its business systems: ${SYSTEMS.join(", ")}.

Answer only from the Help articles provided. Never guess a company rule.
Write the answer as plain text with no markdown. Cite articles only in citedArticleIds, never in the answer text.
Reply with one of three outcomes:
- "answered": the articles fully answer the question. Write short steps and cite every article you used.
- "gap": the articles fall short. Set gapReason to "notCovered" if an article is about this same task but misses the part asked, or "noMatch" if no article is about this task, even when some article touches a nearby topic. Answer any covered part, name the missing part, and cite at least one closest related article.
- "offTopic": the question isn't about getting something done at work, such as how to run an experiment or small talk. Company approvals, policies, and requests are on topic even with no matching article, including ones for lab work.
If the Employee names a system Northwake doesn't use, answer from the Northwake article for that task.
Tag the department and system the question is about, or null if unclear.`;

function replySchema(articleIds: string[]) {
  return z
    .strictObject({
      outcome: z.enum(OUTCOMES),
      answer: z.string(),
      citedArticleIds: z.array(z.enum(articleIds)),
      gapReason: z.enum(GAP_REASONS).nullable(),
      department: z.enum(DEPARTMENTS).nullable(),
      system: z.enum(SYSTEMS).nullable(),
    })
    .refine((r) => r.outcome !== "answered" || r.citedArticleIds.length > 0, {
      message: "An answer must cite an article",
    })
    .refine((r) => (r.outcome === "gap") === (r.gapReason !== null), {
      message: "Only a Gap has a Gap reason",
    });
}

/** Runs the answer-and-tag AI call and returns a checked result ready to save. */
export async function answerAndTag(
  question: string,
  articles: Doc<"helpArticles">[],
) {
  const reply = await askModelForJson(
    replySchema(articles.map((a) => a._id)),
    [
      { role: "system", content: INSTRUCTIONS },
      {
        role: "user",
        content: JSON.stringify({
          helpArticles: articles.map((a) => ({
            id: a._id,
            title: a.title,
            department: a.department,
            system: a.system,
            contactTeam: a.contactTeam,
            body: a.body,
          })),
          question,
        }),
      },
    ],
  );
  if (reply.outcome === "offTopic") {
    return {
      outcome: reply.outcome,
      answer: OFF_TOPIC_DECLINE,
      citedArticleIds: [],
    };
  }
  return {
    outcome: reply.outcome,
    answer: reply.answer,
    citedArticleIds: reply.citedArticleIds as Id<"helpArticles">[],
    gapReason: reply.gapReason ?? undefined,
    department: reply.department ?? undefined,
    system: reply.system ?? undefined,
  };
}
