import { useState } from "react";
import { getConfig, getToken, clearAuth } from "./oauth";
import ConfigScreen from "./ConfigScreen";
import OAuthCallback from "./OAuthCallback";
import Workbench from "./Workbench";

function isCallback() {
  return window.location.pathname.endsWith("/oauth/callback");
}

function isAuthenticated() {
  return !!(getConfig() && getToken()?.accessToken);
}

export default function App() {
  const [state, setState] = useState(() => {
    if (isCallback()) return "callback";
    if (isAuthenticated()) return "workbench";
    return "config";
  });

  if (state === "callback") {
    return <OAuthCallback onDone={() => setState("workbench")} />;
  }
  if (state === "workbench") {
    return <Workbench onLogout={() => { clearAuth(); setState("config"); }} />;
  }
  return <ConfigScreen />;
}
