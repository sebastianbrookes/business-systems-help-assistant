import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

/** Whether a row is starting data or the Visitor's own. */
export const isVisible = (row: { visitorId?: string }, visitorId: string) =>
  row.visitorId === undefined || row.visitorId === visitorId;

/** Starting data, then the Visitor's own rows, from a by_visitor lookup. */
async function startingThenOwn<T>(
  byVisitor: (id: string | undefined) => Promise<T[]>,
  visitorId: string,
) {
  return [...(await byVisitor(undefined)), ...(await byVisitor(visitorId))];
}

export const visibleGroups = (ctx: QueryCtx, visitorId: string) =>
  startingThenOwn(
    (id) =>
      ctx.db
        .query("gapGroups")
        .withIndex("by_visitor", (q) => q.eq("visitorId", id))
        .collect(),
    visitorId,
  );

const startingAndOwnArticles = (ctx: QueryCtx, visitorId: string) =>
  startingThenOwn(
    (id) =>
      ctx.db
        .query("helpArticles")
        .withIndex("by_visitor", (q) => q.eq("visitorId", id))
        .collect(),
    visitorId,
  );

/** The Help articles the Visitor can see, leaving out any article a visible revision replaces. */
export async function visibleArticles(ctx: QueryCtx, visitorId: string) {
  const articles = await startingAndOwnArticles(ctx, visitorId);
  const replaced = new Set(articles.map((a) => a.revisesArticleId));
  return articles.filter((a) => !replaced.has(a._id));
}

/** The article the Visitor now sees in place of `articleId`, following their revisions of it. */
export async function currentVersion(
  ctx: QueryCtx,
  visitorId: string,
  articleId: Id<"helpArticles">,
) {
  const articles = await startingAndOwnArticles(ctx, visitorId);
  let current = articles.find((a) => a._id === articleId);
  while (current) {
    const { _id } = current;
    const next = articles.find((a) => a.revisesArticleId === _id);
    if (!next) return current;
    current = next;
  }
  return null;
}
