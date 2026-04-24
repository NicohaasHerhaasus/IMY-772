import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "../components/ui";
import "./DataExplorer.css";

// // ── Dataset ──────────────────────────────────────────────────────────────────
// // Mirrors the 15 rows in SampleDashboard.xlsx exactly.

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

// ── Validation ────────────────────────────────────────────────────────────────

interface ValidationErrors {
  geo?: string;
  date?: string;
  atLeastOne?: string;
}

function validate(f: Filters): ValidationErrors {
  const errs: ValidationErrors = {};
  if (!f.geo) errs.geo = 'Geographic location is required.';
  if (!f.dateFrom || !f.dateTo) {
    errs.date = 'Both start and end dates are required.';
  } else if (f.dateFrom > f.dateTo) {
    errs.date = 'Start date must be on or before end date.';
  }
  if (!f.organism && !f.source) {
    errs.atLeastOne = 'Select at least one of Organism or Isolation source.';
  }
  return errs;
}

// ── Example query (used in empty state) ──────────────────────────────────────

const EXAMPLE_QUERY: Filters = {
  geo: 'South Africa: Gauteng',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  collectedBy: '',
  amrGene: "aph(3')-Ia",
  sir: 'kanamycin',
  organism: 'Escherichia coli',
  source: '',
  amrClass: 'AMINOGLYCOSIDE',
  amrSubclass: '',
};

interface ExampleQueryCardProps {
  onUseExample: (f: Filters) => void;
}

