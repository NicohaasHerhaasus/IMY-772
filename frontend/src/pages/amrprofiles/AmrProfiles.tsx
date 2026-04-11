import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./AmrProfiles.css";
import DataAnalyticsCard from "../../components/AMRProfiles/Dataanalyticscard";

// ── Types ──────────────────────────────────────────────
type BadgeType = "present" | "absent" | "trace";

type PillColor = "blue" | "orange" | "purple" | "green" | "teal";

interface Organism  { name: string; status: BadgeType; }
interface ArmGene {
  symbol: string;
  antibioticClass: string;
  pillColor: PillColor;
  elementType: string;
  identity: number;
  barColor: string;
}
interface PhenoChip { label: string; type: "resistant" | "moderate"; }
interface IntegronCard { label: string; value: number; sub: string; colorClass: string; }
interface RiverMarker  {
  name: string;
  coords: [number, number];
  risk: "low" | "medium" | "high";
}

// ── Static data ────────────────────────────────────────
const ORGANISMS: Organism[] = [
  { name: "E-Coli",              status: "present" },
  { name: "Helicobacter-pylori", status: "present" },
  { name: "Salmonella",          status: "absent"  },
  { name: "Staphylococcus",      status: "trace"   },
  { name: "Bacillus",            status: "present" },
  { name: "Lactobacillus",       status: "absent"  },
];

const AMR_GENES: ArmGene[] = [
  { symbol: "blaCTX-M-14", antibioticClass: "BETA-LACTAM",   pillColor: "blue",   elementType: "AMR", identity: 100,  barColor: "#6ab4f5" },
  { symbol: "tet(A)",      antibioticClass: "TETRACYCLINE",  pillColor: "orange", elementType: "AMR", identity: 99.2, barColor: "#f0a500" },
  { symbol: "sul2",        antibioticClass: "SULFONAMIDE",   pillColor: "purple", elementType: "AMR", identity: 98.7, barColor: "#b09af0" },
  { symbol: "aph(3')-Ia",  antibioticClass: "AMINOGLYCOSIDE",pillColor: "green",  elementType: "AMR", identity: 100,  barColor: "#4caf82" },
  { symbol: "fosA3",       antibioticClass: "FOSFOMYCIN",    pillColor: "teal",   elementType: "AMR", identity: 97.1, barColor: "#3eb99a" },
];

const INTEGRON_CARDS: IntegronCard[] = [
  { label: "IntI1", value: 9,  sub: "64% positive",    colorClass: "intval--active" },
  { label: "IntI2", value: 2,  sub: "14% positive",    colorClass: "intval--active" },
  { label: "IntI3", value: 0,  sub: "not detected",    colorClass: "intval--zero"   },
  { label: "ESBL",  value: 6,  sub: "43% producers",   colorClass: "intval--esbl"   },
  { label: "AmpC",  value: 2,  sub: "14% producers",   colorClass: "intval--active" },
];

const PHENO_CHIPS: PhenoChip[] = [
  { label: "Ampicillin",   type: "resistant" },
  { label: "Ceftriaxone",  type: "resistant" },
  { label: "Tetracycline", type: "resistant" },
  { label: "Trimethoprim", type: "resistant" },
  { label: "Fosfomycin",   type: "moderate"  },
  { label: "Sulfisoxazole",type: "moderate"  },
  { label: "Kanamycin",    type: "moderate"  },
  { label: "Streptomycin", type: "moderate"  },
];

const PLASMID_TYPES = ["IncFIB(K)", "IncI1-I(Alpha)", "Col(BS512)"];


const RIVERS: RiverMarker[] = [
  { name: "Apies River",   coords: [-25.75, 28.23], risk: "high"   },
  { name: "Henops River",  coords: [-25.85, 28.18], risk: "medium" },
  { name: "Limpopo River", coords: [-22.00, 29.00], risk: "low"    },
  { name: "Lotus River",   coords: [-34.05, 18.51], risk: "high"   },
];

const RISK_COLORS = { low: "#4caf82", medium: "#f0a500", high: "#e04040" };
const PILL_CLASS: Record<PillColor, string> = {
  blue: "pill-blue", orange: "pill-orange", purple: "pill-purple",
  green: "pill-green", teal: "pill-teal",
};

// ── Map fly controller ─────────────────────────────────
function FlyTo({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(coords, 6, { duration: 1.2 }); }, [coords, map]);
  return null;
}

