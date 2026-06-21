import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  CircleMarker,
  Popup,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
// import SiteVisitTimeline from "../../components/SiteVisitTimeline/SiteVisitTimeline";
// import { useSiteVisits } from '../../lib/useSiteVisits';
import "./MapView.css";
// river context removed — map focuses on isolate samples
import { useAuth } from "../../context/AuthContext";
import {
  downloadMapAttachment,
  fetchMapAttachmentMarkers,
  fetchMapAttachmentsForLocation,
  type MapAttachmentListItem,
  type MapAttachmentMarker,
} from "../../lib/mapAttachmentsApi";
import { useIsolates } from '../../context/IsolatesContext';
import { useSamples } from '../../lib/useSamples';
import { MapBaseLayers } from "../../lib/MapBaseLayers";


// rivers data removed

const STATS: Record<number, {
  samplingSites: number;
  sitesAtRisk: number;
  organismsDetected: number;
  lastUpdated: string;
  siteVisits: string;
}> = {
  1: { samplingSites: 14, sitesAtRisk: 6,  organismsDetected: 28, lastUpdated: "Nov 2",  siteVisits: "6 of 7 Site Visits" },
  2: { samplingSites: 8,  sitesAtRisk: 3,  organismsDetected: 17, lastUpdated: "Oct 28", siteVisits: "5 of 7 Site Visits" },
  3: { samplingSites: 10, sitesAtRisk: 4,  organismsDetected: 22, lastUpdated: "Nov 5",  siteVisits: "7 of 7 Site Visits" },
  4: { samplingSites: 6,  sitesAtRisk: 2,  organismsDetected: 12, lastUpdated: "Nov 10", siteVisits: "4 of 7 Site Visits" },
};

// FlyToRiver removed

