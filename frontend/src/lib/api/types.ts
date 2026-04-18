// // src/lib/api/types.ts
// // Matches the 28-column DASHBOARD_TEMPLATE row returned by GET /api/isolates

// export interface IsolateRow {
//   sample_name:          string;   // e.g. "UP_BN_LR_0001_Sample_001"
//   sample_analysis_type: string;   // "WGS" | "Metagenomics"
//   isolate_id:           string;   // e.g. "UPMP-1126_assembly.fasta"
//   organism:             string;   // e.g. "Escherichia coli"
//   sample_id:            string;   // e.g. "Sample_001"
//   isolation_source:     string;   // e.g. "Pivot point"
//   collection_date:      string;   // ISO date string "2024-03-15"
//   geo_loc_name:         string;   // e.g. "South Africa: Gauteng"
//   latitude:             number;
//   longitude:            number;
//   collected_by:         string;
//   amr_resistance_genes: string;   // comma-separated e.g. "aph(3')-Ia, blaCTX-M-14"
//   sequence_name:        string;
//   element_type:         string;   // "AMR" | "STRESS"
//   class:                string;   // "AMINOGLYCOSIDE" | "BETA-LACTAM" | ...
//   subclass:             string;
//   pct_coverage:         number;
//   pct_identity:         number;
//   alignment_length:     number;
//   ref_seq_length:       number;
//   accession:            string;
//   virulence_genes:      string;   // comma-separated or "none detected"
//   plasmid_replicons:    string;   // comma-separated e.g. "IncFIB(K), IncI1-I(Alpha)"
//   predicted_sir:        string;   // comma-separated antibiotics e.g. "ampicillin, ceftriaxone"
//   pH:                   number | null;
//   temp_water_c:         number | null;
//   tds_mg_l:             number | null;
//   dissolved_oxygen_mg_l:number | null;
// }

// export interface ApiResponse<T> {
//   status:  'success' | 'error';
//   data:    T;
//   message?: string;
// }
// src/lib/api/types.ts
// Matches GET /api/isolates — StarAMR Summary rows
// Column names vary by backend: handles both snake_case and Title Case

// src/lib/api/types.ts
// Matches the EXACT JSON shape returned by GET /api/isolates
// Source: IsolateExplorerItem from isolate.service.ts — all keys are camelCase

export interface IsolateGenotype {
  id:                 string;
  geneName:           string;            // ← camelCase from DB alias
  identityPercentage: number | null;
  overlapPercentage:  number | null;
  accessionId:        string | null;
}

export interface IsolatePhenotype {
  id:             string;
  antibioticName: string;               // ← camelCase from DB alias
}

export interface IsolatePlasmid {
  id:                 string;
  plasmidName:        string;           // ← camelCase from DB alias
  identityPercentage: number | null;
}

export interface IsolateRow {
  id:            string;
  isolateName:   string;               // e.g. "UPMP-1126_assembly.fasta"
  qualityModule: string;               // "Passed" | "Failed"
  sequenceType:  string | null;        // e.g. "131", "162", null
  genomeLength:  number | null;
  n50Value:      number | null;
  contigs:       number | null;
  genotypes:     IsolateGenotype[];    // from isolate_genotypes table
  phenotypes:    IsolatePhenotype[];   // from isolate_phenotypes table
  plasmids:      IsolatePlasmid[];     // from isolate_plasmids table
}

// Flattened types used by transformers and UI components
export interface GeneDetail {
  gene_name:    string;
  phenotype:    string;
  pct_identity: number;
  accession:    string;
}

export interface PlasmidDetail {
  plasmid_name: string;
  pct_identity: number;
}