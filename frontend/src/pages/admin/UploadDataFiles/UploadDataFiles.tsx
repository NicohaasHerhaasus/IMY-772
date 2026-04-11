import { useState, useRef, useCallback } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import "./UploadDatafiles.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function tryGetAuthToken(): Promise<{ token: string } | { error: string }> {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    const token =
      session.tokens?.accessToken?.toString() ?? session.tokens?.idToken?.toString();
    if (!token) {
      return { error: "Authentication token is required. Please sign in again." };
    }
    return { token };
  } catch {
    return { error: "Could not load your session. Please sign in again." };
  }
}

type Phase = "idle" | "validating" | "validated" | "uploading" | "done" | "error";

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

function previewCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** Column order matches API / spreadsheet; scroll horizontally to see all. */
const PREVIEW_COLUMNS: Array<{ key: keyof SampleRow; label: string }> = [
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

export default function UploadDataFiles() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [validationResult, setValidationResult] = useState<ValidationSuccess | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = (newFile: File | null) => {
    setFile(newFile);
    setPhase("idle");
    setValidationResult(null);
    setErrors([]);
    setIngestResult(null);
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) resetState(e.target.files[0]);
  };

  const handleValidate = async () => {
    if (!file) {
      setErrors(["Please select a .xlsx file before validating."]);
      setPhase("error");
      return;
    }
    setPhase("validating");
    setErrors([]);
    setValidationResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const auth = await tryGetAuthToken();
      if ("error" in auth) {
        setErrors([auth.error]);
        setPhase("error");
        return;
      }
      const res = await fetch(`${API_BASE}/api/samples/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.details ?? [json.message ?? "Validation failed."]);
        setPhase("error");
        return;
      }
      setValidationResult(json.data as ValidationSuccess);
      setPhase("validated");
    } catch {
      setErrors(["Could not reach the server. Please check your connection and try again."]);
      setPhase("error");
    }
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setPhase("uploading");
    setErrors([]);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const auth = await tryGetAuthToken();
      if ("error" in auth) {
        setErrors([auth.error]);
        setPhase("error");
        return;
      }
      const res = await fetch(`${API_BASE}/api/samples/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.details ?? [json.message ?? "Upload failed."]);
        setPhase("error");
        return;
      }
      setIngestResult(json.data as IngestResult);
      setPhase("done");
    } catch {
      setErrors(["Could not reach the server. Please check your connection and try again."]);
      setPhase("error");
    }
  };

  const handleReset = () => {
    resetState(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isWorking = phase === "validating" || phase === "uploading";

  return (
    <div>
      <h1 className="upload-page-title">Upload Sample Data</h1>

      <div className="upload-card">
        {/* Dropzone */}
        <div>
          <label className="upload-label">
            Import Sample File <span className="required-star">*</span>
          </label>
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
              accept=".xlsx"
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
                  Drag &amp; drop or{" "}
                  <span className="upload-dropzone__link">browse file</span>
                </p>
                <p className="upload-dropzone__hint">.xlsx only</p>
              </>
            )}
          </div>
        </div>

        {/* Required columns hint */}
        {phase === "idle" && (
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
        {phase === "error" && errors.length > 0 && (
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
              {errors.map((e, i) => {
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
        {phase === "validated" && validationResult && (
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
                    {PREVIEW_COLUMNS.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validationResult.rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {PREVIEW_COLUMNS.map((c) => (
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
        {phase === "done" && ingestResult !== null && (
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
          {phase !== "done" && phase !== "validated" && phase !== "uploading" && (
            <button
              className="upload-btn upload-btn--primary"
              onClick={handleValidate}
              disabled={isWorking || !file}
            >
              {phase === "validating" ? (
                <><span className="upload-spinner" /> Validating…</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={14} height={14}>
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
              onClick={handleConfirmUpload}
              disabled={isWorking}
            >
              {phase === "uploading" ? (
                <><span className="upload-spinner" /> Uploading…</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={14} height={14}>
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
        </div>
      </div>
    </div>
  );
}