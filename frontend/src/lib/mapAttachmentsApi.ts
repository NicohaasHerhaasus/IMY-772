import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function getBestBearerTokenForApi(): Promise<string | null> {
  const session = await fetchAuthSession();
  const access = session.tokens?.accessToken;
  const id = session.tokens?.idToken;
  return access?.toString() ?? id?.toString() ?? null;
}

async function requireBearerToken(): Promise<string> {
  const t = await getBestBearerTokenForApi();
  if (!t) throw new Error("You must be signed in.");
  return t;
}

export type MapAttachmentMarker = {
  id: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

export type MapAttachmentListItem = {
  id: string;
  displayName: string;
  originalFilename: string;
  mimeType: string;
  createdAt: string;
};

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getErrorMessage(status: number, rawText: string): string {
  const body = parseJsonSafe(rawText);
  if (body && typeof body === "object") {
    const o = body as { message?: string; details?: unknown };
    if (Array.isArray(o.details) && o.details.length > 0) {
      return o.details.filter((d): d is string => typeof d === "string").join(" ");
    }
    if (typeof o.message === "string" && o.message.trim()) {
      return o.message;
    }
  }
  return rawText.trim().slice(0, 280) || `Request failed (${status}).`;
}

export async function fetchMapAttachmentMarkers(): Promise<MapAttachmentMarker[]> {
  const token = await requireBearerToken();
  const res = await fetch(`${API_BASE_URL}/api/map-attachments/markers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(getErrorMessage(res.status, text));
  }
  const json = parseJsonSafe(text) as { data?: MapAttachmentMarker[] } | null;
  return json?.data ?? [];
}

export async function fetchMapAttachmentsForLocation(lat: number, lng: number): Promise<MapAttachmentListItem[]> {
  const token = await requireBearerToken();
  const q = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const res = await fetch(`${API_BASE_URL}/api/map-attachments/for-location?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(getErrorMessage(res.status, text));
  }
  const json = parseJsonSafe(text) as { data?: MapAttachmentListItem[] } | null;
  return json?.data ?? [];
}

export async function uploadMapAttachment(params: {
  file: File;
  displayName: string;
  lat: number;
  lng: number;
}): Promise<void> {
  const token = await requireBearerToken();
  const fd = new FormData();
  fd.append("file", params.file);
  fd.append("displayName", params.displayName.trim());
  fd.append("lat", String(params.lat));
  fd.append("lng", String(params.lng));

  const res = await fetch(`${API_BASE_URL}/api/map-attachments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(getErrorMessage(res.status, text));
  }
}

export async function downloadMapAttachment(id: string): Promise<void> {
  const token = await requireBearerToken();
  const res = await fetch(`${API_BASE_URL}/api/map-attachments/${encodeURIComponent(id)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(getErrorMessage(res.status, text));
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  let filename = "download";
  if (cd) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
    if (m?.[1]) {
      filename = decodeURIComponent(m[1].replace(/["']/g, "").trim());
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
