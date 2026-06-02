import { useState } from "react";
import { beginOAuth } from "./oauth";
import { MONO, DISPLAY, INK, MUTED, HAIR, BG, ON_INK } from "./styles";

export default function ConfigScreen() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const connect = async (e) => {
    e.preventDefault();
    if (!url.trim()) { setError("enter your vault or hub URL"); return; }
    setLoading(true);
    setError("");
    try {
      await beginOAuth(url.trim());
      // beginOAuth redirects — execution stops here on success
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const field = {
    fontFamily: MONO, fontSize: 13, padding: "10px 12px",
    border: `1px solid ${HAIR}`, borderRadius: 6,
    background: "var(--paper)", color: INK, width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: INK, margin: "0 0 6px" }}>The Workbench</h1>
        <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, margin: "0 0 32px" }}>connect your parachute vault to continue</p>

        <form onSubmit={connect} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: MUTED }}>
              Vault or Hub URL
            </label>
            <input
              style={field}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-hub.fly.dev"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ fontFamily: MONO, fontSize: 11.5, color: "#c0392b", padding: "8px 12px", background: "#fff0ee", borderRadius: 5 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ fontFamily: MONO, fontSize: 13, padding: "12px", border: "none", borderRadius: 6, background: INK, color: ON_INK, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, marginTop: 4 }}
          >
            {loading ? "connecting…" : "connect →"}
          </button>
        </form>

        <p style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, marginTop: 22, lineHeight: 1.6 }}>
          You'll be redirected to your hub to log in. No token paste required.
        </p>
      </div>
    </div>
  );
}
