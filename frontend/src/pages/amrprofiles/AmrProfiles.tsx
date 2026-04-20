// import { useState, useEffect } from "react";
// import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import "./AmrProfiles.css";
// import DataAnalyticsCard from "../../components/AMRProfiles/Dataanalyticscard";

// // ── Types ──────────────────────────────────────────────
// type BadgeType = "present" | "absent" | "trace";

// type PillColor = "blue" | "orange" | "purple" | "green" | "teal";

// interface Organism  { name: string; status: BadgeType; }
// interface ArmGene {
//   symbol: string;
//   antibioticClass: string;
//   pillColor: PillColor;
//   elementType: string;
//   identity: number;
//   barColor: string;
// }
// interface PhenoChip { label: string; type: "resistant" | "moderate"; }
// interface IntegronCard { label: string; value: number; sub: string; colorClass: string; }
// interface RiverMarker  {
//   name: string;
//   coords: [number, number];
//   risk: "low" | "medium" | "high";
// }

// // ── Static data ────────────────────────────────────────
// const ORGANISMS: Organism[] = [
//   { name: "E-Coli",              status: "present" },
//   { name: "Helicobacter-pylori", status: "present" },
//   { name: "Salmonella",          status: "absent"  },
//   { name: "Staphylococcus",      status: "trace"   },
//   { name: "Bacillus",            status: "present" },
//   { name: "Lactobacillus",       status: "absent"  },
// ];

// const AMR_GENES: ArmGene[] = [
//   { symbol: "blaCTX-M-14", antibioticClass: "BETA-LACTAM",   pillColor: "blue",   elementType: "AMR", identity: 100,  barColor: "#6ab4f5" },
//   { symbol: "tet(A)",      antibioticClass: "TETRACYCLINE",  pillColor: "orange", elementType: "AMR", identity: 99.2, barColor: "#f0a500" },
//   { symbol: "sul2",        antibioticClass: "SULFONAMIDE",   pillColor: "purple", elementType: "AMR", identity: 98.7, barColor: "#b09af0" },
//   { symbol: "aph(3')-Ia",  antibioticClass: "AMINOGLYCOSIDE",pillColor: "green",  elementType: "AMR", identity: 100,  barColor: "#4caf82" },
//   { symbol: "fosA3",       antibioticClass: "FOSFOMYCIN",    pillColor: "teal",   elementType: "AMR", identity: 97.1, barColor: "#3eb99a" },
// ];

// const INTEGRON_CARDS: IntegronCard[] = [
//   { label: "IntI1", value: 9,  sub: "64% positive",    colorClass: "intval--active" },
//   { label: "IntI2", value: 2,  sub: "14% positive",    colorClass: "intval--active" },
//   { label: "IntI3", value: 0,  sub: "not detected",    colorClass: "intval--zero"   },
//   { label: "ESBL",  value: 6,  sub: "43% producers",   colorClass: "intval--esbl"   },
//   { label: "AmpC",  value: 2,  sub: "14% producers",   colorClass: "intval--active" },
// ];

// const PHENO_CHIPS: PhenoChip[] = [
//   { label: "Ampicillin",   type: "resistant" },
//   { label: "Ceftriaxone",  type: "resistant" },
//   { label: "Tetracycline", type: "resistant" },
//   { label: "Trimethoprim", type: "resistant" },
//   { label: "Fosfomycin",   type: "moderate"  },
//   { label: "Sulfisoxazole",type: "moderate"  },
//   { label: "Kanamycin",    type: "moderate"  },
//   { label: "Streptomycin", type: "moderate"  },
// ];

// const PLASMID_TYPES = ["IncFIB(K)", "IncI1-I(Alpha)", "Col(BS512)"];


// const RIVERS: RiverMarker[] = [
//   { name: "Apies River",   coords: [-25.75, 28.23], risk: "high"   },
//   { name: "Henops River",  coords: [-25.85, 28.18], risk: "medium" },
//   { name: "Limpopo River", coords: [-22.00, 29.00], risk: "low"    },
//   { name: "Lotus River",   coords: [-34.05, 18.51], risk: "high"   },
// ];