function ExampleQueryCard({ onUseExample }: ExampleQueryCardProps) {
  const rows: { label: string; value: string; color: 'green' | 'blue' | 'amber' }[] = [
    { label: 'Geographic location', value: 'South Africa: Gauteng',  color: 'green' },
    { label: 'Collection date',     value: '2024-01-01 → 2024-12-31', color: 'green' },
    { label: "AMR resistance gene", value: "aph(3')-Ia",             color: 'green' },
    { label: 'Predicted SIR',       value: 'kanamycin',              color: 'green' },
    { label: 'Organism',            value: 'Escherichia coli',        color: 'blue'  },
    { label: 'AMR class',           value: 'AMINOGLYCOSIDE',          color: 'amber' },
  ];

  const dotBg: Record<string, string> = {
    green: '#22c55e',
    blue:  '#3b82f6',
    amber: '#eab308',
  };

  return (
    <div className="de-example-card">
      <div className="de-example-header">
        <div className="de-example-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div>
          <div className="de-example-title">Example query</div>
          <div className="de-example-sub">
            E. coli aminoglycoside resistance · Gauteng · 2024
          </div>
        </div>
      </div>

      <div className="de-example-filters">
        {rows.map((r) => (
          <div key={r.label} className="de-example-row">
            <span
              className="de-example-dot"
              style={{ background: dotBg[r.color] }}
            />
            <span className="de-example-key">{r.label}</span>
            <span className={`de-example-val de-example-val--${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DataExplorer() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [options, setOptions] = useState<DropdownOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryErrors, setQueryErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasQueried, setHasQueried] = useState(false);

  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Persist last valid filters used for export
  const lastFiltersRef = useRef<Filters>(EMPTY_FILTERS);

  // Load example query into filter state
  const loadExample = useCallback((f: Filters) => {
    setFilters(f);
    setValidationErrors({});
    setQueryErrors([]);
    setResult(null);
    setHasQueried(false);
  }, []);

  // ── Load dropdown options on mount ────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setOptionsLoading(true);
        setOptionsError(null);
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/options`, { headers });
        if (!res.ok) throw new Error(`Failed to load options (${res.status})`);
        const json = await res.json();
        if (!cancelled) setOptions(json.data as DropdownOptions);
      } catch (err) {
        if (!cancelled)
          setOptionsError(
            err instanceof Error ? err.message : 'Failed to load dropdown options.',
          );
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setF = useCallback(
    (key: keyof Filters) => (val: string) =>
      setFilters((prev) => ({ ...prev, [key]: val })),
    [],
  );

  // ── Run query ─────────────────────────────────────────────────────────────

  async function runQuery() {
    const errs = validate(filters);
    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setQueryLoading(true);
    setQueryErrors([]);
    setResult(null);
    setExportError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(toApiFilters(filters)),
      });
      const json = await res.json();

      if (!res.ok) {
        setQueryErrors(
          json.errors ?? [json.message ?? `Server error (${res.status})`],
        );
        return;
      }

      setResult(json.data as QueryResult);
      lastFiltersRef.current = { ...filters };
      setHasQueried(true);
    } catch (err) {
      setQueryErrors([
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      ]);
    } finally {
      setQueryLoading(false);
    }
  }

  function resetAll() {
    setFilters(EMPTY_FILTERS);
    setResult(null);
    setHasQueried(false);
    setQueryErrors([]);
    setValidationErrors({});
    setExportError(null);
  }

  // ── Export handlers ───────────────────────────────────────────────────────

  async function handleExportCsv() {
    setExportingCsv(true);
    setExportError(null);
    try {
      await triggerDownload(
        '/export/csv',
        lastFiltersRef.current,
        `query_results_${Date.now()}.csv`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'CSV export failed.');
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleExportXlsx() {
    setExportingXlsx(true);
    setExportError(null);
    try {
      await triggerDownload(
        '/export/xlsx',
        lastFiltersRef.current,
        `query_results_${Date.now()}.xlsx`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'XLSX export failed.');
    } finally {
      setExportingXlsx(false);
    }
  }

  // ── Active filter tags ────────────────────────────────────────────────────

  const activeTags = useMemo(
    () =>
      [
        { label: 'Region', value: filters.geo },
        { label: 'Organism', value: filters.organism },
        { label: 'By', value: filters.collectedBy },
        { label: 'Gene', value: filters.amrGene },
        { label: 'SIR', value: filters.sir },
        { label: 'Source', value: filters.source },
        { label: 'Class', value: filters.amrClass },
        { label: 'Subclass', value: filters.amrSubclass },
        ...(filters.dateFrom || filters.dateTo
          ? [
              {
                label: 'Date',
                value: `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`,
              },
            ]
          : []),
      ].filter((t) => t.value !== ''),
    [filters],
  );

  // Rows as table columns (keep order from first row's keys)
  const tableColumns = useMemo(
    () => (result && result.rows.length > 0 ? Object.keys(result.rows[0]) : []),
    [result],
  );

  const canExport = hasQueried && result !== null && result.rows.length > 0 && !queryLoading;

  // ── Example queries ───────────────────────────────────────────────────────
  // NOTE: EXAMPLE_QUERIES was removed as it's no longer used; use loadExample callback instead


  // NOTE: loadAndRun was removed as it's no longer used; use loadExample callback instead

  return (
    <div className="de-page">
      {/* ══ SIDEBAR ══ */}
      <aside className="de-sidebar">
        <div className="de-sidebar-head">
          <div className="de-sidebar-title" style={{ fontFamily: "'Syne', sans-serif" }}>Query builder</div>            
        </div>

        <div className="de-sidebar-body">
          {/* Options error banner */}
          {optionsError && (
            <div className="de-error-banner">
              <span>⚠ {optionsError}</span>
              <button
                className="de-error-retry"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Mandatory ── */}
          <div className="de-section-label">Mandatory fields</div>

          <SelectField
            label="*Geographic location"
            obligation="m"
            value={filters.geo}
            onChange={setF('geo')}
            options={options?.geoLocations ?? []}
            placeholder="All regions"
            loading={optionsLoading}
          />
          {validationErrors.geo && (
            <div className="de-field-error">{validationErrors.geo}</div>
          )}

          <div className="de-field">
            <div className="de-flabel de-flabel--green">
              <span className="de-dot de-dot--green" />
              *Collection date
            </div>
            <div className="de-date-row">
              <input
                className="de-date-inp"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setF('dateFrom')(e.target.value)}
              />
              <input
                className="de-date-inp"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setF('dateTo')(e.target.value)}
              />
            </div>
            {validationErrors.date && (
              <div className="de-field-error">{validationErrors.date}</div>
            )}
          </div>

          <SelectField
            label="*Collected by"
            obligation="m"
            value={filters.collectedBy}
            onChange={setF('collectedBy')}
            options={options?.collectors ?? []}
            placeholder="All collectors"
            loading={optionsLoading}
          />

          <SelectField
            label="*AMR resistance gene"
            obligation="m"
            value={filters.amrGene}
            onChange={setF('amrGene')}
            options={options?.amrGenes ?? []}
            placeholder="All genes"
            loading={optionsLoading}
          />

          <SelectField
            label="*Predicted SIR (antibiotic)"
            obligation="m"
            value={filters.sir}
            onChange={setF('sir')}
            options={options?.sirProfiles ?? []}
            placeholder="Any antibiotic"
            loading={optionsLoading}
          />

          {/* ── At-least-one ── */}
          <div className="de-section-label" style={{ marginTop: 10 }}>
            At least one required
          </div>

          <SelectField
            label="Organism"
            obligation="b"
            value={filters.organism}
            onChange={setF('organism')}
            options={options?.organisms ?? []}
            loading={optionsLoading}
          />
          <SelectField
            label="Isolation source"
            obligation="b"
            value={filters.source}
            onChange={setF('source')}
            options={options?.isolationSources ?? []}
            loading={optionsLoading}
          />
          {validationErrors.atLeastOne && (
            <div className="de-field-error">{validationErrors.atLeastOne}</div>
          )}

          {/* ── Optional ── */}
          <div className="de-section-label" style={{ marginTop: 10 }}>
            Optional fields
          </div>

          <SelectField
            label="AMR class"
            obligation="y"
            value={filters.amrClass}
            onChange={setF('amrClass')}
            options={options?.elementClasses ?? []}
            placeholder="All classes"
            loading={optionsLoading}
          />
          <SelectField
            label="AMR subclass"
            obligation="y"
            value={filters.amrSubclass}
            onChange={setF('amrSubclass')}
            options={options?.elementSubclasses ?? []}
            placeholder="All subclasses"
            loading={optionsLoading}
          />
        </div>

        <div className="de-sidebar-footer">
          <button
            className={`de-gen-btn${queryLoading ? ' de-gen-btn--loading' : ''}`}
            onClick={runQuery}
            disabled={queryLoading || optionsLoading}
          >
            {queryLoading ? (
              <>
                <span className="de-spinner" />
                Querying…
              </>
            ) : (
              'Generate →'
            )}
          </button>
          <button className="de-reset-btn" onClick={resetAll} disabled={queryLoading}>
            Reset all filters
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="de-main">
        {/* Top bar */}
        <div className="de-topbar">
          <div className="de-topbar-left">
            <div className="de-page-title" style={{ fontFamily: "'Syne', sans-serif" }}>DATA EXPLORER</div>
            {result !== null && (
              <div className="de-page-meta">
                {result.isolatesReturned} record
                {result.isolatesReturned !== 1 ? 's' : ''} returned
              </div>
            )}
          </div>
          <div className="de-export-row">
            <button
              className={`de-export-btn${exportingCsv ? ' de-export-btn--loading' : ''}`}
              disabled={!canExport || exportingCsv || exportingXlsx}
              onClick={handleExportCsv}
            >
              {exportingCsv ? (
                <span className="de-spinner de-spinner--sm" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h10M8 3v7M5 8l3 3 3-3" />
                </svg>
              )}
              Export CSV
            </button>
            <button
              className={`de-export-btn${exportingXlsx ? ' de-export-btn--loading' : ''}`}
              disabled={!canExport || exportingCsv || exportingXlsx}
              onClick={handleExportXlsx}
            >
              {exportingXlsx ? (
                <span className="de-spinner de-spinner--sm" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h10M8 3v7M5 8l3 3 3-3" />
                </svg>
              )}
              Export XLSX
            </button>
          </div>
        </div>

        {/* Export error */}
        {exportError && (
          <div className="de-query-error-bar">⚠ Export failed: {exportError}</div>
        )}

        {/* Query-level errors from backend */}
        {queryErrors.length > 0 && (
          <div className="de-query-error-bar">
            {queryErrors.map((e, i) => (
              <div key={i}>⚠ {e}</div>
            ))}
          </div>
        )}

        {/* Active filter tags */}
        {activeTags.length > 0 && (
          <div className="de-active-filters">
            <span className="de-af-label">Active filters:</span>
            {activeTags.map((t) => (
              <span key={t.label} className="de-filter-tag">
                <span className="de-filter-tag-key">{t.label}:</span> {t.value}
              </span>
            ))}
          </div>
        )}

        {/* Stat cards */}
        <div className="de-stats">
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--red">
              {result
                ? result.matchRate !== null
                  ? `${result.matchRate}%`
                  : 'N/A'
                : '—'}
            </div>
            <div className="de-stat-label">Match rate</div>
          </div>
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--teal">
              {result ? result.isolatesReturned : '—'}
            </div>
            <div className="de-stat-label">Isolates returned</div>
          </div>
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--amber">
              {result ? result.uniqueAmrGenes : '—'}
            </div>
            <div className="de-stat-label">Unique AMR genes</div>
          </div>
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--dark">
              {result ? result.organisms : '—'}
            </div>
            <div className="de-stat-label">Organisms</div>
          </div>
        </div>

        {/* Results area */}
        <div className="de-results">
          {/* Loading skeleton */}
          {queryLoading && (
            <div className="de-loading">
              <div className="de-loading-bar" />
              <div className="de-loading-bar de-loading-bar--wide" />
              <div className="de-loading-bar de-loading-bar--narrow" />
              <div className="de-loading-text">Running query…</div>
            </div>
          )}

          {/* Empty state: no query run yet */}
          {!hasQueried && !queryLoading && (
            <div className="de-empty de-empty--start">
              <div className="de-empty-top">
                <div className="de-empty-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <div className="de-empty-title">No query run yet</div>
                <div className="de-empty-sub">
                  Set your filters on the left and click Generate →
                  <br />
                  Or load the example below to get started immediately.
                </div>
              </div>
              <ExampleQueryCard onUseExample={loadExample} />
            </div>
          )}

          {/* Empty results */}
          {hasQueried && !queryLoading && result !== null && result.rows.length === 0 && (
            <div className="de-empty">
              <div className="de-empty-icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <div className="de-empty-title">No results match your filters</div>
              <div className="de-empty-sub">
                Try relaxing one or more of the active filters
              </div>
            </div>
          )}

          {/* Results table — dynamic columns from API response */}
          {hasQueried && !queryLoading && result !== null && result.rows.length > 0 && (
            <div className="de-table-wrap">
              <div className="de-table-header">
                <span className="de-table-count">
                  {result.isolatesReturned} isolate
                  {result.isolatesReturned !== 1 ? 's' : ''}
                </span>
                <span className="de-table-note">
                  {tableColumns.length} columns · CSV and XLSX export use identical data
                </span>
              </div>
              <div className="de-table-scroll">
                <table className="de-table">
                  <thead>
                    <tr>
                      {tableColumns.map((col) => (
                        <th key={col}>{col.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>
                        {tableColumns.map((col) => {
                          const val = row[col];
                          const str = val === null || val === undefined ? '' : String(val);
                          // Apply semantic cell classes based on column name
                          const isGene = col === 'amr_resistance_genes';
                          const isSir = col === 'predicted_sir_profile';
                          const isClass = col === 'element_class';
                          const isPrimary = col === 'sample_name';
                          const isMono = col === 'isolate_id' || col === 'accession_closest_sequence';
                          const isItalic = col === 'organism';
                          return (
                            <td
                              key={col}
                              className={
                                isPrimary
                                  ? 'de-td-primary'
                                  : isMono
                                    ? 'de-td-mono'
                                    : isItalic
                                      ? 'de-td-italic'
                                      : isGene
                                        ? 'de-td-genes'
                                        : isSir
                                          ? 'de-td-sir'
                                          : 'de-td-muted'
                              }
                            >
                              {isClass ? (
                                <span className="de-pill de-pill--blue">{str}</span>
                              ) : (
                                str
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}