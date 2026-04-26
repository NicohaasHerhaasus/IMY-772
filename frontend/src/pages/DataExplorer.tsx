// import { useState, useMemo } from 'react';
// import './DataExplorer.css';

// // ── Dataset ──────────────────────────────────────────────────────────────────
// // Mirrors the 15 rows in SampleDashboard.xlsx exactly.

// interface IsolateRecord {
//   sample_name:          string;
//   sample_analysis_type: string;
//   isolate_id:           string;
//   organism:             string;
//   sample_id:            string;
//   isolation_source:     string;
//   collection_date:      string;
//   geo_loc_name:         string;
//   latitude:             number;
//   longitude:            number;
//   collected_by:         string;
//   amr_resistance_genes: string;
//   sequence_name:        string;
//   element_type:         string;
//   class:                string;
//   subclass:             string;
//   pct_coverage:         number;
//   pct_identity:         number;
//   alignment_length:     number;
//   ref_seq_length:       number;
//   accession:            string;
//   virulence_genes:      string;
//   plasmid_replicons:    string;
//   predicted_sir:        string;
//   pH:                   number;
//   temp_water_c:         number;
//   tds_mg_l:             number;
//   dissolved_oxygen_mg_l: number;
// }

// const DATASET: IsolateRecord[] = [
//   { sample_name:'UP_BN_LR_0001_Sample_001', sample_analysis_type:'WGS', isolate_id:'UPMP-1126_assembly.fasta', organism:'Escherichia coli', sample_id:'Sample_001', isolation_source:'Pivot point', collection_date:'2024-03-15', geo_loc_name:'South Africa: Gauteng', latitude:-25.7479, longitude:28.2293, collected_by:'L. Richter', amr_resistance_genes:"aph(3')-Ia, blaCTX-M-14, blaTEM-1B", sequence_name:'aminoglycoside phosphotransferase', element_type:'AMR', class:'AMINOGLYCOSIDE', subclass:'KANAMYCIN', pct_coverage:99.7, pct_identity:100, alignment_length:816, ref_seq_length:816, accession:'WP_000018329.1', virulence_genes:'eae, hlyA', plasmid_replicons:'IncFIB(K), IncI1-I(Alpha)', predicted_sir:'ampicillin, ceftriaxone, kanamycin', pH:6.9, temp_water_c:24.2, tds_mg_l:624, dissolved_oxygen_mg_l:9.2 },
//   { sample_name:'UP_BN_LR_0002_Sample_002', sample_analysis_type:'WGS', isolate_id:'UPMP-1129_assembly.fasta', organism:'Escherichia coli', sample_id:'Sample_002', isolation_source:'Water reservoir', collection_date:'2024-05-20', geo_loc_name:'South Africa: Gauteng', latitude:-25.7479, longitude:28.2293, collected_by:'J. van der Merwe', amr_resistance_genes:"aph(3')-Ia, blaCTX-M-14, bleO, fosA3", sequence_name:'aminoglycoside phosphotransferase', element_type:'AMR', class:'AMINOGLYCOSIDE', subclass:'KANAMYCIN', pct_coverage:99.6, pct_identity:99.3, alignment_length:816, ref_seq_length:816, accession:'WP_000018329.1', virulence_genes:'iucA, iroN', plasmid_replicons:'Col(BS512), IncFIB(AP001918)', predicted_sir:'ampicillin, ceftriaxone, bleomycin, fosfomycin, kanamycin', pH:6.6, temp_water_c:15.6, tds_mg_l:504, dissolved_oxygen_mg_l:4.6 },
//   { sample_name:'UP_BN_LR_0003_Sample_003', sample_analysis_type:'WGS', isolate_id:'UPMP-1131_assembly.fasta', organism:'Escherichia coli', sample_id:'Sample_003', isolation_source:'Slaughter floor', collection_date:'2024-06-10', geo_loc_name:'South Africa: Limpopo', latitude:-23.9045, longitude:29.4688, collected_by:'T. Mokoena', amr_resistance_genes:"aph(3')-Ia, blaCTX-M-14, bleO, fosA3", sequence_name:'aminoglycoside phosphotransferase', element_type:'AMR', class:'AMINOGLYCOSIDE', subclass:'KANAMYCIN', pct_coverage:99.5, pct_identity:98.7, alignment_length:816, ref_seq_length:816, accession:'WP_000018329.1', virulence_genes:'eae, hlyA', plasmid_replicons:'Col(BS512), IncFIB(AP001918)', predicted_sir:'ampicillin, ceftriaxone, bleomycin, fosfomycin, kanamycin', pH:7.3, temp_water_c:16.6, tds_mg_l:759, dissolved_oxygen_mg_l:8.5 },
//   { sample_name:'UP_BN_LR_0004_Sample_004', sample_analysis_type:'WGS', isolate_id:'UPMP-1515_assembly.fasta', organism:'Klebsiella pneumoniae', sample_id:'Sample_004', isolation_source:'Carcass swab', collection_date:'2024-08-14', geo_loc_name:'South Africa: Limpopo', latitude:-23.9045, longitude:29.4688, collected_by:'L. Richter', amr_resistance_genes:"aph(3')-IIa, blaCTX-M-14, bleO, fosA3, tet(A)", sequence_name:'aminoglycoside phosphotransferase IIa', element_type:'AMR', class:'AMINOGLYCOSIDE', subclass:'KANAMYCIN', pct_coverage:99.6, pct_identity:99.8, alignment_length:795, ref_seq_length:795, accession:'WP_063856695.1', virulence_genes:'none detected', plasmid_replicons:'IncFIB(AP001918), IncI1-I(Alpha)', predicted_sir:'ampicillin, ceftriaxone, bleomycin, fosfomycin, kanamycin, tetracycline', pH:7.0, temp_water_c:15.6, tds_mg_l:684, dissolved_oxygen_mg_l:5.0 },
//   { sample_name:'UP_BN_LR_0005_Sample_005', sample_analysis_type:'WGS', isolate_id:'UPMP-1547_assembly.fasta', organism:'Klebsiella pneumoniae', sample_id:'Sample_005', isolation_source:'Soil sample', collection_date:'2024-09-03', geo_loc_name:'South Africa: North West', latitude:-25.8553, longitude:25.6418, collected_by:'J. van der Merwe', amr_resistance_genes:'blaCTX-M-15, dfrA14, sul2, tet(B)', sequence_name:'class A beta-lactamase CTX-M-15', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.3, pct_identity:99.1, alignment_length:876, ref_seq_length:876, accession:'WP_000027057.2', virulence_genes:'stx1, stx2', plasmid_replicons:'IncF, IncI1', predicted_sir:'ampicillin, ceftriaxone, sulfisoxazole, tetracycline, trimethoprim', pH:7.5, temp_water_c:25.3, tds_mg_l:661, dissolved_oxygen_mg_l:7.3 },
//   { sample_name:'UP_BN_LR_0006_Sample_006', sample_analysis_type:'WGS', isolate_id:'UPMP-1549_assembly.fasta', organism:'Klebsiella pneumoniae', sample_id:'Sample_006', isolation_source:'Faecal sample', collection_date:'2024-03-15', geo_loc_name:'South Africa: Gauteng', latitude:-25.7479, longitude:28.2293, collected_by:'T. Mokoena', amr_resistance_genes:"blaCTX-M-55, qnrS1, aac(6')-Ib-cr, sul1", sequence_name:'class A beta-lactamase CTX-M-55', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.9, pct_identity:99.8, alignment_length:876, ref_seq_length:876, accession:'WP_058842329.1', virulence_genes:'stx1, stx2', plasmid_replicons:'IncFII, IncN', predicted_sir:'ampicillin, ceftriaxone, ciprofloxacin, sulfisoxazole', pH:7.6, temp_water_c:26.2, tds_mg_l:554, dissolved_oxygen_mg_l:8.2 },
//   { sample_name:'UP_BN_LR_0007_Sample_007', sample_analysis_type:'WGS', isolate_id:'UPMP-1551_assembly.fasta', organism:'Klebsiella pneumoniae', sample_id:'Sample_007', isolation_source:'Feed sample', collection_date:'2024-05-20', geo_loc_name:'South Africa: Gauteng', latitude:-25.7479, longitude:28.2293, collected_by:'L. Richter', amr_resistance_genes:"blaTEM-1B, tet(A), sul2, aph(6)-Id", sequence_name:'class A beta-lactamase TEM-1B', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.7, pct_identity:98.8, alignment_length:861, ref_seq_length:861, accession:'WP_000027057.1', virulence_genes:'eae, hlyA', plasmid_replicons:'IncFIB(AP001918), IncX1', predicted_sir:'ampicillin, streptomycin, sulfisoxazole, tetracycline', pH:8.2, temp_water_c:26.1, tds_mg_l:757, dissolved_oxygen_mg_l:6.5 },
//   { sample_name:'UP_BN_LR_0008_Sample_008', sample_analysis_type:'WGS', isolate_id:'UPMP-1716_assembly.fasta', organism:'Klebsiella pneumoniae', sample_id:'Sample_008', isolation_source:'Pivot point', collection_date:'2024-06-10', geo_loc_name:'South Africa: Limpopo', latitude:-23.9045, longitude:29.4688, collected_by:'J. van der Merwe', amr_resistance_genes:"blaCTX-M-15, blaTEM-1B, aph(3')-Ia, qnrB2", sequence_name:'class A beta-lactamase CTX-M-15', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.9, pct_identity:99.0, alignment_length:876, ref_seq_length:876, accession:'WP_000027057.2', virulence_genes:'none detected', plasmid_replicons:'IncFII, IncI1-I(Alpha)', predicted_sir:'ampicillin, ceftriaxone, ciprofloxacin, kanamycin', pH:7.1, temp_water_c:15.5, tds_mg_l:337, dissolved_oxygen_mg_l:9.5 },
//   { sample_name:'UP_BN_LR_0009_Sample_009', sample_analysis_type:'WGS', isolate_id:'UPMP-1722_assembly.fasta', organism:'Escherichia coli', sample_id:'Sample_009', isolation_source:'Water reservoir', collection_date:'2024-08-14', geo_loc_name:'South Africa: Limpopo', latitude:-23.9045, longitude:29.4688, collected_by:'T. Mokoena', amr_resistance_genes:'blaCTX-M-14, fosA3, rmtB, tet(A)', sequence_name:'class A beta-lactamase CTX-M-14', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.7, pct_identity:99.1, alignment_length:876, ref_seq_length:876, accession:'WP_010896559.1', virulence_genes:'none detected', plasmid_replicons:'IncFIB(K), IncI2', predicted_sir:'aminoglycosides, ampicillin, ceftriaxone, fosfomycin, tetracycline', pH:7.7, temp_water_c:14.7, tds_mg_l:416, dissolved_oxygen_mg_l:9.7 },
//   { sample_name:'UP_BN_LR_0010_Sample_010', sample_analysis_type:'WGS', isolate_id:'UPMP-1725_assembly.fasta', organism:'Serratia fonticola', sample_id:'Sample_010', isolation_source:'Slaughter floor', collection_date:'2024-09-03', geo_loc_name:'South Africa: North West', latitude:-25.8553, longitude:25.6418, collected_by:'L. Richter', amr_resistance_genes:'mcr-1, blaTEM-1B, sul2, tet(B)', sequence_name:'phosphoethanolamine transferase MCR-1', element_type:'AMR', class:'COLISTIN', subclass:'COLISTIN', pct_coverage:99.9, pct_identity:99.9, alignment_length:1824, ref_seq_length:1824, accession:'WP_049678004.1', virulence_genes:'eae, hlyA', plasmid_replicons:'IncI2, IncX4', predicted_sir:'ampicillin, colistin, sulfisoxazole, tetracycline', pH:6.9, temp_water_c:12.5, tds_mg_l:371, dissolved_oxygen_mg_l:5.9 },
//   { sample_name:'UP_BN_LR_0011_Sample_011', sample_analysis_type:'WGS', isolate_id:'UPMP-1727_assembly.fasta', organism:'Serratia fonticola', sample_id:'Sample_011', isolation_source:'Carcass swab', collection_date:'2024-03-15', geo_loc_name:'South Africa: Gauteng', latitude:-25.7479, longitude:28.2293, collected_by:'J. van der Merwe', amr_resistance_genes:"blaCTX-M-27, aph(3')-Ia, dfrA17, aadA5", sequence_name:'class A beta-lactamase CTX-M-27', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.9, pct_identity:100, alignment_length:876, ref_seq_length:876, accession:'WP_012510424.1', virulence_genes:'eae, hlyA', plasmid_replicons:'IncF, IncB/O', predicted_sir:'ampicillin, ceftriaxone, kanamycin, streptomycin, trimethoprim', pH:7.6, temp_water_c:18.5, tds_mg_l:790, dissolved_oxygen_mg_l:6.9 },
//   { sample_name:'UP_BN_LR_0012_Sample_012', sample_analysis_type:'WGS', isolate_id:'UPMP-1745_assembly.fasta', organism:'Serratia fonticola', sample_id:'Sample_012', isolation_source:'Soil sample', collection_date:'2024-05-20', geo_loc_name:'South Africa: Gauteng', latitude:-25.7479, longitude:28.2293, collected_by:'T. Mokoena', amr_resistance_genes:"blaCTX-M-15, aac(6')-Ib-cr, qnrS1, tet(A), sul1", sequence_name:'class A beta-lactamase CTX-M-15', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.8, pct_identity:98.5, alignment_length:876, ref_seq_length:876, accession:'WP_000027057.2', virulence_genes:'fimH, papC', plasmid_replicons:'IncFII, IncHI2', predicted_sir:'ampicillin, ceftriaxone, ciprofloxacin, sulfisoxazole, tetracycline', pH:7.5, temp_water_c:16.3, tds_mg_l:559, dissolved_oxygen_mg_l:9.3 },
//   { sample_name:'UP_BN_LR_0013_Sample_013', sample_analysis_type:'WGS', isolate_id:'UPMP-1749_assembly.fasta', organism:'Serratia fonticola', sample_id:'Sample_013', isolation_source:'Faecal sample', collection_date:'2024-06-10', geo_loc_name:'South Africa: Limpopo', latitude:-23.9045, longitude:29.4688, collected_by:'L. Richter', amr_resistance_genes:"blaCTX-M-14, blaTEM-1B, aph(6)-Id, sul2", sequence_name:'class A beta-lactamase CTX-M-14', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.3, pct_identity:99.1, alignment_length:876, ref_seq_length:876, accession:'WP_010896559.1', virulence_genes:'eae, hlyA', plasmid_replicons:'IncFIB(AP001918), IncI1', predicted_sir:'ampicillin, ceftriaxone, streptomycin, sulfisoxazole', pH:7.4, temp_water_c:13.5, tds_mg_l:183, dissolved_oxygen_mg_l:5.1 },
//   { sample_name:'UP_BN_LR_0014_Sample_014', sample_analysis_type:'WGS', isolate_id:'UPMP-1761_assembly.fasta', organism:'Salmonella spp.', sample_id:'Sample_014', isolation_source:'Feed sample', collection_date:'2024-08-14', geo_loc_name:'South Africa: Limpopo', latitude:-23.9045, longitude:29.4688, collected_by:'J. van der Merwe', amr_resistance_genes:"erm(B), tet(M), aph(3')-Ia, blaTEM-1B", sequence_name:'23S rRNA methyltransferase ErmB', element_type:'AMR', class:'MACROLIDE', subclass:'MACROLIDE', pct_coverage:99.4, pct_identity:99.7, alignment_length:738, ref_seq_length:738, accession:'WP_000199978.1', virulence_genes:'stx1, stx2', plasmid_replicons:'IncFII, IncRepB/Rep_3', predicted_sir:'ampicillin, erythromycin, kanamycin, tetracycline', pH:6.6, temp_water_c:18.3, tds_mg_l:847, dissolved_oxygen_mg_l:7.3 },
//   { sample_name:'UP_BN_LR_0015_Sample_015', sample_analysis_type:'WGS', isolate_id:'UPMP-1772_assembly.fasta', organism:'Salmonella spp.', sample_id:'Sample_015', isolation_source:'Pivot point', collection_date:'2024-09-03', geo_loc_name:'South Africa: North West', latitude:-25.8553, longitude:25.6418, collected_by:'T. Mokoena', amr_resistance_genes:"blaCTX-M-55, qnrB2, aac(6')-Ib-cr, fosA3, tet(A)", sequence_name:'class A beta-lactamase CTX-M-55', element_type:'AMR', class:'BETA-LACTAM', subclass:'BETA-LACTAM', pct_coverage:99.2, pct_identity:98.6, alignment_length:876, ref_seq_length:876, accession:'WP_058842329.1', virulence_genes:'iucA, iroN', plasmid_replicons:'IncFII, IncN, IncX1', predicted_sir:'ampicillin, ceftriaxone, ciprofloxacin, fosfomycin, tetracycline', pH:8.0, temp_water_c:24.4, tds_mg_l:688, dissolved_oxygen_mg_l:6.3 },
// ];

