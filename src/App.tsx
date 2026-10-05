import { useState, useSyncExternalStore } from "react";
import { EmployeePanel } from "./EmployeePanel";
import { ItTeamPanel } from "./ItTeamPanel";
import { LoopSteps } from "./LoopSteps";
import { useNewGaps } from "./useNewGaps";
import { startOver } from "./visitorId";

const CASE_STUDY_URL = "https://sebastianbrookes.com/projects/help-assistant";
// Matches the phone breakpoint in styles.css.
const phoneQuery = matchMedia("(max-width: 800px)");

function onPhoneChange(onChange: () => void) {
  phoneQuery.addEventListener("change", onChange);
  return () => phoneQuery.removeEventListener("change", onChange);
}

const useIsPhone = () => useSyncExternalStore(onPhoneChange, () => phoneQuery.matches);

function onStartOver() {
  if (confirm("Start over? Your questions, drafts, and approved articles will be cleared from this browser.")) {
    startOver();
  }
}

export function App() {
  const isPhone = useIsPhone();
  const [tab, setTab] = useState<"employee" | "itTeam">("employee");
  // Opening a group isn't saved, so this step resets on reload until the Visitor drafts.
  const [openedYours, setOpenedYours] = useState(false);
  const itTeamInView = !isPhone || tab === "itTeam";
  const { newGapCount, flashingGroupIds } = useNewGaps(itTeamInView);

  return (
    <div className="app">
      <header className="topbar">
        <a className="how-it-works" href={CASE_STUDY_URL}>
          ← How it works
        </a>
        <p className="demo-label">
          DEMO · fictional company, fake data ·{" "}
          <button className="about-toggle" aria-label="About this demo" popoverTarget="about">
            ⓘ
          </button>
        </p>
        <button className="start-over" onClick={onStartOver}>
          Start over
        </button>
        {/* A popover floats over the page and closes on Escape or an outside click. */}
        <p id="about" className="about" popover="auto">
          Northwake Therapeutics is made up, and the demo isn't affiliated with Coupa, Concur, Workday, Ironclad,
          ServiceNow, Microsoft, or any other vendor. Your activity is private: other Visitors never see your questions
          or drafts. Sebastian can review saved activity to improve the demo.
        </p>
      </header>
      <LoopSteps openedYours={openedYours} />
      {isPhone && (
        <div className="tabs phone-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "employee"} onClick={() => setTab("employee")}>
            Employee
          </button>
          <button role="tab" aria-selected={tab === "itTeam"} onClick={() => setTab("itTeam")}>
            IT team
            {newGapCount > 0 && (
              <span className="badge">
                {newGapCount} new {newGapCount === 1 ? "Gap" : "Gaps"}
              </span>
            )}
          </button>
        </div>
      )}
      <div className="split">
        <div className="pane" hidden={isPhone && tab !== "employee"}>
          <EmployeePanel />
        </div>
        <div className="pane" hidden={!itTeamInView}>
          <ItTeamPanel flashingGroupIds={flashingGroupIds} onOpenYours={() => setOpenedYours(true)} />
        </div>
      </div>
    </div>
  );
}
