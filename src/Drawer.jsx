import { useState } from "react";
import { MONO, DISPLAY, BODY, INK, MUTED, HAIR, KIND_COLOR, bodyP } from "./styles";
import KindStage from "./KindStage";

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: MUTED, marginBottom: 9 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function Drawer({ p, onClose, onToggleTodo, onAddLog, saving }) {
  const [entry, setEntry] = useState("");
  if (!p) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(30,26,18,.22)", animation: "fade .2s ease-out", zIndex: 40 }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px,100%)",
        background: "#faf8f3", borderLeft: `1px solid ${HAIR}`, zIndex: 50,
        overflowY: "auto", animation: "slide .28s cubic-bezier(.2,.8,.3,1) both",
      }}>
        <div style={{ padding: "26px 28px 70px" }}>
          <button onClick={onClose} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: KIND_COLOR[p.kind] }}>{p.path}</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 27, color: INK, margin: "6px 0 14px", lineHeight: 1.08 }}>{p.title}</h2>
          <div style={{ marginBottom: 26 }}><KindStage p={p} /></div>

          <Section title="Goal">
            <p style={bodyP}>{p.goal}</p>
          </Section>

          {p.todos.length > 0 && (
            <Section title="To-dos">
              {p.todos.map((t, i) => (
                <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 0", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => onToggleTodo(p.id, i)}
                    style={{ marginTop: 3, accentColor: KIND_COLOR[p.kind], width: 15, height: 15 }}
                  />
                  <span style={{ ...bodyP, fontSize: 14.5, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#a39a87" : "#2e2a22" }}>
                    {t.text}
                  </span>
                </label>
              ))}
            </Section>
          )}

          <Section title="Log">
            {p.log.map((l, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED }}>{l.date}</div>
                <div style={{ ...bodyP, fontSize: 14.5 }}>{l.text}</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <input
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && entry.trim()) {
                    onAddLog(p.id, entry.trim());
                    setEntry("");
                  }
                }}
                placeholder="add a log entry"
                style={{ flex: 1, fontFamily: MONO, fontSize: 12, padding: "9px 11px", border: `1px solid ${HAIR}`, borderRadius: 6, background: "#fff", color: INK }}
              />
              <button
                onClick={() => { if (entry.trim()) { onAddLog(p.id, entry.trim()); setEntry(""); } }}
                disabled={saving}
                style={{ fontFamily: MONO, fontSize: 12, padding: "0 15px", border: "none", borderRadius: 6, background: INK, color: "#faf8f3", cursor: saving ? "default" : "pointer", opacity: saving ? 0.5 : 1 }}
              >
                {saving ? "…" : "add"}
              </button>
            </div>
          </Section>

          {p.links.length > 0 && (
            <Section title="Research / links">
              {p.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: "block", fontFamily: MONO, fontSize: 12, color: "#1f6f8a", textDecoration: "none", padding: "4px 0", wordBreak: "break-word" }}>
                  {l.label} &#8599;
                </a>
              ))}
            </Section>
          )}

          {p.notes && (
            <Section title="Notes & people">
              <p style={bodyP}>{p.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