// // ── Helpers ───────────────────────────────────────────────────────────────────

// function unique<T>(arr: T[]): T[] { return [...new Set(arr)]; }

// function downloadCSV(rows: IsolateRecord[]) {
//   const headers = [
//     '*sample_name','*sample_analysis_type','isolate_id','organism','sample_id',
//     'isolation_source','collection_date','*geo_loc_name','latitude','longitude',
//     'collected_by','amr_resistance_genes','sequence_name','element_type','class',
//     'subclass','pct_coverage','pct_identity','alignment_length','ref_seq_length',
//     'accession','virulence_genes','plasmid_replicons','predicted_sir',
//     'pH','temp_water_c','tds_mg_l','dissolved_oxygen_mg_l',
//   ];
//   const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
//   const lines  = [
//     headers.join(','),
//     ...rows.map(r => [
//       r.sample_name, r.sample_analysis_type, r.isolate_id, r.organism, r.sample_id,
//       r.isolation_source, r.collection_date, r.geo_loc_name, r.latitude, r.longitude,
//       r.collected_by, r.amr_resistance_genes, r.sequence_name, r.element_type, r.class,
//       r.subclass, r.pct_coverage, r.pct_identity, r.alignment_length, r.ref_seq_length,
//       r.accession, r.virulence_genes, r.plasmid_replicons, r.predicted_sir,
//       r.pH, r.temp_water_c, r.tds_mg_l, r.dissolved_oxygen_mg_l,
//     ].map(escape).join(',')),
//   ];
//   const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
//   const url  = URL.createObjectURL(blob);
//   const a    = document.createElement('a');
//   a.href     = url;
//   a.download = `ecomap_query_${new Date().toISOString().slice(0,10)}.csv`;
//   a.click();
//   URL.revokeObjectURL(url);
// }

