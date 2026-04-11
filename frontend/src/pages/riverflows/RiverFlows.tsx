import { useState } from "react";
import "./RiverFlows.css";

// ── Types ──────────────────────────────────────────────
type RiskLevel    = "high" | "medium" | "low";
type SafetyStatus = "safe" | "caution" | "unsafe";
type SafetyFilter = "all" | "high" | "medium" | "low";
type IconType     = "swimming" | "drinking" | "fishing" | "farming" | "irrigation" | "kayaking";

interface VisitDot     { visit: string; color: string; }
interface ActivityItem { name: string; status: SafetyStatus; icon: IconType; }

interface River {
  id: number;
  name: string;
  location: string;
  risk: RiskLevel;
  visits: VisitDot[];
  resistanceRate: number;
  isolatesTested: number;
  resistanceGenes: number;
  visitsCompleted: number;
  activities: ActivityItem[];
}

// ── Constants ──────────────────────────────────────────
const RISK_COLOR: Record<RiskLevel, string> = {
  high:   "#e04040",
  medium: "#f0a500",
  low:    "#4caf82",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  high:   "HIGH RESISTANCE",
  medium: "MODERATE RESISTANCE",
  low:    "LOW RESISTANCE",
};

const SAFETY_COLOR: Record<SafetyStatus, string> = {
  safe:    "#4caf82",
  caution: "#f0a500",
  unsafe:  "#e04040",
};

// ── River data ─────────────────────────────────────────
const ALL_RIVERS: River[] = [
  {
    id: 1,
    name: "Apies River",
    location: "Pretoria · Gauteng",
    risk: "high",
    visits: [
      { visit: "V1", color: "#4caf82" },
      { visit: "V2", color: "#4caf82" },
      { visit: "V3", color: "#d4c840" },
      { visit: "V4", color: "#d4a84a" },
      { visit: "V5", color: "#c47a70" },
      { visit: "V6", color: "#c46060" },
      { visit: "V7", color: "#d45050" },
    ],
    resistanceRate: 83,
    isolatesTested: 14,
    resistanceGenes: 28,
    visitsCompleted: 7,
    activities: [
      { name: "Swimming",   status: "unsafe",  icon: "swimming"   },
      { name: "Irrigation", status: "unsafe",  icon: "irrigation" },
      { name: "Drinking",   status: "unsafe",  icon: "drinking"   },
      { name: "Fishing",    status: "unsafe",  icon: "fishing"    },
      { name: "Farming",    status: "unsafe",  icon: "farming"    },
      { name: "Kayaking",   status: "unsafe",  icon: "kayaking"   },
    ],
  },
  {
    id: 2,
    name: "Henops River",
    location: "Centurion · Gauteng",
    risk: "medium",
    visits: [
      { visit: "V1", color: "#4caf82" },
      { visit: "V2", color: "#4caf82" },
      { visit: "V3", color: "#6dc472" },
      { visit: "V4", color: "#d4b44a" },
      { visit: "V5", color: "#d4a84a" },
      { visit: "V6", color: "#c47a70" },
      { visit: "V7", color: "#c46060" },
    ],
    resistanceRate: 64,
    isolatesTested: 8,
    resistanceGenes: 17,
    visitsCompleted: 7,
    activities: [
      { name: "Swimming",   status: "caution", icon: "swimming"   },
      { name: "Irrigation", status: "caution", icon: "irrigation" },
      { name: "Drinking",   status: "unsafe",  icon: "drinking"   },
      { name: "Fishing",    status: "caution", icon: "fishing"    },
      { name: "Farming",    status: "caution", icon: "farming"    },
      { name: "Kayaking",   status: "safe",    icon: "kayaking"   },
    ],
  },
  {
    id: 3,
    name: "Limpopo River",
    location: "Limpopo · Limpopo",
    risk: "low",
    visits: [
      { visit: "V1", color: "#4caf82" },
      { visit: "V2", color: "#4caf82" },
      { visit: "V3", color: "#4caf82" },
      { visit: "V4", color: "#6dc472" },
      { visit: "V5", color: "#6dc472" },
      { visit: "V6", color: "#d4b44a" },
      { visit: "V7", color: "#d4b44a" },
    ],
    resistanceRate: 28,
    isolatesTested: 10,
    resistanceGenes: 12,
    visitsCompleted: 7,
    activities: [
      { name: "Swimming",   status: "safe",    icon: "swimming"   },
      { name: "Irrigation", status: "safe",    icon: "irrigation" },
      { name: "Drinking",   status: "caution", icon: "drinking"   },
      { name: "Fishing",    status: "safe",    icon: "fishing"    },
      { name: "Farming",    status: "safe",    icon: "farming"    },
      { name: "Kayaking",   status: "safe",    icon: "kayaking"   },
    ],
  },
  {
    id: 4,
    name: "Lotus River",
    location: "Cape Town · Western Cape",
    risk: "high",
    visits: [
      { visit: "V1", color: "#4caf82" },
      { visit: "V2", color: "#d4b44a" },
      { visit: "V3", color: "#d4a84a" },
      { visit: "V4", color: "#c47a70" },
      { visit: "V5", color: "#c46060" },
      { visit: "V6", color: "#d45050" },
      { visit: "V7", color: "#e04040" },
    ],
    resistanceRate: 76,
    isolatesTested: 6,
    resistanceGenes: 21,
    visitsCompleted: 7,
    activities: [
      { name: "Swimming",   status: "unsafe",  icon: "swimming"   },
      { name: "Irrigation", status: "caution", icon: "irrigation" },
      { name: "Drinking",   status: "unsafe",  icon: "drinking"   },
      { name: "Fishing",    status: "unsafe",  icon: "fishing"    },
      { name: "Farming",    status: "caution", icon: "farming"    },
      { name: "Kayaking",   status: "caution", icon: "kayaking"   },
    ],
  },
];

