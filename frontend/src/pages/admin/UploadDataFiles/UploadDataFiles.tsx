import { useState, useRef, useCallback, useEffect, type ChangeEvent } from "react";
import { Button, Card, FormField, Select } from "../../../components/ui";
import { useAuth } from "../../../context/AuthContext";
import {
  GENOTYPIC_PREVIEW_COLUMNS,
  MAX_PREVIEW_ROWS,
  type GenotypicUploadRow,
  parseGenotypicXlsxForPreview,
  parseStarAmrXlsxForPreview,
  type StarAmrPreview,
} from "./uploadPreview";
import "./UploadDatafiles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function parseJsonResponse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getApiErrorMessage(response: Response, body: unknown, rawText: string): string {
  if (body && typeof body === "object") {
    const o = body as { message?: string; details?: unknown };
    if (Array.isArray(o.details) && o.details.length > 0) {
      return o.details.filter((d): d is string => typeof d === "string").join(" ");
    }
    if (typeof o.message === "string" && o.message.trim()) {
      return o.message;
    }
  }
  const snippet = rawText.trim().slice(0, 280);
  return snippet || `Request failed (${response.status}).`;
}

/** Genotypic options first — StarAMR is a different workbook shape (Summary + Detailed_Summary only). */
const UPLOAD_TYPES = [
  "Genotypic Analysis Excel (.xlsx)",
  "Genotypic Analysis TSV (.tsv)",
  "StarAMR Workbook (.xlsx)",
] as const;

const GENOTYPIC_TSV_HEADERS = [
  "University of Pretoria Culture number",
  "Isolate number",
  "Farm",
  "Trip",
  "Source",
  "Sample Number",
  "AR Code",
  "Isolate number",
  "Notes",
  "Organism Identity",
  "Owner",
  "IntI1 Positive",
  "IntI2 Positive",
  "IntI3 Positive",
  "CTX-M Gp1",
  "CTX-M Gp9",
  "CTX-M Gp8/25",
  "TEM",
  "SHV",
  "OXA",
  "ACC",
  "EBC",
  "DHA",
  "CIT",
  "FOX",
  "MOX",
] as const;

function parseGenotypicTsv(content: string): GenotypicUploadRow[] {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("The TSV file is empty.");
  }

  const [headerLine, ...dataLines] = lines;
  const actualHeaders = headerLine.split("\t").map((h) => h.trim());

  for (let i = 0; i < GENOTYPIC_TSV_HEADERS.length; i += 1) {
    if (actualHeaders[i] !== GENOTYPIC_TSV_HEADERS[i]) {
      throw new Error("Invalid TSV headers. Use the required genotypic column order.");
    }
  }

  return dataLines.map((line) => {
    const cells = line.split("\t");
    const cell = (index: number): string => (cells[index] ?? "").trim();
    return {
      upCultureNumber: cell(0),
      isolateNumber: cell(1),
      farm: cell(2),
      trip: cell(3),
      source: cell(4),
      sampleNumber: cell(5),
      arCode: cell(6),
      isolateNumberSecondary: cell(7),
      notes: cell(8),
      organismIdentity: cell(9),
      owner: cell(10),
      intI1Positive: cell(11),
      intI2Positive: cell(12),
      intI3Positive: cell(13),
      ctxMGp1: cell(14),
      ctxMGp9: cell(15),
      ctxMGp825: cell(16),
      tem: cell(17),
      shv: cell(18),
      oxa: cell(19),
      acc: cell(20),
      ebc: cell(21),
      dha: cell(22),
      cit: cell(23),
      fox: cell(24),
      mox: cell(25),
    };
  });
}

type FilePreviewState =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "genotypic";
      rows: GenotypicUploadRow[];
      total: number;
      sheetName?: string;
    }
  | { kind: "staramr"; data: StarAmrPreview };

