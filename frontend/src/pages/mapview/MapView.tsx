import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "./MapView.css";
import { useRiver } from "../../layouts/RiverContext";

// ── Types ──────────────────────────────────────────────
interface River {
  id: number;
  name: string;
  sites: number;
  location: string;
  province: string;
  coordinates: [number,number];
  risk: "low" | "medium" | "high";
}

interface Visit {
  id: number;
  label: string;
  sub: string;
  count?: string;
}

// ── Static data ────────────────────────────────────────
const RIVERS: River[] = [
  { id: 1, name: "Apies River",    sites: 14, location: "Pretoria", province:"Gauteng", coordinates:[-25.75,28.23],risk:"high" },
  { id: 2, name: "Henops River",   sites: 8,  location: "Centurion" , province:"Gauteng", coordinates: [-25.85, 28.18] , risk: "medium"},
  { id: 3, name: "Limpopo River",  sites: 10, location: "Limpopo" ,province:"Limpopo" ,coordinates: [-22.0, 29.0] , risk: "low"},
  { id: 4, name: "Lotus River",  sites: 6, location: "Cape Town" ,province:"Western Cape" ,coordinates: [-34.05, 18.51] , risk: "high"},

];

// ── Overview stats (keyed by river id) ────────────────
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


// ── Component ──────────────────────────────────────────
export default function MapView() {
  const [searchQuery, setSearchQuery] = useState("");
  const { activeRiverId: activeRiver, setActiveRiverId: setActiveRiver } = useRiver();
  const stats = STATS[activeRiver];
  const [selectedProvince, setSelectedProvince] = useState<string>("All");
  const [riverSearch, setRiverSearch] = useState("");
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

  return (
    <div className="mapview-page">

      {/* ── LEFT SIDEBAR ── */}
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
        {/* Replace src with your actual map component or image */}
        {/* <img
          className="mv-map-img"
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1400&h=900&fit=crop"
          alt="River map of South Africa"
        /> */}

        <MapContainer
        
          center={[-29.0, 24.0] as [number, number]}
          zoom={6}
          className="mv-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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


</MapContainer>


        {/* Health status legend */}
        <div className="mv-legend">
          <div className="mv-legend-title">Health Status</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--low"/>Low AMR Risk</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--medium"/>Medium AMR Risk</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--high"/>High AMR Risk</div>
          <div className="mv-legend-item"><span className="mv-dot mv-dot--none"/>No data</div>
        </div>

        {/* Sidebar collapse button */}
        <button className="mv-collapse-btn" aria-label="Collapse sidebar">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
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