// // ── Filter state ──────────────────────────────────────────────────────────────

// interface Filters {
//   geo:        string;
//   dateFrom:   string;
//   dateTo:     string;
//   collectedBy: string;
//   amrGene:    string;
//   sir:        string;
//   organism:   string;
//   source:     string;
//   amrClass:   string;
//   virulence:  string;
//   plasmid:    string;
//   idMin:      string;
//   idMax:      string;
//   phMin:      string;
//   phMax:      string;
//   tempMin:    string;
//   tempMax:    string;
//   tdsMin:     string;
//   tdsMax:     string;
//   doMin:      string;
//   doMax:      string;
// }

// const EMPTY_FILTERS: Filters = {
//   geo:'', dateFrom:'', dateTo:'', collectedBy:'', amrGene:'', sir:'',
//   organism:'', source:'', amrClass:'', virulence:'', plasmid:'',
//   idMin:'', idMax:'', phMin:'', phMax:'',
//   tempMin:'', tempMax:'', tdsMin:'', tdsMax:'', doMin:'', doMax:'',
// };

// // ── Sub-components ────────────────────────────────────────────────────────────

// interface SelectFieldProps {
//   label: string;
//   obligation: 'm' | 'b' | 'y';
//   value: string;
//   onChange: (v: string) => void;
//   options: string[];
//   placeholder?: string;
//   hasTealBorder?: boolean;
//   hasBlueBorder?: boolean;
// }

// function SelectField({ label, obligation, value, onChange, options, placeholder = 'All', hasTealBorder, hasBlueBorder }: SelectFieldProps) {
//   const dotClass = obligation === 'm' ? 'de-dot de-dot--green'
//                  : obligation === 'b' ? 'de-dot de-dot--blue'
//                  : 'de-dot de-dot--amber';
//   const lblClass = obligation === 'm' ? 'de-flabel de-flabel--green'
//                  : obligation === 'b' ? 'de-flabel de-flabel--blue'
//                  : 'de-flabel de-flabel--amber';
//   const selClass = `de-select${hasTealBorder ? ' de-select--teal' : hasBlueBorder ? ' de-select--blue' : ''}`;
//   return (
//     <div className="de-field">
//       <div className={lblClass}><span className={dotClass} />{label}</div>
//       <select className={selClass} value={value} onChange={e => onChange(e.target.value)}>
//         <option value="">{placeholder}</option>
//         {options.map(o => <option key={o} value={o}>{o}</option>)}
//       </select>
//     </div>
//   );
// }

