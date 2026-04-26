/**
 * DataExplorerPage.tsx
 *
 * Shared explorer for all uploaded datasets.
 *
 * Admin view  (isAdmin=true)  → can upload new files via the upload modal.
 * Public view (isAdmin=false) → read-only; sees only what admins have uploaded.
 *
 * Data is always fetched from the server, so public users see the live state
 * of whatever has been ingested by admins.
 *
 * Assumed GET endpoints (add these to your Express routers):
 *   GET /api/datasets          → UploadedFileRecord[]  (all datasets, all types)
 *   GET /api/datasets/:id/rows → { rows: Record<string,unknown>[] }
 *
 * Assumed POST endpoints (already exist, admin-only via authMiddleware):
 *   POST /api/samples/upload
 *   POST /api/uploads/staramr
 *   POST /api/uploads/example-amrfinder-plus
 *   POST /api/uploads/example-amrfinder-plus-tsv
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DatasetType =
  | "isolates"
  | "staramr"
  | "amrfinder-plus"
  | "amrfinder-plus-tsv"
  | "map-attachment"
  | "genotypic";

export type FileStatus = "loaded" | "processing" | "error" | "validating";

export type FilterChip = "All" | "Isolates" | "StarAMR" | "AMRFinder+";

/** Shape returned by GET /api/datasets */
export interface UploadedFileRecord {
  id: string;
  name: string;
  type: DatasetType;
  status: FileStatus;
  rowCount?: number;
  uploadedAt: string; // ISO string from server
  error?: string;
}

/** Augmented client-side, includes fetched rows */
interface ClientFile extends UploadedFileRecord {
  rows?: Record<string, unknown>[];
  rowsFetched?: boolean;
}

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : `${RAW_API_BASE.replace(/\/$/, "")}/api`;


const DATASET_CONFIG: Record<
  DatasetType,
  { label: string; uploadEndpoint: string; accept: string; ext: string; uploadable?: boolean }
> = {
  isolates: {
    label: "Isolates",
    uploadEndpoint: `${API_BASE}/samples/upload`,
    accept: ".xlsx",
    ext: "xlsx",
  },
  staramr: {
    label: "StarAMR",
    uploadEndpoint: `${API_BASE}/upload/staramr`,
    accept: ".xlsx",
    ext: "xlsx",
  },
  "amrfinder-plus": {
    label: "AMRFinder+",
    uploadEndpoint: `${API_BASE}/upload/example-amrfinder-plus`,
    accept: ".xlsx",
    ext: "xlsx",
  },
  "amrfinder-plus-tsv": {
    label: "AMRFinder+ (TSV)",
    uploadEndpoint: `${API_BASE}/upload/example-amrfinder-plus-tsv`,
    accept: ".tsv,.txt",
    ext: "tsv",
  },
  "map-attachment": {
    label: "Map file",
    uploadEndpoint: "",
    accept: "",
    ext: "file",
    uploadable: false,
  },
  genotypic: {
    label: "Genotypic",
    uploadEndpoint: "",
    accept: "",
    ext: "xlsx/tsv",
    uploadable: false,
  },
};

const SECTION_ORDER: { label: string; types: DatasetType[] }[] = [
  { label: "Isolate uploads", types: ["isolates"] },
  { label: "StarAMR uploads", types: ["staramr"] },
  { label: "AMRFinder+ uploads", types: ["amrfinder-plus", "amrfinder-plus-tsv"] },
  { label: "Genotypic uploads", types: ["genotypic"] },
  { label: "Map uploads", types: ["map-attachment"] },
];

const FILTER_CHIPS: FilterChip[] = ["All", "Isolates", "StarAMR", "AMRFinder+"];
const PAGE_SIZE = 25;

function chipMatchesType(chip: FilterChip, type: DatasetType): boolean {
  if (chip === "All") return true;
  if (chip === "Isolates") return type === "isolates";
  if (chip === "StarAMR") return type === "staramr";
  if (chip === "AMRFinder+")
    return type === "amrfinder-plus" || type === "amrfinder-plus-tsv";
  return true;
}

