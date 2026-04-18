// // src/lib/transformers.ts
// // Pure functions that convert IsolateRow[] → page-specific data shapes.
// // No fetch calls here — just data mapping.

// import type { IsolateRow } from './api/types';

// // ── Shared helpers ─────────────────────────────────────

// function splitList(raw: string | null | undefined): string[] {
//   if (!raw || raw.toLowerCase() === 'none detected') return [];
//   return raw.split(',').map(s => s.trim()).filter(Boolean);
// }

// function uniqueBy<T>(arr: T[], key: (item: T) => string): T[] {
//   const seen = new Set<string>();
//   return arr.filter(item => {
//     const k = key(item);
//     if (seen.has(k)) return false;
//     seen.add(k);
//     return true;
//   });
// }

// // ── Province / geo helpers ─────────────────────────────

// /** "South Africa: Gauteng" → "Gauteng" */
// export function parseProvince(geoLocName: string): string {
//   const parts = geoLocName.split(':');
//   return parts.length > 1 ? parts[1].trim() : geoLocName.trim();
// }

// // ── Map View transformers ──────────────────────────────

// export interface MapMarker {
//   id:        string;   // sample_name
//   lat:       number;
//   lng:       number;
//   province:  string;
//   geoLoc:    string;
//   risk:      'high' | 'medium' | 'low';
//   isolates:  IsolateRow[];  // all rows at this location
// }

// export interface MapOverviewStats {
//   totalIsolates:    number;
//   esblProducers:    number;  // isolates where class includes BETA-LACTAM resistance genes
//   resistanceGenes:  number;  // unique gene symbols
//   lastUpdated:      string;  // most recent collection_date
//   totalVisits:      number;  // unique collection_dates at location
// }

// /** Group isolates by lat/lon into map markers */
// export function toMapMarkers(isolates: IsolateRow[]): MapMarker[] {
//   const groups = new Map<string, IsolateRow[]>();

//   for (const row of isolates) {
//     const key = `${row.latitude},${row.longitude}`;
//     if (!groups.has(key)) groups.set(key, []);
//     groups.get(key)!.push(row);
//   }

//   return Array.from(groups.entries()).map(([key, rows]) => {
//     const first = rows[0];
//     const allGenes = rows.flatMap(r => splitList(r.amr_resistance_genes));
//     const uniqueGenes = new Set(allGenes).size;
//     const esblCount = rows.filter(r => r.class === 'BETA-LACTAM').length;

//     // Risk: >50% BETA-LACTAM = high, >25% = medium, else low
//     const ratio = esblCount / rows.length;
//     const risk: 'high' | 'medium' | 'low' =
//       ratio > 0.5 ? 'high' : ratio > 0.25 ? 'medium' : 'low';

//     return {
//       id:       key,
//       lat:      first.latitude,
//       lng:      first.longitude,
//       province: parseProvince(first.geo_loc_name),
//       geoLoc:   first.geo_loc_name,
//       risk,
//       isolates: rows,
//     };
//   });
// }

// export function toMapOverviewStats(isolates: IsolateRow[]): MapOverviewStats {
//   const allGenes   = new Set(isolates.flatMap(r => splitList(r.amr_resistance_genes)));
//   const dates      = isolates.map(r => r.collection_date).sort();
//   const uniqueDates = new Set(dates);

//   return {
//     totalIsolates:   isolates.length,
//     esblProducers:   isolates.filter(r => r.class === 'BETA-LACTAM').length,
//     resistanceGenes: allGenes.size,
//     lastUpdated:     dates[dates.length - 1] ?? '—',
//     totalVisits:     uniqueDates.size,
//   };
// }

// // ── AMR Profile transformers ───────────────────────────

// export interface ArmGeneRow {
//   symbol:      string;
//   className:   string;
//   subclass:    string;
//   elementType: string;
//   pctIdentity: number;
//   pctCoverage: number;
//   accession:   string;
// }

