import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import {
  DatasetsRepositoryPort,
  UploadedFileRecord,
} from '../../domain/ports/datasets.repository.port';

export class PostgresDatasetsRepository implements DatasetsRepositoryPort {
  constructor(private readonly pool: Pool) {}

  private parseDelimited(content: string, delimiter: ',' | '\t'): Record<string, unknown>[] {
    const lines = content
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(delimiter).map((h) => h.trim());
    const rows: Record<string, unknown>[] = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(delimiter);
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        row[h || `column_${i + 1}`] = cols[i] ?? '';
      });
      rows.push(row);
    }
    return rows;
  }

  async getAllFiles(): Promise<UploadedFileRecord[]> {
    const result = await this.pool.query(
      `SELECT
        id,
        filename,
        file_type,
        status,
        row_count,
        error_message,
        uploaded_at,
        source_table
      FROM (
        SELECT
          u.id,
          u.display_name AS filename,
          CASE
            WHEN u.source_type = 'map_pin' THEN 'map-attachment'
            WHEN u.upload_channel = 'staramr_workbook' THEN 'staramr'
            WHEN u.upload_channel = 'example_amrfinder_workbook' THEN 'amrfinder-plus'
            WHEN u.upload_channel = 'example_amrfinder_tsv' THEN 'amrfinder-plus-tsv'
            WHEN u.upload_channel LIKE 'genotypic_%' THEN 'genotypic'
            ELSE 'isolates'
          END AS file_type,
          'loaded'::text AS status,
          NULL::int AS row_count,
          NULL::text AS error_message,
          u.created_at AS uploaded_at,
          CASE
            WHEN u.source_type = 'map_pin' THEN 'map_attachments'
            WHEN u.upload_channel = 'staramr_workbook' THEN 'staramr_isolates'
            WHEN u.upload_channel = 'example_amrfinder_workbook' THEN 'example_amrfinder_plus'
            WHEN u.upload_channel = 'example_amrfinder_tsv' THEN 'example_amrfinder_plus'
            WHEN u.upload_channel LIKE 'genotypic_%' THEN 'genotypic_analysis'
            ELSE 'samples'
          END AS source_table
        FROM uploaded_datafiles u
      ) datasets
      ORDER BY uploaded_at DESC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      file_type: row.file_type,
      status: row.status,
      row_count: row.row_count,
      error_message: row.error_message,
      uploaded_at:
        typeof row.uploaded_at === 'string'
          ? new Date(row.uploaded_at).toISOString()
          : row.uploaded_at.toISOString(),
      source_table: row.source_table,
    }));
  }

  async getFileById(id: string): Promise<UploadedFileRecord | null> {
    const result = await this.pool.query(
      `SELECT
        id,
        filename,
        file_type,
        status,
        row_count,
        error_message,
        uploaded_at,
        source_table
      FROM (
        SELECT
          u.id,
          u.display_name AS filename,
          CASE
            WHEN u.source_type = 'map_pin' THEN 'map-attachment'
            WHEN u.upload_channel = 'staramr_workbook' THEN 'staramr'
            WHEN u.upload_channel = 'example_amrfinder_workbook' THEN 'amrfinder-plus'
            WHEN u.upload_channel = 'example_amrfinder_tsv' THEN 'amrfinder-plus-tsv'
            WHEN u.upload_channel LIKE 'genotypic_%' THEN 'genotypic'
            ELSE 'isolates'
          END AS file_type,
          'loaded'::text AS status,
          NULL::int AS row_count,
          NULL::text AS error_message,
          u.created_at AS uploaded_at,
          CASE
            WHEN u.source_type = 'map_pin' THEN 'map_attachments'
            WHEN u.upload_channel = 'staramr_workbook' THEN 'staramr_isolates'
            WHEN u.upload_channel = 'example_amrfinder_workbook' THEN 'example_amrfinder_plus'
            WHEN u.upload_channel = 'example_amrfinder_tsv' THEN 'example_amrfinder_plus'
            WHEN u.upload_channel LIKE 'genotypic_%' THEN 'genotypic_analysis'
            ELSE 'samples'
          END AS source_table
        FROM uploaded_datafiles u
      ) datasets
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      filename: row.filename,
      file_type: row.file_type,
      status: row.status,
      row_count: row.row_count,
      error_message: row.error_message,
      uploaded_at:
        typeof row.uploaded_at === 'string'
          ? new Date(row.uploaded_at).toISOString()
          : row.uploaded_at.toISOString(),
      source_table: row.source_table,
    };
  }

  async recordFileUpload(
    filename: string,
    fileType: UploadedFileRecord['file_type'],
    rowCount: number,
    sourceTable: string,
    userId?: string,
  ): Promise<UploadedFileRecord> {
    const result = await this.pool.query(
      `INSERT INTO uploaded_files 
        (filename, file_type, row_count, source_table, uploaded_by_user_id, status)
      VALUES ($1, $2, $3, $4, $5, 'loaded')
      RETURNING id, filename, file_type, status, row_count, error_message, uploaded_at, source_table`,
      [filename, fileType, rowCount, sourceTable, userId || null]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      filename: row.filename,
      file_type: row.file_type,
      status: row.status,
      row_count: row.row_count,
      error_message: row.error_message,
      uploaded_at: row.uploaded_at.toISOString(),
      source_table: row.source_table,
    };
  }

  async getRowsBySourceTable(sourceTable: string, fileId?: string): Promise<Record<string, unknown>[]> {
    // Dynamically query the source table (with basic SQL injection protection)
    // This assumes all source tables follow the same naming conventions
    const allowedTables = [
      'samples',
      'isolates',
      'staramr_isolates',
      'example_amrfinder_plus',
      'genotypic_analysis',
      'map_attachments',
    ];

    if (!allowedTables.includes(sourceTable)) {
      throw new Error(`Invalid source table: ${sourceTable}`);
    }

    if (sourceTable === 'map_attachments') {
      if (!fileId) {
        throw new Error('fileId is required for map_attachments rows.');
      }
      const result = await this.pool.query(
        `SELECT
          id,
          display_name,
          original_filename,
          mime_type,
          file_data,
          latitude,
          longitude,
          uploaded_by,
          created_at
        FROM map_attachments
        WHERE id = $1`,
        [fileId],
      );
      const file = result.rows[0] as
        | {
            id: string;
            display_name: string;
            original_filename: string;
            mime_type: string;
            file_data: Buffer | null;
            latitude: number;
            longitude: number;
            uploaded_by: string;
            created_at: Date;
          }
        | undefined;

      if (!file || !file.file_data) return [];

      const lowerName = file.original_filename.toLowerCase();
      const mime = (file.mime_type ?? '').toLowerCase();

      try {
        if (lowerName.endsWith('.csv') || mime.includes('csv')) {
          return this.parseDelimited(file.file_data.toString('utf8'), ',');
        }
        if (lowerName.endsWith('.tsv') || mime.includes('tab-separated') || lowerName.endsWith('.txt')) {
          return this.parseDelimited(file.file_data.toString('utf8'), '\t');
        }
        if (lowerName.endsWith('.xlsx') || mime.includes('spreadsheetml')) {
          const wb = XLSX.read(file.file_data, { type: 'buffer' });
          const firstSheet = wb.SheetNames[0];
          if (!firstSheet) return [];
          return XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[firstSheet], { defval: '' });
        }
      } catch {
        // fall through to metadata row
      }

      return [
        {
          id: file.id,
          display_name: file.display_name,
          original_filename: file.original_filename,
          mime_type: file.mime_type,
          latitude: file.latitude,
          longitude: file.longitude,
          uploaded_by: file.uploaded_by,
          created_at: file.created_at,
        },
      ];
    }

    // Use dynamic query with parameterized table name (note: table names can't be parameterized in pg)
    const query = `SELECT * FROM ${sourceTable} LIMIT 1000`;
    const result = await this.pool.query(query);

    return result.rows;
  }
}
