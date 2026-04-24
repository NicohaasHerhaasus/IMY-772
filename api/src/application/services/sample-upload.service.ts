import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import { ValidationError } from '../errors/app.errors';

type SheetRow = Record<string, unknown>;

type MandatoryField =
  | 'sampleName'
  | 'sampleAnalysisType'
  | 'isolationSource'
  | 'collectionDate'
  | 'geoLocName'
  | 'latitude'
  | 'longitude'
  | 'predictedSirProfile';

export interface SampleRow {
  sampleName: string;
  sampleAnalysisType: string;
  isolationSource: string;
  collectionDate: string;
  geoLocName: string;
  latitude: number;
  longitude: number;
  predictedSirProfile: string;
  isolateId: string | null;
  organism: string | null;
  labSampleId: string | null;
  collectedBy: string | null;
  amrResistanceGenes: string | null;
  sequenceName: string | null;
  elementType: string | null;
  elementClass: string | null;
  elementSubclass: string | null;
  targetLength: number | null;
  referenceSequenceLength: number | null;
  pctCoverageReference: number | null;
  pctIdentityReference: number | null;
  alignmentLength: number | null;
  accessionClosestSequence: string | null;
  virulenceGenes: string | null;
  plasmidReplicons: string | null;
  ph: number | null;
  tempOfWater: number | null;
  tdsMgL: number | null;
  dissolvedOxygenMgL: number | null;
}

export interface ValidationResult {
  valid: boolean;
  rowCount: number;
  rows: SampleRow[];
}

export interface IngestResult {
  insertedCount: number;
  skippedCount: number;
  skippedNames: string[];
}