// export interface SirProfile {
//   resistant:    string[];
//   intermediate: string[];
//   susceptible:  string[];
// }

// export interface WaterQuality {
//   pH:               number | null;
//   tempC:            number | null;
//   tdsMgl:           number | null;
//   dissolvedOxygenMgl: number | null;
// }

// export interface AmrProfileData {
//   sampleName:       string;
//   organism:         string;
//   geoLoc:           string;
//   province:         string;
//   lat:              number;
//   lng:              number;
//   collectionDate:   string;
//   isolationSource:  string;
//   analysisType:     string;
//   // Sidebar
//   resistanceRatePct: number;
//   organisms:        { name: string; status: 'present' | 'absent' | 'trace' }[];
//   // Gene table
//   amrGenes:         ArmGeneRow[];
//   // SIR + phenotypes
//   sirProfile:       SirProfile;
//   predictedPhenotypes: string[];
//   plasmidTypes:     string[];
//   virulenceGenes:   string[];
//   // Water quality
//   waterQuality:     WaterQuality;
//   // Integrons / ESBL — from binary info embedded in isolate if available
//   intI1:            boolean;
//   intI2:            boolean;
//   intI3:            boolean;
//   esblProducer:     boolean;
//   ampcProducer:     boolean;
// }

// /**
//  * Converts all isolate rows for a single location (lat/lon group)
//  * into a single AmrProfileData object.
//  */
// export function toAmrProfileData(isolates: IsolateRow[]): AmrProfileData {
//   if (isolates.length === 0) throw new Error('No isolates provided');

//   const first = isolates[0];
//   const province = parseProvince(first.geo_loc_name);

//   // Unique gene rows
//   const amrGenes: ArmGeneRow[] = uniqueBy(
//     isolates.map(r => ({
//       symbol:      r.amr_resistance_genes.split(',')[0].trim(),
//       className:   r.class,
//       subclass:    r.subclass,
//       elementType: r.element_type,
//       pctIdentity: r.pct_identity,
//       pctCoverage: r.pct_coverage,
//       accession:   r.accession,
//     })),
//     g => g.symbol,
//   );

//   // SIR — all predicted phenotypes across isolates, deduplicated
//   const allPhenotypes = [
//     ...new Set(isolates.flatMap(r => splitList(r.predicted_sir))),
//   ];

//   // We don't have explicit S/I/R classification — we classify heuristically:
//   // Phenotypes = predicted resistant. No I or S data in the current schema.
//   const sirProfile: SirProfile = {
//     resistant:    allPhenotypes,
//     intermediate: [],
//     susceptible:  [],
//   };

//   // Organisms across all isolates at this location
//   const uniqueOrganisms = [...new Set(isolates.map(r => r.organism))];
//   const allOrganismNames = ['Escherichia coli', 'Klebsiella pneumoniae', 'Salmonella spp.', 'Serratia fonticola'];
//   const organisms = allOrganismNames.map(name => ({
//     name,
//     status: uniqueOrganisms.includes(name)
//       ? ('present' as const)
//       : ('absent' as const),
//   }));

//   // Resistance rate = proportion of isolates that carry ≥1 AMR gene
//   const withGenes = isolates.filter(r => splitList(r.amr_resistance_genes).length > 0);
//   const resistanceRatePct = Math.round((withGenes.length / isolates.length) * 100);

//   // Water quality — average across isolates at location (may be null)
//   const avg = (field: (r: IsolateRow) => number | null): number | null => {
//     const vals = isolates.map(field).filter((v): v is number => v !== null);
//     return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
//   };

