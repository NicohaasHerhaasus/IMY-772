import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "./MapView.css";
import { useRiver } from "../../layouts/RiverContext";
import { useAuth } from "../../context/AuthContext";
import {
  downloadMapAttachment,
  fetchMapAttachmentMarkers,
  fetchMapAttachmentsForLocation,
  type MapAttachmentListItem,
  type MapAttachmentMarker,
} from "../../lib/mapAttachmentsApi";


interface River {
  id: number;
  name: string;
  sites: number;
  location: string;
  province: string;
  coordinates: [number,number];
  risk: "low" | "medium" | "high";
}


const RIVERS: River[] = [
  { id: 1, name: "Apies River",    sites: 14, location: "Pretoria", province:"Gauteng", coordinates:[-25.75,28.23],risk:"high" },
  { id: 2, name: "Henops River",   sites: 8,  location: "Centurion" , province:"Gauteng", coordinates: [-25.85, 28.18] , risk: "medium"},
  { id: 3, name: "Limpopo River",  sites: 10, location: "Limpopo" ,province:"Limpopo" ,coordinates: [-22.0, 29.0] , risk: "low"},
  { id: 4, name: "Lotus River",  sites: 6, location: "Cape Town" ,province:"Western Cape" ,coordinates: [-34.05, 18.51] , risk: "high"},

];

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

function FlyToRiver({ coordinates }: { coordinates: [number, number] }) {
  const map = useMap();

  map.flyTo(coordinates, 10, {
    duration: 1.5,
  });

  return null;
}

const pinDropIcon = L.divIcon({
  className: "mv-pin-drop",
  html: '<span class="mv-pin-drop__dot" aria-hidden="true"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

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
  const { activeRiverId: activeRiver, setActiveRiverId: setActiveRiver } = useRiver();
  const stats = STATS[activeRiver];
  const [selectedProvince, setSelectedProvince] = useState<string>("All");
  const [riverSearch, setRiverSearch] = useState("");
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [mapMarkers, setMapMarkers] = useState<MapAttachmentMarker[]>([]);
  const [markersLoadError, setMarkersLoadError] = useState<string | null>(null);
  const [locationFiles, setLocationFiles] = useState<MapAttachmentListItem[]>([]);
  const [locationFilesLoading, setLocationFilesLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const animatedSamplingSites = useCountUp(stats.samplingSites);
  const animatedSitesAtRisk = useCountUp(stats.sitesAtRisk);
  const animatedOrganisms = useCountUp(stats.organismsDetected);
  const provinces = ["All", ...Array.from(new Set(RIVERS.map(r => r.province)))];
  const filteredRivers = RIVERS.filter((river) => {
  const matchesProvince =
    selectedProvince === "All" || river.province === selectedProvince;

  const matchesSearch =
    river.name.toLowerCase().includes(riverSearch.toLowerCase());

  return matchesProvince && matchesSearch;
});

useEffect(() => {
  if (filteredRivers.length > 0) {
    setActiveRiver(filteredRivers[0].id);
  }
}, [selectedProvince, riverSearch]);

  const updatePinPosition = useCallback((pos: [number, number]) => {
    setPinPosition(pos);
    setManualLat(formatCoord(pos[0]));
    setManualLng(formatCoord(pos[1]));
  }, []);

  const applyManualCoords = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      updatePinPosition([lat, lng]);
      setPinModalOpen(true);
    }
  }, [manualLat, manualLng, updatePinPosition]);

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
      placeholder="Search by River..."
      value={riverSearch}
      onChange={(e) => setRiverSearch(e.target.value)}
      className="mv-search-input"
    />
  </div>
</div>

<div className="mv-section-header">Filter by Province</div>
<div className="mv-river-list">
  {provinces.map((province) => (
    <div
      key={province}
      className={`mv-river-item ${selectedProvince === province ? "active" : ""}`}
      onClick={() => setSelectedProvince(province)}
    >
      <div className="mv-river-name">{province}</div>
    </div>
  ))}
