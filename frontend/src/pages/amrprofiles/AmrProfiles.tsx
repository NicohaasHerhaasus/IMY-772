import { useState, useRef, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AmrProfiles.css";
import { useRiver } from "../../layouts/RiverContext"; 


// Fix Leaflet default icon paths broken by bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Types ──────────────────────────────────────────────
type BadgeType = "present" | "absent" | "trace";
type TabType   = "organisms" | "amr" | "metagenomics";
type RiskLevel = "low" | "medium" | "high";

interface Organism  { name: string; status: BadgeType; }
interface WaterParam { label: string; value: number; color: "green" | "yellow" | "red"; }
interface VisitBar  { label: string; height: number; color: string; }
interface GroupedBar { label: string; purple: number; orange: number; }
interface ColBar    { h: number; color: string; }

interface RiverData {
  id: number;
  name: string;
  province: string;
  lat: number;
  lng: number;
  zoom: number;
  healthScore: number;
  riskLevel: RiskLevel;
  riskTag: string;
  riskDesc: string;
  organisms: Organism[];
  waterParams: WaterParam[];
  visits: VisitBar[];
  groupedBars: GroupedBar[];
  colBars: ColBar[];
  pieA: number;
  pieB: number;
}

// ── Risk colour helper ─────────────────────────────────
const RISK_COLORS: Record<RiskLevel, string> = {
  low:    "#4caf82",
  medium: "#f0a500",
  high:   "#e03e3e",
};

// ── Static river dataset ───────────────────────────────
// Replace these records with real API data later.
const RIVERS: RiverData[] = [
  {
    id: 1,
    name: "Apies River",
    province: "Pretoria, Gauteng",
    lat: -25.7479, lng: 28.2293, zoom: 11,
    healthScore: 93,
    riskLevel: "high",
    riskTag: "!! High Risk Area",
    riskDesc: "Not recommended for drinking,\nfarming or daily activities",
    organisms: [
      { name: "E-Coli",              status: "present" },
      { name: "Helicobacter-pylori", status: "present" },
      { name: "Salmonella",          status: "absent"  },
      { name: "Staphylococcus",      status: "trace"   },
      { name: "Bacillus",            status: "present" },
      { name: "Lactobacillus",       status: "absent"  },
    ],
    waterParams: [
      { label: "Temperature",  value: 72, color: "green"  },
      { label: "pH",           value: 55, color: "yellow" },
      { label: "TDS",          value: 28, color: "red"    },
      { label: "EC",           value: 22, color: "red"    },
      { label: "Dissolved O2", value: 65, color: "green"  },
    ],
    visits: [
      { label: "V1", height: 38, color: "#4caf82" },
      { label: "V2", height: 52, color: "#6dc472" },
      { label: "V3", height: 62, color: "#c4b44a" },
      { label: "V4", height: 68, color: "#d4a84a" },
      { label: "V5", height: 74, color: "#c47a70" },
      { label: "V6", height: 80, color: "#c46060" },
      { label: "V7", height: 88, color: "#d45050" },
    ],
    groupedBars: [
      { label: "A", purple: 78, orange: 85 },
      { label: "B", purple: 58, orange: 62 },
      { label: "C", purple: 72, orange: 42 },
      { label: "D", purple: 44, orange: 36 },
    ],
    colBars: [
      { h: 40, color: "#f0a040" }, { h: 70, color: "#e07020" },
      { h: 90, color: "#f0a040" }, { h: 55, color: "#e07020" },
      { h: 30, color: "#f0c060" }, { h: 80, color: "#e07020" },
      { h: 45, color: "#f0a040" },
    ],
    pieA: 60, pieB: 30,
  },
  {
    id: 2,
    name: "Henops River",
    province: "Centurion, Gauteng",
    lat: -25.8610, lng: 28.1890, zoom: 12,
    healthScore: 58,
    riskLevel: "medium",
    riskTag: "! Medium Risk Area",
    riskDesc: "Use with caution.\nMonitor regularly.",
    organisms: [
      { name: "E-Coli",              status: "trace"   },
      { name: "Helicobacter-pylori", status: "absent"  },
      { name: "Salmonella",          status: "absent"  },
      { name: "Staphylococcus",      status: "present" },
      { name: "Bacillus",            status: "trace"   },
      { name: "Lactobacillus",       status: "present" },
    ],
    waterParams: [
      { label: "Temperature",  value: 60, color: "green"  },
      { label: "pH",           value: 70, color: "green"  },
      { label: "TDS",          value: 50, color: "yellow" },
      { label: "EC",           value: 45, color: "yellow" },
      { label: "Dissolved O2", value: 75, color: "green"  },
    ],
    visits: [
      { label: "V1", height: 30, color: "#4caf82" },
      { label: "V2", height: 40, color: "#4caf82" },
      { label: "V3", height: 50, color: "#6dc472" },
      { label: "V4", height: 55, color: "#c4b44a" },
      { label: "V5", height: 60, color: "#d4a84a" },
      { label: "V6", height: 65, color: "#c47a70" },
      { label: "V7", height: 70, color: "#c46060" },
    ],
    groupedBars: [
      { label: "A", purple: 55, orange: 60 },
      { label: "B", purple: 40, orange: 50 },
      { label: "C", purple: 65, orange: 35 },
      { label: "D", purple: 30, orange: 45 },
    ],
    colBars: [
      { h: 30, color: "#f0c060" }, { h: 55, color: "#f0a040" },
      { h: 70, color: "#e07020" }, { h: 40, color: "#f0a040" },
      { h: 60, color: "#e07020" }, { h: 50, color: "#f0c060" },
      { h: 35, color: "#f0a040" },
    ],
    pieA: 50, pieB: 35,
  },
  {
    id: 3,
    name: "Limpopo River",
    province: "Limpopo",
    lat: -22.9000, lng: 29.4600, zoom: 9,
    healthScore: 32,
    riskLevel: "low",
    riskTag: "✓ Low Risk Area",
    riskDesc: "Generally safe.\nRegular monitoring advised.",
    organisms: [
      { name: "E-Coli",              status: "absent"  },
      { name: "Helicobacter-pylori", status: "absent"  },
      { name: "Salmonella",          status: "absent"  },
      { name: "Staphylococcus",      status: "trace"   },
      { name: "Bacillus",            status: "absent"  },
      { name: "Lactobacillus",       status: "present" },
    ],
    waterParams: [
      { label: "Temperature",  value: 50, color: "green"  },
      { label: "pH",           value: 80, color: "green"  },
      { label: "TDS",          value: 65, color: "green"  },
      { label: "EC",           value: 60, color: "green"  },
      { label: "Dissolved O2", value: 85, color: "green"  },
    ],
    visits: [
      { label: "V1", height: 20, color: "#4caf82" },
      { label: "V2", height: 25, color: "#4caf82" },
      { label: "V3", height: 30, color: "#4caf82" },
      { label: "V4", height: 28, color: "#6dc472" },
      { label: "V5", height: 35, color: "#6dc472" },
      { label: "V6", height: 32, color: "#4caf82" },
      { label: "V7", height: 38, color: "#6dc472" },
    ],
    groupedBars: [
      { label: "A", purple: 30, orange: 25 },
      { label: "B", purple: 20, orange: 30 },
      { label: "C", purple: 35, orange: 20 },
      { label: "D", purple: 15, orange: 22 },
    ],
    colBars: [
      { h: 20, color: "#4caf82" }, { h: 35, color: "#6dc472" },
      { h: 28, color: "#4caf82" }, { h: 40, color: "#6dc472" },
      { h: 22, color: "#4caf82" }, { h: 30, color: "#6dc472" },
      { h: 25, color: "#4caf82" },
    ],
    pieA: 70, pieB: 20,
  },
];



// ── Map fly-to controller ──────────────────────────────
function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.4 });
  }, [lat, lng, zoom, map]);
  return null;
}

