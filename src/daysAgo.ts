const DAY_MS = 24 * 60 * 60 * 1000;

/** How long ago a time was, to the day: "today", "3 days ago", "5 weeks ago". */
export function daysAgo(time: number) {
  const days = Math.floor((Date.now() - time) / DAY_MS);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}
