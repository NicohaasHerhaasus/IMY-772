import { useState, useRef, useCallback, useEffect, type ChangeEvent } from "react";
import { Button, Card, FormField, Select } from "../../../components/ui";
import { useAuth } from "../../../context/AuthContext";
import {
  EXAMPLE_AMRFINDER_PLUS_PREVIEW_COLUMNS,
  GENOTYPIC_PREVIEW_COLUMNS,
  MAX_PREVIEW_ROWS,
  parseExampleAmrFinderPlusXlsxForPreview,
  type ExampleAmrFinderPlusRow,
  type GenotypicUploadRow,
  parseGenotypicXlsxForPreview,
  parseStarAmrXlsxForPreview,
  type StarAmrPreview,
} from "./uploadPreview";
import "./UploadDataFiles.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
  "Sample Dashboard Excel (.xlsx)",
  "Genotypic Analysis Excel (.xlsx)",
  "Genotypic Analysis TSV (.tsv)",
  "StarAMR Workbook (.xlsx)",
  "Example AMRFinderPlus Excel (.xlsx)",
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
  | { kind: "staramr"; data: StarAmrPreview }
  | { kind: "amrfinderplus"; rows: ExampleAmrFinderPlusRow[]; total: number };

type SampleUploadPhase = "idle" | "validating" | "validated" | "uploading" | "done" | "error";

interface SampleRow {
  sampleName: string;
  sampleAnalysisType: string;
  isolationSource: string;
  collectionDate: string;
  geoLocName: string;
  latitude: number;
  longitude: number;
  predictedSirProfile: string;
  isolateId: string | null;
  organism: string | null;
  labSampleId: string | null;
  collectedBy: string | null;
  amrResistanceGenes: string | null;
  sequenceName: string | null;
  elementType: string | null;
  elementClass: string | null;
  elementSubclass: string | null;
  targetLength: number | null;
  referenceSequenceLength: number | null;
  pctCoverageReference: number | null;
  pctIdentityReference: number | null;
  alignmentLength: number | null;
  accessionClosestSequence: string | null;
  virulenceGenes: string | null;
  plasmidReplicons: string | null;
  ph: number | null;
  tempOfWater: number | null;
  tdsMgL: number | null;
  dissolvedOxygenMgL: number | null;
}

interface ValidationSuccess {
  rowCount: number;
  rows: SampleRow[];
}

interface IngestResult {
  insertedCount: number;
  skippedCount: number;
  skippedNames: string[];
}

const REQUIRED_COLUMNS = [
  "Sample name",
  "Sample analysis type",
  "Isolation source",
  "Collection date",
  "geo_loc_name",
  "Latitude",
  "Longitude",
  "Predicted SIR profile",
];

const OPTIONAL_COLUMNS_HINT = [
  "Isolate ID",
  "Organism",
  "Sample ID",
  "Collected by",
  "AMR resistance genes",
  "Sequence name",
  "Element type",
  "Class",
  "Subclass",
  "Target length",
  "Reference sequence length",
  "% coverage of reference sequence",
  "% identity to reference sequence",
  "Alignment length",
  "Accession of closest sequence",
  "Virulence genes",
  "Plasmid replicons",
  "pH",
  "Temp of water",
  "TDS (mg/L)",
  "Dissolved oxygen (mg/L)",
];

const SAMPLE_PREVIEW_COLUMNS: Array<{ key: keyof SampleRow; label: string }> = [
  { key: "sampleName", label: "Sample name" },
  { key: "sampleAnalysisType", label: "Analysis type" },
  { key: "isolateId", label: "Isolate ID" },
  { key: "organism", label: "Organism" },
  { key: "labSampleId", label: "Sample ID" },
  { key: "isolationSource", label: "Isolation source" },
  { key: "collectionDate", label: "Collection date" },
  { key: "geoLocName", label: "geo_loc_name" },
  { key: "latitude", label: "Latitude" },
  { key: "longitude", label: "Longitude" },
  { key: "collectedBy", label: "Collected by" },
  { key: "amrResistanceGenes", label: "AMR genes" },
  { key: "sequenceName", label: "Sequence name" },
  { key: "elementType", label: "Element type" },
  { key: "elementClass", label: "Class" },
  { key: "elementSubclass", label: "Subclass" },
  { key: "targetLength", label: "Target len." },
  { key: "referenceSequenceLength", label: "Ref. seq. len." },
  { key: "pctCoverageReference", label: "% Cov. ref." },
  { key: "pctIdentityReference", label: "% Id. ref." },
  { key: "alignmentLength", label: "Align. len." },
  { key: "accessionClosestSequence", label: "Accession" },
  { key: "virulenceGenes", label: "Virulence" },
  { key: "plasmidReplicons", label: "Plasmids" },
  { key: "predictedSirProfile", label: "Predicted SIR" },
  { key: "ph", label: "pH" },
  { key: "tempOfWater", label: "Water temp." },
  { key: "tdsMgL", label: "TDS (mg/L)" },
  { key: "dissolvedOxygenMgL", label: "DO (mg/L)" },
];

function previewCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

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

function ExampleAmrFinderPlusPreviewTable({ rows }: { rows: ExampleAmrFinderPlusRow[] }) {
  return (
    <div className="upload-preview__scroll">
      <table className="upload-preview-table">
        <thead>
          <tr>
            {EXAMPLE_AMRFINDER_PLUS_PREVIEW_COLUMNS.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {EXAMPLE_AMRFINDER_PLUS_PREVIEW_COLUMNS.map((col) => (
                <td key={col.key}>{row[col.key] || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UploadDataFiles() {
  const { getAccessToken } = useAuth();
  const [uploadType, setUploadType] = useState<(typeof UPLOAD_TYPES)[number]>(UPLOAD_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreviewState>({ kind: "none" });
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<SampleUploadPhase>("idle");
  const [validationResult, setValidationResult] = useState<ValidationSuccess | null>(null);
  const [sampleErrors, setSampleErrors] = useState<string[]>([]);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSampleDashboard = uploadType === "Sample Dashboard Excel (.xlsx)";

  const resetState = useCallback((newFile: File | null) => {
    setFile(newFile);
    setFilePreview({ kind: "none" });
    setPhase("idle");
    setValidationResult(null);
    setSampleErrors([]);
    setIngestResult(null);
    setIsUploading(false);
    setMessage("");
    setError("");
  }, []);

  useEffect(() => {
    if (!file) {
      setFilePreview({ kind: "none" });
      return;
    }
    if (isSampleDashboard) {
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

        if (uploadType === "Example AMRFinderPlus Excel (.xlsx)") {
          const data = parseExampleAmrFinderPlusXlsxForPreview(buffer);
          if (!cancelled) {
            setFilePreview({ kind: "amrfinderplus", rows: data.rows, total: data.total });
          }
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
  }, [file, uploadType, isSampleDashboard]);

  const accept =
    uploadType === "Genotypic Analysis TSV (.tsv)"
      ? ".tsv,.txt"
      : ".xlsx";

  const isWorking = isSampleDashboard ? phase === "validating" || phase === "uploading" : isUploading;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) resetState(dropped);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) resetState(e.target.files[0]);
  };

  const handleValidateSample = async () => {
    if (!file) {
      setSampleErrors(["Please select a .xlsx file before validating."]);
      setPhase("error");
      return;
    }
    setPhase("validating");
    setSampleErrors([]);
    setValidationResult(null);
    setIngestResult(null);
    setMessage("");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setSampleErrors(["Authentication token is required. Please sign in again."]);
        setPhase("error");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/samples/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const rawText = await res.text();
      const json = parseJsonResponse(rawText) as { data?: ValidationSuccess; message?: string; details?: unknown };
      if (!res.ok) {
        if (Array.isArray(json?.details)) {
          setSampleErrors(json.details.filter((d): d is string => typeof d === "string"));
        } else {
          setSampleErrors([getApiErrorMessage(res, json, rawText)]);
        }
        setPhase("error");
        return;
      }
      setValidationResult((json?.data ?? { rowCount: 0, rows: [] }) as ValidationSuccess);
      setPhase("validated");
    } catch (err) {
      setSampleErrors([
        err instanceof Error
          ? err.message
          : "Could not reach the server. Please check your connection and try again.",
      ]);
      setPhase("error");
    }
  };

  const handleConfirmSampleUpload = async () => {
    if (!file) return;
    setPhase("uploading");
    setSampleErrors([]);
    setMessage("");
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setSampleErrors(["Authentication token is required. Please sign in again."]);
        setPhase("error");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/samples/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const rawText = await res.text();
      const json = parseJsonResponse(rawText) as { data?: IngestResult; message?: string; details?: unknown };
      if (!res.ok) {
        if (Array.isArray(json?.details)) {
          setSampleErrors(json.details.filter((d): d is string => typeof d === "string"));
        } else {
          setSampleErrors([getApiErrorMessage(res, json, rawText)]);
        }
        setPhase("error");
        return;
      }
      setIngestResult(
        (json?.data ?? { insertedCount: 0, skippedCount: 0, skippedNames: [] }) as IngestResult,
      );
      setPhase("done");
    } catch (err) {
      setSampleErrors([
        err instanceof Error
          ? err.message
          : "Could not reach the server. Please check your connection and try again.",
      ]);
      setPhase("error");
    }
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

      if (isSampleDashboard) {
        throw new Error("Use Validate and Confirm upload for sample dashboard files.");
      } else if (uploadType === "StarAMR Workbook (.xlsx)") {
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
      } else if (uploadType === "Example AMRFinderPlus Excel (.xlsx)") {
        if (!file.name.toLowerCase().endsWith(".xlsx")) {
          throw new Error("Only .xlsx is supported for Example AMRFinderPlus.");
        }
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_URL}/api/upload/example-amrfinder-plus`, {
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
        setMessage(`Uploaded ${payload?.data?.insertedCount ?? 0} AMRFinderPlus row(s).`);
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

  const handleReset = () => {
    resetState(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <h1 className="upload-page-title">Upload Sample Data</h1>

      <Card className="gap-7">
        <FormField label="Upload type" required className="max-w-[400px]">
          <Select
            value={uploadType}
            onChange={(value) => {
              setUploadType(value as (typeof UPLOAD_TYPES)[number]);
              resetState(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            options={[...UPLOAD_TYPES]}
            placeholder="Choose type"
          />
        </FormField>

        <p className="text-[0.9rem] text-text-muted">
          {isSampleDashboard
            ? "Dashboard sample workbook upload with strict server-side validator (required fields like geo_loc_name, latitude, and longitude)."
            : uploadType === "StarAMR Workbook (.xlsx)"
            ? "Only for StarAMR pipeline output: requires Summary and Detailed_Summary sheets. UP culture / genotypic tables belong under Genotypic Analysis Excel — not here."
            : uploadType === "Example AMRFinderPlus Excel (.xlsx)"
              ? "Requires the sheet 'Sheet 1 - exampleAMRFinderPlus' with columns like SampleID, Protein identifier, Gene symbol, and HMM description."
            : uploadType === "Genotypic Analysis Excel (.xlsx)"
              ? "Any .xlsx file or sheet name is fine. One row must contain the UP genotypic column headers in order (we scan the first 15 rows); data rows follow below that row."
              : "TSV must use the required column headers in order (tabs; empty cells allowed)."}
        </p>

        <FormField label="File" required>
          <div
            className={[
              "upload-dropzone",
              dragging ? "upload-dropzone--dragging" : "",
              file ? "upload-dropzone--has-file" : "",
            ].join(" ")}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragging(false)}
            onClick={() => !isWorking && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="upload-dropzone__input"
              onChange={handleFileChange}
              disabled={isWorking}
            />

            {file ? (
              <>
                <div className="upload-dropzone__icon-wrap upload-dropzone__icon-wrap--success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.5} width={22} height={22}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="upload-dropzone__filename">{file.name}</p>
                {!isWorking && <p className="upload-dropzone__hint">Click to replace file</p>}
              </>
            ) : (
              <>
                <div className="upload-dropzone__icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} width={22} height={22}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="upload-dropzone__text">
                  Drag &amp; Drop or <span className="upload-dropzone__link">Choose file</span>
                </p>
                <p className="upload-dropzone__hint">{accept}</p>
              </>
            )}
          </div>
        </FormField>

        {file && !isSampleDashboard && (
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
            {filePreview.kind === "amrfinderplus" && (
              <div className="upload-preview">
                <div className="upload-preview__head">
                  <h2 className="upload-preview__title">Preview</h2>
                  <p className="upload-preview__meta">
                    Showing {filePreview.rows.length} of {filePreview.total} data row
                    {filePreview.total === 1 ? "" : "s"}
                    {filePreview.total > MAX_PREVIEW_ROWS ? ` (first ${MAX_PREVIEW_ROWS})` : ""}
                  </p>
                </div>
                <ExampleAmrFinderPlusPreviewTable rows={filePreview.rows} />
              </div>
            )}
          </section>
        )}

        {message && <p className="text-[0.9rem] text-primary font-semibold">{message}</p>}
        {error && <p className="text-[0.9rem] text-danger font-semibold">{error}</p>}

        {isSampleDashboard && phase === "idle" && (
          <div className="sample-upload__hint-box">
            <p className="sample-upload__hint-title">Required columns</p>
            <ul className="sample-upload__hint-list">
              {REQUIRED_COLUMNS.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
            <p className="sample-upload__hint-title" style={{ marginTop: "1rem" }}>
              Optional columns (stored when present)
            </p>
            <ul className="sample-upload__hint-list">
              {OPTIONAL_COLUMNS_HINT.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error panel */}
        {isSampleDashboard && phase === "error" && sampleErrors.length > 0 && (
          <div className="sample-upload__error-box" role="alert">
            <div className="sample-upload__error-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Validation failed — fix the issues below before uploading
            </div>
            <ul className="sample-upload__error-list">
              {sampleErrors.map((e, i) => {
                const isSummary = e.startsWith("MISSING COLUMNS:") || e.startsWith("MISSING DATA:");
                const displayText = e.replace(/^MISSING COLUMNS:\s*/, "").replace(/^MISSING DATA:\s*/, "");
                return (
                  <li key={i} className={isSummary ? "sample-upload__error-summary" : ""}>
                    {displayText}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Validation success panel */}
        {isSampleDashboard && phase === "validated" && validationResult && (
          <div className="sample-upload__success-box" role="status">
            <div className="sample-upload__success-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Validation passed —{" "}
              {validationResult.rowCount} row{validationResult.rowCount !== 1 ? "s" : ""} ready to import
            </div>
            <div className="sample-upload__table-wrapper">
              <table className="sample-upload__table">
                <thead>
                  <tr>
                    <th>#</th>
                    {SAMPLE_PREVIEW_COLUMNS.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validationResult.rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {SAMPLE_PREVIEW_COLUMNS.map((c) => (
                        <td key={c.key}>{previewCell(row[c.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {validationResult.rowCount > 10 && (
                <p className="sample-upload__table-more">
                  + {validationResult.rowCount - 10} more row{validationResult.rowCount - 10 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Done panel */}
        {isSampleDashboard && phase === "done" && ingestResult !== null && (
          <div className="sample-upload__done-box" role="status">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} width={28} height={28} style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p className="sample-upload__done-count">{ingestResult.insertedCount}</p>
              <p className="sample-upload__done-label">
                sample{ingestResult.insertedCount !== 1 ? "s" : ""} imported successfully
              </p>
              {ingestResult.skippedCount > 0 && (
                <p className="sample-upload__done-skipped">
                  <strong>{ingestResult.skippedCount}</strong> duplicate
                  {ingestResult.skippedCount !== 1 ? "s" : ""} skipped:{" "}
                  {ingestResult.skippedNames.join(", ")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {isSampleDashboard ? (
            <>
              {phase !== "done" && phase !== "validated" && phase !== "uploading" && (
                <button
                  className="upload-btn upload-btn--primary"
                  onClick={handleValidateSample}
                  disabled={isWorking || !file}
                >
                  {phase === "validating" ? (
                    <>
                      <span className="upload-spinner" /> Validating...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        width={14}
                        height={14}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Validate file
                    </>
                  )}
                </button>
              )}
              {(phase === "validated" || phase === "uploading") && (
                <button
                  className="upload-btn upload-btn--primary"
                  onClick={handleConfirmSampleUpload}
                  disabled={isWorking}
                >
                  {phase === "uploading" ? (
                    <>
                      <span className="upload-spinner" /> Uploading...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        width={14}
                        height={14}
                      >
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                      Confirm upload
                    </>
                  )}
                </button>
              )}
              {(phase === "error" || phase === "done") && (
                <button className="upload-btn upload-btn--outline" onClick={handleReset}>
                  Start over
                </button>
              )}
            </>
          ) : (
            <Button onClick={handleUpload} className="px-8" disabled={isUploading || !file}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
