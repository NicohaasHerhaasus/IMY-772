import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function getToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString() ?? session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("You must be signed in.");
  }
  return token;
}

function parseError(status: number, raw: string): string {
  try {
    const json = JSON.parse(raw) as { message?: string; details?: unknown };
    if (Array.isArray(json.details) && json.details.length > 0) {
      return json.details.filter((d): d is string => typeof d === "string").join(" ");
    }
    if (typeof json.message === "string" && json.message.trim()) return json.message;
  } catch {
    // ignore
  }
  return raw.trim().slice(0, 240) || `Request failed (${status}).`;
}

export type ManagedDatafile = {
  id: string;
  sourceType: "structured_upload" | "map_pin";
  sourceRefId: string | null;
  uploadChannel: string;
  displayName: string;
  originalFilename: string;
  mimeType: string;
  uploadedBy: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchManagedDatafiles(): Promise<ManagedDatafile[]> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/datafiles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(parseError(res.status, raw));
  const body = JSON.parse(raw) as { data?: ManagedDatafile[] };
  return body.data ?? [];
}

export async function renameManagedDatafile(id: string, displayName: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/datafiles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new Error(parseError(res.status, raw));
  }
}

export async function deleteManagedDatafile(id: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/datafiles/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new Error(parseError(res.status, raw));
  }
}