</div>

        {/* Filter by River */}
        <div className="mv-section-header">Filter by River</div>
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
          {filteredRivers.map((r) => (
  <div
    key={r.id}
    className={`mv-river-item ${activeRiver === r.id ? "active" : ""}`}
    onClick={() => setActiveRiver(r.id)}
  >
    <div className="mv-river-name">{r.name}</div>
    <div className="mv-river-meta">
      {r.sites} sites · {r.location} ({r.province})
    </div>
  </div>
))}
        </div>

      </aside>

      {/* ── MAP AREA ── */}
      <main className="mv-map-area">
        <div className="mv-pin-toolbar" role="region" aria-label="Pin location">
          <span className="mv-pin-toolbar__label">Set pin by lat / lng</span>
          <input
            type="text"
            inputMode="decimal"
            className="mv-pin-toolbar__input"
            placeholder="Latitude"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            aria-label="Latitude"
          />
          <input
            type="text"
            inputMode="decimal"
            className="mv-pin-toolbar__input"
            placeholder="Longitude"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            aria-label="Longitude"
          />
          <button type="button" className="mv-pin-toolbar__btn" onClick={applyManualCoords}>
            Place pin
          </button>
          <span className="mv-pin-toolbar__hint">
            Or left-click the map; drag the pin to adjust.
          </span>
        </div>

        {pinCoordsLabel && (
          <div className="mv-pin-coords-chip" aria-live="polite">
            Pin: {pinCoordsLabel}
          </div>
        )}

        <MapContainer
        
          center={[-29.0, 24.0] as [number, number]}
          zoom={6}
          className="mv-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapPinController
            pinPosition={pinPosition}
            onPinChange={updatePinPosition}
            onOpenModal={() => setPinModalOpen(true)}
          />

          <FlyToRiver coordinates={RIVERS.find(r => r.id === activeRiver)!.coordinates}/>


          {/* Example: River risk points */}
          <CircleMarker
            center={[-25.75, 28.23]} 
            radius={10}
            pathOptions={{ color: "red" }}
          >
            <Popup>Apies River – High AMR Risk</Popup>
          </CircleMarker>

          <CircleMarker
            center={[-25.85, 28.18]} // Henops
            radius={8}
            pathOptions={{ color: "orange" }}
          >
            <Popup>Henops River – Medium Risk</Popup>
          </CircleMarker>


        {/* {RIVERS.map((river) => (
          <CircleMarker
            key={river.id}
            center={river.coordinates}
            radius={activeRiver === river.id ? 12 : 8}
            pathOptions={{
              color:
                river.risk === "high"
                  ? "#e04040"
                  : river.risk === "medium"
                  ? "#f0a500"
                  : "#4caf82",
            }}
          >
            <Popup>
              {river.name} <br />
              {river.sites} sites <br />
              Risk: {river.risk}
            </Popup>
          </CircleMarker>
        ))} */}

        {filteredRivers.map((river) => (
  <CircleMarker
    key={river.id}
    center={river.coordinates}
    radius={activeRiver === river.id ? 12 : 8}
    pathOptions={{
      color:
        river.risk === "high"
          ? "#e04040"
          : river.risk === "medium"
          ? "#f0a500"
          : "#4caf82",
    }}
  >
    <Popup>
      {river.name}<br />
      {river.sites} sites<br />
      {river.location}, {river.province}<br />
      Risk: {river.risk}
    </Popup>
  </CircleMarker>
))}

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


        {/* Health status legend */}
        <div className="mv-legend">
          <div className="mv-legend-title">Health Status</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--low"/>Low AMR Risk</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--medium"/>Medium AMR Risk</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--high"/>High AMR Risk</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--none"/>No data</div>
          <div className="mv-legend-divider" />
          <div className="mv-legend-title">Location data</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--attach"/>File uploaded</div>
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
          <div className="mv-stat-label">Sampling Sites</div>
          <div className={`mv-stat-value mv-stat-value--green`}>{animatedSamplingSites}</div>
          <div className="mv-stat-sub">{RIVERS.find(r => r.id === activeRiver)?.name}</div>
        </div>

        <div className="mv-stat-card">
          <div className="mv-stat-label">Sites at Risk</div>
          <div className="mv-stat-value mv-stat-value--orange">{animatedSitesAtRisk}</div>
          <div className="mv-stat-sub">High AMR detected</div>
        </div>

        <div className="mv-stat-card">
          <div className="mv-stat-label">Organisms Detected</div>
          <div className="mv-stat-value mv-stat-value--amber">{animatedOrganisms}</div>
          <div className="mv-stat-sub">{RIVERS.find(r => r.id === activeRiver)?.name}</div>
        </div>

        <div className="mv-stat-card">
          <div className="mv-stat-label">Last Updated</div>
          <div className="mv-stat-value--date">{stats.lastUpdated}</div>
          <div className="mv-stat-sub">{stats.siteVisits}</div>
        </div>
      </aside>

    </div>
  );
}