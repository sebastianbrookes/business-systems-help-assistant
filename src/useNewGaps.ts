import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { visitorId } from "./visitorId";

const FLASH_MS = 2500;

/**
 * The Visitor's Gaps since the page loaded that the IT team panel hasn't shown
 * yet. While the panel is in view, they're marked seen and their groups flash.
 */
export function useNewGaps(itTeamInView: boolean) {
  const questions = useQuery(api.questions.list, { visitorId });
  const [seen, setSeen] = useState<Set<Id<"questions">> | null>(null);
  const [flashing, setFlashing] = useState<Set<Id<"gapGroups">>>(new Set());
  const gaps = questions?.filter((q) => q.gapGroupId) ?? [];
  const unseen = seen ? gaps.filter((q) => !seen.has(q._id)) : [];

  useEffect(() => {
    if (!questions) return;
    const gapIds = new Set(gaps.map((q) => q._id));
    // Gaps from before this page load aren't new.
    if (!seen) return setSeen(gapIds);
    if (!itTeamInView || !unseen.length) return;
    setSeen(gapIds);
    setFlashing(new Set(unseen.map((q) => q.gapGroupId!)));
  }, [questions, itTeamInView]);

  useEffect(() => {
    if (!flashing.size) return;
    const timer = setTimeout(() => setFlashing(new Set()), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flashing]);

  return { newGapCount: unseen.length, flashingGroupIds: flashing };
}
