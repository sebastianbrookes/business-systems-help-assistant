import { EmployeePanel } from "./EmployeePanel";
import { ItTeamPanel } from "./ItTeamPanel";
import { startOver } from "./visitorId";

function onStartOver() {
  if (confirm("Start over? Your questions, drafts, and approved articles will be cleared from this browser.")) {
    startOver();
  }
}

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <button className="start-over" onClick={onStartOver}>
          Start over
        </button>
      </header>
      <div className="split">
        <EmployeePanel />
        <ItTeamPanel />
      </div>
    </div>
  );
}
