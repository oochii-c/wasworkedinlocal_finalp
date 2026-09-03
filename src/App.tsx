import { SajuProvider, useSaju } from "./state/SajuContext";
import SajuForm from "./pages/SajuForm";
import Dashboard from "./pages/dashboard/Dashboard";
import Portal from "./pages/portal";

function Router() {
  const { view, chart } = useSaju();
  // 원국 없으면(첫 방문·미제출) 폼. view가 form이어도 폼.
  if (view === "form" || !chart) return <SajuForm />;
  if (view === "home") return <Portal />;
  return <Dashboard />;
}

export default function App() {
  return (
    <SajuProvider>
      <Router />
    </SajuProvider>
  );
}