//   return {
//     sampleName:       first.sample_name,
//     organism:         first.organism,
//     geoLoc:           first.geo_loc_name,
//     province,
//     lat:              first.latitude,
//     lng:              first.longitude,
//     collectionDate:   first.collection_date,
//     isolationSource:  first.isolation_source,
//     analysisType:     first.sample_analysis_type,
//     resistanceRatePct,
//     organisms,
//     amrGenes,
//     sirProfile,
//     predictedPhenotypes: allPhenotypes,
//     plasmidTypes:     [...new Set(isolates.flatMap(r => splitList(r.plasmid_replicons)))],
//     virulenceGenes:   [...new Set(isolates.flatMap(r => splitList(r.virulence_genes)))],
//     waterQuality: {
//       pH:               avg(r => r.pH),
//       tempC:            avg(r => r.temp_water_c),
//       tdsMgl:           avg(r => r.tds_mg_l),
//       dissolvedOxygenMgl: avg(r => r.dissolved_oxygen_mg_l),
//     },
//     // These fields are not yet in the dashboard template — default false until
//     // the backend exposes them from the BINARY_INFO table.
//     intI1:        false,
//     intI2:        false,
//     intI3:        false,
//     esblProducer: isolates.some(r => r.class === 'BETA-LACTAM'),
//     ampcProducer: false,
//   };
// }

// // ── River Flows transformers ───────────────────────────

// export type RiskLevel = 'high' | 'medium' | 'low';

// export interface VisitDot {
//   visit: string;   // "V1" … "VN"
//   date:  string;   // ISO date
//   color: string;
// }

// export interface RiverFlowData {
//   id:              string;   // geo_loc_name used as stable ID
//   name:            string;   // derived from geo_loc_name e.g. "Gauteng"
//   province:        string;
//   geoLoc:          string;
//   location:        string;   // human-readable
//   risk:            RiskLevel;
//   resistanceRate:  number;   // 0-100
//   isolatesTested:  number;
//   resistanceGenes: number;
//   visitsCompleted: number;
//   visits:          VisitDot[];
//   activities: {
//     name:   string;
//     status: 'safe' | 'caution' | 'unsafe';
//     icon:   string;
//   }[];
// }

// function resistanceRateToColor(rate: number): string {
//   if (rate >= 75) return '#d45050';
//   if (rate >= 60) return '#c46060';
//   if (rate >= 50) return '#c47a70';
//   if (rate >= 40) return '#d4a84a';
//   if (rate >= 30) return '#d4c840';
//   if (rate >= 20) return '#6dc472';
//   return '#4caf82';
// }

// function rateToRisk(rate: number): RiskLevel {
//   if (rate >= 60) return 'high';
//   if (rate >= 35) return 'medium';
//   return 'low';
// }

// /** Derives activity safety from resistance rate */
// function activitySafety(rate: number) {
//   const unsafe  = rate >= 70;
//   const caution = rate >= 40;
//   const toStatus = (flagUnsafe: boolean, flagCaution: boolean) =>
//     flagUnsafe ? 'unsafe' : flagCaution ? 'caution' : 'safe';

//   return [
//     { name: 'Swimming',   status: toStatus(unsafe, caution),              icon: 'swimming'   },
//     { name: 'Irrigation', status: toStatus(unsafe, caution),              icon: 'irrigation' },
//     { name: 'Drinking',   status: toStatus(true, true),                   icon: 'drinking'   }, // always at least caution
//     { name: 'Fishing',    status: toStatus(unsafe, caution),              icon: 'fishing'    },
//     { name: 'Farming',    status: toStatus(unsafe, caution),              icon: 'farming'    },
//     { name: 'Kayaking',   status: toStatus(false, rate >= 60),            icon: 'kayaking'   },
//   ] as { name: string; status: 'safe' | 'caution' | 'unsafe'; icon: string }[];
// }

// /** Groups isolates by province → one RiverFlowData per province */
// export function toRiverFlows(isolates: IsolateRow[]): RiverFlowData[] {
//   const groups = new Map<string, IsolateRow[]>();

//   for (const row of isolates) {
//     const key = row.geo_loc_name;
//     if (!groups.has(key)) groups.set(key, []);
//     groups.get(key)!.push(row);
//   }