// const RISK_COLORS = { low: "#4caf82", medium: "#f0a500", high: "#e04040" };
// const PILL_CLASS: Record<PillColor, string> = {
//   blue: "pill-blue", orange: "pill-orange", purple: "pill-purple",
//   green: "pill-green", teal: "pill-teal",
// };

// // ── Map fly controller ─────────────────────────────────
// function FlyTo({ coords }: { coords: [number, number] }) {
//   const map = useMap();
//   useEffect(() => { map.flyTo(coords, 6, { duration: 1.2 }); }, [coords, map]);
//   return null;
// }

// // ── Main component ─────────────────────────────────────
// export default function AmrProfiles() {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);

//   const healthScore  = 93;
//   const dashOffset   = 283 - (healthScore / 100) * 283;

//   return (
//     <div className="amr-page">

//       {/* ══ LEFT SIDEBAR ══ */}
//       <aside className="amr-sidebar">

//         {/* Search */}
//         <div className="amr-search-wrap">
//           <div className="amr-search">
//             <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
//               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
//             </svg>
//             <input
//               type="text"
//               placeholder="Search River"
//               value={searchQuery}
//               onChange={e => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Site details section */}
//         <div className="amr-section-label">Site Details</div>

//         {/* Resistance ring */}
//         <div className="amr-ring-block">
//           <div className="amr-ring-wrap">
//             <svg viewBox="0 0 100 100">
//               <circle className="track" cx="50" cy="50" r="45" />
//               <circle
//                 className="progress"
//                 cx="50" cy="50" r="45"
//                 strokeDashoffset={dashOffset}
//               />
//             </svg>
//             <div className="amr-ring-label">{healthScore}%</div>
//           </div>
//           <p className="amr-ring-desc">
//             83% of isolates carry<br/>
//             &gt;1 AMR gene
//           </p>
//         </div>

//         {/* Organisms */}
//         <div className="amr-section-label">Organisms Detected</div>
//         <div className="amr-organisms">
//           {ORGANISMS.map(org => (
//             <div key={org.name} className="amr-org-row">
//               <span className="amr-org-name">{org.name}</span>
//               <span className={`amr-badge amr-badge--${org.status}`}>
//                 {org.status}
//               </span>
//             </div>
//           ))}
//         </div>

//         {/* Collapse toggle */}
//         <button className="amr-collapse-btn" aria-label="Collapse sidebar">
//           <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
//             <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2"
//               strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </button>
//       </aside>

//       {/* ══ MAIN CONTENT ══ */}
//       <main className="amr-main">
//         <div className="amr-content-grid">

//           {/* ── LEFT COLUMN ── */}
//           <div className="amr-left-col">

//             {/* AMR Genes table */}
//             <div className="amr-card">
//               <div className="amr-card-title">AMR Genes</div>
//               <table className="amr-gene-table">
//                 <thead>
//                   <tr>
//                     <th>Gene symbol</th>
//                     <th>Antibiotic class</th>
//                     <th>Element type</th>
//                     <th>% Identity</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {AMR_GENES.map(gene => (
//                     <tr key={gene.symbol}>
//                       <td style={{ fontFamily: "monospace", fontWeight: 500 }}>
//                         {gene.symbol}
//                       </td>
//                       <td>
//                         <span className={`gene-class-pill ${PILL_CLASS[gene.pillColor]}`}>
//                           {gene.antibioticClass}
//                         </span>
//                       </td>
//                       <td style={{ color: "#5a6b64", fontSize: 12 }}>
//                         {gene.elementType}
//                       </td>
//                       <td>
//                         <div className="identity-bar-wrap">
//                           <span style={{ fontSize: 12, minWidth: 38 }}>
//                             {gene.identity}%
//                           </span>
//                           <div className="identity-bar-track">
//                             <div
//                               className="identity-bar-fill"
//                               style={{
//                                 width: `${gene.identity}%`,
//                                 background: gene.barColor,
//                               }}
//                             />
//                           </div>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Integrons & ESBL/AmpC */}
//             <div className="amr-card">
//               <div className="amr-card-title">Integrons &amp; ESBL/AmpC</div>
//               <div className="amr-integron-grid">
//                 {INTEGRON_CARDS.map(card => (
//                   <div key={card.label} className="amr-integron-card">
//                     <div className="amr-integron-label">{card.label}</div>
//                     <div className={`amr-integron-value ${card.colorClass}`}>
//                       {card.value}
//                     </div>
//                     <div className="amr-integron-sub">{card.sub}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Predicted phenotypes */}
//             <div className="amr-card">
//               <div className="amr-card-title">Predicted Phenotypes</div>