// interface RangePairProps {
//   label: string;
//   minVal: string; maxVal: string;
//   onMinChange: (v: string) => void; onMaxChange: (v: string) => void;
//   step?: string; unit?: string;
// }

// function RangePair({ label, minVal, maxVal, onMinChange, onMaxChange, step = '0.1', unit }: RangePairProps) {
//   return (
//     <div className="de-field">
//       <div className="de-flabel de-flabel--amber"><span className="de-dot de-dot--amber" />{label}{unit ? ` (${unit})` : ''}</div>
//       <div className="de-range-row">
//         <input className="de-range-inp" type="number" step={step} placeholder="Min" value={minVal} onChange={e => onMinChange(e.target.value)} />
//         <input className="de-range-inp" type="number" step={step} placeholder="Max" value={maxVal} onChange={e => onMaxChange(e.target.value)} />
//       </div>
//     </div>
//   );
// }

// // ── Main component ────────────────────────────────────────────────────────────

// export default function DataExplorer() {
//   const [filters,   setFilters]   = useState<Filters>(EMPTY_FILTERS);
//   const [results,   setResults]   = useState<IsolateRecord[] | null>(null);
//   const [hasQueried, setHasQueried] = useState(false);

//   // derive unique option lists from dataset
//   const opts = useMemo(() => ({
//     geos:       unique(DATASET.map(r => r.geo_loc_name)).sort(),
//     collectors: unique(DATASET.map(r => r.collected_by)).sort(),
//     genes:      unique(DATASET.flatMap(r => r.amr_resistance_genes.split(', '))).sort(),
//     sirs:       unique(DATASET.flatMap(r => r.predicted_sir.split(', '))).sort(),
//     organisms:  unique(DATASET.map(r => r.organism)).sort(),
//     sources:    unique(DATASET.map(r => r.isolation_source)).sort(),
//     classes:    unique(DATASET.map(r => r.class)).sort(),
//     virulences: unique(DATASET.map(r => r.virulence_genes)).sort(),
//     plasmids:   unique(DATASET.flatMap(r => r.plasmid_replicons.split(', '))).sort(),
//     types:      unique(DATASET.map(r => r.sample_analysis_type)).sort(),
//   }), []);

//   const setF = (key: keyof Filters) => (val: string) =>
//     setFilters(prev => ({ ...prev, [key]: val }));

//   function runQuery() {
//     const f = filters;
//     const filtered = DATASET.filter(r => {
//       if (f.geo        && r.geo_loc_name !== f.geo)            return false;
//       if (f.collectedBy && r.collected_by !== f.collectedBy)   return false;
//       if (f.amrGene    && !r.amr_resistance_genes.includes(f.amrGene)) return false;
//       if (f.sir        && !r.predicted_sir.includes(f.sir))    return false;
//       if (f.organism   && r.organism !== f.organism)           return false;
//       if (f.source     && r.isolation_source !== f.source)     return false;
//       if (f.amrClass   && r.class !== f.amrClass)              return false;
//       if (f.virulence  && r.virulence_genes !== f.virulence)   return false;
//       if (f.plasmid    && !r.plasmid_replicons.includes(f.plasmid)) return false;
//       if (f.dateFrom   && r.collection_date < f.dateFrom)      return false;
//       if (f.dateTo     && r.collection_date > f.dateTo)        return false;
//       if (f.idMin      && r.pct_identity   < parseFloat(f.idMin))  return false;
//       if (f.idMax      && r.pct_identity   > parseFloat(f.idMax))  return false;
//       if (f.phMin      && r.pH             < parseFloat(f.phMin))   return false;
//       if (f.phMax      && r.pH             > parseFloat(f.phMax))   return false;
//       if (f.tempMin    && r.temp_water_c   < parseFloat(f.tempMin)) return false;
//       if (f.tempMax    && r.temp_water_c   > parseFloat(f.tempMax)) return false;
//       if (f.tdsMin     && r.tds_mg_l       < parseFloat(f.tdsMin))  return false;
//       if (f.tdsMax     && r.tds_mg_l       > parseFloat(f.tdsMax))  return false;
//       if (f.doMin      && r.dissolved_oxygen_mg_l < parseFloat(f.doMin)) return false;
//       if (f.doMax      && r.dissolved_oxygen_mg_l > parseFloat(f.doMax)) return false;
//       return true;
//     });
//     setResults(filtered);
//     setHasQueried(true);
//   }

//   function resetAll() {
//     setFilters(EMPTY_FILTERS);
//     setResults(null);
//     setHasQueried(false);
//   }

//   // Derived stats
//   const uniqueGeneCount = results
//     ? unique(results.flatMap(r => r.amr_resistance_genes.split(', '))).length
//     : 0;
//   const uniqueOrgCount  = results ? unique(results.map(r => r.organism)).length : 0;

//   // Active filter tags (label → value pairs where value is non-empty)
//   const activeTags: { label: string; value: string }[] = [
//     { label: 'Region',    value: filters.geo },
//     { label: 'Organism',  value: filters.organism },
//     { label: 'By',        value: filters.collectedBy },
//     { label: 'Gene',      value: filters.amrGene },
//     { label: 'SIR',       value: filters.sir },
//     { label: 'Source',    value: filters.source },
//     { label: 'Class',     value: filters.amrClass },
//     { label: 'Virulence', value: filters.virulence },
//     { label: 'Plasmid',   value: filters.plasmid },
//     ...(filters.dateFrom || filters.dateTo
//       ? [{ label: 'Date', value: `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}` }]
//       : []),
//     ...(filters.idMin || filters.idMax
//       ? [{ label: '% Identity', value: `${filters.idMin || '0'}–${filters.idMax || '100'}` }]
//       : []),
//     ...(filters.phMin || filters.phMax
//       ? [{ label: 'pH', value: `${filters.phMin || '0'}–${filters.phMax || '14'}` }]
//       : []),
//   ].filter(t => t.value !== '');

//   return (
//     <div className="de-page">

//       {/* ══ SIDEBAR ══ */}
//       <aside className="de-sidebar">
//         <div className="de-sidebar-head">
//           <div className="de-sidebar-title">Query builder</div>
//           <div className="de-legend">
//             <div className="de-legend-item"><span className="de-dot de-dot--green" />Mandatory</div>
//             <div className="de-legend-item"><span className="de-dot de-dot--blue" />At least one required</div>
//             <div className="de-legend-item"><span className="de-dot de-dot--amber" />Optional</div>
//           </div>
//         </div>

//         <div className="de-sidebar-body">

//           {/* ── Mandatory ── */}
//           <div className="de-section-label">Mandatory fields</div>

//           <SelectField label="*Geographic location" obligation="m" value={filters.geo} onChange={setF('geo')} options={opts.geos} placeholder="All regions" hasTealBorder />

