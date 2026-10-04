import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { visitorId } from "./visitorId";

/** What Employees ask and where the Help articles fall short, including the Visitor's own questions. */
export function Dashboard() {
  const dashboard = useQuery(api.dashboard.get, { visitorId });
  if (!dashboard) return null;
  const { bySystem } = dashboard;
  const largestTotal = Math.max(1, ...bySystem.map((s) => s.total));
  const width = (n: number) => `${(100 * n) / largestTotal}%`;

  return (
    <div className="dashboard">
      <div className="stats">
        <Stat value={dashboard.questionsLast30Days} label="Questions in the last 30 days" />
        <Stat
          value={dashboard.percentAnswered === null ? "–" : `${dashboard.percentAnswered}%`}
          label="Answered from a Help article"
        />
        <Stat value={dashboard.openGroups} label="Open Gap groups" />
        <Stat value={dashboard.resolvedGroups} label="Resolved Gap groups" />
      </div>
      <h3>Questions by system, last 30 days</h3>
      <p className="legend">
        <span className="swatch answered" /> Answered <span className="swatch gap" /> Gap
      </p>
      <ul className="chart">
        {bySystem.map(({ system, answered, gap, total }) => (
          <li key={system} aria-label={`${system}: ${answered} answered, ${gap} Gaps`}>
            <span className="system">{system}</span>
            <span className="bar">
              {answered > 0 && (
                <span
                  className="segment answered"
                  style={{ width: width(answered) }}
                  title={`${answered} answered`}
                />
              )}
              {gap > 0 && (
                <span className="segment gap" style={{ width: width(gap) }} title={`${gap} Gaps`} />
              )}
            </span>
            <span className="total">{total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
