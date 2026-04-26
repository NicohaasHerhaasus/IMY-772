
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './DataExplorer.css';

// ── API config ────────────────────────────────────────────────────────────────

const API_BASE = '/api/query-builder';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.accessToken?.toString();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Backend types (mirrors QueryBuilderFilters) ───────────────────────────────

interface QueryBuilderFilters {
  geo_loc_name: string;
  collection_date_start: string;
  collection_date_end: string;
  collected_by?: string;
  amr_resistance_gene?: string;
  predicted_sir_profile?: string;
  organism?: string;
  isolation_source?: string;
  element_class?: string;
  element_subclass?: string;
}

interface DropdownOptions {
  geoLocations: string[];
  collectors: string[];
  amrGenes: string[];
  sirProfiles: string[];
  organisms: string[];
  isolationSources: string[];
  elementClasses: string[];
  elementSubclasses: string[];
}

interface QueryResult {
  matchRate: number | null;
  isolatesReturned: number;
  uniqueAmrGenes: number;
  organisms: number;
  rows: Record<string, unknown>[];
}

// ── Frontend filter state ─────────────────────────────────────────────────────

interface Filters {
  geo: string;
  dateFrom: string;
  dateTo: string;
  collectedBy: string;
  amrGene: string;
  sir: string;
  organism: string;
  source: string;
  amrClass: string;
  amrSubclass: string;
}

const EMPTY_FILTERS: Filters = {
  geo: '',
  dateFrom: '',
  dateTo: '',
  collectedBy: '',
  amrGene: '',
  sir: '',
  organism: '',
  source: '',
  amrClass: '',
  amrSubclass: '',
};

function isAllFilter(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'all';
}

function openDatePicker(input: HTMLInputElement): void {
  const pickerCapable = input as HTMLInputElement & { showPicker?: () => void };
  try {
    pickerCapable.showPicker?.();
  } catch {
    // Some browsers require strict user-gesture contexts; native picker still works.
  }
}

// Map frontend Filters → backend QueryBuilderFilters
function toApiFilters(f: Filters): QueryBuilderFilters {
  return {
    geo_loc_name: isAllFilter(f.geo) ? '' : f.geo,
    collection_date_start: f.dateFrom,
    collection_date_end: f.dateTo,
    collected_by: f.collectedBy || undefined,
    amr_resistance_gene: f.amrGene || undefined,
    predicted_sir_profile: f.sir || undefined,
    organism: isAllFilter(f.organism) ? undefined : f.organism,
    isolation_source: isAllFilter(f.source) ? undefined : f.source,
    element_class: f.amrClass || undefined,
    element_subclass: f.amrSubclass || undefined,
  };
}

// ── Download helper ───────────────────────────────────────────────────────────

async function triggerDownload(
  endpoint: '/export/csv' | '/export/xlsx',
  filters: Filters,
  filename: string,
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(toApiFilters(filters)),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  obligation: 'm' | 'b' | 'y';
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

function SelectField({
  label,
  obligation,
  value,
  onChange,
  options,
  placeholder = 'All',
  loading = false,
  disabled = false,
}: SelectFieldProps) {
  const dotClass =
    obligation === 'm'
      ? 'de-dot de-dot--green'
      : obligation === 'b'
        ? 'de-dot de-dot--blue'
        : 'de-dot de-dot--amber';
  const lblClass =
    obligation === 'm'
      ? 'de-flabel de-flabel--green'
      : obligation === 'b'
        ? 'de-flabel de-flabel--blue'
        : 'de-flabel de-flabel--amber';
  const borderClass =
    obligation === 'm'
      ? ' de-select--teal'
      : obligation === 'b'
        ? ' de-select--blue'
        : '';

  return (
    <div className="de-field">
      <div className={lblClass}>
        <span className={dotClass} />
        {label}
      </div>
      <select
        className={`de-select${borderClass}${loading ? ' de-select--loading' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

interface ValidationErrors {
  date?: string;
}

function validate(f: Filters): ValidationErrors {
  const errs: ValidationErrors = {};
  if (!f.dateFrom || !f.dateTo) {
    errs.date = 'Both start and end dates are required.';
  } else if (f.dateFrom > f.dateTo) {
    errs.date = 'Start date must be on or before end date.';
  }
  return errs;
}

// ── Example query card (used in empty state) ────────────────────────────────

function ExampleQueryCard() {
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
                onClick={(e) => openDatePicker(e.currentTarget)}
              />
              <input
                className="de-date-inp"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setF('dateTo')(e.target.value)}
                onClick={(e) => openDatePicker(e.currentTarget)}
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
              <ExampleQueryCard />
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