//           <div className="de-field">
//             <div className="de-flabel de-flabel--green"><span className="de-dot de-dot--green" />*Collection date</div>
//             <div className="de-date-row">
//               <input className="de-date-inp" type="date" value={filters.dateFrom} onChange={e => setF('dateFrom')(e.target.value)} />
//               <input className="de-date-inp" type="date" value={filters.dateTo}   onChange={e => setF('dateTo')(e.target.value)} />
//             </div>
//           </div>

//           <SelectField label="*Collected by" obligation="m" value={filters.collectedBy} onChange={setF('collectedBy')} options={opts.collectors} hasTealBorder />

//           <SelectField label="*AMR resistance gene" obligation="m" value={filters.amrGene} onChange={setF('amrGene')} options={opts.genes} placeholder="All genes" hasTealBorder />

//           <SelectField label="*Predicted SIR (antibiotic)" obligation="m" value={filters.sir} onChange={setF('sir')} options={opts.sirs} placeholder="Any antibiotic" hasTealBorder />

//           {/* ── At-least-one ── */}
//           <div className="de-section-label" style={{ marginTop: 10 }}>At least one required</div>

//           <SelectField label="Organism" obligation="b" value={filters.organism} onChange={setF('organism')} options={opts.organisms} hasBlueBorder />
//           <SelectField label="Isolation source" obligation="b" value={filters.source} onChange={setF('source')} options={opts.sources} hasBlueBorder />

//           {/* ── Optional ── */}
//           <div className="de-section-label" style={{ marginTop: 10 }}>Optional fields</div>

//           <SelectField label="AMR class" obligation="y" value={filters.amrClass} onChange={setF('amrClass')} options={opts.classes} placeholder="All classes" />
//           <SelectField label="Virulence genes" obligation="y" value={filters.virulence} onChange={setF('virulence')} options={opts.virulences} placeholder="All virulence genes" />
//           <SelectField label="Plasmid replicons" obligation="y" value={filters.plasmid} onChange={setF('plasmid')} options={opts.plasmids} placeholder="All replicons" />

//           <RangePair label="% Identity"     minVal={filters.idMin}   maxVal={filters.idMax}   onMinChange={setF('idMin')}   onMaxChange={setF('idMax')} />
//           <RangePair label="pH range"       minVal={filters.phMin}   maxVal={filters.phMax}   onMinChange={setF('phMin')}   onMaxChange={setF('phMax')} />
//           <RangePair label="Water temp"     minVal={filters.tempMin} maxVal={filters.tempMax} onMinChange={setF('tempMin')} onMaxChange={setF('tempMax')} unit="°C" step="1" />
//           <RangePair label="TDS"            minVal={filters.tdsMin}  maxVal={filters.tdsMax}  onMinChange={setF('tdsMin')}  onMaxChange={setF('tdsMax')} unit="mg/L" step="1" />
//           <RangePair label="Dissolved O₂"  minVal={filters.doMin}   maxVal={filters.doMax}   onMinChange={setF('doMin')}   onMaxChange={setF('doMax')} unit="mg/L" />
//         </div>

//         <div className="de-sidebar-footer">
//           <button className="de-gen-btn" onClick={runQuery}>Generate →</button>
//           <button className="de-reset-btn" onClick={resetAll}>Reset all filters</button>
//         </div>
//       </aside>

//       {/* ══ MAIN ══ */}
//       <main className="de-main">

//         {/* Top bar */}
//         <div className="de-topbar">
//           <div className="de-topbar-left">
//             <div className="de-page-title">Data explorer</div>
//             {results !== null && (
//               <div className="de-page-meta">
//                 {results.length} record{results.length !== 1 ? 's' : ''} returned
//                 {results.length > 0 && ` · ${unique(results.map(r => r.organism)).join(', ')}`}
//               </div>
//             )}
//           </div>
//           <div className="de-export-row">
//             <button
//               className="de-export-btn"
//               disabled={!results || results.length === 0}
//               onClick={() => results && downloadCSV(results)}
//             >
//               <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M3 12h10M8 3v7M5 8l3 3 3-3" />
//               </svg>
//               Export CSV
//             </button>
//             <button
//               className="de-export-btn"
//               disabled={!results || results.length === 0}
//               onClick={() => alert('PDF export — wire up your backend /api/export/pdf endpoint here.')}
//             >
//               <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M3 12h10M8 3v7M5 8l3 3 3-3" />
//               </svg>
//               Export PDF
//             </button>
//           </div>
//         </div>

//         {/* Active filter tags */}
//         {activeTags.length > 0 && (
//           <div className="de-active-filters">
//             <span className="de-af-label">Active filters:</span>
//             {activeTags.map(t => (
//               <span key={t.label} className="de-filter-tag">
//                 <span className="de-filter-tag-key">{t.label}:</span> {t.value}
//               </span>
//             ))}
//           </div>
//         )}

//         {/* Stat cards */}
//         <div className="de-stats">
//           <div className="de-stat-card">
//             <div className="de-stat-value de-stat-value--red">{results ? `${Math.round((results.length / DATASET.length) * 100)}%` : '—'}</div>
//             <div className="de-stat-label">Match rate</div>
//           </div>
//           <div className="de-stat-card">
//             <div className="de-stat-value de-stat-value--teal">{results ? results.length : '—'}</div>
//             <div className="de-stat-label">Isolates returned</div>
//           </div>
//           <div className="de-stat-card">
//             <div className="de-stat-value de-stat-value--amber">{results ? uniqueGeneCount : '—'}</div>
//             <div className="de-stat-label">Unique AMR genes</div>
//           </div>
//           <div className="de-stat-card">
//             <div className="de-stat-value de-stat-value--dark">{results ? uniqueOrgCount : '—'}</div>
//             <div className="de-stat-label">Organisms</div>
//           </div>
//         </div>

//         {/* Results area */}
//         <div className="de-results">
//           {!hasQueried && (
//             <div className="de-empty">
//               <div className="de-empty-icon">
//                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
//                   <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
//                 </svg>
//               </div>
//               <div className="de-empty-title">No query run yet</div>
//               <div className="de-empty-sub">Set your filters on the left and click Generate →</div>
//             </div>
//           )}

//           {hasQueried && results !== null && results.length === 0 && (
//             <div className="de-empty">
//               <div className="de-empty-icon">
//                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
//                   <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
//                 </svg>
//               </div>
//               <div className="de-empty-title">No results match your filters</div>
//               <div className="de-empty-sub">Try relaxing one or more of the active filters</div>
//             </div>
//           )}