function GenotypicPreviewTable({ rows }: { rows: GenotypicUploadRow[] }) {
  return (
    <div className="upload-preview__scroll">
      <table className="upload-preview-table">
        <thead>
          <tr>
            {GENOTYPIC_PREVIEW_COLUMNS.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {GENOTYPIC_PREVIEW_COLUMNS.map((col) => (
                <td key={col.key}>{row[col.key] || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StarAmrSheetPreview({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (headers.length === 0 && rows.length === 0) {
    return <p className="upload-preview__empty">No rows in this sheet.</p>;
  }
  return (
    <div className="upload-preview__scroll upload-preview__scroll--nested">
      <table className="upload-preview-table upload-preview-table--compact">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h || `Col ${i + 1}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri}>
              {headers.map((_, ci) => (
                <td key={ci}>{cells[ci] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UploadDatafiles() {
  const { getAccessToken } = useAuth();
  const [uploadType, setUploadType] = useState<(typeof UPLOAD_TYPES)[number]>(UPLOAD_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreviewState>({ kind: "none" });
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setFilePreview({ kind: "none" });
      return;
    }

    let cancelled = false;
    setFilePreview({ kind: "loading" });

    const load = async () => {
      try {
        if (uploadType === "Genotypic Analysis TSV (.tsv)") {
          const rows = parseGenotypicTsv(await file.text());
          if (cancelled) return;
          const slice = rows.slice(0, MAX_PREVIEW_ROWS);
          setFilePreview({
            kind: "genotypic",
            rows: slice,
            total: rows.length,
          });
          return;
        }

        const buffer = await file.arrayBuffer();

        if (uploadType === "Genotypic Analysis Excel (.xlsx)") {
          const { rows, sheetName } = parseGenotypicXlsxForPreview(buffer);
          if (cancelled) return;
          const slice = rows.slice(0, MAX_PREVIEW_ROWS);
          setFilePreview({
            kind: "genotypic",
            rows: slice,
            total: rows.length,
            sheetName,
          });
          return;
        }

        const data = parseStarAmrXlsxForPreview(buffer);
        if (!cancelled) {
          setFilePreview({ kind: "staramr", data });
        }
      } catch (err) {
        if (!cancelled) {
          setFilePreview({
            kind: "error",
            message: err instanceof Error ? err.message : "Could not read this file for preview.",
          });
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [file, uploadType]);

  const accept =
    uploadType === "Genotypic Analysis TSV (.tsv)" ? ".tsv,.txt" : ".xlsx";

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a file.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setError("");

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("No access token. Sign in again.");
      }

      if (uploadType === "StarAMR Workbook (.xlsx)") {
        if (!file.name.toLowerCase().endsWith(".xlsx")) {
          throw new Error("Only .xlsx is supported for StarAMR.");
        }
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_URL}/api/upload/staramr`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        const rawText = await response.text();
        const result = parseJsonResponse(rawText);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(response, result, rawText));
        }
        const payload = result as { data?: Record<string, number> } | null;
        const { isolatesCount, genotypesCount, phenotypesCount, plasmidsCount } = payload?.data ?? {};
        setMessage(
          `Import successful. Isolates: ${isolatesCount ?? 0}, Genotypes: ${genotypesCount ?? 0}, ` +
            `Phenotypes: ${phenotypesCount ?? 0}, Plasmids: ${plasmidsCount ?? 0}.`,
        );
      } else if (uploadType === "Genotypic Analysis Excel (.xlsx)") {
        if (!file.name.toLowerCase().endsWith(".xlsx")) {
          throw new Error("Only .xlsx is supported for genotypic Excel.");
        }
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_URL}/api/genotypic-analysis/upload-xlsx`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        const rawText = await response.text();
        const result = parseJsonResponse(rawText);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(response, result, rawText));
        }
        const payload = result as { data?: { insertedCount?: number } } | null;
        setMessage(`Uploaded ${payload?.data?.insertedCount ?? 0} genotypic row(s) from Excel.`);
      } else {
        if (!file.name.toLowerCase().endsWith(".tsv") && !file.name.toLowerCase().endsWith(".txt")) {
          throw new Error("Only .tsv or .txt for genotypic TSV upload.");
        }
        const rows = parseGenotypicTsv(await file.text());
        if (rows.length === 0) {
          throw new Error("No data rows after the header.");
        }
        const response = await fetch(`${API_BASE_URL}/api/genotypic-analysis/upload-tsv`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ rows }),
        });
        const rawText = await response.text();
        const result = parseJsonResponse(rawText);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(response, result, rawText));
        }
        const payload = result as { data?: { insertedCount?: number } } | null;
        setMessage(`Uploaded ${payload?.data?.insertedCount ?? rows.length} genotypic row(s).`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-[2rem] font-bold text-primary mb-7 tracking-[-0.3px]">
        Upload Data
      </h1>

      <Card className="gap-7">
        <FormField label="Upload type" required className="max-w-[400px]">
          <Select
            value={uploadType}
            onChange={(value) => {
              setUploadType(value as (typeof UPLOAD_TYPES)[number]);
              setFile(null);
              setFilePreview({ kind: "none" });
              setMessage("");
              setError("");
            }}
            options={[...UPLOAD_TYPES]}
            placeholder="Choose type"
          />
        </FormField>

        <p className="text-[0.9rem] text-text-muted">
          {uploadType === "StarAMR Workbook (.xlsx)"
            ? "Only for StarAMR pipeline output: requires Summary and Detailed_Summary sheets. UP culture / genotypic tables belong under Genotypic Analysis Excel — not here."
            : uploadType === "Genotypic Analysis Excel (.xlsx)"
              ? "Any .xlsx file or sheet name is fine. One row must contain the UP genotypic column headers in order (we scan the first 15 rows); data rows follow below that row."
              : "TSV must use the required column headers in order (tabs; empty cells allowed)."}
        </p>

        <FormField label="File" required>
          <div
            className={`upload-dropzone ${dragging ? "upload-dropzone--dragging" : ""} ${file ? "upload-dropzone--has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="upload-dropzone__input"
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a9e7a" strokeWidth={1.5} width={32} height={32}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="upload-dropzone__filename">{file.name}</p>
                <p className="upload-dropzone__hint">Click to replace</p>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={32} height={32}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p className="upload-dropzone__text">
                  Drag &amp; Drop or <span className="upload-dropzone__link">Choose file</span>
                </p>
                <p className="upload-dropzone__hint">{accept}</p>
              </>
            )}
          </div>
        </FormField>

        {file && (
          <section className="upload-preview-section" aria-label="File preview">
            {filePreview.kind === "loading" && (
              <p className="upload-preview__loading text-[0.9rem] text-text-muted">Reading file for preview…</p>
            )}
            {filePreview.kind === "error" && (
              <div className="upload-preview upload-preview--warn">
                <h2 className="upload-preview__title">Preview</h2>
                <p className="upload-preview__error-msg">{filePreview.message}</p>
                <p className="upload-preview__hint text-[0.85rem] text-text-muted">
                  Fix the file or choose the correct upload type, then try again. You can still attempt upload if the
                  server accepts the format.
                </p>
              </div>
            )}
            {filePreview.kind === "genotypic" && (
              <div className="upload-preview">
                <div className="upload-preview__head">
                  <h2 className="upload-preview__title">Preview</h2>
                  <p className="upload-preview__meta">
                    Showing {filePreview.rows.length} of {filePreview.total} data row
                    {filePreview.total === 1 ? "" : "s"}
                    {filePreview.total > MAX_PREVIEW_ROWS ? ` (first ${MAX_PREVIEW_ROWS})` : ""}
                    {filePreview.sheetName != null ? ` · Sheet: ${filePreview.sheetName}` : ""}
                  </p>
                </div>
                <GenotypicPreviewTable rows={filePreview.rows} />
              </div>
            )}
            {filePreview.kind === "staramr" && (
              <div className="upload-preview">
                <div className="upload-preview__head">
                  <h2 className="upload-preview__title">Preview</h2>
                  <p className="upload-preview__meta">
                    StarAMR workbook · Sheets: {filePreview.data.sheetNames.join(", ") || "(none)"}
                  </p>
                </div>
                {filePreview.data.warning && (
                  <p className="upload-preview__banner">{filePreview.data.warning}</p>
                )}
                {filePreview.data.summary && (
                  <div className="upload-preview__block">
                    <h3 className="upload-preview__subtitle">{filePreview.data.summary.tabTitle}</h3>
                    <StarAmrSheetPreview
                      headers={filePreview.data.summary.headers}
                      rows={filePreview.data.summary.rows}
                    />
                  </div>
                )}
                {filePreview.data.detailed && (
                  <div className="upload-preview__block">
                    <h3 className="upload-preview__subtitle">{filePreview.data.detailed.tabTitle}</h3>
                    <StarAmrSheetPreview
                      headers={filePreview.data.detailed.headers}
                      rows={filePreview.data.detailed.rows}
                    />
                  </div>
                )}
                {!filePreview.data.summary && !filePreview.data.detailed && (
                  <p className="upload-preview__empty">No Summary / Detailed_Summary tables to show.</p>
                )}
              </div>
            )}
          </section>
        )}

        {message && <p className="text-[0.9rem] text-primary font-semibold">{message}</p>}
        {error && <p className="text-[0.9rem] text-danger font-semibold">{error}</p>}

        <div className="flex gap-4 flex-wrap">
          <Button onClick={handleUpload} className="px-8" disabled={isUploading}>
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