//               <div className="amr-phenotype-section">
//                 <div className="amr-phenotype-label">Predicted antibiotic resistance</div>
//                 <div className="amr-pheno-chips">
//                   {PHENO_CHIPS.map(chip => (
//                     <span
//                       key={chip.label}
//                       className={`amr-pheno-chip chip-${chip.type}`}
//                     >
//                       {chip.label}
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div className="amr-phenotype-section">
//                 <div className="amr-phenotype-label">Plasmid types identified</div>
//                 <div className="amr-plasmid-chips">
//                   {PLASMID_TYPES.map(p => (
//                     <span key={p} className="amr-plasmid-chip">{p}</span>
//                   ))}
//                 </div>
//               </div>

//               <div className="amr-mlst-row">
//                 <span className="amr-mlst-label">MLST sequence type:</span>
//                 <span className="amr-mlst-value">ST-162 (ecoli_achtman_4)</span>
//               </div>
//             </div>
//           </div>

//           {/* ── RIGHT COLUMN ── */}
//           <div className="amr-right-col">

//             {/* River map */}
//             <div className="amr-map-card">
//               <div className="amr-card-title" style={{ color: "#1c2f42" }}>
//                 River Map View
//               </div>
//               <div className="amr-map-inner">
//                 <MapContainer
//                   center={[-29.0, 24.0]}
//                   zoom={5}
//                   zoomControl={false}
//                   style={{ width: "100%", height: "100%", minHeight: 200 }}
//                 >
//                   <TileLayer
//                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   />
//                   <FlyTo coords={[-29.0, 25.5]} />
//                   {RIVERS.map(river => (
//                     <CircleMarker
//                       key={river.name}
//                       center={river.coords}
//                       radius={8}
//                       pathOptions={{
//                         color: RISK_COLORS[river.risk],
//                         fillColor: RISK_COLORS[river.risk],
//                         fillOpacity: 0.85,
//                         weight: 2,
//                       }}
//                     >
//                       <Popup>
//                         <strong>{river.name}</strong><br />
//                         Risk: {river.risk}
//                       </Popup>
//                     </CircleMarker>
//                   ))}
//                 </MapContainer>

//                 {/* Legend overlay */}
//                 <div className="amr-map-legend">
//                   <div className="amr-map-legend-title">Health Status</div>
//                   <div className="amr-map-legend-row">
//                     <div className="amr-map-dot" style={{ background: "#4caf82" }}/>
//                     Low AMR Risk
//                   </div>
//                   <div className="amr-map-legend-row">
//                     <div className="amr-map-dot" style={{ background: "#f0a500" }}/>
//                     Medium AMR Risk
//                   </div>
//                   <div className="amr-map-legend-row">
//                     <div className="amr-map-dot" style={{ background: "#e04040" }}/>
//                     High AMR Risk
//                   </div>
//                   <div className="amr-map-legend-row">
//                     <div className="amr-map-dot" style={{ background: "#3a5060" }}/>
//                     No data
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Data Analysis card - real Recharts charts with tab switching */}
//             <DataAnalyticsCard />

//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

// src/pages/AmrProfiles/AmrProfiles.tsx
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './AmrProfiles.css';
import DataAnalyticsCard from '../../components/AMRProfiles/Dataanalyticscard';
import { useIsolates } from '../../context/IsolatesContext';
import {
  toAmrProfileData, toMapMarkers, classifyGene,
  type AmrProfileData, type RiskLevel,
} from '../../lib/transformers';
import type { IsolateRow } from '../../lib/api/types';

