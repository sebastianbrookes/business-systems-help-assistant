/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as answerAndTag from "../answerAndTag.js";
import type * as draftArticles from "../draftArticles.js";
import type * as gapGroups from "../gapGroups.js";
import type * as groupGap from "../groupGap.js";
import type * as openrouter from "../openrouter.js";
import type * as questions from "../questions.js";
import type * as seed from "../seed.js";
import type * as startingArticles from "../startingArticles.js";
import type * as startingItTeamNotes from "../startingItTeamNotes.js";
import type * as visibility from "../visibility.js";
import type * as writeDraft from "../writeDraft.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  answerAndTag: typeof answerAndTag;
  draftArticles: typeof draftArticles;
  gapGroups: typeof gapGroups;
  groupGap: typeof groupGap;
  openrouter: typeof openrouter;
  questions: typeof questions;
  seed: typeof seed;
  startingArticles: typeof startingArticles;
  startingItTeamNotes: typeof startingItTeamNotes;
  visibility: typeof visibility;
  writeDraft: typeof writeDraft;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
