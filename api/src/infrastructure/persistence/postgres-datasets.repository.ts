import { Pool } from 'pg';
import {
  DatasetsRepositoryPort,
  UploadedFileRecord,
} from '../../domain/ports/datasets.repository.port';

export class PostgresDatasetsRepository implements DatasetsRepositoryPort {
  constructor(private readonly pool: Pool) {}

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
          id,
          filename,
          file_type,
          status,
          row_count,
          error_message,
          uploaded_at,
          source_table
        FROM uploaded_files
        UNION ALL
        SELECT
          id,
          display_name AS filename,
          'map-attachment'::text AS file_type,
          'loaded'::text AS status,
          NULL::int AS row_count,
          NULL::text AS error_message,
          created_at AS uploaded_at,
          'map_attachments'::text AS source_table
        FROM map_attachments
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
          id,
          filename,
          file_type,
          status,
          row_count,
          error_message,
          uploaded_at,
          source_table
        FROM uploaded_files
        UNION ALL
        SELECT
          id,
          display_name AS filename,
          'map-attachment'::text AS file_type,
          'loaded'::text AS status,
          NULL::int AS row_count,
          NULL::text AS error_message,
          created_at AS uploaded_at,
          'map_attachments'::text AS source_table
        FROM map_attachments
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
    const allowedTables = ['samples', 'isolates', 'staramr_isolates', 'example_amrfinder_plus', 'map_attachments'];

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
          latitude,
          longitude,
          uploaded_by,
          created_at
        FROM map_attachments
        WHERE id = $1`,
        [fileId],
      );
      return result.rows;
    }

    // Use dynamic query with parameterized table name (note: table names can't be parameterized in pg)
    const query = `SELECT * FROM ${sourceTable} LIMIT 1000`;
    const result = await this.pool.query(query);

    return result.rows;
  }
}