// ── Main component ─────────────────────────────────────
export default function AmrProfiles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const healthScore  = 93;
  const dashOffset   = 283 - (healthScore / 100) * 283;

  return (
    <div className="amr-page">

      {/* ══ LEFT SIDEBAR ══ */}
      <aside className="amr-sidebar">

        {/* Search */}
        <div className="amr-search-wrap">
          <div className="amr-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search River"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Site details section */}
        <div className="amr-section-label">Site Details</div>

        {/* Resistance ring */}
        <div className="amr-ring-block">
          <div className="amr-ring-wrap">
            <svg viewBox="0 0 100 100">
              <circle className="track" cx="50" cy="50" r="45" />
              <circle
                className="progress"
                cx="50" cy="50" r="45"
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="amr-ring-label">{healthScore}%</div>
          </div>
          <p className="amr-ring-desc">
            83% of isolates carry<br/>
            &gt;1 AMR gene
          </p>
        </div>

        {/* Organisms */}
        <div className="amr-section-label">Organisms Detected</div>
        <div className="amr-organisms">
          {ORGANISMS.map(org => (
            <div key={org.name} className="amr-org-row">
              <span className="amr-org-name">{org.name}</span>
              <span className={`amr-badge amr-badge--${org.status}`}>
                {org.status}
              </span>
            </div>
          ))}
        </div>

        {/* Collapse toggle */}
        <button className="amr-collapse-btn" aria-label="Collapse sidebar">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="amr-main">
        <div className="amr-content-grid">

          {/* ── LEFT COLUMN ── */}
          <div className="amr-left-col">

            {/* AMR Genes table */}
            <div className="amr-card">
              <div className="amr-card-title">AMR Genes</div>
              <table className="amr-gene-table">
                <thead>
                  <tr>
                    <th>Gene symbol</th>
                    <th>Antibiotic class</th>
                    <th>Element type</th>
                    <th>% Identity</th>
                  </tr>
                </thead>
                <tbody>
                  {AMR_GENES.map(gene => (
                    <tr key={gene.symbol}>
                      <td style={{ fontFamily: "monospace", fontWeight: 500 }}>
                        {gene.symbol}
                      </td>
                      <td>
                        <span className={`gene-class-pill ${PILL_CLASS[gene.pillColor]}`}>
                          {gene.antibioticClass}
                        </span>
                      </td>
                      <td style={{ color: "#5a6b64", fontSize: 12 }}>
                        {gene.elementType}
                      </td>
                      <td>
                        <div className="identity-bar-wrap">
                          <span style={{ fontSize: 12, minWidth: 38 }}>
                            {gene.identity}%
                          </span>
                          <div className="identity-bar-track">
                            <div
                              className="identity-bar-fill"
                              style={{
                                width: `${gene.identity}%`,
                                background: gene.barColor,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Integrons & ESBL/AmpC */}
            <div className="amr-card">
              <div className="amr-card-title">Integrons &amp; ESBL/AmpC</div>
              <div className="amr-integron-grid">
                {INTEGRON_CARDS.map(card => (
                  <div key={card.label} className="amr-integron-card">
                    <div className="amr-integron-label">{card.label}</div>
                    <div className={`amr-integron-value ${card.colorClass}`}>
                      {card.value}
                    </div>
                    <div className="amr-integron-sub">{card.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Predicted phenotypes */}
            <div className="amr-card">
              <div className="amr-card-title">Predicted Phenotypes</div>

              <div className="amr-phenotype-section">
                <div className="amr-phenotype-label">Predicted antibiotic resistance</div>
                <div className="amr-pheno-chips">
                  {PHENO_CHIPS.map(chip => (
                    <span
                      key={chip.label}
                      className={`amr-pheno-chip chip-${chip.type}`}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="amr-phenotype-section">
                <div className="amr-phenotype-label">Plasmid types identified</div>
                <div className="amr-plasmid-chips">
                  {PLASMID_TYPES.map(p => (
                    <span key={p} className="amr-plasmid-chip">{p}</span>
                  ))}
                </div>
              </div>

              <div className="amr-mlst-row">
                <span className="amr-mlst-label">MLST sequence type:</span>
                <span className="amr-mlst-value">ST-162 (ecoli_achtman_4)</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="amr-right-col">

            {/* River map */}
            <div className="amr-map-card">
              <div className="amr-card-title" style={{ color: "#1c2f42" }}>
                River Map View
              </div>
              <div className="amr-map-inner">
                <MapContainer
                  center={[-29.0, 24.0]}
                  zoom={5}
                  zoomControl={false}
                  style={{ width: "100%", height: "100%", minHeight: 200 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FlyTo coords={[-29.0, 25.5]} />
                  {RIVERS.map(river => (
                    <CircleMarker
                      key={river.name}
                      center={river.coords}
                      radius={8}
                      pathOptions={{
                        color: RISK_COLORS[river.risk],
                        fillColor: RISK_COLORS[river.risk],
                        fillOpacity: 0.85,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <strong>{river.name}</strong><br />
                        Risk: {river.risk}
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                {/* Legend overlay */}
                <div className="amr-map-legend">
                  <div className="amr-map-legend-title">Health Status</div>
                  <div className="amr-map-legend-row">
                    <div className="amr-map-dot" style={{ background: "#4caf82" }}/>
                    Low AMR Risk
                  </div>
                  <div className="amr-map-legend-row">
                    <div className="amr-map-dot" style={{ background: "#f0a500" }}/>
                    Medium AMR Risk
                  </div>
                  <div className="amr-map-legend-row">
                    <div className="amr-map-dot" style={{ background: "#e04040" }}/>
                    High AMR Risk
                  </div>
                  <div className="amr-map-legend-row">
                    <div className="amr-map-dot" style={{ background: "#3a5060" }}/>
                    No data
                  </div>
                </div>
              </div>
            </div>

            {/* Data Analysis card — real Recharts charts with tab switching */}
            <DataAnalyticsCard />

          </div>
        </div>
      </main>
    </div>
  );
}