// ── Custom coloured marker icon ────────────────────────
function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// ── Pie chart (SVG) ────────────────────────────────────
function PieChart({ pctA, pctB }: { pctA: number; pctB: number }) {
  const pctC = 100 - pctA - pctB;
  const segments = [
    { pct: pctA, color: "#3eb99a" },
    { pct: pctB, color: "#e07040" },
    { pct: pctC, color: "#7b6cf6" },
  ];
  const r = 70; const cx = 80; const cy = 80;
  let cumulative = 0;

  function toXY(pct: number) {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const paths = segments.map((seg) => {
    const start = toXY(cumulative);
    cumulative += seg.pct;
    const end = toXY(cumulative);
    const large = seg.pct > 50 ? 1 : 0;
    return {
      d: `M${cx} ${cy} L${start.x} ${start.y} A${r} ${r} 0 ${large} 1 ${end.x} ${end.y}Z`,
      color: seg.color,
    };
  });

  return (
    <div className="amr-pie-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="#1a2d3f" strokeWidth="1.5" />
        ))}
      </svg>
      <span className="amr-pie-label amr-pie-label--a">{pctA}%</span>
      <span className="amr-pie-label amr-pie-label--b">{pctB}%</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export default function AmrProfiles() {
  const { activeRiverId } = useRiver();
  const [activeTab,    setActiveTab]    = useState<TabType>("organisms");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { activeRiverId: activeRiver, setActiveRiverId: setActiveRiver } = useRiver();
  const searchRef = useRef<HTMLDivElement>(null);

  // Replace the initial useState value:
  const [selectedRiver, setSelectedRiver] = useState<RiverData>(
    RIVERS.find(r => r.id === activeRiverId) ?? RIVERS[0]
  );

  // Sync if the context value changes (e.g. user navigates back and forth)
  useEffect(() => {
    const match = RIVERS.find(r => r.id === activeRiverId);
    if (match) setSelectedRiver(match);
  }, [activeRiverId]);

  // Filter rivers by search query
  const filtered = useMemo(() =>
    RIVERS.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.province.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectRiver(river: RiverData) {
    setSelectedRiver(river);
    setSearchQuery(river.name);
    setShowDropdown(false);
  }

  const r = selectedRiver;
  const ringColor  = RISK_COLORS[r.riskLevel];
  // stroke-dasharray 283 = 2πr where r=45
  const dashOffset = 283 - (r.healthScore / 100) * 283;


useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  return (
    <div className="amr-page">

      {/* ══ LEFT SIDEBAR ══ */}
      <aside className="amr-sidebar">

        {/* Search */}
        <div className="amr-search-wrap" ref={searchRef}>
  <div
    className="amr-search"
    onClick={() => setShowDropdown(prev => !prev)}
  >
    {/* <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg> */}

    <span className="amr-search-placeholder">
      {RIVERS.find(r => r.id === activeRiver)?.name || "Select River"}
    </span>
  </div>

  {showDropdown && (
    <div className="amr-search-dropdown">
      {RIVERS.map(river => (
        <div
          key={river.id}
          className="amr-search-option"
          onClick={() => {
            setActiveRiver(river.id);
            setShowDropdown(false);
          }}
        >
          <strong>{river.name}</strong>
          <span>{river.province}</span>
        </div>
      ))}
    </div>
  )}
</div>
        


        {/* Site Details */}
        <div className="amr-section-label">Site Details</div>

        <div className="amr-health-block">
          <div className="amr-score-ring">
            <svg viewBox="0 0 100 100">
              <circle className="track" cx="50" cy="50" r="45" />
              <circle
                className="progress"
                cx="50" cy="50" r="45"
                stroke={ringColor}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="amr-score-label" style={{ color: ringColor }}>
              {r.healthScore}%
            </div>
          </div>

          <div>
            <div className="amr-risk-tag" style={{ color: ringColor }}>{r.riskTag}</div>
            <div className="amr-risk-desc">
              {r.riskDesc.split("\n").map((line, i) => <span key={i}>{line}<br/></span>)}
            </div>
          </div>
        </div>

        {/* Organisms */}
        <div className="amr-section-label">Organisms Detected</div>
        <div className="amr-organisms">
          {r.organisms.map(org => (
            <div key={org.name} className="amr-org-row">
              <span className="amr-org-name">{org.name}</span>
              <span className={`amr-badge amr-badge--${org.status}`}>{org.status}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="amr-main">

        {/* Top row: water quality + Leaflet map */}
        <div className="amr-top">

          {/* Water Quality Parameters */}
          <div className="amr-params-card">
            <div className="amr-card-title">Water Quality Parameters</div>
            <div className="amr-params-list">
              {r.waterParams.map(p => (
                <div key={p.label} className="amr-param-row">
                  <span className="amr-param-name">{p.label}</span>
                  <div className="amr-param-bar-track">
                    <div
                      className={`amr-param-bar-fill bar--${p.color}`}
                      style={{ width: `${p.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaflet Map */}
          <div className="amr-map-card">
            <MapContainer
              center={[r.lat, r.lng]}
              zoom={r.zoom}
              zoomControl={false}
              style={{ width: "100%", height: "100%", minHeight: 260 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Fly map to selected river */}
              <FlyTo lat={r.lat} lng={r.lng} zoom={r.zoom} />

              {/* Markers for all rivers */}
              {RIVERS.map(river => (
                <Marker
                  key={river.id}
                  position={[river.lat, river.lng]}
                  icon={makeIcon(RISK_COLORS[river.riskLevel])}
                  eventHandlers={{ click: () => selectRiver(river) }}
                >
                  <Popup>
                    <strong>{river.name}</strong><br/>
                    {river.province}<br/>
                    Health Score: {river.healthScore}%
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legend overlay */}
            <div className="amr-map-legend">
              <div className="amr-map-legend-title">Health Status</div>
              <div className="amr-legend-row"><span className="amr-dot amr-dot--low"/>Low AMR Risk</div>
              <div className="amr-legend-row"><span className="amr-dot amr-dot--medium"/>Medium AMR Risk</div>
              <div className="amr-legend-row"><span className="amr-dot amr-dot--high"/>High AMR Risk</div>
              <div className="amr-legend-row"><span className="amr-dot amr-dot--none"/>No data</div>
            </div>
          </div>
        </div>

        {/* Visit Timeline */}
        <div className="amr-timeline-card">
          <div className="amr-card-title">Visit Timeline</div>
          <div className="amr-timeline-bars">
            {r.visits.map((v, i) => (
              <div key={v.label} className="amr-visit-col">
                <div
                  className="amr-visit-bar"
                  style={{ height: `${v.height}%`, background: v.color, animationDelay: `${i * 0.08}s` }}
                />
                <span className="amr-visit-label">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Analytics */}
        <div className="amr-analytics">
          <div className="amr-analytics-title">Data Analytics</div>

          <div className="amr-charts-row">
            {/* Grouped bar chart */}
            <div className="amr-chart-card amr-bar-chart">
              {r.groupedBars.map((row, i) => (
                <div key={row.label} className="amr-grouped-row">
                  <span className="amr-grouped-label">{row.label}</span>
                  <div className="amr-grouped-bars">
                    <div className="amr-mini-bar mini-bar--purple" style={{ width: `${row.purple}%` }} />
                    <div className="amr-mini-bar mini-bar--orange" style={{ width: `${row.orange}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pie chart */}
            <div className="amr-chart-card" style={{ alignItems: "center" }}>
              <PieChart pctA={r.pieA} pctB={r.pieB} />
            </div>

            {/* Column chart */}
            <div className="amr-chart-card">
              <div className="amr-col-chart">
                {r.colBars.map((b, i) => (
                  <div
                    key={i}
                    className="amr-col-bar"
                    style={{ height: `${b.h}%`, background: b.color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="amr-tabs">
            {(["organisms", "amr", "metagenomics"] as TabType[]).map(tab => (
              <button
                key={tab}
                className={`amr-tab ${activeTab === tab ? "amr-tab--active" : "amr-tab--inactive"}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "organisms"    && "Organisms"}
                {tab === "amr"          && "AMR Profiles"}
                {tab === "metagenomics" && "Metagenomics Data"}
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}