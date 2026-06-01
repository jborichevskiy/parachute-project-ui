import { useState } from "react";
import { setConfig } from "./api";
import { MONO, DISPLAY, INK, MUTED, HAIR, BG } from "./styles";

export default function ConfigScreen({ onDone }) {
  const [vaultUrl, setVaultUrl] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const url = vaultUrl.trim().replace(/\/$/, "");
    const tok = token.trim();
    if (!url || !tok) { setError("both fields required"); return; }

    setTesting(true);
    setError("");
    try {
      const r = await fetch(`${url}/api/notes?tag=project&limit=1`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!r.ok) throw new Error(`vault returned ${r.status}`);
      setConfig({ vaultUrl: url, token: tok });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setTesting(false);
    }
  };

  const field = {
    fontFamily: MONO,
    fontSize: 13,
    padding: "10px 12px",
    border: `1px solid ${HAIR}`,
    borderRadius: 6,
    background: "#fff",
    color: INK,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: INK, margin: "0 0 6px" }}>The Workbench</h1>
        <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, margin: "0 0 32px" }}>connect your parachute vault to continue</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: MUTED }}>Vault URL</label>
            <input
              style={field}
              value={vaultUrl}
              onChange={(e) => setVaultUrl(e.target.value)}
              placeholder="https://your-hub.fly.dev/vault/default"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: MUTED }}>API Token</label>
            <input
              style={field}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              placeholder="hub JWT with vault:write scope"
              autoComplete="off"
            />
          </div>

          {error && (
            <div style={{ fontFamily: MONO, fontSize: 11.5, color: "#c0392b", padding: "8px 12px", background: "#fff0ee", borderRadius: 5 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={testing}
            style={{ fontFamily: MONO, fontSize: 13, padding: "12px", border: "none", borderRadius: 6, background: INK, color: "#faf8f3", cursor: testing ? "default" : "pointer", opacity: testing ? 0.6 : 1, marginTop: 4 }}
          >
            {testing ? "connecting…" : "connect"}
          </button>
        </form>

        <p style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, marginTop: 22, lineHeight: 1.6 }}>
          Your URL and token are stored only in this browser's localStorage. Nothing is sent anywhere except your vault.
        </p>
      </div>
    </div>
  );
}
