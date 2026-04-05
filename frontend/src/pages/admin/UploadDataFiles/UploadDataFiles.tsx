import { useState, useRef, useCallback } from "react";
import "./UploadDatafiles.css";

// Mock river list — replace with API call later
const RIVER_OPTIONS = [
  "Apies River",
  "Hennops River",
  "Crocodile River",
  "Limpopo River",
  "Vaal River",
];

export default function UploadDatafiles() {
  const [riverName, setRiverName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collectionDate, setCollectionDate] = useState("");
  const [sampleNumber, setSampleNumber] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop ──────────────────────────────────────
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

  const handleDragLeave = () => setDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  // ── Submit ────────────────────────────────────────────
  const handleUpload = () => {
    if (!riverName || !collectionDate || !file) {
      alert("Please fill in all required fields.");
      return;
    }
    // TODO: POST to your backend API
    console.log({ riverName, collectionDate, sampleNumber: parseInt(sampleNumber, 10), file });
  };

  const handlePreview = () => {
    // TODO: open a preview modal or navigate to preview page
    console.log("Preview", file);
  };

  return (
    <div className="upload-page">
      <h1 className="upload-page__title">Upload Data</h1>

      <div className="upload-card">
        {/* Row 1: River Name + Date + Sample Number */}
        <div className="upload-card__row">
          {/* River Name Dropdown */}
          <div className="upload-field upload-field--grow">
            <label className="upload-field__label">
              River Name <span className="upload-field__required">*</span>
            </label>
            <div
              className={`upload-select ${dropdownOpen ? "upload-select--open" : ""}`}
              onClick={() => setDropdownOpen((p) => !p)}
            >
              <span className={riverName ? "" : "upload-select__placeholder"}>
                {riverName || "None"}
              </span>
              <svg
                className={`upload-select__chevron ${dropdownOpen ? "upload-select__chevron--up" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                width={18}
                height={18}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>

              {dropdownOpen && (
                <ul className="upload-select__dropdown" onClick={(e) => e.stopPropagation()}>
                  {RIVER_OPTIONS.map((r) => (
                    <li
                      key={r}
                      className={`upload-select__option ${r === riverName ? "upload-select__option--selected" : ""}`}
                      onClick={() => {
                        setRiverName(r);
                        setDropdownOpen(false);
                      }}
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Date of Collection */}
          <div className="upload-field upload-field--grow">
            <label className="upload-field__label">
              Date of Collection <span className="upload-field__required">*</span>
            </label>
            <div className="upload-date">
              <input
                type="date"
                className="upload-date__input"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
              />
              <svg
                className="upload-date__icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                width={18}
                height={18}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>

          {/* Sample Upload Number */}
          <div className="upload-field upload-field--shrink">
            <label className="upload-field__label">
              Sample Upload Number <span className="upload-field__required">*</span>
            </label>
            <div className="upload-stepper">
              <input
                type="text"
                inputMode="numeric"
                className="upload-stepper__input"
                value={sampleNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setSampleNumber(val);
                }}
                onBlur={() => {
                  const n = parseInt(sampleNumber, 10);
                  setSampleNumber(String(isNaN(n) || n < 1 ? 1 : n));
                }}
              />
              <div className="upload-stepper__controls">
                <button
                  className="upload-stepper__btn"
                  onClick={() => setSampleNumber((n) => String(parseInt(n, 10) + 1))}
                  aria-label="Increase"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={10} height={10}><polyline points="6 15 12 9 18 15" /></svg>
                </button>
                <button
                  className="upload-stepper__btn"
                  onClick={() => setSampleNumber((n) => String(Math.max(1, parseInt(n, 10) - 1)))}
                  aria-label="Decrease"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={10} height={10}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: File Dropzone */}
        <div className="upload-field">
          <label className="upload-field__label">
            Import Data <span className="upload-field__required">*</span>
          </label>
          <div
            className={`upload-dropzone ${dragging ? "upload-dropzone--dragging" : ""} ${file ? "upload-dropzone--has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
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
                  Drag &amp; Drop or{" "}
                  <span className="upload-dropzone__link">Choose file</span>{" "}
                  to upload
                </p>
                <p className="upload-dropzone__hint">.csv, .tsv, .txt</p>
              </>
            )}
          </div>
        </div>

        {/* Row 3: Action Buttons */}
        <div className="upload-card__actions">
          <button className="upload-btn upload-btn--primary" onClick={handleUpload}>
            Upload your data
          </button>
          <button className="upload-btn upload-btn--outline" onClick={handlePreview}>
            Preview data
          </button>
        </div>
      </div>
    </div>
  );
}