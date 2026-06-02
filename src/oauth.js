/* OAuth 2.1 + PKCE + DCR flow for Parachute Workbench */

const SCOPE = "vault:read vault:write";
const CLIENT_NAME = "Parachute Workbench";

// Resolved at runtime so it works on both localhost and GitHub Pages
export function getRedirectUri() {
  const base = import.meta.env.BASE_URL; // e.g. "/parachute-project-ui/"
  return window.location.origin + base + "oauth/callback";
}

// ── PKCE ────────────────────────────────────────────────────────────────────

function generateVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function deriveChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateState() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Storage keys ─────────────────────────────────────────────────────────────

const CONFIG_KEY = "wb:config";
const TOKEN_KEY = "wb:token";
const PENDING_KEY = "wb:oauth_pending"; // sessionStorage

const dcrKey = (issuer) => `wb:dcr:${issuer}`;

// ── Config/token accessors ───────────────────────────────────────────────────

export function getConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; }
}

export function getToken() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

// ── Discovery + DCR ──────────────────────────────────────────────────────────

function normalizeUrl(raw) {
  const s = raw.trim();
  const withScheme = /^https?:\/\//.test(s) ? s : `https://${s}`;
  return withScheme.replace(/\/$/, "");
}

async function discoverMetadata(url) {
  const normalized = normalizeUrl(url);
  const r = await fetch(`${normalized}/.well-known/oauth-authorization-server`);
  if (!r.ok) throw new Error(`Discovery failed (${r.status}). Is this a valid Parachute vault or hub URL?`);
  return r.json();
}

async function ensureClient(meta, redirectUri) {
  const key = dcrKey(meta.issuer);
  const cached = JSON.parse(localStorage.getItem(key) || "null");
  if (cached?.clientId && cached?.redirectUri === redirectUri) return cached.clientId;

  const r = await fetch(meta.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ client_name: CLIENT_NAME, redirect_uris: [redirectUri] }),
  });
  if (!r.ok) throw new Error(`Client registration failed (${r.status})`);
  const data = await r.json();
  localStorage.setItem(key, JSON.stringify({ clientId: data.client_id, redirectUri }));
  return data.client_id;
}

// ── Begin OAuth flow (call this to start login) ──────────────────────────────

export async function beginOAuth(issuerUrl) {
  const meta = await discoverMetadata(issuerUrl);
  const redirectUri = getRedirectUri();
  const clientId = await ensureClient(meta, redirectUri);

  const codeVerifier = generateVerifier();
  const codeChallenge = await deriveChallenge(codeVerifier);
  const state = generateState();

  sessionStorage.setItem(PENDING_KEY, JSON.stringify({
    issuer: meta.issuer,
    tokenEndpoint: meta.token_endpoint,
    clientId,
    codeVerifier,
    state,
    issuerUrl: normalizeUrl(issuerUrl),
    redirectUri,
  }));

  const url = new URL(meta.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", SCOPE);

  window.location.href = url.toString();
}

// ── Complete OAuth flow (call this in the callback route) ─────────────────────

export class PendingApprovalError extends Error {
  constructor(approveUrl) {
    super("pending_approval");
    this.approveUrl = approveUrl;
  }
}

export async function completeOAuth(code, returnedState) {
  const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
  if (!pending) throw new Error("No pending OAuth session. Try connecting again.");
  if (pending.state !== returnedState) throw new Error("State mismatch — possible CSRF. Try again.");
  sessionStorage.removeItem(PENDING_KEY);

  const r = await fetch(pending.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: pending.codeVerifier,
      client_id: pending.clientId,
      redirect_uri: pending.redirectUri,
    }),
  });

  const data = await r.json();

  if (!r.ok) {
    if (data.approve_url) throw new PendingApprovalError(data.approve_url);
    throw new Error(data.error_description || data.error || `Token exchange failed (${r.status})`);
  }

  // Resolve vault API URL from token response
  let vaultUrl = pending.issuerUrl;
  if (data.services) {
    const n = data.vault;
    if (n && data.services[`vault:${n}`]?.url) vaultUrl = data.services[`vault:${n}`].url;
    else if (data.services.vault?.url) vaultUrl = data.services.vault.url;
  }

  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    vaultUrl: vaultUrl.replace(/\/$/, ""),
    tokenEndpoint: pending.tokenEndpoint,
    clientId: pending.clientId,
    issuer: pending.issuer,
  }));

  saveToken(data);
}

function saveToken(data) {
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresAt,
  }));
}

// ── Token refresh (called automatically on 401) ───────────────────────────────

let _refreshPromise = null;

export async function refreshToken() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = _doRefresh().finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

async function _doRefresh() {
  const config = getConfig();
  const token = getToken();
  if (!config?.tokenEndpoint || !token?.refreshToken) return null;

  const r = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: config.clientId,
    }),
  });

  if (!r.ok) {
    if (r.status < 500) clearAuth(); // 4xx = session gone; force re-login
    return null;
  }

  const data = await r.json();
  saveToken(data);
  return data.access_token;
}
