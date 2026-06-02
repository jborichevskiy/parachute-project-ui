import { getConfig, getToken, refreshToken, clearAuth } from "./oauth";

async function authFetch(url, options = {}) {
  let token = getToken()?.accessToken;
  if (!token) throw new Error("Not authenticated");

  let r = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  // On 401, try refreshing once
  if (r.status === 401) {
    const fresh = await refreshToken();
    if (!fresh) { clearAuth(); throw new Error("Session expired — please reconnect"); }
    r = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${fresh}` },
    });
  }

  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r;
}

function base() {
  return getConfig().vaultUrl.replace(/\/$/,  "");
}

export async function fetchProjects() {
  const r = await authFetch(`${base()}/api/notes?tag=project&limit=100`);
  const data = await r.json();
  return Array.isArray(data) ? data : data.notes ?? [];
}

export async function patchNote(id, content) {
  const r = await authFetch(`${base()}/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return r.json();
}
