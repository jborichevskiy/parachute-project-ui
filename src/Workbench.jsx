import { useState, useEffect, useCallback } from "react";
import { fetchProjects, patchNote } from "./api";
import { parseNote, toggleTodoInContent, addLogEntryToContent } from "./parseNote";
import LowPolyIcon from "./LowPolyIcon";
import KindStage from "./KindStage";
import Drawer from "./Drawer";
import { MONO, DISPLAY, INK, MUTED, HAIR, BG, KIND_COLOR, ON_INK } from "./styles";

function ZoneLabel({ children, count }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: INK }}>{children}</span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{count}</span>
    </div>
  );
}

function meta(p) {
  const remaining = p.todos.filter((t) => !t.done).length;
  return { remaining, last: p.log[0]?.date };
}

function BenchCard({ p, onClick, delay }) {
  const { remaining, last } = meta(p);
  return (
    <button onClick={onClick} className="card"
      style={{ animation: `rise .5s ${delay}s both ease-out`, textAlign: "left", cursor: "pointer", background: "transparent", border: "none", borderTop: `1px solid ${HAIR}`, padding: "18px 4px 4px", display: "flex", gap: 14, width: "100%" }}>
      <LowPolyIcon seed={p.id} kind={p.kind} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: INK, lineHeight: 1.12, marginBottom: 7 }}>{p.title}</div>
        <KindStage p={p} />
        <div style={{ marginTop: 11, fontFamily: MONO, fontSize: 10, color: MUTED, display: "flex", justifyContent: "space-between" }}>
          <span>{remaining > 0 ? `${remaining} next step${remaining === 1 ? "" : "s"}` : "no next steps"}</span>
          {last && <span>{last}</span>}
        </div>
      </div>
    </button>
  );
}

function ShelfRow({ p, onClick, delay }) {
  return (
    <button onClick={onClick} className="row"
      style={{ animation: `rise .45s ${delay}s both ease-out`, textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: "10px 4px", display: "flex", alignItems: "center", gap: 11, width: "100%", borderTop: `1px solid ${HAIR}` }}>
      <LowPolyIcon seed={p.id} kind={p.kind} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 14.5, color: INK, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
      </div>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: KIND_COLOR[p.kind], flexShrink: 0 }} />
    </button>
  );
}

export default function Workbench({ onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  const [activeTags, setActiveTags] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  };

  const toggleTag = (tag) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchProjects();
      setProjects(raw.map(parseNote));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = projects.find((p) => p.id === openId) ?? null;

  // Union of all (non-"project") tags across projects, for the filter bar.
  const allTags = [...new Set(projects.flatMap((p) => p.tags))].sort();
  // A project matches when it carries every currently-selected tag.
  const visible = activeTags.length
    ? projects.filter((p) => activeTags.every((t) => p.tags.includes(t)))
    : projects;

  const active = visible.filter((p) => p.stage === "active");
  const planned = visible.filter((p) => p.stage === "planning");
  const paused = visible.filter((p) => p.stage === "paused" || p.stage === "archived");

  const updateContent = async (id, newContent) => {
    setSaving(true);
    try {
      const updated = await patchNote(id, newContent);
      const parsed = parseNote({ ...updated, content: newContent });
      setProjects((ps) => ps.map((p) => p.id === id ? parsed : p));
      showToast("saved");
    } catch (e) {
      showToast("save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = (id, idx) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const todo = p.todos[idx];
    const newContent = toggleTodoInContent(p.content, todo.text, todo.done);
    updateContent(id, newContent);
  };

  const addLog = (id, text) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const date = new Date().toISOString().slice(0, 10);
    const newContent = addLogEntryToContent(p.content, date, text);
    updateContent(id, newContent);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>loading vault…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: "#c0392b" }}>error: {error}</span>
        <button onClick={load} style={{ fontFamily: MONO, fontSize: 12, padding: "8px 18px", border: `1px solid ${HAIR}`, borderRadius: 6, background: "transparent", color: MUTED, cursor: "pointer" }}>retry</button>
        <button onClick={onLogout} style={{ fontFamily: MONO, fontSize: 11, background: "none", border: "none", color: MUTED, cursor: "pointer", textDecoration: "underline" }}>change config</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f3", padding: "44px 20px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <header style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 30, color: INK, margin: 0, letterSpacing: ".01em" }}>Jon's workbench</h1>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 6 }}>
              {projects.length} projects · parachute vault
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={toggleTheme} title="toggle dark mode" style={{ fontFamily: MONO, fontSize: 11, background: "none", border: `1px solid ${HAIR}`, borderRadius: 5, padding: "5px 10px", color: MUTED, cursor: "pointer" }}>{theme === "dark" ? "☀" : "☾"}</button>
            <button onClick={load} title="refresh" style={{ fontFamily: MONO, fontSize: 11, background: "none", border: `1px solid ${HAIR}`, borderRadius: 5, padding: "5px 10px", color: MUTED, cursor: "pointer" }}>↺</button>
          </div>
        </header>

        {allTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {allTags.map((tag) => {
              const on = activeTags.includes(tag);
              return (
                <button key={tag} onClick={() => toggleTag(tag)}
                  style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".04em", padding: "5px 11px", borderRadius: 20, cursor: "pointer", border: `1px solid ${on ? INK : HAIR}`, background: on ? INK : "transparent", color: on ? ON_INK : MUTED }}>
                  #{tag}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])}
                style={{ fontFamily: MONO, fontSize: 10.5, padding: "5px 11px", borderRadius: 20, cursor: "pointer", border: "none", background: "none", color: MUTED, textDecoration: "underline" }}>
                clear
              </button>
            )}
          </div>
        )}

        <section style={{ marginBottom: 52 }}>
          <ZoneLabel count={active.length}>On the bench</ZoneLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "0 36px", marginTop: 4 }}>
            {active.map((p, i) => (
              <BenchCard key={p.id} p={p} onClick={() => setOpenId(p.id)} delay={0.05 + i * 0.07} />
            ))}
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 44 }}>
          <section>
            <ZoneLabel count={planned.length}>Planned</ZoneLabel>
            <div style={{ marginTop: 4 }}>
              {planned.length ? planned.map((p, i) => (
                <ShelfRow key={p.id} p={p} onClick={() => setOpenId(p.id)} delay={0.2 + i * 0.06} />
              )) : <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, paddingTop: 12 }}>nothing planned</div>}
            </div>
          </section>
          <section>
            <ZoneLabel count={paused.length}>Paused</ZoneLabel>
            <div style={{ marginTop: 4 }}>
              {paused.length ? paused.map((p, i) => (
                <ShelfRow key={p.id} p={p} onClick={() => setOpenId(p.id)} delay={0.28 + i * 0.06} />
              )) : <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, paddingTop: 12 }}>nothing paused</div>}
            </div>
          </section>
        </div>
      </div>

      <Drawer p={open} onClose={() => setOpenId(null)} onToggleTodo={toggleTodo} onAddLog={addLog} saving={saving} />

      {toast && (
        <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 60, fontFamily: MONO, fontSize: 11.5, background: INK, color: ON_INK, padding: "11px 18px", borderRadius: 8, animation: "fade .2s ease-out" }}>
          {toast}
        </div>
      )}

      <button onClick={onLogout} style={{ position: "fixed", bottom: 26, right: 24, fontFamily: MONO, fontSize: 10, background: "none", border: "none", color: MUTED, cursor: "pointer", opacity: 0.5 }}>
        config
      </button>
    </div>
  );
}