//   return Array.from(groups.entries()).map(([geoLoc, rows]) => {
//     const province = parseProvince(geoLoc);

//     // Sort by collection_date to build visit timeline
//     const sorted = [...rows].sort(
//       (a, b) => new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime()
//     );

//     // Group by date → each unique date = one "visit"
//     const visitMap = new Map<string, IsolateRow[]>();
//     for (const r of sorted) {
//       if (!visitMap.has(r.collection_date)) visitMap.set(r.collection_date, []);
//       visitMap.get(r.collection_date)!.push(r);
//     }

//     const visits: VisitDot[] = Array.from(visitMap.entries()).map(
//       ([date, visitRows], i) => {
//         const genesInVisit = visitRows.filter(r => splitList(r.amr_resistance_genes).length > 0);
//         const visitRate = Math.round((genesInVisit.length / visitRows.length) * 100);
//         return {
//           visit: `V${i + 1}`,
//           date,
//           color: resistanceRateToColor(visitRate),
//         };
//       }
//     );

//     const allGenes    = new Set(rows.flatMap(r => splitList(r.amr_resistance_genes)));
//     const withGenes   = rows.filter(r => splitList(r.amr_resistance_genes).length > 0);
//     const resistanceRate = Math.round((withGenes.length / rows.length) * 100);

//     return {
//       id:              geoLoc,
//       name:            province,
//       province,
//       geoLoc,
//       location:        `${province} · ${geoLoc.split(':')[0].trim()}`,
//       risk:            rateToRisk(resistanceRate),
//       resistanceRate,
//       isolatesTested:  rows.length,
//       resistanceGenes: allGenes.size,
//       visitsCompleted: visitMap.size,
//       visits,
//       activities:      activitySafety(resistanceRate),
//     };
//   });
// }


// src/lib/transformers.ts
// Converts IsolateRow[] (camelCase, nested arrays) into page-specific data.
// Key field names match isolate.service.ts exactly:
//   isolateName, qualityModule, sequenceType, genomeLength, n50Value, contigs
//   genotypes[].geneName / identityPercentage / overlapPercentage / accessionId
//   phenotypes[].antibioticName
//   plasmids[].plasmidName / identityPercentage

import type { IsolateRow, GeneDetail, PlasmidDetail } from './api/types';

// ── Helpers ────────────────────────────────────────────

