import { useEffect, useState } from "react";
import { completeOAuth, PendingApprovalError } from "./oauth";
import { MONO, DISPLAY, INK, MUTED, BG } from "./styles";

export default function OAuthCallback({ onDone }) {
  const [error, setError] = useState(null);
  const [approveUrl, setApproveUrl] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(params.get("error_description") || oauthError);
      return;
    }
    if (!code || !state) {
      setError("Missing code or state in callback URL.");
      return;
    }

    completeOAuth(code, state)
      .then(() => {
        // Clean up the URL, then hand off to the app
        window.history.replaceState({}, "", import.meta.env.BASE_URL);
        onDone();
      })
      .catch((err) => {
        if (err instanceof PendingApprovalError) {
          setApproveUrl(err.approveUrl);
        } else {
          setError(err.message);
        }
      });
  }, []);

  if (approveUrl) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: INK, margin: "0 0 12px" }}>Waiting for approval</h2>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>
            This app needs to be approved by your hub admin before it can connect.
          </p>
          <a href={approveUrl} target="_blank" rel="noreferrer"
            style={{ fontFamily: MONO, fontSize: 12, color: "#1f6f8a" }}>
            Approve in hub admin ↗
          </a>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => window.location.reload()}
              style={{ fontFamily: MONO, fontSize: 11, background: "none", border: "none", color: MUTED, cursor: "pointer", textDecoration: "underline" }}>
              I've approved it — try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: "#c0392b", marginBottom: 16 }}>{error}</p>
          <button onClick={() => { window.history.replaceState({}, "", import.meta.env.BASE_URL); window.location.reload(); }}
            style={{ fontFamily: MONO, fontSize: 11, background: "none", border: "none", color: MUTED, cursor: "pointer", textDecoration: "underline" }}>
            ← back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>completing sign-in…</span>
    </div>
  );
}
