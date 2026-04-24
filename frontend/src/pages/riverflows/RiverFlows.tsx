// src/pages/RiverFlows/RiverFlows.tsx
// Integrated with backend — fetches from GET /api/samples

import { useState, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { fetchAuthSession } from 'aws-amplify/auth';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './RiverFlows.css';

// Fix Leaflet default icon path broken by Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Types ─────────────────────────────────────────────────────────────────────

/** Shape returned by GET /api/samples after controller transforms */
export interface Sample {
  id:                   string;
  sampleName:           string;
  analysisType:         string | null;
  isolateId:            string | null;
  organism:             string | null;
  /** lab_sample_id from DB */
  sampleId:             string | null;
  isolationSource:      string;
  collectionDate:       string;
  geoLocName:           string;
  /** Parsed from geoLocName ("South Africa: Gauteng" → "Gauteng") */
  region:               string;
  latitude:             number;
  longitude:            number;
  collectedBy:          string | null;
  /** Split from amr_resistance_genes string */
  amrGenes:             string[];
  sequenceName:         string | null;
  elementType:          string | null;
  amrClass:             string | null;
  subclass:             string | null;
  pctCoverage:          number | null;
  pctIdentity:          number | null;
  alignmentLength:      number | null;
  refSeqLength:         number | null;
  accession:            string | null;
  /** Split from virulence_genes string */
  virulenceGenes:       string[];
  /** Split from plasmid_replicons string */
  plasmidReplicons:     string[];
  /** Split from predicted_sir_profile string */
  predictedSir:         string[];
  ph:                   number | null;
  tempWaterC:           number | null;
  tdsMgL:               number | null;
  dissolvedOxygenMgL:   number | null;
}

interface ApiResponse {
  status: 'success' | 'error';
  data:   { samples: Sample[]; count: number };
}

// ── Fetch hook ────────────────────────────────────────────────────────────────

function useSamples() {
  const [samples,  setSamples]  = useState<Sample[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchSamples = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get Cognito access token (same pattern as the rest of the app)
      let accessToken: string | undefined;
      try {
        const { tokens } = await fetchAuthSession();
        accessToken = tokens?.accessToken?.toString();
        console.log('[useSamples] fetchAuthSession tokens:', tokens);
        console.log('[useSamples] accessToken:', accessToken ? accessToken.slice(0, 30) + '...' : 'MISSING');
      } catch (sessionErr) {
        console.error('[useSamples] fetchAuthSession threw:', sessionErr);
        throw new Error(`Could not retrieve auth session: ${String(sessionErr)}`);
      }

      if (!accessToken) {
        throw new Error('No access token in session. Please sign out and sign in again.');
      }

      let res: Response;
      try {
        res = await fetch('/api/samples', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('[useSamples] fetch status:', res.status);
      } catch (networkErr) {
        throw new Error(`Network error — is the API server running? (${String(networkErr)})`);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '(no body)');
        throw new Error(`API returned ${res.status} ${res.statusText}: ${text}`);
      }

      const rawText = await res.text();
      console.log('[useSamples] raw response:', rawText.slice(0, 300));

      let json: ApiResponse;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(`API response was not valid JSON (status ${res.status}). Body: ${rawText.slice(0, 200)}`);
      }

      setSamples(json.data.samples);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSamples(); }, [fetchSamples]);

  return { samples, loading, error, refetch: fetchSamples };
}

// ── Derived lists for filter sidebar ─────────────────────────────────────────

function uniqueSorted(arr: string[]): string[] {
  return [...new Set(arr)].sort();
}

// ── Map fly-to helper ─────────────────────────────────────────────────────────

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], 10, { animate: true, duration: 1.2 });
  return null;
}

// ── Environmental parameter bar ────────────────────────────────────────────────

interface EnvBarProps {
  label: string;
  value: number | null;
  max:   number;
  unit:  string;
  color: string;
}

