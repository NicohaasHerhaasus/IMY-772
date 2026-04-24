import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "../components/ui";
import "./DataExplorer.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type PublicDatafile = {
  id: string;
  sourceType: "structured_upload" | "map_pin";
  displayName: string;
  originalFilename: string;
  mimeType: string;
  uploadChannel: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  downloadable: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function DataExplorer() {
  const [files, setFiles] = useState<PublicDatafile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadFiles = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/datafiles/public`);
      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw.trim() || `Failed to load files (${res.status}).`);
      }
      const body = (await res.json()) as { data?: PublicDatafile[] };
      setFiles(body.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  const filtered = useMemo(
    () =>
      files.filter((f) =>
        [f.displayName, f.originalFilename, f.uploadChannel].some((v) =>
          v.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [files, search],
  );

  const handleDownload = async (file: PublicDatafile) => {
    if (!file.downloadable) return;
    setDownloadingId(file.id);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/datafiles/${encodeURIComponent(file.id)}/public-download`);
      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw.trim() || `Download failed (${res.status}).`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalFilename || file.displayName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="explorer-page">
      <header className="explorer-header">
        <h1 className="explorer-title">Data Explorer</h1>
        <p className="explorer-subtitle">Download available uploaded datafiles.</p>
      </header>

      <Card className="explorer-upload-card">
        <div className="explorer-toolbar">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="explorer-search"
            placeholder="Search files..."
          />
          <Button variant="outline" onClick={() => void loadFiles()}>
            Refresh
          </Button>
        </div>
        {error && <p className="explorer-banner explorer-banner--error">{error}</p>}
      </Card>

      <section className="explorer-files-grid">
        {loading ? (
          <p className="explorer-hint">Loading files...</p>
        ) : filtered.length === 0 ? (
          <p className="explorer-hint">No files found.</p>
        ) : (
          filtered.map((file) => (
            <Card key={file.id} className="explorer-file-card">
              <div className="explorer-file-top">
                <h3 className="explorer-file-title">{file.displayName}</h3>
                <span className="explorer-pill">
                  {file.sourceType === "map_pin" ? "Map pin" : "Structured"}
                </span>
              </div>
              <p className="explorer-file-meta">Original: {file.originalFilename}</p>
              <p className="explorer-file-meta">Type: {file.mimeType}</p>
              <p className="explorer-file-meta">Channel: {file.uploadChannel}</p>
              {file.latitude !== null && file.longitude !== null && (
                <p className="explorer-file-meta">
                  Coordinates: {file.latitude.toFixed(5)}, {file.longitude.toFixed(5)}
                </p>
              )}
              <p className="explorer-file-meta">Uploaded: {formatDate(file.createdAt)}</p>
              <div className="explorer-file-actions">
                <Button
                  onClick={() => void handleDownload(file)}
                  disabled={!file.downloadable || downloadingId === file.id}
                >
                  {!file.downloadable
                    ? "Not downloadable"
                    : downloadingId === file.id
                      ? "Downloading..."
                      : "Export / Download"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