/** Strip leading *, whitespace; lower-case; remove non-alphanumeric for fuzzy matching. */
function normalizeHeader(value: string): string {
  return value
    .replace(/^\*+/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const MANDATORY_COLUMNS: Array<{
  field: MandatoryField;
  label: string;
  aliases: string[];
}> = [
  {
    field: 'sampleName',
    label: 'Sample name',
    // Do not use "sample id" here - that maps to lab_sample_id
    aliases: ['samplename', 'sample name', 'sample_name'],
  },
  {
    field: 'sampleAnalysisType',
    label: 'Sample analysis type',
    aliases: [
      'sampleanalysistype',
      'sample analysis type',
      'sample_analysis_type',
      'analysistype',
      'analysis type',
    ],
  },
  {
    field: 'isolationSource',
    label: 'Isolation source',
    aliases: ['isolationsource', 'isolation source', 'isolation_source'],
  },
  {
    field: 'collectionDate',
    label: 'Collection date',
    aliases: ['collectiondate', 'collection date', 'collection_date', 'date of collection'],
  },
  {
    field: 'geoLocName',
    label: 'geo_loc_name',
    aliases: [
      'geolocalname',
      'geolocname',
      'geo loc name',
      'geo_loc_name',
      'geoloc',
    ],
  },
  {
    field: 'latitude',
    label: 'Latitude',
    aliases: ['latitude', 'lat'],
  },
  {
    field: 'longitude',
    label: 'Longitude',
    aliases: ['longitude', 'lon', 'lng', 'long'],
  },
  {
    field: 'predictedSirProfile',
    label: 'Predicted SIR profile',
    aliases: [
      'predictedsirprofile',
      'predicted sir profile',
      'predictedsir',
      'predicted_sir',
      'sirprofile',
      'sir profile',
      'predicted sir',
    ],
  },
];

type OptionalKind = 'string' | 'int' | 'decimal';

type OptionalSampleField = Exclude<keyof SampleRow, MandatoryField>;

const OPTIONAL_COLUMNS: Array<{
  field: OptionalSampleField;
  label: string;
  aliases: string[];
  kind: OptionalKind;
}> = [
  {
    field: 'isolateId',
    label: 'Isolate ID',
    aliases: ['isolateid', 'isolate id', 'isolate_id'],
    kind: 'string',
  },
  { field: 'organism', label: 'Organism', aliases: ['organism'], kind: 'string' },
  {
    field: 'labSampleId',
    label: 'Sample ID',
    aliases: ['sampleid', 'sample id', 'sample_id'],
    kind: 'string',
  },
  {
    field: 'collectedBy',
    label: 'Collected by',
    aliases: ['collectedby', 'collected by', 'collected_by'],
    kind: 'string',
  },
  {
    field: 'amrResistanceGenes',
    label: 'AMR resistance genes',
    aliases: ['amrresistancegenes', 'amr resistance genes', 'amr_resistance_genes'],
    kind: 'string',
  },
  {
    field: 'sequenceName',
    label: 'Sequence name',
    aliases: ['sequencename', 'sequence name', 'sequence_name'],
    kind: 'string',
  },
  {
    field: 'elementType',
    label: 'Element type',
    aliases: ['elementtype', 'element type', 'element_type'],
    kind: 'string',
  },
  { field: 'elementClass', label: 'Class', aliases: ['class', 'elementclass', 'element class'], kind: 'string' },
  {
    field: 'elementSubclass',
    label: 'Subclass',
    aliases: ['subclass', 'sub class', 'elementsubclass', 'element_subclass'],
    kind: 'string',
  },
  {
    field: 'targetLength',
    label: 'Target length',
    aliases: ['targetlength', 'target length', 'target_length'],
    kind: 'int',
  },
  {
    field: 'referenceSequenceLength',
    label: 'Reference sequence length',
    aliases: [
      'referencesequencelength',
      'reference sequence length',
      'refseqlength',
      'ref_seq_length',
    ],
    kind: 'int',
  },
  {
    field: 'pctCoverageReference',
    label: '% coverage of reference sequence',
    aliases: [
      'pctcoverage',
      'pct_coverage',
      'pctcoverageofreferencesequence',
      'coverage of reference sequence',
      'coverageofreferencesequence',
      'percentcoverageofreferencesequence',
    ],
    kind: 'decimal',
  },
  {
    field: 'pctIdentityReference',
    label: '% identity to reference sequence',
    aliases: [
      'pctidentity',
      'pct_identity',
      'pctidentitytoreferencesequence',
      'identity to reference sequence',
      'identitytoreferencesequence',
      'percentidentitytoreferencesequence',
    ],
    kind: 'decimal',
  },
  {
    field: 'alignmentLength',
    label: 'Alignment length',
    aliases: ['alignmentlength', 'alignment length', 'alignment_length'],
    kind: 'int',
  },
  {
    field: 'accessionClosestSequence',
    label: 'Accession of closest sequence',
    aliases: [
      'accession',
      'accessionofclosestsequence',
      'accession of closest sequence',
      'closestsequenceaccession',
    ],
    kind: 'string',
  },
  {
    field: 'virulenceGenes',
    label: 'Virulence genes',
    aliases: ['virulencegenes', 'virulence genes', 'virulence_genes'],
    kind: 'string',
  },
  {
    field: 'plasmidReplicons',
    label: 'Plasmid replicons',
    aliases: ['plasmidreplicons', 'plasmid replicons', 'plasmid_replicons'],
    kind: 'string',
  },
  { field: 'ph', label: 'pH', aliases: ['ph'], kind: 'decimal' },
  {
    field: 'tempOfWater',
    label: 'Temp of water',
    aliases: [
      'tempofwater',
      'temp of water',
      'tempwaterc',
      'temp_water_c',
      'water temp',
      'watertemperature',
      'water temperature',
    ],
    kind: 'decimal',
  },
  {
    field: 'tdsMgL',
    label: 'TDS (mg/L)',
    aliases: ['tdsmgl', 'tds', 'tds mg/l', 'tds_mg_l', 'totaldissolvedsolids'],
    kind: 'decimal',
  },
  {
    field: 'dissolvedOxygenMgL',
    label: 'Dissolved oxygen (mg/L)',
    aliases: [
      'dissolvedoxygenmgl',
      'dissolved oxygen',
      'dissolved oxygen mg/l',
      'dissolved_oxygen_mg_l',
      'domgl',
      'do mg/l',
    ],
    kind: 'decimal',
  },
];

function findColumnKey(row: SheetRow, aliases: string[]): string | undefined {
  const aliasSet = new Set(aliases.map(normalizeHeader));
  return Object.keys(row).find((k) => aliasSet.has(normalizeHeader(k)));
}

function getCellString(row: SheetRow, key: string): string {
  const value = row[key];
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseCoordinate(raw: string, label: string): number {
  const parsed = parseFloat(raw.replace(/,/g, '.'));
  if (isNaN(parsed)) {
    throw new ValidationError([`"${label}" value "${raw}" is not a valid number.`]);
  }
  return parsed;
}

function parseOptionalInt(raw: string, label: string, rowNum: number): number | null | string {
  const s = raw.trim();
  if (!s) return null;
  const n = parseInt(s.replace(/,/g, ''), 10);
  if (isNaN(n)) {
    return `Row ${rowNum}: "${label}" value "${raw}" is not a valid whole number.`;
  }
  return n;
}

function parseOptionalDecimal(raw: string, label: string, rowNum: number): number | null | string {
  const s = raw.replace(/%/g, '').trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, '.'));
  if (isNaN(n)) {
    return `Row ${rowNum}: "${label}" value "${raw}" is not a valid number.`;
  }
  return n;
}

function readOptionalFields(
  row: SheetRow,
  optionalKeys: Map<OptionalSampleField, string | undefined>,
  rowNum: number,
): { values: Partial<SampleRow>; errors: string[] } {
  const values: Partial<SampleRow> = {};
  const errors: string[] = [];

  for (const col of OPTIONAL_COLUMNS) {
    const key = optionalKeys.get(col.field);
    const raw = key ? getCellString(row, key) : '';

    if (col.kind === 'string') {
      (values as Record<string, string | null>)[col.field] = raw ? raw : null;
      continue;
    }

    if (col.kind === 'int') {
      const r = parseOptionalInt(raw, col.label, rowNum);
      if (typeof r === 'string') errors.push(r);
      else (values as Record<string, number | null>)[col.field] = r;
      continue;
    }

    const r = parseOptionalDecimal(raw, col.label, rowNum);
    if (typeof r === 'string') errors.push(r);
    else (values as Record<string, number | null>)[col.field] = r;
  }

  return { values, errors };
}

export class SampleUploadService {
  constructor(private readonly pool: Pool) {}

  /** Parse and validate an .xlsx buffer. Throws ValidationError on failure. */
  async validateWorkbook(buffer: Buffer): Promise<ValidationResult> {
    if (!buffer || buffer.length === 0) {
      throw new ValidationError(['Uploaded file is empty.']);
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch {
      throw new ValidationError(['Could not parse file. Make sure it is a valid .xlsx workbook.']);
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new ValidationError(['The workbook contains no sheets.']);
    }

    const sheet = workbook.Sheets[firstSheetName];

    const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: null });

    const allAliases = new Set(
      MANDATORY_COLUMNS.flatMap((c) => c.aliases.map(normalizeHeader)),
    );

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(allRows.length, 20); i++) {
      const row = allRows[i] as (string | null)[];
      const hasHeader = row.some(
        (cell) => cell && allAliases.has(normalizeHeader(String(cell))),
      );
      if (hasHeader) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new ValidationError([
        'Could not find a header row in the first 20 rows of the sheet.',
        'Make sure the file contains the required column names (e.g. "Sample name", "Latitude", "geo_loc_name").',
      ]);
    }

    const rawRows = XLSX.utils.sheet_to_json<SheetRow>(sheet, {
      defval: null,
      raw: false,
      range: headerRowIndex,
    });

    if (rawRows.length === 0) {
      throw new ValidationError(['The sheet has no data rows after the header.']);
    }

    const firstRow = rawRows[0];

    const missingColumns: string[] = [];
    for (const col of MANDATORY_COLUMNS) {
      const key = findColumnKey(firstRow, col.aliases);
      if (!key) {
        missingColumns.push(col.label);
      }
    }
    if (missingColumns.length > 0) {
      const presentHeaders = Object.keys(firstRow).join(', ') || '(none)';
      throw new ValidationError([
        `MISSING COLUMNS: The uploaded file is missing ${missingColumns.length} required column${missingColumns.length !== 1 ? 's' : ''}.`,
        `Missing: ${missingColumns.join(', ')}.`,
        `Headers found in file: ${presentHeaders}.`,
        `Tip: Column headers must match the required names exactly (leading * and extra spaces are ignored).`,
      ]);
    }

    const optionalKeys = new Map<OptionalSampleField, string | undefined>();
    for (const col of OPTIONAL_COLUMNS) {
      optionalKeys.set(col.field, findColumnKey(firstRow, col.aliases));
    }

    const parsedRows: SampleRow[] = [];
    const rowErrors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;
      const rowProblems: string[] = [];

      const getValue = (col: (typeof MANDATORY_COLUMNS)[number]): string => {
        const key = findColumnKey(row, col.aliases)!;
        return getCellString(row, key);
      };

      const sampleName = getValue(MANDATORY_COLUMNS[0]);
      const sampleAnalysisType = getValue(MANDATORY_COLUMNS[1]);
      const isolationSource = getValue(MANDATORY_COLUMNS[2]);
      const collectionDate = getValue(MANDATORY_COLUMNS[3]);
      const geoLocName = getValue(MANDATORY_COLUMNS[4]);
      const latitudeRaw = getValue(MANDATORY_COLUMNS[5]);
      const longitudeRaw = getValue(MANDATORY_COLUMNS[6]);
      const predictedSirProfile = getValue(MANDATORY_COLUMNS[7]);

      if (!sampleName) rowProblems.push('"Sample name" is empty');
      if (!sampleAnalysisType) rowProblems.push('"Sample analysis type" is empty');
      if (!isolationSource) rowProblems.push('"Isolation source" is empty');
      if (!collectionDate) rowProblems.push('"Collection date" is empty');
      if (!geoLocName) rowProblems.push('"geo_loc_name" is empty');
      if (!latitudeRaw) rowProblems.push('"Latitude" is empty');
      if (!longitudeRaw) rowProblems.push('"Longitude" is empty');
      if (!predictedSirProfile) rowProblems.push('"Predicted SIR profile" is empty');

      const { values: optValues, errors: optErrors } = readOptionalFields(row, optionalKeys, rowNum);
      rowProblems.push(...optErrors);

      if (rowProblems.length > 0) {
        rowErrors.push(`Row ${rowNum}: ${rowProblems.join('; ')}.`);
        continue;
      }

      let latitude: number;
      let longitude: number;
      try {
        latitude = parseCoordinate(latitudeRaw, 'Latitude');
        longitude = parseCoordinate(longitudeRaw, 'Longitude');
      } catch (err) {
        if (err instanceof ValidationError) {
          rowErrors.push(`Row ${rowNum}: ${err.details[0]}`);
          continue;
        }
        throw err;
      }

      parsedRows.push({
        sampleName,
        sampleAnalysisType,
        isolationSource,
        collectionDate,
        geoLocName,
        latitude,
        longitude,
        predictedSirProfile,
        isolateId: optValues.isolateId ?? null,
        organism: optValues.organism ?? null,
        labSampleId: optValues.labSampleId ?? null,
        collectedBy: optValues.collectedBy ?? null,
        amrResistanceGenes: optValues.amrResistanceGenes ?? null,
        sequenceName: optValues.sequenceName ?? null,
        elementType: optValues.elementType ?? null,
        elementClass: optValues.elementClass ?? null,
        elementSubclass: optValues.elementSubclass ?? null,
        targetLength: optValues.targetLength ?? null,
        referenceSequenceLength: optValues.referenceSequenceLength ?? null,
        pctCoverageReference: optValues.pctCoverageReference ?? null,
        pctIdentityReference: optValues.pctIdentityReference ?? null,
        alignmentLength: optValues.alignmentLength ?? null,
        accessionClosestSequence: optValues.accessionClosestSequence ?? null,
        virulenceGenes: optValues.virulenceGenes ?? null,
        plasmidReplicons: optValues.plasmidReplicons ?? null,
        ph: optValues.ph ?? null,
        tempOfWater: optValues.tempOfWater ?? null,
        tdsMgL: optValues.tdsMgL ?? null,
        dissolvedOxygenMgL: optValues.dissolvedOxygenMgL ?? null,
      });
    }

    if (rowErrors.length > 0) {
      throw new ValidationError([
        `MISSING DATA: ${rowErrors.length} row${rowErrors.length !== 1 ? 's have' : ' has'} missing or invalid values.`,
        ...rowErrors,
      ]);
    }

    return { valid: true, rowCount: parsedRows.length, rows: parsedRows };
  }

  /** Validate and persist rows. Skips rows whose sample_name already exists. */
  async ingestWorkbook(buffer: Buffer): Promise<IngestResult> {
    const { rows } = await this.validateWorkbook(buffer);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let insertedCount = 0;
      const skippedNames: string[] = [];

      const insertSql = `
        INSERT INTO samples (
          sample_name, sample_analysis_type, isolation_source,
          collection_date, geo_loc_name, latitude, longitude, predicted_sir_profile,
          isolate_id, organism, lab_sample_id, collected_by, amr_resistance_genes,
          sequence_name, element_type, element_class, element_subclass,
          target_length, reference_sequence_length, pct_coverage_reference, pct_identity_reference,
          alignment_length, accession_closest_sequence, virulence_genes, plasmid_replicons,
          ph, water_temp_c, tds_mg_l, dissolved_oxygen_mg_l
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
          $26, $27, $28, $29
        )
        ON CONFLICT (sample_name) DO NOTHING
        RETURNING sample_name
      `;

      for (const row of rows) {
        const result = await client.query<{ sample_name: string }>(insertSql, [
          row.sampleName,
          row.sampleAnalysisType,
          row.isolationSource,
          row.collectionDate,
          row.geoLocName,
          row.latitude,
          row.longitude,
          row.predictedSirProfile,
          row.isolateId,
          row.organism,
          row.labSampleId,
          row.collectedBy,
          row.amrResistanceGenes,
          row.sequenceName,
          row.elementType,
          row.elementClass,
          row.elementSubclass,
          row.targetLength,
          row.referenceSequenceLength,
          row.pctCoverageReference,
          row.pctIdentityReference,
          row.alignmentLength,
          row.accessionClosestSequence,
          row.virulenceGenes,
          row.plasmidReplicons,
          row.ph,
          row.tempOfWater,
          row.tdsMgL,
          row.dissolvedOxygenMgL,
        ]);

        if (result.rowCount && result.rowCount > 0) {
          insertedCount += 1;
        } else {
          skippedNames.push(row.sampleName);
        }
      }

      await client.query('COMMIT');
      return { insertedCount, skippedCount: skippedNames.length, skippedNames };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