const pinDropIcon = L.divIcon({
  className: "mv-pin-drop",
  html: '<span class="mv-pin-drop__dot" aria-hidden="true"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

function getRiskLevel(sample: any): 'high'|'medium'|'low'|'none' {
  // normalize fields that might be named differently in the API
  const genesRaw = sample?.amrResistanceGenes ?? sample?.amrGenes ?? [];
  const predicted = (sample?.predictedSirProfile ?? sample?.predictedSir ?? '') as string | string[];

  // normalize genes to an array of lowercase strings
  const genes = Array.isArray(genesRaw)
    ? (genesRaw as any[]).map((g) => String(g).toLowerCase())
    : String(genesRaw || '').trim()
        ? String(genesRaw).split(/[,;\s]+/).map((s) => s.toLowerCase()).filter(Boolean)
        : [];

  // priority gene check (example list)
  const priority = ['mcr-1', 'blandm', 'blakpc', 'vana'].map((p) => p.toLowerCase());
  if (genes.length > 0 && genes.some((g) => priority.some((p) => g.includes(p)))) return 'high';

  const geneCount = genes.length;
  if (geneCount >= 3) return 'high';
  if (geneCount >= 1) return 'medium';

  if (Array.isArray(predicted) ? predicted.includes('R') : String(predicted).toLowerCase().includes('resist')) {
    return 'high';
  }

  return 'low';
}

const riskColor: Record<string,string> = {
  high: '#d62728',
  medium: '#ff7f0e',
  low: '#2ca02c',
  none: '#6c757d',
};

function getColorForSample(sample:any){
  const level = getRiskLevel(sample);
  return riskColor[level] ?? riskColor.none;
}

function formatCoord(n: number) {
  return n.toFixed(5);
}

function MapPinController({
  pinPosition,
  onPinChange,
  onOpenModal,
}: {
  pinPosition: [number, number] | null;
  onPinChange: (pos: [number, number]) => void;
  onOpenModal: () => void;
}) {
  useMapEvents({
    click(e) {
      onPinChange([e.latlng.lat, e.latlng.lng]);
      onOpenModal();
    },
  });

  if (!pinPosition) return null;

  return (
    <Marker
      position={pinPosition}
      icon={pinDropIcon}
      draggable
      eventHandlers={{
        dragend: (ev) => {
          const ll = ev.target.getLatLng();
          onPinChange([ll.lat, ll.lng]);
        },
      }}
    />
  );
}

function useCountUp(target: number, duration: number = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 1;
    const increment = target / (duration / 16); // ~60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      setValue(Math.floor(start));
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
}


export default function MapView() {
  const { user, login } = useAuth();
  const stats = STATS[1];
  const [isolateSearch, setIsolateSearch] = useState("");
  const [selectedSeqType, setSelectedSeqType] = useState<string>("All");
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<MapAttachmentMarker[]>([]);
  const [markersLoadError, setMarkersLoadError] = useState<string | null>(null);
  const [locationFiles, setLocationFiles] = useState<MapAttachmentListItem[]>([]);
  const [locationFilesLoading, setLocationFilesLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(true);
  const animatedSamplingSites = useCountUp(stats.samplingSites);
  const animatedSitesAtRisk = useCountUp(stats.sitesAtRisk);
  const animatedOrganisms = useCountUp(stats.organismsDetected);
  // isolate list search + sequence type filter
  const { isolates } = useIsolates();
  
  const seqTypes = ["All", ...Array.from(new Set(isolates.map(i => i.sequenceType ?? 'Unknown'))).sort()];
  const filteredIsolates = isolates.filter((iso) => {
    const matchesSeq = selectedSeqType === 'All' || (iso.sequenceType ?? 'Unknown') === selectedSeqType;
    const q = isolateSearch.trim().toLowerCase();
    const matchesSearch = !q || iso.isolateName.toLowerCase().includes(q);
    return matchesSeq && matchesSearch;
  });

  // samples (to resolve isolate -> sample coords)
  const { samples } = useSamples();

  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [selectedIsolate, setSelectedIsolate] = useState<typeof isolates[number] | null>(null);
  // const { visits: siteVisits, loading: visitsLoading } = useSiteVisits(selectedIsolate?.isolateName ?? null);

  function FlyToCoords({ coords }: { coords: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
      if (!coords) return;
      // eslint-disable-next-line no-console
      console.debug('[MapView] FlyToCoords running, coords:', coords);
      // log current center
      // eslint-disable-next-line no-console
      console.debug('[MapView] before flyTo center:', map.getCenter());
      map.flyTo(coords, 12, { animate: true, duration: 1.0 });
      // eslint-disable-next-line no-console
      console.debug('[MapView] after flyTo requested');
    }, [coords, map]);
    return null;
  }

  function MapReadySetter({ onReady }: { onReady: (m: L.Map) => void }) {
    const map = useMap();
    useEffect(() => {
      if (map) onReady(map);
    }, [map, onReady]);
    return null;
  }

  const isolatesWithCoords = useMemo(() => {
    // Be permissive about types: isolateId may be number or string, lat/lng may be strings.
    return filteredIsolates
      .map((iso) => {
        const sample = samples.find((s) => {
          if (s == null) return false;
          const sid = s.isolateId == null ? '' : String(s.isolateId);
          const isoName = (iso as any).isolateName ?? (iso.id == null ? '' : String(iso.id));
          const iid = isoName == null ? '' : String(isoName);
          // samples.store isolate identifiers as filenames like "UPMP-1126_assembly.fasta";
          // match when the sample isolateId contains the isolateName, or equals it.
          return sid !== '' && iid !== '' && (sid === iid || sid.includes(iid));
        });
        if (!sample) return null;
        const lat = Number((sample as any).latitude);
        const lng = Number((sample as any).longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { iso, lat, lng, sample };
      })
      .filter(Boolean) as Array<{ iso: (typeof isolates)[number]; lat: number; lng: number; sample: any }>;
  }, [filteredIsolates, samples]);

  // Debug logs to help runtime inspection when markers don't appear
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[MapView] samples count:', samples.length, 'isolates count:', isolates.length);
    if (samples.length > 0) {
      // eslint-disable-next-line no-console
      console.debug('[MapView] sample[0]:', samples[0]);
    }
  }, [samples, isolates.length]);

  const updatePinPosition = useCallback((pos: [number, number]) => {
    setPinPosition(pos);
  }, []);

  const pinCoordsLabel = useMemo(() => {
    if (!pinPosition) return null;
    return `${formatCoord(pinPosition[0])}, ${formatCoord(pinPosition[1])}`;
  }, [pinPosition]);

  useEffect(() => {
    if (!pinModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinModalOpen]);

  useEffect(() => {
    if (!pinModalOpen) {
      setModalError(null);
    }
  }, [pinModalOpen]);

  const refreshMarkers = useCallback(async () => {
    if (!user) {
      setMapMarkers([]);
      return;
    }
    try {
      const markers = await fetchMapAttachmentMarkers();
      setMapMarkers(markers);
      setMarkersLoadError(null);
    } catch (e) {
      setMarkersLoadError(e instanceof Error ? e.message : "Failed to load attachments");
      setMapMarkers([]);
    }
  }, [user]);

  useEffect(() => {
    void refreshMarkers();
  }, [refreshMarkers]);

  useEffect(() => {
    if (!pinModalOpen || !pinPosition || !user) {
      setLocationFiles([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLocationFilesLoading(true);
      try {
        const list = await fetchMapAttachmentsForLocation(pinPosition[0], pinPosition[1]);
        if (!cancelled) setLocationFiles(list);
      } catch {
        if (!cancelled) setLocationFiles([]);
      } finally {
        if (!cancelled) setLocationFilesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pinModalOpen, pinPosition, user]);

  const handleDownload = useCallback(
    async (id: string) => {
      try {
        await downloadMapAttachment(id);
      } catch (e) {
        setModalError(e instanceof Error ? e.message : "Download failed.");
      }
    },
    [],
  );

  const openAttachmentLocation = useCallback(
    (lat: number, lng: number) => {
      updatePinPosition([lat, lng]);
      setPinModalOpen(true);
    },
    [updatePinPosition],
  );

  // Overview metrics
  const totalSamples = samples.length;
  const totalIsolates = isolates.length;
  const geoLocatedSamples = useMemo(() => {
    return samples.filter((s) => {
      const lat = Number((s as any).latitude);
      const lng = Number((s as any).longitude);
      return Number.isFinite(lat) && Number.isFinite(lng);
    }).length;
  }, [samples]);

  const filesAttached = mapMarkers.length;

  const animatedTotalSamples = useCountUp(totalSamples);
  const animatedTotalIsolates = useCountUp(totalIsolates);
  const animatedGeoLocated = useCountUp(geoLocatedSamples);
  const animatedFilesAttached = useCountUp(filesAttached);

  return (
    <div className="mapview-page">

      <aside className="mv-sidebar">

        {/* Search */}
        {/* <div className="mv-search-wrap">
  <div className="mv-search">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>

    <input
      type="text"
      placeholder="Search by Province..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="mv-search-input"
    />
  </div>
</div> */}

<div className="mv-search-wrap">
  <div className="mv-search">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>

    <input
      type="text"
      placeholder="Search isolates..."
      value={isolateSearch}
      onChange={(e) => setIsolateSearch(e.target.value)}
      className="mv-search-input"
    />
  </div>
</div>

{/* <div className="mv-section-header">Filter by Sequence Type</div>
<div className="mv-river-list">
  {seqTypes.map((t) => (
    <div
      key={t}
      className={`mv-river-item ${selectedSeqType === t ? 'active' : ''}`}
      onClick={() => setSelectedSeqType(t)}
    >
      <div className="mv-river-name">{t}</div>
    </div>
  ))}
</div> */}

        <div className="mv-section-header">Isolates</div>
        <div className="mv-river-list">
          {/* {RIVERS.map((r) => (
            <div
              key={r.id}
              className={`mv-river-item ${activeRiver === r.id ? "active" : ""}`}
              onClick={() => setActiveRiver(r.id)}
            >
              <div className="mv-river-name">{r.name}</div>
              <div className="mv-river-meta">{r.sites} sites · {r.location}</div>
            </div>
          ))} */}
          {isolatesWithCoords && isolatesWithCoords.length > 0 ? (
            isolatesWithCoords.map(({ iso, lat, lng, sample }) => {
              const onClick = () => {
                // eslint-disable-next-line no-console
                console.debug('[MapView] isolate clicked (with coords):', iso.id ?? iso.isolateName, { lat, lng });
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  // eslint-disable-next-line no-console
                  console.debug('[MapView] setting focusCoords to', [lat, lng]);
                  setFocusCoords([lat, lng]);
                  if (mapInstance) {
                    try {
                      mapInstance.flyTo([lat, lng], 12, { animate: true, duration: 1.0 });
                    } catch (e) {
                      // eslint-disable-next-line no-console
                      console.debug('[MapView] mapInstance.flyTo failed', e);
                    }
                  }
                }
                // select isolate to load visits
                setSelectedIsolate(iso as any);
              };

              return (
                <div key={iso.id} className={`mv-river-item`} onClick={onClick} title={iso.isolateName}>
                  <div className="mv-river-name">
                    {iso.isolateName}
                    {sample ? (
                      <span className="mv-sample-name" style={{ fontSize: '12px', color: '#9aa', marginLeft: 8 }}>
                        — {sample.sampleName}
                      </span>
                    ) : null}
                  </div>
                  <div className="mv-river-meta">{iso.sequenceType ?? '—'}</div>
                </div>
              );
            })
          ) : (
            <div className="mv-river-item">No isolates with geo-located samples</div>
          )}
        </div>

      </aside>

      {/* ── MAP AREA ── */}
      <main className="mv-map-area">
        <div className="mv-map-stack">
        <div className="mv-map-wrap">
        <MapContainer
          center={([-29.0, 24.0] as [number, number])}
          zoom={6}
          className="mv-map"
        >
          <MapReadySetter onReady={(m) => setMapInstance(m)} />
          <MapBaseLayers />

          <MapPinController
            pinPosition={pinPosition}
            onPinChange={updatePinPosition}
            onOpenModal={() => setPinModalOpen(true)}
          />

          <FlyToCoords coords={focusCoords} />

          {/* Rivers and example risk markers removed per latest requirements */}

          {isolatesWithCoords.map(({ iso, lat, lng, sample }) => {
            const color = getColorForSample(sample);
            const level = getRiskLevel(sample);
            const radius = level === 'high' ? 9 : level === 'medium' ? 7 : 6;
            return (
              <CircleMarker
                key={`iso-${iso.id}`}
                center={[lat, lng]}
                radius={radius}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
              >
              <Popup>
                <div style={{ maxWidth: 220 }}>
                  <strong>{iso.isolateName}</strong>
                  <div style={{ fontSize: 12, color: '#666' }}>{iso.sequenceType ?? '—'}</div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>{sample.sampleName}</div>
                </div>
              </Popup>
            </CircleMarker>
          )})

        }
        {mapMarkers.map((m) => (
          <CircleMarker
            key={m.id}
            center={[m.latitude, m.longitude]}
            radius={9}
            pathOptions={{
              color: "#1a7f72",
              fillColor: "#2a9d8f",
              fillOpacity: 0.92,
              weight: 2,
              bubblingMouseEvents: false,
            }}
            eventHandlers={{
              click: () => {
                openAttachmentLocation(m.latitude, m.longitude);
              },
            }}
          />
        ))}

        


</MapContainer>

        <div className={`mv-legend ${legendOpen ? "mv-legend--open" : "mv-legend--collapsed"}`}>
          <button
            type="button"
            className="mv-legend-toggle"
            onClick={() => setLegendOpen((open) => !open)}
            aria-expanded={legendOpen}
            aria-controls="mv-legend-body"
          >
            <span className="mv-legend-toggle__label">Map legend</span>
            <svg
              className="mv-legend-toggle__chevron"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {legendOpen && (
            <div id="mv-legend-body" className="mv-legend-body">
              <div className="mv-legend-title">Health Status</div>
              <div className="mv-legend-item"><span className="mv-dot" style={{ background: riskColor.low }} />Low AMR Risk</div>
              <div className="mv-legend-item"><span className="mv-dot" style={{ background: riskColor.medium }} />Medium AMR Risk</div>
              <div className="mv-legend-item"><span className="mv-dot" style={{ background: riskColor.high }} />High AMR Risk</div>
              <div className="mv-legend-item"><span className="mv-dot" style={{ background: riskColor.none }} />No data</div>
              <div className="mv-legend-divider" />
              <div className="mv-legend-title">Location data</div>
              <div className="mv-legend-item"><span className="mv-dot mv-dot--attach"/>File uploaded</div>
            </div>
          )}
        </div>
        </div>
        <p className="mv-map-hint" role="note">
          <strong>Click the map</strong> to drop a pin and open location files. Drag the pin to adjust.{" "}
          <span className="mv-map-hint__teal">Teal dots</span> mark uploaded files - click one to view downloads.
          {pinCoordsLabel && (
            <span className="mv-map-hint__coords" aria-live="polite">
              {" "}
              Current pin: {pinCoordsLabel}.
            </span>
          )}
        </p>
        {/* Site visit timeline (for selected isolate) */}
        {selectedIsolate && (
          <div style={{ marginTop: 12 }}>
            <h3 style={{ margin: '6px 0 8px 0' }}>Site visits — {selectedIsolate.isolateName}</h3>
            {/* {visitsLoading ? <div>Loading visits…</div> : <SiteVisitTimeline visits={siteVisits} />} */}
          </div>
        )}
        </div>

        {markersLoadError && user && (
          <div className="mv-attach-toast" role="status">
            Could not load file markers: {markersLoadError}
          </div>
        )}

        {/* Sidebar collapse button */}
        <button className="mv-collapse-btn" aria-label="Collapse sidebar">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {pinModalOpen && (
          <div
            className="mv-pin-modal-backdrop"
            role="presentation"
            onClick={() => setPinModalOpen(false)}
          >
            <div
              className="mv-pin-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mv-pin-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="mv-pin-modal__close"
                aria-label="Close"
                onClick={() => setPinModalOpen(false)}
              >
                ×
              </button>
              <h2 id="mv-pin-modal-title" className="mv-pin-modal__title">
                Location data
              </h2>
              {pinPosition && (
                <p className="mv-pin-modal__coords">
                  Coordinates: {formatCoord(pinPosition[0])}°, {formatCoord(pinPosition[1])}°
                </p>
              )}

              {!user && (
                <div className="mv-pin-modal__signin">
                  <p className="mv-pin-modal__hint">Sign in to view files attached to this pin and to download them.</p>
                  <button type="button" className="mv-pin-modal__signin-btn" onClick={login}>
                    Sign in
                  </button>
                </div>
              )}

              {user && (
                <>
                  <div className="mv-pin-modal__section-label">Files at this location</div>
                  {locationFilesLoading ? (
                    <p className="mv-pin-modal__hint">Loading…</p>
                  ) : locationFiles.length === 0 ? (
                    <>
                      <p className="mv-pin-modal__hint">No files uploaded for this location yet.</p>
                      {user && (
                        <p className="mv-pin-modal__admin-hint">
                          To attach files, use{" "}
                          <Link to="/admin/map-upload" className="mv-pin-modal__admin-link">
                            Admin → Map location files
                          </Link>
                          .
                        </p>
                      )}
                    </>
                  ) : (
                    <ul className="mv-pin-modal__file-list">
                      {locationFiles.map((f) => (
                        <li key={f.id} className="mv-pin-modal__file-row">
                          <span className="mv-pin-modal__file-name" title={f.originalFilename}>
                            {f.displayName}
                          </span>
                          <button
                            type="button"
                            className="mv-pin-modal__download-btn"
                            onClick={() => void handleDownload(f.id)}
                          >
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {modalError && <p className="mv-pin-modal__error">{modalError}</p>}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT OVERVIEW PANEL ── */}
      <aside className="mv-overview">
        <div className="mv-overview-title">Overview</div>

        <div className="mv-stat-card">
          <div className="mv-stat-label">Total Samples</div>
          <div className={`mv-stat-value mv-stat-value--green`}>{animatedTotalSamples}</div>
          <div className="mv-stat-sub">Total uploaded samples</div>
        </div>

        <div className="mv-stat-card">
          <div className="mv-stat-label">Total Isolates</div>
          <div className="mv-stat-value mv-stat-value--orange">{animatedTotalIsolates}</div>
          <div className="mv-stat-sub">Distinct isolates in dataset</div>
        </div>

        <div className="mv-stat-card">
          <div className="mv-stat-label">Geo-located Samples</div>
          <div className="mv-stat-value mv-stat-value--amber">{animatedGeoLocated}</div>
          <div className="mv-stat-sub">Samples with valid coordinates</div>
        </div>

        <div className="mv-stat-card">
          <div className="mv-stat-label">Files Attached</div>
          <div className="mv-stat-value--date">{animatedFilesAttached}</div>
          <div className="mv-stat-sub">Map attachment files</div>
        </div>
      </aside>

    </div>
  );
}