function uniqueBy<T>(arr: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── Gene classification by name prefix ────────────────

export function classifyGene(geneName: string): string {
  const s = geneName.toLowerCase();
  if (s.startsWith('bla'))                                      return 'Beta-lactam';
  if (s.startsWith('tet'))                                      return 'Tetracycline';
  if (s.startsWith('sul'))                                      return 'Sulfonamide';
  if (s.startsWith('dfr'))                                      return 'Trimethoprim';
  if (s.startsWith('aph') || s.startsWith('aac') ||
      s.startsWith('aad') || s.startsWith('ant') ||
      s.startsWith('rmtb'))                                     return 'Aminoglycoside';
  if (s.startsWith('mcr'))                                      return 'Colistin';
  if (s.startsWith('erm'))                                      return 'Macrolide';
  if (s.startsWith('qnr') || s.includes('oqx'))                return 'Quinolone';
  if (s.startsWith('fos'))                                      return 'Fosfomycin';
  if (s.startsWith('bleo'))                                     return 'Bleomycin';
  if (s.startsWith('cat') || s.startsWith('cml'))              return 'Phenicol';
  return 'Other';
}

// ── Extract gene details from nested genotypes[] ───────

export function extractGeneDetails(isolates: IsolateRow[]): GeneDetail[] {
  return uniqueBy(
    isolates.flatMap(row =>
      (row.genotypes ?? []).map(g => ({
        gene_name:    g.geneName,
        phenotype:    '',   // per-gene phenotype not in schema; comes from phenotypes[]
        pct_identity: g.identityPercentage !== null && g.identityPercentage !== undefined
          ? Number(g.identityPercentage)
          : 100,
        accession:    g.accessionId ?? '',
      }))
    ),
    g => g.gene_name,
  );
}

// ── Extract plasmid details from nested plasmids[] ─────

export function extractPlasmidDetails(isolates: IsolateRow[]): PlasmidDetail[] {
  return uniqueBy(
    isolates.flatMap(row =>
      (row.plasmids ?? []).map(p => ({
        plasmid_name:  p.plasmidName,
        pct_identity:  p.identityPercentage !== null && p.identityPercentage !== undefined
          ? Number(p.identityPercentage)
          : 0,
      }))
    ),
    p => p.plasmid_name,
  );
}

// ── AMR Profile ────────────────────────────────────────

export type RiskLevel = 'high' | 'medium' | 'low';

export interface AmrProfileData {
  groupLabel:          string;
  sequenceType:        string;
  scheme:              string;
  totalIsolates:       number;
  passedCount:         number;
  failedCount:         number;
  qualityPassPct:      number;
  genes:               GeneDetail[];
  plasmids:            PlasmidDetail[];
  predictedPhenotypes: string[];
  genomeStats: {
    avgGenomeLength: number;
    avgN50:          number;
    avgContigs:      number;
  };
}

export function toAmrProfileData(groupLabel: string, isolates: IsolateRow[]): AmrProfileData {
  if (isolates.length === 0) throw new Error('No isolates');

  const passed = isolates.filter(r => r.qualityModule === 'Passed').length;
  const failed = isolates.length - passed;

  const genes   = extractGeneDetails(isolates);
  const plasmids = extractPlasmidDetails(isolates);

  // Collect unique phenotypes from phenotypes[].antibioticName
  const predictedPhenotypes = [
    ...new Set(
      isolates.flatMap(r => (r.phenotypes ?? []).map(p => p.antibioticName))
    ),
  ].sort();

  const avg = (field: (r: IsolateRow) => number | null): number => {
    const vals = isolates.map(field).filter((v): v is number => v !== null && v > 0);
    return vals.length
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      : 0;
  };

  return {
    groupLabel,
    sequenceType:   String(isolates[0].sequenceType ?? '—'),
    scheme:         '—',
    totalIsolates:  isolates.length,
    passedCount:    passed,
    failedCount:    failed,
    qualityPassPct: Math.round((passed / isolates.length) * 100),
    genes,
    plasmids,
    predictedPhenotypes,
    genomeStats: {
      avgGenomeLength: avg(r => r.genomeLength),
      avgN50:          avg(r => r.n50Value),
      avgContigs:      avg(r => r.contigs),
    },
  };
}

// ── Chart helpers ──────────────────────────────────────

export function genesByClass(genes: GeneDetail[]) {
  const map = new Map<string, number>();
  for (const g of genes) {
    const cls = classifyGene(g.gene_name);
    map.set(cls, (map.get(cls) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ── River Flows ────────────────────────────────────────

export interface VisitDot { visit: string; color: string; }

export interface RiverFlowData {
  id:              string;
  name:            string;
  location:        string;
  risk:            RiskLevel;
  resistanceRate:  number;
  isolatesTested:  number;
  resistanceGenes: number;
  visitsCompleted: number;
  visits:          VisitDot[];
  activities:      { name: string; status: 'safe' | 'caution' | 'unsafe'; icon: string }[];
}

function rateToRisk(rate: number): RiskLevel {
  return rate >= 60 ? 'high' : rate >= 35 ? 'medium' : 'low';
}

function rateToColor(rate: number): string {
  if (rate >= 80) return '#d45050';
  if (rate >= 65) return '#c46060';
  if (rate >= 50) return '#c47a70';
  if (rate >= 40) return '#d4a84a';
  if (rate >= 30) return '#d4c840';
  if (rate >= 20) return '#6dc472';
  return '#4caf82';
}

function activitySafety(rate: number) {
  const unsafe  = rate >= 70;
  const caution = rate >= 40;
  const s = (u: boolean, c: boolean): 'safe' | 'caution' | 'unsafe' =>
    u ? 'unsafe' : c ? 'caution' : 'safe';
  return [
    { name: 'Swimming',   status: s(unsafe, caution),   icon: 'swimming'   },
    { name: 'Irrigation', status: s(unsafe, caution),   icon: 'irrigation' },
    { name: 'Drinking',   status: s(true,   true),      icon: 'drinking'   },
    { name: 'Fishing',    status: s(unsafe, caution),   icon: 'fishing'    },
    { name: 'Farming',    status: s(unsafe, caution),   icon: 'farming'    },
    { name: 'Kayaking',   status: s(false, rate >= 60), icon: 'kayaking'   },
  ] as { name: string; status: 'safe' | 'caution' | 'unsafe'; icon: string }[];
}

const RIVER_NAMES = [
  'Apies River', 'Henops River', 'Limpopo River', 'Lotus River',
  'Crocodile River', 'Vaal River', 'Orange River',
];

export function toRiverFlows(isolates: IsolateRow[]): RiverFlowData[] {
  // Group by sequenceType — each ST = one river/location cluster
  const groups = new Map<string, IsolateRow[]>();
  for (const row of isolates) {
    const st  = String(row.sequenceType ?? '').trim();
    const key = st && st !== '-' && st !== 'null' ? `ST-${st}` : 'Unknown ST';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([stLabel, rows], idx) => {
      // Count total unique genes across all isolates in this group
      const allGenes = new Set(
        rows.flatMap(r => (r.genotypes ?? []).map(g => g.geneName))
      );
      const passed = rows.filter(r => r.qualityModule === 'Passed').length;
      const rate   = Math.round((passed / rows.length) * 100);

      const step   = Math.max(1, Math.floor(rows.length / 7));
      const visits: VisitDot[] = rows
        .filter((_, i) => i % step === 0)
        .slice(0, 7)
        .map((_, i) => ({ visit: `V${i + 1}`, color: rateToColor(rate) }));

      return {
        id:              stLabel,
        name:            RIVER_NAMES[idx] ?? `River ${idx + 1}`,
        location:        `${stLabel} · ecoli_achtman_4`,
        risk:            rateToRisk(rate),
        resistanceRate:  rate,
        isolatesTested:  rows.length,
        resistanceGenes: allGenes.size,
        visitsCompleted: visits.length,
        visits,
        activities:      activitySafety(rate),
      };
    });
}

// ── Map markers ────────────────────────────────────────

export interface MapMarker {
  id:    string;
  lat:   number;
  lng:   number;
  label: string;
  risk:  RiskLevel;
  count: number;
}

const PLACEHOLDER_COORDS: [number, number][] = [
  [-25.7479, 28.2293],
  [-23.9045, 29.4688],
  [-25.8553, 25.6418],
  [-33.9249, 18.4241],
];

export function toMapMarkers(isolates: IsolateRow[]): MapMarker[] {
  const groups = new Map<string, IsolateRow[]>();
  for (const row of isolates) {
    const st  = String(row.sequenceType ?? '').trim();
    const key = st && st !== '-' ? `ST-${st}` : 'Unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return Array.from(groups.entries()).map(([key, rows], i) => {
    const passed = rows.filter(r => r.qualityModule === 'Passed').length;
    const rate   = Math.round((passed / rows.length) * 100);
    const coords = PLACEHOLDER_COORDS[i % PLACEHOLDER_COORDS.length];
    return {
      id:    key,
      lat:   coords[0],
      lng:   coords[1],
      label: key,
      risk:  rateToRisk(rate),
      count: rows.length,
    };
  });
}