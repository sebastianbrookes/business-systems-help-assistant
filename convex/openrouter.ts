import { ConvexError } from "convex/values";
import { z } from "zod";

/** Thrown when a limit is hit or OpenRouter is out of credit. */
export class PausedError extends ConvexError<string> {
  constructor() {
    super(
      "The assistant is paused right now. Try a Suggested question instead, which still works.",
    );
  }
}

/** The one place the model is named. */
const MODEL = "openai/gpt-6-luna";

/**
 * Asks the model for JSON matching `schema` and returns it checked.
 * Throws a ConvexError if the reply isn't valid JSON of that shape.
 */
export async function askModelForJson<T>(
  schema: z.ZodType<T>,
  messages: { role: "system" | "user"; content: string }[],
): Promise<T> {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema, { io: "input" });
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "reply",
            strict: true,
            schema: jsonSchema,
          },
        },
      }),
    },
  );
  // OpenRouter refuses with 402 when the prepaid credit has run out.
  if (response.status === 402) throw new PausedError();
  if (!response.ok) {
    throw new Error(`OpenRouter returned ${response.status}`);
  }
  try {
    const body = await response.json();
    return schema.parse(JSON.parse(body.choices[0].message.content));
  } catch {
    throw new ConvexError("The assistant gave an unusable reply. Try again.");
  }
}
