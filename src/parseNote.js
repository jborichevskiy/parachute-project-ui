/**
 * Parse a project note's markdown content into structured data.
 *
 * Conventions (from the vault):
 *   # Title
 *   **Goal:** ...
 *   ## Log
 *   ### YYYY-MM-DD
 *   text...
 *   ## To-dos
 *   - [ ] item
 *   - [x] done item
 *   ## Research / videos  (or ## Research / links, etc.)
 *   - label — url  or  label https://...  or bare https://...
 *   ## Notes & people
 *   free text
 */
export function parseNote(note) {
  const content = note.content || "";
  const lines = content.split("\n");

  let title = note.path?.split("/").pop() ?? "";
  let goal = "";
  const log = [];
  const todos = [];
  const links = [];
  let notesText = "";

  let section = null; // "log" | "todos" | "research" | "notes"
  let currentLogDate = null;
  let currentLogLines = [];

  const flushLog = () => {
    if (currentLogDate) {
      log.push({ date: currentLogDate, text: currentLogLines.join("\n").trim() });
      currentLogDate = null;
      currentLogLines = [];
    }
  };

  for (const raw of lines) {
    const line = raw;

    // h1 → title
    if (/^# /.test(line)) {
      title = line.slice(2).trim();
      continue;
    }

    // h2 → section switch
    if (/^## /i.test(line)) {
      flushLog();
      const sec = line.slice(3).toLowerCase();
      if (sec.startsWith("log")) section = "log";
      else if (sec.startsWith("to-do") || sec.startsWith("todo")) section = "todos";
      else if (sec.startsWith("research") || sec.startsWith("link")) section = "research";
      else if (sec.startsWith("notes")) section = "notes";
      else section = null;
      continue;
    }

    // h3 inside log → date header
    if (section === "log" && /^### \d{4}-\d{2}-\d{2}/.test(line)) {
      flushLog();
      currentLogDate = line.slice(4).trim();
      continue;
    }

    // Goal line (can appear anywhere before sections)
    const goalMatch = line.match(/^\*\*Goal:\*\*\s*(.*)$/);
    if (goalMatch) {
      goal = goalMatch[1].trim();
      continue;
    }

    if (section === "log") {
      if (currentLogDate) currentLogLines.push(line);
      continue;
    }

    if (section === "todos") {
      const checked = /^- \[x\]/i.test(line);
      const unchecked = /^- \[ \]/.test(line);
      if (checked || unchecked) {
        const text = line.replace(/^- \[[x ]\]\s*/i, "").trim();
        todos.push({ text, done: checked });
      }
      continue;
    }

    if (section === "research") {
      // skip blank lines
      if (!line.trim()) continue;
      // bullet or bare line
      const stripped = line.replace(/^[-*]\s*/, "").trim();
      // extract url
      const urlMatch = stripped.match(/https?:\/\/\S+/);
      if (urlMatch) {
        const url = urlMatch[0];
        const label = stripped.replace(url, "").replace(/[—–-]\s*$/, "").trim() || url;
        links.push({ label, url });
      }
      continue;
    }

    if (section === "notes") {
      notesText += line + "\n";
      continue;
    }
  }

  flushLog();

  return {
    id: note.id,
    path: note.path,
    title,
    goal,
    stage: note.metadata?.stage ?? "planning",
    kind: note.metadata?.kind ?? "digital",
    tags: (note.tags ?? []).filter((t) => t !== "project"),
    log,
    todos,
    links,
    notes: notesText.trim(),
    content, // keep raw for write-back
  };
}

/** Toggle a checkbox in raw markdown content. Returns updated content. */
export function toggleTodoInContent(content, todoText, currentDone) {
  // replace the specific checkbox line
  const escapedText = todoText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const from = currentDone
    ? new RegExp(`^(- \\[x\\]\\s*)${escapedText}$`, "im")
    : new RegExp(`^(- \\[ \\]\\s*)${escapedText}$`, "im");
  const to = currentDone
    ? `- [ ] ${todoText}`
    : `- [x] ${todoText}`;
  return content.replace(from, to);
}

/** Prepend a new log entry under ## Log > ### YYYY-MM-DD. Returns updated content. */
export function addLogEntryToContent(content, date, text) {
  const entry = `### ${date}\n${text}\n`;
  // insert after "## Log\n"
  const match = content.match(/^## Log\s*$/im);
  if (match) {
    const idx = content.indexOf(match[0]) + match[0].length;
    return content.slice(0, idx) + "\n" + entry + content.slice(idx);
  }
  // fallback: append
  return content + `\n## Log\n\n${entry}`;
}
