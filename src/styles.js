export const MONO = "'IBM Plex Mono', ui-monospace, monospace";
export const DISPLAY = "'Fraunces', Georgia, serif";
export const BODY = "'Newsreader', Georgia, serif";

// Theme-aware colors — resolve to CSS variables defined in main.jsx.
// Toggling [data-theme] on <html> swaps every value at once.
export const INK = "var(--ink)";
export const MUTED = "var(--muted)";
export const HAIR = "var(--hair)";
export const BG = "var(--bg)";
export const PAPER = "var(--paper)"; // input/card surface (was #fff)
export const ON_INK = "var(--on-ink)"; // text on an INK-filled surface

export const STAGE = {
  planning: { dot: "#c79324", label: "planning" },
  active: { dot: "#3f9d52", label: "active" },
  paused: { dot: "#9097a0", label: "paused" },
  shipped: { dot: "#3a7bd5", label: "shipped" },
  archived: { dot: "#7a6a58", label: "archived" },
};

export const KIND_COLOR = { physical: "#c9682a", digital: "#1f8a8a" };

export const bodyP = {
  fontFamily: BODY,
  fontSize: 15,
  lineHeight: 1.55,
  color: "var(--body-ink)",
  margin: 0,
};
