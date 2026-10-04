const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When a row happened. Starting history counts back from today, so the demo
 * never looks stale. Convex doesn't re-run a query as the clock moves, which is
 * fine at the scale of days.
 */
export const happenedAt = (row: { daysAgo?: number; _creationTime: number }) =>
  row.daysAgo === undefined ? row._creationTime : Date.now() - row.daysAgo * DAY_MS;
