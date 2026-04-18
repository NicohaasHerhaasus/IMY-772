import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import { ValidationError } from '../errors/app.errors';

type UploadRow = Record<string, string | null | undefined>;

const MAX_ROWS_PER_UPLOAD = 5000;

/** Row 1 of the spreadsheet must match these titles in order (spacing/case may vary). */
export const GENOTYPIC_SPREADSHEET_HEADERS = [
  'University of Pretoria Culture number',
  'Isolate number',
  'Farm',
  'Trip',
  'Source',
  'Sample Number',
  'AR Code',
  'Isolate number',
  'Notes',
  'Organism Identity',
  'Owner',
  'IntI1 Positive',
  'IntI2 Positive',
  'IntI3 Positive',
  'CTX-M Gp1',
  'CTX-M Gp9',
  'CTX-M Gp8/25',
  'TEM',
  'SHV',
  'OXA',
  'ACC',
  'EBC',
  'DHA',
  'CIT',
  'FOX',
  'MOX',
] as const;

function normalizeExcelHeaderCell(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const EXPECTED_HEADER_NORMALIZED = GENOTYPIC_SPREADSHEET_HEADERS.map((h) => normalizeExcelHeaderCell(h));

function matrixRowToUploadRow(row: unknown[]): UploadRow {
  const c = (i: number): string => String(row[i] ?? '').trim();
  return {
    upCultureNumber: c(0),
    isolateNumber: c(1),
    farm: c(2),
    trip: c(3),
    source: c(4),
    sampleNumber: c(5),
    arCode: c(6),
    isolateNumberSecondary: c(7),
    notes: c(8),
    organismIdentity: c(9),
    owner: c(10),
    intI1Positive: c(11),
    intI2Positive: c(12),
    intI3Positive: c(13),
    ctxMGp1: c(14),
    ctxMGp9: c(15),
    ctxMGp825: c(16),
    tem: c(17),
    shv: c(18),
    oxa: c(19),
    acc: c(20),
    ebc: c(21),
    dha: c(22),
    cit: c(23),
    fox: c(24),
    mox: c(25),
  };
}

function parseGenotypicXlsxToRows(buffer: Buffer): UploadRow[] {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError(['Uploaded file is empty.']);
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new ValidationError(['Invalid .xlsx file.']);
  }

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as unknown[][];

    if (!matrix.length) {
      continue;
    }

    const maxScan = Math.min(15, matrix.length);
    for (let headerRowIndex = 0; headerRowIndex < maxScan; headerRowIndex += 1) {
      const headerCells = (matrix[headerRowIndex] ?? []).map((cell) => String(cell ?? '').trim());
      if (headerCells.length < EXPECTED_HEADER_NORMALIZED.length) {
        continue;
      }

      const normalizedHeaderRow = headerCells
        .slice(0, EXPECTED_HEADER_NORMALIZED.length)
        .map((h) => normalizeExcelHeaderCell(h));

      let headerMatch = true;
      for (let i = 0; i < EXPECTED_HEADER_NORMALIZED.length; i += 1) {
        if (normalizedHeaderRow[i] !== EXPECTED_HEADER_NORMALIZED[i]) {
          headerMatch = false;
          break;
        }
      }
      if (!headerMatch) {
        continue;
      }

      const rows: UploadRow[] = [];
      for (let r = headerRowIndex + 1; r < matrix.length; r += 1) {
        const rawRow = matrix[r] ?? [];
        const row = rawRow as unknown[];
        const hasValue = row.some((cell) => String(cell ?? '').trim() !== '');
        if (!hasValue) {
          continue;
        }
        rows.push(matrixRowToUploadRow(row));
      }

      if (rows.length === 0) {
        throw new ValidationError(['No data rows found below the header row on the matching sheet.']);
      }

      return rows;
    }
  }

  throw new ValidationError([
    'No sheet found with the required genotypic column headers in row 1.',
    `Sheets in workbook: ${workbook.SheetNames.join(', ') || '(none)'}`,
  ]);
}

function normalizeValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class GenotypicAnalysisService {
  constructor(private readonly pool: Pool) {}

  async uploadXlsx(buffer: Buffer): Promise<{ insertedCount: number }> {
    const rows = parseGenotypicXlsxToRows(buffer);
    return this.uploadRows(rows);
  }

  async uploadRows(rows: UploadRow[]): Promise<{ insertedCount: number }> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new ValidationError(['rows must contain at least one TSV row.']);
    }

    if (rows.length > MAX_ROWS_PER_UPLOAD) {
      throw new ValidationError([`rows exceeds maximum of ${MAX_ROWS_PER_UPLOAD} rows per upload.`]);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const row of rows) {
        await client.query(
          `
            INSERT INTO genotypic_analysis (
              up_culture_number,
              isolate_number,
              farm,
              trip,
              source,
              sample_number,
              ar_code,
              isolate_number_secondary,
              notes,
              organism_identity,
              owner,
              inti1_positive,
              inti2_positive,
              inti3_positive,
              ctx_m_gp1,
              ctx_m_gp9,
              ctx_m_gp8_25,
              tem,
              shv,
              oxa,
              acc,
              ebc,
              dha,
              cit,
              fox,
              mox
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
            );
          `,
          [
            normalizeValue(row.upCultureNumber),
            normalizeValue(row.isolateNumber),
            normalizeValue(row.farm),
            normalizeValue(row.trip),
            normalizeValue(row.source),
            normalizeValue(row.sampleNumber),
            normalizeValue(row.arCode),
            normalizeValue(row.isolateNumberSecondary),
            normalizeValue(row.notes),
            normalizeValue(row.organismIdentity),
            normalizeValue(row.owner),
            normalizeValue(row.intI1Positive),
            normalizeValue(row.intI2Positive),
            normalizeValue(row.intI3Positive),
            normalizeValue(row.ctxMGp1),
            normalizeValue(row.ctxMGp9),
            normalizeValue(row.ctxMGp825),
            normalizeValue(row.tem),
            normalizeValue(row.shv),
            normalizeValue(row.oxa),
            normalizeValue(row.acc),
            normalizeValue(row.ebc),
            normalizeValue(row.dha),
            normalizeValue(row.cit),
            normalizeValue(row.fox),
            normalizeValue(row.mox),
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
