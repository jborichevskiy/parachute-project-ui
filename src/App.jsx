import { useState } from "react";
import { getConfig, clearConfig } from "./api";
import ConfigScreen from "./ConfigScreen";
import Workbench from "./Workbench";

export default function App() {
  const [configured, setConfigured] = useState(() => !!getConfig());

  const logout = () => { clearConfig(); setConfigured(false); };

  if (!configured) return <ConfigScreen onDone={() => setConfigured(true)} />;
  return <Workbench onLogout={logout} />;
}