// ── SVG Icons ──────────────────────────────────────────
const Icons: Record<IconType, JSX.Element> = {
  swimming: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2"/>
      <path d="M6 11l2-4h8l2 4"/>
      <path d="M2 16c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/>
      <path d="M2 20c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/>
    </svg>
  ),
  drinking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8l-1 11H9L8 2z"/>
      <path d="M9 13v5a3 3 0 006 0v-5"/>
      <path d="M6 22h12"/>
    </svg>
  ),
  fishing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5v6"/>
      <path d="M4 8h12"/>
      <path d="M16 8c0-2 2.5-3.5 3.5-3.5S21 7 16 8"/>
      <path d="M4 19c3.5 0 6-3 6-6"/>
      <circle cx="8" cy="16" r="2"/>
    </svg>
  ),
  farming: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  irrigation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v5M7 8l5 3 5-3M7 13l5 3 5-3M7 18l5 3 5-3"/>
    </svg>
  ),
  kayaking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="2"/>
      <path d="M2 17c4-5 8-5 12 0"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <path d="M9 8l2 4"/>
    </svg>
  ),
};

// ── Unified River Card ─────────────────────────────────
function RiverCard({ river }: { river: River }) {
  return (
    <div className="rf-card">

      {/* Top row: left = name/location/visits, right = activity safety */}
      <div className="rf-card-top">

        {/* Left: header + visit dots */}
        <div className="rf-card-header-block">
          <div className="rf-card-name-row">
            <div className="rf-card-name">{river.name}</div>
          </div>
          <div className="rf-card-location">{river.location}</div>
          <div className="rf-visits-row">
            <span className="rf-visits-label">Visits →</span>
            {river.visits.map(v => (
              <div key={v.visit} className="rf-visit-col">
                <div className="rf-visit-dot" style={{ background: v.color }} />
                <span className="rf-visit-dot-label">{v.visit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Daily Activity Safety + badge */}
        <div className="rf-activity-col">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="rf-activity-title" style={{ marginBottom: 0 }}>
              Daily Activity Safety
            </div>
            <span className={`rf-badge rf-badge--${river.risk}`}>
              {RISK_LABEL[river.risk]}
            </span>
          </div>
          <div className="rf-activity-grid">
            {river.activities.map(act => (
              <div key={act.name} className="rf-activity-item">
                <div className="rf-activity-icon">{Icons[act.icon]}</div>
                <span className="rf-activity-name">{act.name}</span>
                <div
                  className="rf-activity-dot"
                  style={{ background: SAFETY_COLOR[act.status] }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="rf-stats-row">
        <div className="rf-stat">
          <div className="rf-stat-value" style={{ color: RISK_COLOR[river.risk] }}>
            {river.resistanceRate}%
          </div>
          <div className="rf-stat-label">Resistance rate</div>
        </div>
        <div className="rf-stat">
          <div className="rf-stat-value" style={{ color: "#3eb99a" }}>
            {river.isolatesTested}
          </div>
          <div className="rf-stat-label">Isolates tested</div>
        </div>
        <div className="rf-stat">
          <div className="rf-stat-value" style={{ color: "#f0a500" }}>
            {river.resistanceGenes}
          </div>
          <div className="rf-stat-label">Resistance genes</div>
        </div>
        <div className="rf-stat">
          <div className="rf-stat-value" style={{ color: "#e8edf2" }}>
            {river.visitsCompleted}
          </div>
          <div className="rf-stat-label">Visits completed</div>
        </div>
      </div>

      {/* Resistance bar */}
      <div className="rf-resist-block">
        <div className="rf-resist-label">Overall resistance rate across visits</div>
        <div className="rf-resist-row">
          <div className="rf-resist-track">
            <div
              className="rf-resist-fill"
              style={{
                width: `${river.resistanceRate}%`,
                background: RISK_COLOR[river.risk],
              }}
            />
          </div>
          <span className="rf-resist-pct">{river.resistanceRate}%</span>
        </div>
      </div>

    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function RiverFlows() {
  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeRiverId, setActiveRiverId] = useState<number | "all">("all");
  const [activeSafety,  setActiveSafety]  = useState<SafetyFilter>("all");

  const visibleRivers = ALL_RIVERS.filter(r => {
    const matchRiver  = activeRiverId === "all" || r.id === activeRiverId;
    const matchSafety = activeSafety  === "all" || r.risk === activeSafety;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRiver && matchSafety && matchSearch;
  });

  const sidebarRivers = ALL_RIVERS.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rf-page">

      {/* ── Sidebar ── */}
      <aside className="rf-sidebar">
        <div className="rf-search-wrap">
          <div className="rf-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search River"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rf-section-label">Filter by River</div>
        <div className="rf-river-list">
          <div
            className={`rf-river-item ${activeRiverId === "all" ? "active" : ""}`}
            onClick={() => setActiveRiverId("all")}
          >
            <div className="rf-river-name">All Rivers</div>
          </div>
          {sidebarRivers.map(r => (
            <div
              key={r.id}
              className={`rf-river-item ${activeRiverId === r.id ? "active" : ""}`}
              onClick={() => setActiveRiverId(r.id)}
            >
              <div className="rf-river-name">{r.name}</div>
              <div className="rf-river-meta">{r.location}</div>
            </div>
          ))}
        </div>

        <div className="rf-section-label">Filter by Safety</div>
        <div className="rf-safety-list">
          {(["all", "high", "medium", "low"] as SafetyFilter[]).map(f => (
            <div
              key={f}
              className={`rf-safety-item ${activeSafety === f ? "active" : ""}`}
              onClick={() => setActiveSafety(f)}
            >
              {f === "all"    && "All"}
              {f === "high"   && "High Risk Rivers"}
              {f === "medium" && "Moderate Risk Rivers"}
              {f === "low"    && "Safe Rivers"}
            </div>
          ))}
        </div>

        <button className="rf-collapse-btn" aria-label="Collapse sidebar">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="rf-main">
        <div className="rf-page-title">All River Flows</div>

        {visibleRivers.length === 0 && (
          <p style={{ color: "#5a7a94", fontSize: 14, marginTop: 8 }}>
            No rivers match the current filters.
          </p>
        )}

        {visibleRivers.map(river => (
          <RiverCard key={river.id} river={river} />
        ))}
      </main>
    </div>
  );
}