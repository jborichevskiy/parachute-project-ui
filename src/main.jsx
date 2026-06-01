import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:opsz@6..72&display=swap');
  @keyframes rise { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes fade { from{opacity:0} to{opacity:1} }
  .card, .row { transition: opacity .15s ease }
  .card:hover, .row:hover { opacity: .66 }
  * { box-sizing: border-box }
  body { margin: 0 }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