function fileIconStyle(type: DatasetType) {
  if (type === "map-attachment") return { bg: "#12243a", stroke: "#93c5fd" };
  if (type === "genotypic") return { bg: "#311b2f", stroke: "#f9a8d4" };
  if (type === "amrfinder-plus-tsv") return { bg: "#0c2d45", stroke: "#60a5fa" };
  if (type === "staramr")            return { bg: "#0a2d1a", stroke: "#4ade80" };
  return                                    { bg: "#2a1f0a", stroke: "#fbbf24" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dedupeFiles(files: UploadedFileRecord[]): UploadedFileRecord[] {
  const latestByKey = new Map<string, UploadedFileRecord>();
  for (const file of files) {
    const key = `${file.name}::${file.type}`;
    const existing = latestByKey.get(key);
    if (!existing || new Date(file.uploadedAt) > new Date(existing.uploadedAt)) {
      latestByKey.set(key, file);
    }
  }
  return Array.from(latestByKey.values()).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconFile = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const IconSearch = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconUpload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);

const IconColumns = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconExport = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="8 17 12 21 16 17" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" />
  </svg>
);

const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconSpinner = ({ size = 10 }: { size?: number }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "spin 0.9s linear infinite", display: "block" }}
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  value, label, color,
}: {
  value: string | number; label: string; color?: string;
}) => (
  <div style={S.mstat}>
    <div style={{ ...S.mstatV, ...(color ? { color } : {}) }}>{value}</div>
    <div style={S.mstatL}>{label}</div>
  </div>
);

// ─── Upload Modal (admin only) ────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onUploaded: (file: ClientFile) => void;
}

