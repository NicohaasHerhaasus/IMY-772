import { useState } from "react";
import "./ExportDatafiles.css";

// Mock data — replace with API calls later
const DATA_SOURCES = [
  "Apies River",
  "Hennops River",
  "Crocodile River",
  "Limpopo River",
  "Vaal River",
];

const EXPORT_FORMATS = ["JSON", "CSV", "TSV", "Excel (.xlsx)"];

export default function ExportDatafiles() {
  const [dataSource, setDataSource] = useState("");
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [format, setFormat] = useState("");
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  const handleExport = () => {
    if (!dataSource || !format) {
      alert("Please select both a data source and a format.");
      return;
    }
    // TODO: call your backend export endpoint
    console.log({ dataSource, format });
  };

  return (
    <div className="export-page">
      <h1 className="export-page__title">
        Export Data{dataSource ? ` from ${dataSource}` : ""}
      </h1>

      <div className="export-card">
        {/* Data Source */}
        <div className="export-field">
          <label className="export-field__label">
            Data Source <span className="export-field__required">*</span>
          </label>
          <div
            className={`export-select ${sourceDropdownOpen ? "export-select--open" : ""}`}
            onClick={() => {
              setSourceDropdownOpen((p) => !p);
              setFormatDropdownOpen(false);
            }}
          >
            <span className={dataSource ? "" : "export-select__placeholder"}>
              {dataSource || "Select a data source"}
            </span>
            <svg
              className={`export-select__chevron ${sourceDropdownOpen ? "export-select__chevron--up" : ""}`}
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

            {sourceDropdownOpen && (
              <ul className="export-select__dropdown" onClick={(e) => e.stopPropagation()}>
                {DATA_SOURCES.map((s) => (
                  <li
                    key={s}
                    className={`export-select__option ${s === dataSource ? "export-select__option--selected" : ""}`}
                    onClick={() => {
                      setDataSource(s);
                      setSourceDropdownOpen(false);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Format */}
        <div className="export-field">
          <label className="export-field__label">
            Format <span className="export-field__required">*</span>
          </label>
          <div
            className={`export-select ${formatDropdownOpen ? "export-select--open" : ""}`}
            onClick={() => {
              setFormatDropdownOpen((p) => !p);
              setSourceDropdownOpen(false);
            }}
          >
            <span className={format ? "" : "export-select__placeholder"}>
              {format || "Select a format"}
            </span>
            <svg
              className={`export-select__chevron ${formatDropdownOpen ? "export-select__chevron--up" : ""}`}
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

            {formatDropdownOpen && (
              <ul className="export-select__dropdown" onClick={(e) => e.stopPropagation()}>
                {EXPORT_FORMATS.map((f) => (
                  <li
                    key={f}
                    className={`export-select__option ${f === format ? "export-select__option--selected" : ""}`}
                    onClick={() => {
                      setFormat(f);
                      setFormatDropdownOpen(false);
                    }}
                  >
                    <span className="export-select__option-icon">
                      {f === "JSON" && "{ }"}
                      {f === "CSV" && "csv"}
                      {f === "TSV" && "tsv"}
                      {f === "Excel (.xlsx)" && "xls"}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Summary pill — shows when both are selected */}
        {dataSource && format && (
          <div className="export-summary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Exporting <strong>{dataSource}</strong> as <strong>{format}</strong>
          </div>
        )}

        {/* Export Button */}
        <div className="export-card__actions">
          <button
            className={`export-btn ${!dataSource || !format ? "export-btn--disabled" : ""}`}
            onClick={handleExport}
            disabled={!dataSource || !format}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}