//           {hasQueried && results !== null && results.length > 0 && (
//             <div className="de-table-wrap">
//               <div className="de-table-header">
//                 <span className="de-table-count">{results.length} isolate{results.length !== 1 ? 's' : ''}</span>
//                 <span className="de-table-note">All 28 fields — exactly what CSV / PDF will contain</span>
//               </div>
//               <div className="de-table-scroll">
//                 <table className="de-table">
//                   <thead>
//                     <tr>
//                       <th>*Sample name</th>
//                       <th>Isolate ID</th>
//                       <th>Organism</th>
//                       <th>Source</th>
//                       <th>Date</th>
//                       <th>*Geo location</th>
//                       <th>Collected by</th>
//                       <th>AMR genes</th>
//                       <th>Class</th>
//                       <th>Subclass</th>
//                       <th>% Identity</th>
//                       <th>% Coverage</th>
//                       <th>Virulence</th>
//                       <th>Plasmid replicons</th>
//                       <th>*SIR (antibiotics)</th>
//                       <th>pH</th>
//                       <th>Temp °C</th>
//                       <th>TDS mg/L</th>
//                       <th>DO mg/L</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {results.map(r => (
//                       <tr key={r.sample_name}>
//                         <td className="de-td-primary">{r.sample_name}</td>
//                         <td className="de-td-mono">{r.isolate_id.replace('_assembly.fasta', '')}</td>
//                         <td className="de-td-italic">{r.organism}</td>
//                         <td className="de-td-muted">{r.isolation_source}</td>
//                         <td className="de-td-muted">{r.collection_date}</td>
//                         <td className="de-td-muted">{r.geo_loc_name.replace('South Africa: ', 'ZA: ')}</td>
//                         <td className="de-td-muted">{r.collected_by}</td>
//                         <td className="de-td-genes">{r.amr_resistance_genes}</td>
//                         <td><span className="de-pill de-pill--blue">{r.class}</span></td>
//                         <td className="de-td-muted">{r.subclass}</td>
//                         <td className="de-td-muted">{r.pct_identity}%</td>
//                         <td className="de-td-muted">{r.pct_coverage}%</td>
//                         <td className="de-td-muted">{r.virulence_genes}</td>
//                         <td className="de-td-muted">{r.plasmid_replicons}</td>
//                         <td className="de-td-sir">{r.predicted_sir}</td>
//                         <td className="de-td-muted">{r.pH}</td>
//                         <td className="de-td-muted">{r.temp_water_c}</td>
//                         <td className="de-td-muted">{r.tds_mg_l}</td>
//                         <td className="de-td-muted">{r.dissolved_oxygen_mg_l}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './DataExplorer.css';

// ── API config ────────────────────────────────────────────────────────────────

const API_BASE = '/api/query-builder';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.accessToken?.toString();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Backend types (mirrors QueryBuilderFilters) ───────────────────────────────

interface QueryBuilderFilters {
  geo_loc_name: string;
  collection_date_start: string;
  collection_date_end: string;
  collected_by?: string;
  amr_resistance_gene?: string;
  predicted_sir_profile?: string;
  organism?: string;
  isolation_source?: string;
  element_class?: string;
  element_subclass?: string;
}

interface DropdownOptions {
  geoLocations: string[];
  collectors: string[];
  amrGenes: string[];
  sirProfiles: string[];
  organisms: string[];
  isolationSources: string[];
  elementClasses: string[];
  elementSubclasses: string[];
}

interface QueryResult {
  matchRate: number | null;
  isolatesReturned: number;
  uniqueAmrGenes: number;
  organisms: number;
  rows: Record<string, unknown>[];
}

// ── Frontend filter state ─────────────────────────────────────────────────────

interface Filters {
  geo: string;
  dateFrom: string;
  dateTo: string;
  collectedBy: string;
  amrGene: string;
  sir: string;
  organism: string;
  source: string;
  amrClass: string;
  amrSubclass: string;
}

const EMPTY_FILTERS: Filters = {
  geo: '',
  dateFrom: '',
  dateTo: '',
  collectedBy: '',
  amrGene: '',
  sir: '',
  organism: '',
  source: '',
  amrClass: '',
  amrSubclass: '',
};

function isAllFilter(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'all';
}

function openDatePicker(input: HTMLInputElement): void {
  const pickerCapable = input as HTMLInputElement & { showPicker?: () => void };
  try {
    pickerCapable.showPicker?.();
  } catch {
    // Some browsers require strict user-gesture contexts; native picker still works.
  }
}

// Map frontend Filters → backend QueryBuilderFilters
function toApiFilters(f: Filters): QueryBuilderFilters {
  return {
    geo_loc_name: isAllFilter(f.geo) ? '' : f.geo,
    collection_date_start: f.dateFrom,
    collection_date_end: f.dateTo,
    collected_by: f.collectedBy || undefined,
    amr_resistance_gene: f.amrGene || undefined,
    predicted_sir_profile: f.sir || undefined,
    organism: isAllFilter(f.organism) ? undefined : f.organism,
    isolation_source: isAllFilter(f.source) ? undefined : f.source,
    element_class: f.amrClass || undefined,
    element_subclass: f.amrSubclass || undefined,
  };
}

// ── Download helper ───────────────────────────────────────────────────────────