function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [selectedType, setSelectedType] = useState<DatasetType>("isolates");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = DATASET_CONFIG[selectedType];

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(cfg.uploadEndpoint, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error?.message ?? json?.message ?? "Upload failed.";
        setUploadError(msg);
        onUploaded({
          id: crypto.randomUUID(),
          name: file.name,
          type: selectedType,
          status: "error",
          uploadedAt: new Date().toISOString(),
          error: msg,
        });
        return;
      }
      onUploaded({
        id: json.data?.id ?? crypto.randomUUID(),
        name: file.name,
        type: selectedType,
        status: "loaded",
        rowCount:
          json.data?.rowCount ??
          json.data?.insertedCount ??
          json.data?.rows?.length,
        rows: json.data?.rows,
        uploadedAt: new Date().toISOString(),
      });
      onClose();
    } catch (e) {
      setUploadError((e as Error).message ?? "Network error.");
    } finally {
      setUploading(false);
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [selectedType]
  );

  return (
    <div style={S.modalBackdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Upload datafile</span>
          <button style={S.modalClose} onClick={onClose}>×</button>
        </div>

        {/* Dataset type */}
        <div style={{ padding: "14px 18px 0" }}>
          <div style={S.modalLabel}>Dataset type</div>
          <div style={S.typeGrid}>
            {(
              Object.entries(DATASET_CONFIG) as [
                DatasetType,
                (typeof DATASET_CONFIG)[DatasetType]
              ][]
            ).filter(([, c]) => c.uploadable !== false).map(([key, c]) => (
              <button
                key={key}
                style={{
                  ...S.typeBtn,
                  ...(selectedType === key ? S.typeBtnActive : {}),
                }}
                onClick={() => {
                  setSelectedType(key);
                  setUploadError(null);
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 600 }}>{c.label}</span>
                <span
                  style={{
                    fontSize: 9,
                    color: selectedType === key ? "#5DCAA5" : "#bbb",
                    marginTop: 1,
                  }}
                >
                  .{c.ext}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div style={{ padding: "12px 18px 18px" }}>
          <div
            style={{
              ...S.dropZone,
              ...(dragging ? S.dropZoneActive : {}),
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept={cfg.accept}
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {uploading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#1D9E75" }}><IconSpinner size={18} /></div>
                <span style={{ fontSize: 11, color: "#888" }}>Uploading…</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#1D9E75" }}><IconUpload /></div>
                <span style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500 }}>
                  Drop {cfg.accept} file here
                </span>
                <span style={{ fontSize: 10, color: "#aaa" }}>or click to browse · max 20 MB</span>
              </div>
            )}
          </div>
          {uploadError && (
            <div style={S.modalError}>{uploadError}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Generic table ────────────────────────────────────────────────────────────

function GenericTable({
  file,
  tableSearch,
}: {
  file: ClientFile;
  tableSearch: string;
}) {
  const [page, setPage] = useState(0);

  const rows = file.rows ?? [];
  const filtered = tableSearch
    ? rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v).toLowerCase().includes(tableSearch.toLowerCase())
        )
      )
    : rows;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (file.rowsFetched && rows.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#bbb",
          fontSize: 12,
          flexDirection: "column",
          gap: 6,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span>No row data available for this file.</span>
      </div>
    );
  }

  if (!file.rowsFetched) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#bbb",
          fontSize: 12,
          gap: 8,
        }}
      >
        <IconSpinner size={14} />
        Loading rows…
      </div>
    );
  }

  return (
    <>
      <div style={{ flex: 1, overflow: "auto" }}>
        <table className="gt" style={S.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={S.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} style={S.tr}>
                {columns.map((col) => (
                  <td key={col} style={S.td}>
                    {row[col] == null ? (
                      <span style={{ color: "#ccc" }}>—</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={S.pagination}>
        <span style={{ fontSize: 12, color: "#888" }}>
          Rows per page: <strong>{PAGE_SIZE}</strong>
        </span>
        <span style={{ fontSize: 11, color: "#aaa" }}>
          {file.name} · {page * PAGE_SIZE + 1}–
          {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length}
        </span>
        <div style={{ display: "flex", gap: 5 }}>
          <button
            style={S.pgBtn}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            style={S.pgBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Empty / Loading states ───────────────────────────────────────────────────

const EmptyNoSelection = ({ isAdmin, onUpload }: { isAdmin: boolean; onUpload: () => void }) => (
  <div style={S.emptyState}>
    <div style={S.emptyIcon}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.4" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#999", marginBottom: 4 }}>
      No file selected
    </div>
    <div style={{ fontSize: 11, color: "#bbb", marginBottom: isAdmin ? 16 : 0 }}>
      {isAdmin
        ? "Select a file from the panel or upload a new dataset"
        : "Select a file from the panel to explore its data"}
    </div>
    {isAdmin && (
      <button style={S.emptyBtn} onClick={onUpload}>
        <IconUpload /> Upload dataset
      </button>
    )}
  </div>
);

const EmptyNoFiles = ({ isAdmin, onUpload }: { isAdmin: boolean; onUpload: () => void }) => (
  <div style={S.emptyState}>
    <div style={S.emptyIcon}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.4" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#999", marginBottom: 4 }}>
      {isAdmin ? "No datasets uploaded yet" : "No datasets available"}
    </div>
    <div style={{ fontSize: 11, color: "#bbb", marginBottom: isAdmin ? 16 : 0 }}>
      {isAdmin
        ? "Upload your first dataset to get started"
        : "Check back later — datasets will appear here once uploaded by an admin"}
    </div>
    {isAdmin && (
      <button style={S.emptyBtn} onClick={onUpload}>
        <IconUpload /> Upload dataset
      </button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface DataExplorerPageProps {
  /** Pass true for admin users (shows upload controls).
   *  Pass false (or omit) for public read-only view. */
  isAdmin?: boolean;
}

export default function DataExplorerPage({ isAdmin = false }: DataExplorerPageProps) {
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ClientFile | null>(null);
  const [filterChip, setFilterChip] = useState<FilterChip>("All");
  const [panelSearch, setPanelSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ── Fetch all datasets from server ──────────────────────────────────────────
  async function fetchDatasets() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/datasets`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      const records: Array<Record<string, unknown>> = (json.data ?? json) as Array<Record<string, unknown>>;
      // Map API response fields to frontend interface
      const mappedRecords: UploadedFileRecord[] = records.map((r) => ({
        id: String(r.id ?? ''),
        name: String(r.filename ?? ''),
        type: r.file_type as DatasetType,
        status: r.status as FileStatus,
        rowCount: typeof r.row_count === 'number' ? r.row_count : undefined,
        uploadedAt: String(r.uploaded_at ?? new Date().toISOString()),
        error: typeof r.error_message === 'string' ? r.error_message : undefined,
      }));
      setFiles(dedupeFiles(mappedRecords).map((r) => ({ ...r, rowsFetched: false })));
    } catch (e) {
      setFetchError((e as Error).message ?? "Failed to load datasets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDatasets(); }, []);

  // ── Fetch rows when a file is selected ─────────────────────────────────────
  async function selectFile(file: ClientFile) {
    setSelected(file);
    setTableSearch("");
    if (file.rowsFetched) return; // already loaded

    try {
      const res = await fetch(`${API_BASE}/datasets/${file.id}/rows`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      const rows: Record<string, unknown>[] = json.data?.rows ?? json.rows ?? [];
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, rows, rowsFetched: true } : f
        )
      );
      setSelected((prev) =>
        prev?.id === file.id ? { ...prev, rows, rowsFetched: true } : prev
      );
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, rows: [], rowsFetched: true } : f
        )
      );
      setSelected((prev) =>
        prev?.id === file.id ? { ...prev, rows: [], rowsFetched: true } : prev
      );
    }
  }

  // ── Admin: optimistically add newly uploaded file ───────────────────────────
  function handleUploaded(file: ClientFile) {
    const key = `${file.name}::${file.type}`;
    setFiles((prev) => [
      { ...file, rowsFetched: true },
      ...prev.filter((existing) => `${existing.name}::${existing.type}` !== key),
    ]);
    if (file.status !== "error") setSelected({ ...file, rowsFetched: true });
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const filteredFiles = files.filter((f) => {
    return (
      chipMatchesType(filterChip, f.type) &&
      f.name.toLowerCase().includes(panelSearch.toLowerCase())
    );
  });

  const loadedCount = files.filter((f) => f.status === "loaded").length;
  const errorCount  = files.filter((f) => f.status === "error").length;
  const rows        = selected?.rows ?? [];
  const rowCount    = selected?.rowCount ?? rows.length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .file-row-hover:hover { background: #0a2a35 !important; }
  .icon-btn-hover:hover { background: #f5f5f0 !important; }
  .pg-btn-hover:hover:not(:disabled) { background: #f5f5f0 !important; }
  .upload-btn-hover:hover { background: #0a2a35 !important; }
  .gt tbody tr:hover td { background: #f8f8f5; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: #1e3545; border-radius: 3px; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
`}</style>

      {isAdmin && showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onUploaded={handleUploaded}
        />
      )}

      <div style={S.pageBody}>

        {/* ── LEFT PANEL ── */}
        <div style={S.leftPanel}>
          <div style={S.lpHead}>
            <div style={S.lpTitle}>Uploaded datafiles</div>
            <div style={S.lpSub}>
              {isAdmin ? "Admin uploads · click to filter table" : "Click a file to explore its data"}
            </div>
          </div>

          <div style={S.lpSearch}>
            <div style={S.lpSearchBox}>
              <IconSearch />
              <input
                style={S.lpSearchInput}
                type="text"
                placeholder="Search files…"
                value={panelSearch}
                onChange={(e) => setPanelSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={S.lpFilterRow}>
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                style={{ ...S.lpChip, ...(filterChip === chip ? S.lpChipActive : {}) }}
                onClick={() => setFilterChip(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Upload button — admin only */}
          {isAdmin && (
            <button
              className="upload-btn-hover"
              style={S.uploadBtn}
              onClick={() => setShowModal(true)}
            >
              <IconUpload /> Upload new dataset
            </button>
          )}

          {/* Refresh button */}
          <button
  className="upload-btn-hover"
  style={{
    margin: "6px 12px 4px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
    fontWeight: 500,
    color: "#4a7a8a",
    background: "transparent",
    border: "0.5px solid #1e3545",
    borderRadius: 7,
    padding: "5px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
    width: "calc(100% - 24px)",
  }}
  onClick={fetchDatasets}
>
  <IconRefresh /> Refresh datasets
</button>

          {/* File list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, color: "#bbb", gap: 8, fontSize: 11 }}>
                <IconSpinner size={13} /> Loading datasets…
              </div>
            ) : fetchError ? (
              <div style={{ padding: "16px 14px", color: "#A32D2D", fontSize: 11 }}>
                {fetchError}
              </div>
            ) : (
              <>
                {SECTION_ORDER.map((section) => {
                  const sectionFiles = filteredFiles.filter((f) =>
                    section.types.includes(f.type)
                  );
                  if (sectionFiles.length === 0) return null;
                  return (
                    <div key={section.label}>
                      <div style={S.lpSectionHd}>{section.label}</div>
                      {sectionFiles.map((file) => {
                        const ic = fileIconStyle(file.type);
                        const isSel = selected?.id === file.id;
                        return (
                          <div
                            key={file.id}
                            className="file-row-hover"
                            style={{
                              ...S.fileRow,
                              ...(isSel ? S.fileRowSelected : {}),
                            }}
                            onClick={() => selectFile(file)}
                          >
                            <div style={{ ...S.fileIcon, background: ic.bg }}>
                              <IconFile color={ic.stroke} />
                            </div>
                            <div style={S.fileInfo}>
                              <div
                                style={{
                                  ...S.fileName,
                                  ...(isSel ? { color: "#3eb99a" } : {}),
                                }}
                              >
                                {file.name}
                              </div>
                              <div style={S.fileMeta}>
                                {file.rowCount != null
                                  ? `${file.rowCount} rows · `
                                  : ""}
                                {fmtDate(file.uploadedAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {filteredFiles.length === 0 && (
                  <div
                    style={{
                      padding: "24px 14px",
                      textAlign: "center",
                      color: "#bbb",
                      fontSize: 11,
                    }}
                  >
                    {files.length === 0
                      ? isAdmin
                        ? "No files uploaded yet."
                        : "No datasets available yet."
                      : "No files match this filter."}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={S.lpFooter}>
            <div style={S.lpFooterStat}>
              <strong>{files.length}</strong> files ·{" "}
              <strong>{loadedCount}</strong> loaded
              {errorCount > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <strong style={{ color: "#A32D2D" }}>{errorCount}</strong>{" "}
                  error{errorCount > 1 ? "s" : ""}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={S.rightPanel}>
          {loading ? (
            <div style={S.emptyState}>
              <IconSpinner size={20} />
              <span style={{ fontSize: 12, color: "#bbb", marginTop: 10 }}>
                Loading datasets…
              </span>
            </div>
          ) : files.length === 0 ? (
            <EmptyNoFiles isAdmin={isAdmin} onUpload={() => setShowModal(true)} />
          ) : !selected ? (
            <EmptyNoSelection isAdmin={isAdmin} onUpload={() => setShowModal(true)} />
          ) : (
            <>
              {/* Header */}
              <div style={S.rpHead}>
                <div style={S.rpCrumb}>
                  {DATASET_CONFIG[selected.type].label}
                  <IconChevronRight />
                  <span style={{ color: "#1D9E75", fontWeight: 500 }}>
                    {selected.name}
                  </span>
                </div>
                <div style={S.rpH1}>Data explorer</div>
              </div>

              {/* Toolbar */}
              <div style={S.rpToolbar}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={S.tbSearch}>
                    <IconSearch />
                    <input
                      style={S.tbSearchInput}
                      type="text"
                      placeholder={`Search ${DATASET_CONFIG[selected.type].label.toLowerCase()}…`}
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                    />
                  </div>
                  <div style={S.ctxPill}>
                    <IconFile color="#1D9E75" />
                    <span
                      style={{
                        fontSize: 10,
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selected.name}
                    </span>
                    <span
                      style={S.ctxX}
                      onClick={() => setSelected(null)}
                    >
                      ×
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {([<IconColumns />, <IconFilter />, <IconExport />] as React.ReactNode[]).map(
                    (ic, i) => (
                      <div key={i} className="icon-btn-hover" style={S.iconBtn}>
                        {ic}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={S.rpStats}>
                <StatCard
                  value={rowCount ?? "—"}
                  label="Total rows"
                  color="#0F6E56"
                />
                <StatCard
                  value={DATASET_CONFIG[selected.type].label}
                  label="Dataset type"
                />
                <StatCard
                  value={selected.status === "loaded" ? "✓" : "✗"}
                  label="Ingested"
                  color={selected.status === "loaded" ? "#0F6E56" : "#A32D2D"}
                />
                <StatCard
                  value={
                    rows.length > 0 ? Object.keys(rows[0]).length : "—"
                  }
                  label="Columns"
                />
                <StatCard value={fmtDate(selected.uploadedAt)} label="Uploaded" />
              </div>

              {/* Error banner */}
              {selected.status === "error" ? (
                <div style={{ padding: "20px 22px" }}>
                  <div style={S.errorBanner}>
                    <strong>Upload error:</strong>{" "}
                    {selected.error ?? "An unknown error occurred."}
                  </div>
                </div>
              ) : (
                <GenericTable file={selected} tableSearch={tableSearch} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  pageBody: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f0f1ea",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // Left panel
  leftPanel: { width: 268, minWidth: 268, background: "#0d1f2d", borderRight: "1px solid #e5e5e0", display: "flex", flexDirection: "column", overflow: "hidden" },
  lpHead: {
  padding: "16px 16px 10px",
  borderBottom: "1px solid #1e3545",   // ← was #f0f0eb
},
lpTitle: {
  fontSize: 12,
  fontWeight: 600,
  color: "#ffffff",                     // ← was #1a1a1a
  marginBottom: 2,
},
lpSub: {
  fontSize: 10,
  color: "#4a7a8a",                     // ← was #888
},
lpSearch: {
  padding: "10px 12px",
  borderBottom: "1px solid #1e3545",   // ← was #f0f0eb
},
lpSearchBox: {
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: "#122a3a",               // ← was #f5f5f0
  border: "1px solid #1e3545",         // ← was #e5e5e0
  borderRadius: 8,
  padding: "7px 10px",
},
lpSearchInput: {
  border: "none",
  background: "transparent",
  fontSize: 11,
  color: "#ffffff",                     // ← was #1a1a1a
  outline: "none",
  flex: 1,
  fontFamily: "inherit",
},
lpFilterRow: {
  display: "flex",
  gap: 4,
  padding: "8px 12px",
  borderBottom: "1px solid #1e3545",   // ← was #f0f0eb
  flexWrap: "wrap",
},
lpChip: {
  fontSize: 9,
  fontWeight: 600,
  padding: "3px 8px",
  borderRadius: 99,
  border: "1px solid #1e3545",         // ← was #e0e0db
  color: "#4a7a8a",                    // ← was #888
  cursor: "pointer",
  background: "transparent",
  fontFamily: "inherit",
},
lpSectionHd: {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: "#5a9aaa",                    // ← was #bbb
  textTransform: "uppercase",
  padding: "10px 14px 4px",
},
fileName: {
  fontSize: 11,
  fontWeight: 500,
  color: "#e0e8ee",                    // ← was #1a1a1a
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
},
fileMeta: {
  fontSize: 9,
  color: "#4a7a8a",                    // ← was #999
  marginTop: 1,
},
lpFooter: {
  padding: "10px 14px",
  borderTop: "1px solid #1e3545",     // ← was #f0f0eb
},
lpFooterStat: {
  fontSize: 10,
  color: "#4a7a8a",                   // ← was #999
},
fileRowSelected: {
  background: "#0a2a35",              // ← was #E1F5EE
  borderLeftColor: "#3eb99a",
},
fileRow: {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  cursor: "pointer",
  borderLeft: "3px solid transparent",
  transition: "background 0.1s",
  background: "transparent",   // ← add this so rows don't inherit light bg
},

fileIcon: {
  width: 30,
  height: 30,
  borderRadius: 7,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: "#122a3a",       // ← override the per-type colour on dark bg
},

  // Right panel
  rightPanel: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, background: "#f5f5f0" },
  rpHead: { padding: "16px 22px 12px", background: "#fff", borderBottom: "1px solid #e5e5e0" },
  rpCrumb: { fontSize: 10, color: "#999", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 },
  rpH1: { fontSize: 22, fontWeight: 600, color: "#1a1a1a" },
  rpToolbar: { padding: "10px 22px", background: "#fff", borderBottom: "1px solid #e5e5e0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  tbSearch: { display: "flex", alignItems: "center", gap: 7, background: "#f5f5f0", border: "1px solid #e5e5e0", borderRadius: 8, padding: "6px 10px", width: 210 },
  tbSearchInput: { border: "none", background: "transparent", fontSize: 11, color: "#1a1a1a", outline: "none", flex: 1, fontFamily: "inherit" },
  ctxPill: { background: "#E1F5EE", border: "1px solid #9FE1CB", borderRadius: 99, padding: "4px 10px", fontSize: 10, color: "#085041", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 },
  ctxX: { cursor: "pointer", color: "#5DCAA5", fontSize: 13, lineHeight: "1" },
  iconBtn: { width: 31, height: 31, borderRadius: 7, border: "1px solid #e5e5e0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  rpStats: { display: "flex", gap: 10, padding: "12px 22px", background: "#f5f5f0", borderBottom: "1px solid #e5e5e0", flexWrap: "wrap" },
  mstat: { background: "#fff", border: "1px solid #e5e5e0", borderRadius: 9, padding: "10px 14px", minWidth: 80 },
  mstatV: { fontSize: 20, fontWeight: 600, color: "#1a1a1a" },
  mstatL: { fontSize: 9, color: "#999", marginTop: 1 },

  // Table
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left", padding: "10px 18px", borderBottom: "1px solid #e5e5e0", whiteSpace: "nowrap", background: "#fff", position: "sticky", top: 0, zIndex: 1 },
  tr: { borderBottom: "1px solid #f0f0eb" },
  td: { padding: "11px 18px", fontSize: 12, color: "#1a1a1a", verticalAlign: "middle", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 18, padding: "10px 22px", background: "#fff", borderTop: "1px solid #e5e5e0", flexShrink: 0 },
  pgBtn: { width: 28, height: 28, borderRadius: 7, border: "1px solid #e5e5e0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  // Empty states
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, background: "#f5f5f0", border: "1px solid #e5e5e0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyBtn: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#0F6E56", background: "#E1F5EE", border: "1px solid #9FE1CB", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", marginTop: 12 },
  errorBanner: { background: "#FCEBEB", border: "1px solid #F5BEBE", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#501313" },

  // Modal
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: 12, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 14px", borderBottom: "1px solid #f0f0eb" },
  modalTitle: { fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  modalClose: { fontSize: 18, color: "#aaa", background: "none", border: "none", cursor: "pointer", lineHeight: "1", padding: "0 2px", fontFamily: "inherit" },
  modalLabel: { fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 },
  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  typeBtn: { display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e5e5e0", background: "#fafafa", cursor: "pointer", fontFamily: "inherit" },
  typeBtnActive: { background: "#E1F5EE", borderColor: "#5DCAA5" },
  dropZone: { border: "2px dashed #e5e5e0", borderRadius: 10, padding: "32px 20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#fafafa", marginTop: 12 },
  dropZoneActive: { borderColor: "#1D9E75", background: "#f0faf5" },
  modalError: { marginTop: 10, background: "#FCEBEB", border: "1px solid #F5BEBE", borderRadius: 7, padding: "8px 12px", fontSize: 11, color: "#501313" },
};