function EnvBar({ label, value, max, unit, color }: EnvBarProps) {
  if (value == null) return null;
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="sd-env-row">
      <div className="sd-env-label">{label}</div>
      <div className="sd-env-track">
        <div className="sd-env-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="sd-env-value">{value}{unit}</div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="sd-page">
      <aside className="sd-sidebar">
        <div style={{ padding: '24px 16px', color: '#5a7a94', fontSize: 13 }}>
          Loading samples…
        </div>
      </aside>
      <main className="sd-main">
        <div style={{ padding: 40, color: '#5a7a94', fontSize: 14 }}>
          Fetching sample data from server…
        </div>
      </main>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="sd-page">
      <aside className="sd-sidebar" />
      <main className="sd-main">
        <div style={{ padding: 40 }}>
          <div style={{ color: '#e04040', fontSize: 14, marginBottom: 12 }}>
            Failed to load samples: {message}
          </div>
          <button
            onClick={onRetry}
            style={{
              padding: '8px 16px', background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      </main>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: 40 }}>
      <div style={{ color: '#5a7a94', fontSize: 14, marginBottom: 8 }}>
        No samples found. Upload a dataset to get started.
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RiverFlows() {
  const { samples, loading, error, refetch } = useSamples();

  const [searchQuery,      setSearchQuery]      = useState('');
  const [activeRegion,     setActiveRegion]     = useState<string | null>(null);
  const [activeOrganism,   setActiveOrganism]   = useState<string | null>(null);
  const [selectedSample,   setSelectedSample]   = useState<Sample | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Derive unique filter options from live data
  const regions   = useMemo(() => uniqueSorted(samples.map(s => s.region).filter(Boolean)), [samples]);
  const organisms = useMemo(() => uniqueSorted(samples.map(s => s.organism ?? '').filter(Boolean)), [samples]);

  // Apply filters
  const filteredSamples = useMemo(() => {
    return samples.filter(s => {
      if (activeRegion   && s.region             !== activeRegion)   return false;
      if (activeOrganism && (s.organism ?? '')   !== activeOrganism) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.sampleName.toLowerCase().includes(q)           &&
          !(s.organism ?? '').toLowerCase().includes(q)     &&
          !s.isolationSource.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [samples, activeRegion, activeOrganism, searchQuery]);

  // Auto-select first sample when data loads or filters change
  useEffect(() => {
    if (filteredSamples.length === 0) {
      setSelectedSample(null);
      return;
    }
    setSelectedSample(prev => {
      if (prev && filteredSamples.some(s => s.id === prev.id)) return prev;
      return filteredSamples[0];
    });
  }, [filteredSamples]);

  const showSampleList = !!(activeRegion || activeOrganism || searchQuery.length > 0);

  // ── Early returns ────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;

  const s = selectedSample;

  return (
    <div className="sd-page">

      {/* ══ SIDEBAR ══ */}
      <aside className={`sd-sidebar${sidebarCollapsed ? ' sd-sidebar--collapsed' : ''}`}>

        {!sidebarCollapsed && (
          <>
            {/* Search */}
            <div className="sd-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7a8a" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="sd-search-inp"
                type="text"
                placeholder="Search Samples"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by location */}
            {regions.length > 0 && (
              <>
                <div className="sd-sb-section">Filter by location</div>
                <div className="sd-sb-divider" />
                {regions.map(r => (
                  <div
                    key={r}
                    className={`sd-sb-item${activeRegion === r ? ' sd-sb-item--active' : ''}`}
                    onClick={() => setActiveRegion(prev => prev === r ? null : r)}
                  >
                    {r}
                  </div>
                ))}
              </>
            )}

            {/* Filter by organism */}
            {organisms.length > 0 && (
              <>
                <div className="sd-sb-section" style={{ marginTop: 20 }}>Filter by organism</div>
                <div className="sd-sb-divider" />
                {organisms.map(o => (
                  <div
                    key={o}
                    className={`sd-sb-item${activeOrganism === o ? ' sd-sb-item--active' : ''}`}
                    onClick={() => setActiveOrganism(prev => prev === o ? null : o)}
                  >
                    {o}
                  </div>
                ))}
              </>
            )}

            {/* Filtered sample list */}
            {showSampleList && filteredSamples.length > 0 && (
              <>
                <div className="sd-sb-section" style={{ marginTop: 20 }}>
                  {filteredSamples.length} result{filteredSamples.length !== 1 ? 's' : ''}
                </div>
                <div className="sd-sb-divider" />
                {filteredSamples.map(sam => (
                  <div
                    key={sam.id}
                    className={`sd-sb-sample${s?.id === sam.id ? ' sd-sb-sample--active' : ''}`}
                    onClick={() => setSelectedSample(sam)}
                  >
                    <div className="sd-sb-sample-name">{sam.sampleId ?? sam.sampleName}</div>
                    <div className="sd-sb-sample-meta">
                      {(sam.organism ?? 'Unknown').split(' ')[0]} · {sam.isolationSource}
                    </div>
                  </div>
                ))}
              </>
            )}

            {showSampleList && filteredSamples.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: 11, color: '#5a7a8a' }}>
                No results for current filters.
              </div>
            )}

            {/* Total count */}
            {samples.length > 0 && (
              <div style={{ padding: '16px 16px 0', fontSize: 11, color: '#5a7a8a' }}>
                {samples.length} total sample{samples.length !== 1 ? 's' : ''} loaded
              </div>
            )}
          </>
        )}

        {/* Collapse toggle */}
        <button
          className="sd-collapse-btn"
          onClick={() => setSidebarCollapsed(p => !p)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path
              d={sidebarCollapsed ? 'M3 1l6 6-6 6' : 'M7 1L1 7l6 6'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="sd-main">

        {!s && <EmptyState />}

        {s && (
          <>
            {/* Header */}
            <div className="sd-header">
              <h1 className="sd-heading">{s.sampleName}</h1>
              <div className="sd-coords">
                <strong>{s.geoLocName}</strong>
                &nbsp;·&nbsp;{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
              </div>
            </div>

            {/* Two-column content */}
            <div className="sd-grid">

              {/* ── Left column ── */}
              <div className="sd-left">

                <div className="sd-top-row">

                  {/* Info card */}
                  <div className="sd-card sd-info-card">
                    {s.organism    && <div className="sd-info-row"><span className="sd-info-key">Organism:</span><span className="sd-info-val">{s.organism}</span></div>}
                    <div className="sd-info-row"><span className="sd-info-key">Isolation source:</span><span className="sd-info-val">{s.isolationSource}</span></div>
                    {s.collectedBy && <div className="sd-info-row"><span className="sd-info-key">Collected by:</span><span className="sd-info-val">{s.collectedBy}</span></div>}
                    <div className="sd-info-row"><span className="sd-info-key">Collection date:</span><span className="sd-info-val">{s.collectionDate}</span></div>
                    {s.analysisType && <div className="sd-info-row"><span className="sd-info-key">Analysis type:</span><span className="sd-info-val">{s.analysisType}</span></div>}
                    {s.amrClass    && <div className="sd-info-row"><span className="sd-info-key">AMR class:</span><span className="sd-info-val">{s.amrClass}</span></div>}
                    {s.accession   && <div className="sd-info-row"><span className="sd-info-key">Accession:</span><span className="sd-info-val sd-mono">{s.accession}</span></div>}
                    {s.isolateId   && <div className="sd-info-row"><span className="sd-info-key">Isolate ID:</span><span className="sd-info-val sd-mono">{s.isolateId}</span></div>}
                  </div>

                  {/* Stat tiles 2×2 */}
                  <div className="sd-tiles">
                    <div className="sd-tile sd-tile--teal">
                      <div className="sd-tile-val">{s.pctIdentity != null ? `${s.pctIdentity}%` : '—'}</div>
                      <div className="sd-tile-lbl">Identity</div>
                    </div>
                    <div className="sd-tile sd-tile--amber">
                      <div className="sd-tile-val">{s.pctCoverage != null ? `${s.pctCoverage}%` : '—'}</div>
                      <div className="sd-tile-lbl">Coverage</div>
                    </div>
                    <div className="sd-tile sd-tile--dark">
                      <div className="sd-tile-val">{s.alignmentLength ?? '—'}</div>
                      <div className="sd-tile-lbl">Alignment length</div>
                    </div>
                    <div className="sd-tile sd-tile--teal2">
                      <div className="sd-tile-val">{s.refSeqLength ?? '—'}</div>
                      <div className="sd-tile-lbl">Ref. seq. length</div>
                    </div>
                  </div>
                </div>

                {/* Environmental parameters */}
                {(s.ph != null || s.tempWaterC != null || s.tdsMgL != null || s.dissolvedOxygenMgL != null) && (
                  <div className="sd-card">
                    <div className="sd-card-title">Environmental parameters</div>
                    <EnvBar label="pH"             value={s.ph}                 max={14}   unit=""   color="#1D9E75" />
                    <EnvBar label="Temp. of water" value={s.tempWaterC}         max={40}   unit="°C" color="#f0a500" />
                    <EnvBar label="TDS (mg/L)"     value={s.tdsMgL}             max={1500} unit=""   color="#d45050" />
                    <EnvBar label="Dissolved O₂"   value={s.dissolvedOxygenMgL} max={15}   unit=""   color="#1D9E75" />
                  </div>
                )}
              </div>

              {/* ── Right column ── */}
              <div className="sd-right">

                {/* Leaflet map — only mount when coordinates are finite numbers */}
                <div className="sd-card sd-map-card">
                  <div className="sd-card-title">River map view</div>
                  <div className="sd-map-container">
                    {Number.isFinite(s.latitude) && Number.isFinite(s.longitude) ? (
                      <MapContainer
                        key={`${s.id}-map`}
                        center={[s.latitude, s.longitude]}
                        zoom={10}
                        zoomControl
                        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FlyTo lat={s.latitude} lng={s.longitude} />
                        <Marker position={[s.latitude, s.longitude]}>
                          <Popup>
                            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                              <strong>{s.sampleId ?? s.sampleName}</strong><br />
                              {s.geoLocName}<br />
                              {s.organism && <><em>{s.organism}</em><br /></>}
                              {s.isolationSource}<br />
                              {s.collectionDate}
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', color: '#5a7a8a', fontSize: 13 }}>
                        No coordinates available for this sample.
                      </div>
                    )}
                  </div>
                  <div className="sd-map-meta">
                    {Number.isFinite(s.latitude) && Number.isFinite(s.longitude)
                      ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)} · ${s.geoLocName}`
                      : s.geoLocName}
                  </div>
                </div>

                {/* AMR genes + SIR + virulence + plasmids */}
                <div className="sd-card">
                  {s.amrGenes.length > 0 && (
                    <>
                      <div className="sd-card-title">AMR resistance genes</div>
                      <div className="sd-pills">
                        {s.amrGenes.map(g => <span key={g} className="sd-pill">{g}</span>)}
                      </div>
                    </>
                  )}

                  {s.predictedSir.length > 0 && (
                    <>
                      <div className="sd-card-title" style={{ marginTop: s.amrGenes.length > 0 ? 14 : 0 }}>
                        Predicted SIR profiles
                      </div>
                      <div className="sd-pills">
                        {s.predictedSir.map(p => <span key={p} className="sd-pill">{p}</span>)}
                      </div>
                    </>
                  )}

                  {s.virulenceGenes.length > 0 && (
                    <>
                      <div className="sd-card-title" style={{ marginTop: 14 }}>Virulence genes</div>
                      <div className="sd-pills">
                        {s.virulenceGenes.map(v => <span key={v} className="sd-pill">{v}</span>)}
                      </div>
                    </>
                  )}

                  {s.plasmidReplicons.length > 0 && (
                    <>
                      <div className="sd-card-title" style={{ marginTop: 14 }}>Plasmid replicons</div>
                      <div className="sd-pills">
                        {s.plasmidReplicons.map(p => <span key={p} className="sd-pill">{p}</span>)}
                      </div>
                    </>
                  )}

                  {[s.amrGenes, s.predictedSir, s.virulenceGenes, s.plasmidReplicons].every(a => a.length === 0) && (
                    <div style={{ color: '#5a7a8a', fontSize: 12 }}>
                      No genomic data available for this sample.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}