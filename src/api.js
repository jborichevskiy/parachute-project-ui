export function getConfig() {
  try {
    return JSON.parse(localStorage.getItem("parachute_config") || "null");
  } catch {
    return null;
  }
}

export function setConfig(config) {
  localStorage.setItem("parachute_config", JSON.stringify(config));
}

export function clearConfig() {
  localStorage.removeItem("parachute_config");
}

function headers() {
  const cfg = getConfig();
  return {
    Authorization: `Bearer ${cfg.token}`,
    "Content-Type": "application/json",
  };
}

function base() {
  return getConfig().vaultUrl.replace(/\/$/, "");
}

export async function fetchProjects() {
  const r = await fetch(`${base()}/api/notes?tag=project&limit=100`, {
    headers: headers(),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const data = await r.json();
  // vault returns { notes: [...] } or an array directly
  return Array.isArray(data) ? data : data.notes ?? [];
}

export async function patchNote(id, content) {
  const r = await fetch(`${base()}/api/notes/${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ content }),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}