async function triggerDownload(
  endpoint: '/export/csv' | '/export/xlsx',
  filters: Filters,
  filename: string,
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(toApiFilters(filters)),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  obligation: 'm' | 'b' | 'y';
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

function SelectField({
  label,
  obligation,
  value,
  onChange,
  options,
  placeholder = 'All',
  loading = false,
  disabled = false,
}: SelectFieldProps) {
  const dotClass =
    obligation === 'm'
      ? 'de-dot de-dot--green'
      : obligation === 'b'
        ? 'de-dot de-dot--blue'
        : 'de-dot de-dot--amber';
  const lblClass =
    obligation === 'm'
      ? 'de-flabel de-flabel--green'
      : obligation === 'b'
        ? 'de-flabel de-flabel--blue'
        : 'de-flabel de-flabel--amber';
  const borderClass =
    obligation === 'm'
      ? ' de-select--teal'
      : obligation === 'b'
        ? ' de-select--blue'
        : '';

  return (
    <div className="de-field">
      <div className={lblClass}>
        <span className={dotClass} />
        {label}
      </div>
      <select
        className={`de-select${borderClass}${loading ? ' de-select--loading' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

interface ValidationErrors {
  date?: string;
}

function validate(f: Filters): ValidationErrors {
  const errs: ValidationErrors = {};
  if (!f.dateFrom || !f.dateTo) {
    errs.date = 'Both start and end dates are required.';
  } else if (f.dateFrom > f.dateTo) {
    errs.date = 'Start date must be on or before end date.';
  }
  return errs;
}

// ── Example query (used in empty state) ──────────────────────────────────────

const EXAMPLE_QUERY: Filters = {
  geo: 'South Africa: Gauteng',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  collectedBy: '',
  amrGene: "aph(3')-Ia",
  sir: 'kanamycin',
  organism: 'Escherichia coli',
  source: '',
  amrClass: 'AMINOGLYCOSIDE',
  amrSubclass: '',
};

interface ExampleQueryCardProps {
  onUseExample: (f: Filters) => void;
}

function ExampleQueryCard({ onUseExample }: ExampleQueryCardProps) {
  const rows: { label: string; value: string; color: 'green' | 'blue' | 'amber' }[] = [
    { label: 'Geographic location', value: 'South Africa: Gauteng',  color: 'green' },
    { label: 'Collection date',     value: '2024-01-01 → 2024-12-31', color: 'green' },
    { label: "AMR resistance gene", value: "aph(3')-Ia",             color: 'green' },
    { label: 'Predicted SIR',       value: 'kanamycin',              color: 'green' },
    { label: 'Organism',            value: 'Escherichia coli',        color: 'blue'  },
    { label: 'AMR class',           value: 'AMINOGLYCOSIDE',          color: 'amber' },
  ];

  const dotBg: Record<string, string> = {
    green: '#22c55e',
    blue:  '#3b82f6',
    amber: '#eab308',
  };

  return (
    <div className="de-example-card">
      <div className="de-example-header">
        <div className="de-example-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div>
          <div className="de-example-title">Example query</div>
          <div className="de-example-sub">
            E. coli aminoglycoside resistance · Gauteng · 2024
          </div>
        </div>
      </div>

      <div className="de-example-filters">
        {rows.map((r) => (
          <div key={r.label} className="de-example-row">
            <span
              className="de-example-dot"
              style={{ background: dotBg[r.color] }}
            />
            <span className="de-example-key">{r.label}</span>
            <span className={`de-example-val de-example-val--${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DataExplorer() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [options, setOptions] = useState<DropdownOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryErrors, setQueryErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasQueried, setHasQueried] = useState(false);

  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Persist last valid filters used for export
  const lastFiltersRef = useRef<Filters>(EMPTY_FILTERS);

  // Load example query into filter state
  const loadExample = useCallback((f: Filters) => {
    setFilters(f);
    setValidationErrors({});
    setQueryErrors([]);
    setResult(null);
    setHasQueried(false);
  }, []);

  // ── Load dropdown options on mount ────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setOptionsLoading(true);
        setOptionsError(null);
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/options`, { headers });
        if (!res.ok) throw new Error(`Failed to load options (${res.status})`);
        const json = await res.json();
        if (!cancelled) setOptions(json.data as DropdownOptions);
      } catch (err) {
        if (!cancelled)
          setOptionsError(
            err instanceof Error ? err.message : 'Failed to load dropdown options.',
          );
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setF = useCallback(
    (key: keyof Filters) => (val: string) =>
      setFilters((prev) => ({ ...prev, [key]: val })),
    [],
  );

  // ── Run query ─────────────────────────────────────────────────────────────

  async function runQuery() {
    const errs = validate(filters);
    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setQueryLoading(true);
    setQueryErrors([]);
    setResult(null);
    setExportError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(toApiFilters(filters)),
      });
      const json = await res.json();

      if (!res.ok) {
        setQueryErrors(
          json.errors ?? [json.message ?? `Server error (${res.status})`],
        );
        return;
      }

      setResult(json.data as QueryResult);
      lastFiltersRef.current = { ...filters };
      setHasQueried(true);
    } catch (err) {
      setQueryErrors([
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      ]);
    } finally {
      setQueryLoading(false);
    }
  }

  function resetAll() {
    setFilters(EMPTY_FILTERS);
    setResult(null);
    setHasQueried(false);
    setQueryErrors([]);
    setValidationErrors({});
    setExportError(null);
  }

  // ── Export handlers ───────────────────────────────────────────────────────

  async function handleExportCsv() {
    setExportingCsv(true);
    setExportError(null);
    try {
      await triggerDownload(
        '/export/csv',
        lastFiltersRef.current,
        `query_results_${Date.now()}.csv`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'CSV export failed.');
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleExportXlsx() {
    setExportingXlsx(true);
    setExportError(null);
    try {
      await triggerDownload(
        '/export/xlsx',
        lastFiltersRef.current,
        `query_results_${Date.now()}.xlsx`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'XLSX export failed.');
    } finally {
      setExportingXlsx(false);
    }
  }

  // ── Active filter tags ────────────────────────────────────────────────────

  const activeTags = useMemo(
    () =>
      [
        { label: 'Region', value: filters.geo },
        { label: 'Organism', value: filters.organism },
        { label: 'By', value: filters.collectedBy },
        { label: 'Gene', value: filters.amrGene },
        { label: 'SIR', value: filters.sir },
        { label: 'Source', value: filters.source },
        { label: 'Class', value: filters.amrClass },
        { label: 'Subclass', value: filters.amrSubclass },
        ...(filters.dateFrom || filters.dateTo
          ? [
              {
                label: 'Date',
                value: `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`,
              },
            ]
          : []),
      ].filter((t) => t.value !== ''),
    [filters],
  );

  // Rows as table columns (keep order from first row's keys)
  const tableColumns = useMemo(
    () => (result && result.rows.length > 0 ? Object.keys(result.rows[0]) : []),
    [result],
  );

  const canExport = hasQueried && result !== null && result.rows.length > 0 && !queryLoading;

  // ── Example queries ───────────────────────────────────────────────────────
  // NOTE: EXAMPLE_QUERIES was removed as it's no longer used; use loadExample callback instead


  // NOTE: loadAndRun was removed as it's no longer used; use loadExample callback instead

  return (
    <div className="de-page">
      {/* ══ SIDEBAR ══ */}
      <aside className="de-sidebar">
        <div className="de-sidebar-head">
          <div className="de-sidebar-title" style={{ fontFamily: "'Syne', sans-serif" }}>Query builder</div>            
        </div>

        <div className="de-sidebar-body">
          {/* Options error banner */}
          {optionsError && (
            <div className="de-error-banner">
              <span>⚠ {optionsError}</span>
              <button
                className="de-error-retry"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Mandatory ── */}
          <div className="de-section-label">Mandatory fields</div>

          <SelectField
            label="*Geographic location"
            obligation="m"
            value={filters.geo}
            onChange={setF('geo')}
            options={options?.geoLocations ?? []}
            placeholder="All regions"
            loading={optionsLoading}
          />

          <div className="de-field">
            <div className="de-flabel de-flabel--green">
              <span className="de-dot de-dot--green" />
              *Collection date
            </div>
            <div className="de-date-row">
              <input
                className="de-date-inp"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setF('dateFrom')(e.target.value)}
                onClick={(e) => openDatePicker(e.currentTarget)}
              />
              <input
                className="de-date-inp"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setF('dateTo')(e.target.value)}
                onClick={(e) => openDatePicker(e.currentTarget)}
              />
            </div>
            {validationErrors.date && (
              <div className="de-field-error">{validationErrors.date}</div>
            )}
          </div>

          <SelectField
            label="*Collected by"
            obligation="m"
            value={filters.collectedBy}
            onChange={setF('collectedBy')}
            options={options?.collectors ?? []}
            placeholder="All collectors"
            loading={optionsLoading}
          />

          <SelectField
            label="*AMR resistance gene"
            obligation="m"
            value={filters.amrGene}
            onChange={setF('amrGene')}
            options={options?.amrGenes ?? []}
            placeholder="All genes"
            loading={optionsLoading}
          />

          <SelectField
            label="*Predicted SIR (antibiotic)"
            obligation="m"
            value={filters.sir}
            onChange={setF('sir')}
            options={options?.sirProfiles ?? []}
            placeholder="Any antibiotic"
            loading={optionsLoading}
          />

          {/* ── At-least-one ── */}
          <div className="de-section-label" style={{ marginTop: 10 }}>
            At least one required
          </div>

          <SelectField
            label="Organism"
            obligation="b"
            value={filters.organism}
            onChange={setF('organism')}
            options={options?.organisms ?? []}
            loading={optionsLoading}
          />
          <SelectField
            label="Isolation source"
            obligation="b"
            value={filters.source}
            onChange={setF('source')}
            options={options?.isolationSources ?? []}
            loading={optionsLoading}
          />

          {/* ── Optional ── */}
          <div className="de-section-label" style={{ marginTop: 10 }}>
            Optional fields
          </div>

          <SelectField
            label="AMR class"
            obligation="y"
            value={filters.amrClass}
            onChange={setF('amrClass')}
            options={options?.elementClasses ?? []}
            placeholder="All classes"
            loading={optionsLoading}
          />
          <SelectField
            label="AMR subclass"
            obligation="y"
            value={filters.amrSubclass}
            onChange={setF('amrSubclass')}
            options={options?.elementSubclasses ?? []}
            placeholder="All subclasses"
            loading={optionsLoading}
          />
        </div>

        <div className="de-sidebar-footer">
          <button
            className={`de-gen-btn${queryLoading ? ' de-gen-btn--loading' : ''}`}
            onClick={runQuery}
            disabled={queryLoading || optionsLoading}
          >
            {queryLoading ? (
              <>
                <span className="de-spinner" />
                Querying…
              </>
            ) : (
              'Generate →'
            )}
          </button>
          <button className="de-reset-btn" onClick={resetAll} disabled={queryLoading}>
            Reset all filters
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="de-main">
        {/* Top bar */}
        <div className="de-topbar">
          <div className="de-topbar-left">
            <div className="de-page-title" style={{ fontFamily: "'Syne', sans-serif" }}>DATA EXPLORER</div>
            {result !== null && (
              <div className="de-page-meta">
                {result.isolatesReturned} record
                {result.isolatesReturned !== 1 ? 's' : ''} returned
              </div>
            )}
          </div>
          <div className="de-export-row">
            <button
              className={`de-export-btn${exportingCsv ? ' de-export-btn--loading' : ''}`}
              disabled={!canExport || exportingCsv || exportingXlsx}
              onClick={handleExportCsv}
            >
              {exportingCsv ? (
                <span className="de-spinner de-spinner--sm" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h10M8 3v7M5 8l3 3 3-3" />
                </svg>
              )}
              Export CSV
            </button>
            <button
              className={`de-export-btn${exportingXlsx ? ' de-export-btn--loading' : ''}`}
              disabled={!canExport || exportingCsv || exportingXlsx}
              onClick={handleExportXlsx}
            >
              {exportingXlsx ? (
                <span className="de-spinner de-spinner--sm" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h10M8 3v7M5 8l3 3 3-3" />
                </svg>
              )}
              Export XLSX
            </button>
          </div>
        </div>

        {/* Export error */}
        {exportError && (
          <div className="de-query-error-bar">⚠ Export failed: {exportError}</div>
        )}

        {/* Query-level errors from backend */}
        {queryErrors.length > 0 && (
          <div className="de-query-error-bar">
            {queryErrors.map((e, i) => (
              <div key={i}>⚠ {e}</div>
            ))}
          </div>
        )}

        {/* Active filter tags */}
        {activeTags.length > 0 && (
          <div className="de-active-filters">
            <span className="de-af-label">Active filters:</span>
            {activeTags.map((t) => (
              <span key={t.label} className="de-filter-tag">
                <span className="de-filter-tag-key">{t.label}:</span> {t.value}
              </span>
            ))}
          </div>
        )}

        {/* Stat cards */}
        <div className="de-stats">
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--red">
              {result
                ? result.matchRate !== null
                  ? `${result.matchRate}%`
                  : 'N/A'
                : '—'}
            </div>
            <div className="de-stat-label">Match rate</div>
          </div>
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--teal">
              {result ? result.isolatesReturned : '—'}
            </div>
            <div className="de-stat-label">Isolates returned</div>
          </div>
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--amber">
              {result ? result.uniqueAmrGenes : '—'}
            </div>
            <div className="de-stat-label">Unique AMR genes</div>
          </div>
          <div className="de-stat-card">
            <div className="de-stat-value de-stat-value--dark">
              {result ? result.organisms : '—'}
            </div>
            <div className="de-stat-label">Organisms</div>
          </div>
        </div>

        {/* Results area */}
        <div className="de-results">
          {/* Loading skeleton */}
          {queryLoading && (
            <div className="de-loading">
              <div className="de-loading-bar" />
              <div className="de-loading-bar de-loading-bar--wide" />
              <div className="de-loading-bar de-loading-bar--narrow" />
              <div className="de-loading-text">Running query…</div>
            </div>
          )}

          {/* Empty state: no query run yet */}
          {!hasQueried && !queryLoading && (
            <div className="de-empty de-empty--start">
              <div className="de-empty-top">
                <div className="de-empty-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <div className="de-empty-title">No query run yet</div>
                <div className="de-empty-sub">
                  Set your filters on the left and click Generate →
                  <br />
                  Or load the example below to get started immediately.
                </div>
              </div>
              <ExampleQueryCard onUseExample={loadExample} />
            </div>
          )}

          {/* Empty results */}
          {hasQueried && !queryLoading && result !== null && result.rows.length === 0 && (
            <div className="de-empty">
              <div className="de-empty-icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <div className="de-empty-title">No results match your filters</div>
              <div className="de-empty-sub">
                Try relaxing one or more of the active filters
              </div>
            </div>
          )}

          {/* Results table — dynamic columns from API response */}
          {hasQueried && !queryLoading && result !== null && result.rows.length > 0 && (
            <div className="de-table-wrap">
              <div className="de-table-header">
                <span className="de-table-count">
                  {result.isolatesReturned} isolate
                  {result.isolatesReturned !== 1 ? 's' : ''}
                </span>
                <span className="de-table-note">
                  {tableColumns.length} columns · CSV and XLSX export use identical data
                </span>
              </div>
              <div className="de-table-scroll">
                <table className="de-table">
                  <thead>
                    <tr>
                      {tableColumns.map((col) => (
                        <th key={col}>{col.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>
                        {tableColumns.map((col) => {
                          const val = row[col];
                          const str = val === null || val === undefined ? '' : String(val);
                          // Apply semantic cell classes based on column name
                          const isGene = col === 'amr_resistance_genes';
                          const isSir = col === 'predicted_sir_profile';
                          const isClass = col === 'element_class';
                          const isPrimary = col === 'sample_name';
                          const isMono = col === 'isolate_id' || col === 'accession_closest_sequence';
                          const isItalic = col === 'organism';
                          return (
                            <td
                              key={col}
                              className={
                                isPrimary
                                  ? 'de-td-primary'
                                  : isMono
                                    ? 'de-td-mono'
                                    : isItalic
                                      ? 'de-td-italic'
                                      : isGene
                                        ? 'de-td-genes'
                                        : isSir
                                          ? 'de-td-sir'
                                          : 'de-td-muted'
                              }
                            >
                              {isClass ? (
                                <span className="de-pill de-pill--blue">{str}</span>
                              ) : (
                                str
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}