// ── Pill colour by gene class ──────────────────────────
const CLASS_PILL: Record<string, string> = {
  'Beta-lactam':    'pill-blue',
  'Tetracycline':   'pill-orange',
  'Sulfonamide':    'pill-purple',
  'Trimethoprim':   'pill-purple',
  'Aminoglycoside': 'pill-green',
  'Colistin':       'pill-red',
  'Macrolide':      'pill-red',
  'Quinolone':      'pill-orange',
  'Fosfomycin':     'pill-teal',
  'Bleomycin':      'pill-teal',
  'Phenicol':       'pill-blue',
  'Other':          'pill-teal',
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#4caf82', medium: '#f0a500', high: '#e04040',
};

function FlyTo({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(coords, 6, { duration: 1.2 }); }, [coords, map]);
  return null;
}

// ── Build groups by sequenceType (camelCase from API) ─
function buildGroups(isolates: IsolateRow[]): Map<string, IsolateRow[]> {
  const map = new Map<string, IsolateRow[]>();
  for (const row of isolates) {
    const st  = String(row.sequenceType ?? '').trim();
    const key = st && st !== '-' && st !== 'null' && st !== 'undefined'
      ? `ST-${st}` : 'Unknown ST';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return new Map([...map.entries()].sort((a, b) => b[1].length - a[1].length));
}

const PLACEHOLDER_COORDS: Record<string, [number, number]> = {};
const BASE_COORDS: [number, number][] = [
  [-25.7479, 28.2293], [-23.9045, 29.4688], [-25.8553, 25.6418], [-33.9249, 18.4241],
];

export default function AmrProfiles() {
  const { isolates, loading, error } = useIsolates();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const groups = buildGroups(isolates);
  const groupKeys = Array.from(groups.keys());

  // Assign stable placeholder coords to each group
  groupKeys.forEach((k, i) => {
    if (!PLACEHOLDER_COORDS[k]) {
      PLACEHOLDER_COORDS[k] = BASE_COORDS[i % BASE_COORDS.length];
    }
  });

  useEffect(() => {
    if (groupKeys.length > 0 && !selectedKey) setSelectedKey(groupKeys[0]);
  }, [groupKeys.length]);

  if (loading) return (
    <div className="amr-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#5a7a94', fontSize: 14 }}>Loading isolate data…</div>
    </div>
  );

  if (error) return (
    <div className="amr-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#e04040', fontSize: 14 }}>Failed to load data: {error}</div>
    </div>
  );

  const selectedIsolates = selectedKey ? (groups.get(selectedKey) ?? []) : [];
  const profile: AmrProfileData | null = selectedIsolates.length > 0
    ? toAmrProfileData(selectedKey!, selectedIsolates)
    : null;

  const mapMarkers  = toMapMarkers(isolates);
  const mapCenter: [number, number] = selectedKey && PLACEHOLDER_COORDS[selectedKey]
    ? PLACEHOLDER_COORDS[selectedKey] : [-28.0, 26.0];

  return (
    <div className="amr-page">

      {/* ══ SIDEBAR ══ */}
      <aside className="amr-sidebar">

        {/* Isolate group selector - native select showing all ST groups */}
        <div className="amr-search-wrap">
          <div className="amr-select-wrap">
            {/* <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: '#3eb99a', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg> */}
            <select
              className="amr-select"
              value={selectedKey ?? ''}
              onChange={e => setSelectedKey(e.target.value)}
            >
              {groupKeys.map(k => (
                <option key={k} value={k}>
                  {k} ({groups.get(k)?.length} isolates)
                </option>
              ))}
            </select>
            {/* <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: '#5a7a94', flexShrink: 0, pointerEvents: 'none' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg> */}
          </div>
        </div>

        {/* Site details section */}
        <div className="amr-section-label">Site Details</div>

        {/* Quality ring - green if ALL isolates passed, red if ANY failed */}
        {(() => {
          const allPassed  = profile ? profile.failedCount === 0 : false;
          const ringColor  = allPassed ? '#4caf82' : '#e04040';
          const ringLabel  = allPassed ? 'Passed' : 'Failed';
          const fillRatio  = profile
            ? profile.passedCount / Math.max(profile.totalIsolates, 1)
            : 0;
          const ringOffset = allPassed ? 0 : 283 - fillRatio * 283;

          return (
            <div className="amr-ring-block">
              <div className="amr-ring-wrap">
                <svg viewBox="0 0 100 100">
                  <circle className="track" cx="50" cy="50" r="45" />
                  <circle
                    className="progress"
                    cx="50" cy="50" r="45"
                    stroke={ringColor}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="amr-ring-label" style={{ color: ringColor, fontSize: 13 }}>
                  {ringLabel}
                </div>
              </div>
              <p className="amr-ring-desc">
                Quality status<br/>
                {profile
                  ? `${profile.passedCount} passed · ${profile.failedCount} failed`
                  : '-'}
              </p>
            </div>
          );
        })()}

        {/* Organisms Detected */}
        <div className="amr-section-label">Organisms Detected</div>
        <div className="amr-organisms">
          {[
            { name: 'Escherichia coli',      present: true  },
            { name: 'Klebsiella pneumoniae',  present: false },
            { name: 'Salmonella spp.',        present: false },
            { name: 'Serratia fonticola',     present: false },
          ].map(org => (
            <div key={org.name} className="amr-org-row">
              <span className="amr-org-name">{org.name}</span>
              <span className={`amr-badge amr-badge--${org.present ? 'present' : 'absent'}`}>
                {org.present ? 'present' : 'absent'}
              </span>
            </div>
          ))}
        </div>

        <button className="amr-collapse-btn" aria-label="Collapse sidebar">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="amr-main">

        {/* ── ROW 1: AMR Genes - full width ── */}
        {profile && profile.genes.length > 0 ? (
          <div className="amr-card">
            <div className="amr-card-title">
              AMR Genes - {selectedKey}
              <span style={{ fontSize: 10, fontWeight: 400, color: '#5a6b64', marginLeft: 8 }}>
                {profile.genes.length} gene{profile.genes.length !== 1 ? 's' : ''} across {profile.totalIsolates} isolates
              </span>
            </div>
            <table className="amr-gene-table">
              <thead>
                <tr>
                  <th>Gene symbol</th>
                  <th>Antibiotic class</th>
                  <th>Predicted phenotype</th>
                  <th>% Identity</th>
                </tr>
              </thead>
              <tbody>
                {profile.genes.map(gene => {
                  const cls = classifyGene(gene.gene_name);
                  return (
                    <tr key={gene.gene_name}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {gene.gene_name}
                      </td>
                      <td>
                        <span className={`gene-class-pill ${CLASS_PILL[cls] ?? 'pill-teal'}`}
                          style={{ fontSize: 10, textTransform: 'none' }}>
                          {cls}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#5a6b64' }}>
                        {gene.phenotype || '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, minWidth: 38 }}>
                            {gene.pct_identity}%
                          </span>
                          <div className="identity-bar-track">
                            <div className="identity-bar-fill"
                              style={{ width: `${gene.pct_identity}%`, background: '#3eb99a' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : profile ? (
          <div className="amr-card">
            <div className="amr-card-title">AMR Genes - {selectedKey}</div>
            <p style={{ color: '#5a6b64', fontSize: 13 }}>
              No resistance genes detected for this isolate group.
            </p>
          </div>
        ) : null}

        {/* ── ROW 2: Quality & Genomic Overview - full width ── */}
        {profile && (
          <div className="amr-card">
            <div className="amr-card-title">Quality &amp; Genomic Overview</div>
            <div className="amr-integron-grid">
              {[
                { label: 'Passed',   value: String(profile.passedCount),      sub: 'quality check',      active: profile.passedCount > 0       },
                { label: 'Failed',   value: String(profile.failedCount),      sub: 'quality check',      active: false                          },
                { label: 'Genes',    value: String(profile.genes.length),     sub: 'unique AMR genes',   active: profile.genes.length > 0       },
                { label: 'Plasmids', value: String(profile.plasmids.length),  sub: 'replicon types',     active: profile.plasmids.length > 0    },
                { label: 'Total',    value: String(profile.totalIsolates),    sub: 'isolates in group',  active: true                           },
              ].map(card => (
                <div key={card.label} className="amr-integron-card">
                  <div className="amr-integron-label">{card.label}</div>
                  <div className={`amr-integron-value ${card.active ? 'intval--active' : 'intval--zero'}`}>
                    {card.value}
                  </div>
                  <div className="amr-integron-sub">{card.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
              {[
                { label: 'Avg genome length', value: profile.genomeStats.avgGenomeLength.toLocaleString() + ' bp' },
                { label: 'Avg N50',           value: profile.genomeStats.avgN50.toLocaleString()                  },
                { label: 'Avg contigs',       value: profile.genomeStats.avgContigs.toLocaleString()              },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#162535', borderRadius: 6, padding: '8px 10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9, color: '#5a7a94', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8aa0b4' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ROW 3: Predicted Phenotypes (left) + Data Analysis (right) ── */}
        {profile && (
          <div className="amr-pheno-analytics-row">

            {/* Predicted Phenotypes */}
            <div className="amr-card">
              <div className="amr-card-title">Predicted Phenotypes</div>
              <div className="amr-phenotype-section">
                <div className="amr-phenotype-label">Predicted antibiotic resistance (StarAMR)</div>
                {profile.predictedPhenotypes.length > 0 ? (
                  <div className="amr-pheno-chips">
                    {profile.predictedPhenotypes.map(p => (
                      <span key={p} className="amr-pheno-chip chip-resistant">{p}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#5a6b64', fontSize: 12 }}>No phenotype data available</p>
                )}
              </div>
              {profile.plasmids.length > 0 && (
                <div className="amr-phenotype-section" style={{ marginTop: 12 }}>
                  <div className="amr-phenotype-label">Plasmid replicons identified</div>
                  <div className="amr-plasmid-chips">
                    {profile.plasmids.map(p => (
                      <span key={p.plasmid_name} className="amr-plasmid-chip">
                        {p.plasmid_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 11, color: '#5a6b64' }}>
                Sequence type: <strong style={{ color: '#3eb99a' }}>{profile.sequenceType || '-'}</strong>
              </div>
            </div>

            {/* Data Analysis */}
            <DataAnalyticsCard
              genes={profile.genes}
              plasmids={profile.plasmids}
              isolates={selectedIsolates}
            />
          </div>
        )}

        {/* ── ROW 4: Map - full width ── */}
        <div className="amr-map-card">
          <div className="amr-card-title" style={{ color: '#1c2f42' }}>
            Isolate Map View
            <span style={{ fontSize: 10, fontWeight: 400, color: '#8aa0b4', marginLeft: 8 }}>
              placeholder locations
            </span>
          </div>
          <div className="amr-map-inner">
            <MapContainer
              center={[-28.0, 26.0]}
              zoom={5}
              zoomControl={false}
              style={{ width: '100%', height: '100%', minHeight: 260 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo coords={mapCenter} />
              {mapMarkers.map(m => (
                <CircleMarker
                  key={m.id}
                  center={[m.lat, m.lng]}
                  radius={8}
                  pathOptions={{
                    color: RISK_COLORS[m.risk],
                    fillColor: RISK_COLORS[m.risk],
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <strong>{m.label}</strong><br/>
                    {m.count} isolates
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="amr-map-legend">
              <div className="amr-map-legend-title">Quality pass rate</div>
              {[
                { color: '#4caf82', label: 'High (≥60%)' },
                { color: '#f0a500', label: 'Medium (35–59%)' },
                { color: '#e04040', label: 'Low (<35%)' },
              ].map(l => (
                <div key={l.label} className="amr-map-legend-row">
                  <div className="amr-map-dot" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}