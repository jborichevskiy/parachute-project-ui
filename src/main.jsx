import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Apply the persisted theme before first paint to avoid a flash.
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.dataset.theme = savedTheme;

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:opsz@6..72&display=swap');
  :root, [data-theme="light"] {
    --ink: #1f1d18;
    --body-ink: #2e2a22;
    --muted: #8c8578;
    --hair: #e6e1d6;
    --bg: #faf8f3;
    --paper: #ffffff;
    --on-ink: #faf8f3;
  }
  [data-theme="dark"] {
    --ink: #f3efe6;
    --body-ink: #ddd6c8;
    --muted: #8f897c;
    --hair: #34312b;
    --bg: #16140f;
    --paper: #211e18;
    --on-ink: #16140f;
  }
  @keyframes rise { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes fade { from{opacity:0} to{opacity:1} }
  .card, .row { transition: opacity .15s ease }
  .card:hover, .row:hover { opacity: .66 }
  * { box-sizing: border-box }
  body { margin: 0; background: var(--bg); }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
