import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import { ValidationError } from '../errors/app.errors';

type AmrFinderPlusRow = {
  sampleId: string;
  proteinIdentifier: string;
  geneSymbol: string | null;
  sequenceName: string | null;
  scope: string | null;
  elementType: string | null;
  elementSubtype: string | null;
  className: string | null;
  subclass: string | null;
  method: string | null;
  targetLength: number | null;
  referenceSequenceLength: number | null;
  pctCoverageReference: number | null;
  pctIdentityReference: number | null;
  alignmentLength: number | null;
  accessionClosestSequence: string | null;
  nameClosestSequence: string | null;
  hmmId: string | null;
  hmmDescription: string | null;
};

const REQUIRED_HEADERS = [
  'SampleID',
  'Protein identifier',
  'Gene symbol',
  'Sequence name',
  'Scope',
  'Element type',
  'Element subtype',
  'Class',
  'Subclass',
  'Method',
  'Target length',
  'Reference sequence length',
  '% Coverage of reference sequence',
  '% Identity to reference sequence',
  'Alignment length',
  'Accession of closest sequence',
  'Name of closest sequence',
  'HMM id',
  'HMM description',
] as const;

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function toNullableString(value: unknown): string | null {
  const str = String(value ?? '').trim();
  return str.length > 0 ? str : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[% ,]/g, '').trim();
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function findSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet | undefined {
  const preferred = normalizeHeader('Sheet 1 - exampleAMRFinderPlus');
  const fallback = normalizeHeader('exampleAMRFinderPlus');
  for (const sheetName of workbook.SheetNames) {
    const key = normalizeHeader(sheetName);
    if (key === preferred || key.includes(fallback)) {
      return workbook.Sheets[sheetName];
    }
  }
  return undefined;
}

function mapRows(records: Record<string, unknown>[]): AmrFinderPlusRow[] {
  if (!records.length) {
    throw new ValidationError(['No data rows found in AMRFinderPlus file.']);
  }

  const firstHeaders = Object.keys(records[0] ?? {});
  const normalizedHeaderSet = new Set(firstHeaders.map((h) => normalizeHeader(h)));
  const missing = REQUIRED_HEADERS.filter((h) => !normalizedHeaderSet.has(normalizeHeader(h)));
  if (missing.length > 0) {
    throw new ValidationError([`Missing required columns: ${missing.join(', ')}`]);
  }

  return records
    .map((row) => {
      const get = (name: string): unknown =>
        row[
          Object.keys(row).find((k) => normalizeHeader(k) === normalizeHeader(name)) ?? name
        ];

      const sampleId = toNullableString(get('SampleID'));
      const proteinIdentifier = toNullableString(get('Protein identifier'));
      if (!sampleId || !proteinIdentifier) {
        return null;
      }

      return {
        sampleId,
        proteinIdentifier,
        geneSymbol: toNullableString(get('Gene symbol')),
        sequenceName: toNullableString(get('Sequence name')),
        scope: toNullableString(get('Scope')),
        elementType: toNullableString(get('Element type')),
        elementSubtype: toNullableString(get('Element subtype')),
        className: toNullableString(get('Class')),
        subclass: toNullableString(get('Subclass')),
        method: toNullableString(get('Method')),
        targetLength: toNullableNumber(get('Target length')),
        referenceSequenceLength: toNullableNumber(get('Reference sequence length')),
        pctCoverageReference: toNullableNumber(get('% Coverage of reference sequence')),
        pctIdentityReference: toNullableNumber(get('% Identity to reference sequence')),
        alignmentLength: toNullableNumber(get('Alignment length')),
        accessionClosestSequence: toNullableString(get('Accession of closest sequence')),
        nameClosestSequence: toNullableString(get('Name of closest sequence')),
        hmmId: toNullableString(get('HMM id')),
        hmmDescription: toNullableString(get('HMM description')),
      } satisfies AmrFinderPlusRow;
    })
    .filter((r): r is AmrFinderPlusRow => r !== null);
}

function parseWorkbook(buffer: Buffer): AmrFinderPlusRow[] {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError(['Uploaded file is empty.']);
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new ValidationError(['Invalid .xlsx file.']);
  }

  const sheet = findSheet(workbook);
  if (!sheet) {
    throw new ValidationError([
      'Could not find the AMRFinderPlus sheet. Expected "Sheet 1 - exampleAMRFinderPlus".',
      `Sheets in file: ${workbook.SheetNames.join(', ') || '(none)'}`,
    ]);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: false });
  return mapRows(rows);
}

function parseTsv(buffer: Buffer): AmrFinderPlusRow[] {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError(['Uploaded file is empty.']);
  }
  const content = buffer.toString('utf-8');
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  if (lines.length < 2) {
    throw new ValidationError(['TSV must include a header and at least one row.']);
  }

  const headers = lines[0].split('\t').map((h) => h.trim());
  const records: Record<string, unknown>[] = lines.slice(1).map((line) => {
    const cells = line.split('\t');
    const record: Record<string, unknown> = {};
    for (let i = 0; i < headers.length; i += 1) {
      record[headers[i]] = cells[i] ?? '';
    }
    return record;
  });
  return mapRows(records);
}

export class ExampleAmrFinderPlusUploadService {
  constructor(private readonly pool: Pool) {}

  async ingestWorkbook(buffer: Buffer): Promise<{ insertedCount: number }> {
    const rows = parseWorkbook(buffer);
    return this.insertRows(rows);
  }

  async ingestTsv(buffer: Buffer): Promise<{ insertedCount: number }> {
    const rows = parseTsv(buffer);
    return this.insertRows(rows);
  }

  private async insertRows(rows: AmrFinderPlusRow[]): Promise<{ insertedCount: number }> {
    if (rows.length === 0) {
      throw new ValidationError(['No valid rows found. SampleID and Protein identifier are required.']);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        await client.query(
          `
            INSERT INTO example_amrfinder_plus (
              sample_id, protein_identifier, gene_symbol, sequence_name, scope,
              element_type, element_subtype, class, subclass, method,
              target_length, reference_sequence_length, pct_coverage_reference,
              pct_identity_reference, alignment_length, accession_closest_sequence,
              name_closest_sequence, hmm_id, hmm_description
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16,
              $17, $18, $19
            );
          `,
          [
            row.sampleId,
            row.proteinIdentifier,
            row.geneSymbol,
            row.sequenceName,
            row.scope,
            row.elementType,
            row.elementSubtype,
            row.className,
            row.subclass,
            row.method,
            row.targetLength,
            row.referenceSequenceLength,
            row.pctCoverageReference,
            row.pctIdentityReference,
            row.alignmentLength,
            row.accessionClosestSequence,
            row.nameClosestSequence,
            row.hmmId,
            row.hmmDescription,
          ],
        );
      }
      await client.query('COMMIT');
      return { insertedCount: rows.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
