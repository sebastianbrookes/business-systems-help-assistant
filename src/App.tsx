import { EmployeePanel } from "./EmployeePanel";
import { ItTeamPanel } from "./ItTeamPanel";

export function App() {
  return (
    <div className="split">
      <EmployeePanel />
      <ItTeamPanel />
    </div>
  );
}
