import { ConvexError } from "convex/values";

/** The message to show for a failed Convex call. */
export const errorMessage = (e: unknown) =>
  e instanceof ConvexError ? String(e.data) : "Something went wrong. Try again.";
