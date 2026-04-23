import { Pool } from 'pg';
import { NotFoundError } from '../errors/app.errors';

export type DatafileSourceType = 'structured_upload' | 'map_pin';

export type ManagedDatafile = {
  id: string;
  sourceType: DatafileSourceType;
  sourceRefId: string | null;
  uploadChannel: string;
  displayName: string;
  originalFilename: string;
  mimeType: string;
  uploadedBy: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicDatafile = {
  id: string;
  sourceType: DatafileSourceType;
  displayName: string;
  originalFilename: string;
  mimeType: string;
  uploadChannel: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  downloadable: boolean;
};

export type DatafileDownload = {
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
};

export class UploadedDatafileService {
  constructor(private readonly pool: Pool) {}

  async createStructured(params: {
    uploadChannel: string;
    displayName: string;
    originalFilename: string;
    mimeType: string;
    uploadedBy: string;
    fileBuffer?: Buffer;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO uploaded_datafiles (
        source_type, upload_channel, display_name, original_filename, mime_type, uploaded_by, file_data
      ) VALUES ('structured_upload', $1, $2, $3, $4, $5, $6)`,
      [
        params.uploadChannel.trim().slice(0, 64),
        params.displayName.trim().slice(0, 500),
        params.originalFilename.trim().slice(0, 500),
        params.mimeType.trim().slice(0, 255) || 'application/octet-stream',
        params.uploadedBy,
        params.fileBuffer ?? null,
      ],
    );
  }

  async createMapPinRecord(params: {
    sourceRefId: string;
    displayName: string;
    originalFilename: string;
    mimeType: string;
    uploadedBy: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO uploaded_datafiles (
        source_type, source_ref_id, upload_channel, display_name, original_filename, mime_type, uploaded_by
      ) VALUES ('map_pin', $1, 'map_location_upload', $2, $3, $4, $5)`,
      [
        params.sourceRefId,
        params.displayName.trim().slice(0, 500),
        params.originalFilename.trim().slice(0, 500),
        params.mimeType.trim().slice(0, 255) || 'application/octet-stream',
        params.uploadedBy,
      ],
    );
  }

  async listAll(): Promise<ManagedDatafile[]> {
    const { rows } = await this.pool.query<{
      id: string;
      source_type: DatafileSourceType;
      source_ref_id: string | null;
      upload_channel: string;
      display_name: string;
      original_filename: string;
      mime_type: string;
      uploaded_by: string;
      latitude: string | null;
      longitude: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT
        u.id,
        u.source_type,
        u.source_ref_id,
        u.upload_channel,
        u.display_name,
        u.original_filename,
        u.mime_type,
        u.uploaded_by,
        m.latitude::text,
        m.longitude::text,
        u.created_at,
        u.updated_at
      FROM uploaded_datafiles u
      LEFT JOIN map_attachments m ON m.id = u.source_ref_id
      ORDER BY u.created_at DESC`,
    );

    return rows.map((r) => ({
      id: r.id,
      sourceType: r.source_type,
      sourceRefId: r.source_ref_id,
      uploadChannel: r.upload_channel,
      displayName: r.display_name,
      originalFilename: r.original_filename,
      mimeType: r.mime_type,
      uploadedBy: r.uploaded_by,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }));
  }

  async listPublic(): Promise<PublicDatafile[]> {
    const { rows } = await this.pool.query<{
      id: string;
      source_type: DatafileSourceType;
      source_ref_id: string | null;
      upload_channel: string;
      display_name: string;
      original_filename: string;
      mime_type: string;
      latitude: string | null;
      longitude: string | null;
      created_at: Date;
      has_structured_file_data: boolean;
      has_map_file_data: boolean;
    }>(
      `SELECT
        u.id,
        u.source_type,
        u.source_ref_id,
        u.upload_channel,
        u.display_name,
        u.original_filename,
        u.mime_type,
        m.latitude::text,
        m.longitude::text,
        u.created_at,
        (u.file_data IS NOT NULL) AS has_structured_file_data,
        (m.file_data IS NOT NULL) AS has_map_file_data
      FROM uploaded_datafiles u
      LEFT JOIN map_attachments m ON m.id = u.source_ref_id
      ORDER BY u.created_at DESC`,
    );

    return rows.map((r) => ({
      id: r.id,
      sourceType: r.source_type,
      displayName: r.display_name,
      originalFilename: r.original_filename,
      mimeType: r.mime_type,
      uploadChannel: r.upload_channel,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      createdAt: r.created_at.toISOString(),
      downloadable:
        r.source_type === 'map_pin' ? r.has_map_file_data : r.has_structured_file_data,
    }));
  }

  async getById(id: string): Promise<ManagedDatafile> {
    const { rows } = await this.pool.query<{
      id: string;
      source_type: DatafileSourceType;
      source_ref_id: string | null;
      upload_channel: string;
      display_name: string;
      original_filename: string;
      mime_type: string;
      uploaded_by: string;
      latitude: string | null;
      longitude: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT
        u.id,
        u.source_type,
        u.source_ref_id,
        u.upload_channel,
        u.display_name,
        u.original_filename,
        u.mime_type,
        u.uploaded_by,
        m.latitude::text,
        m.longitude::text,
        u.created_at,
        u.updated_at
      FROM uploaded_datafiles u
      LEFT JOIN map_attachments m ON m.id = u.source_ref_id
      WHERE u.id = $1`,
      [id],
    );

    const row = rows[0];
    if (!row) throw new NotFoundError('Datafile');
    return {
      id: row.id,
      sourceType: row.source_type,
      sourceRefId: row.source_ref_id,
      uploadChannel: row.upload_channel,
      displayName: row.display_name,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      uploadedBy: row.uploaded_by,
      latitude: row.latitude !== null ? Number(row.latitude) : null,
      longitude: row.longitude !== null ? Number(row.longitude) : null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async getStructuredDownloadById(id: string): Promise<DatafileDownload> {
    const { rows } = await this.pool.query<{
      file_data: Buffer | null;
      mime_type: string;
      original_filename: string;
    }>(
      `SELECT file_data, mime_type, original_filename
       FROM uploaded_datafiles
       WHERE id = $1 AND source_type = 'structured_upload'`,
      [id],
    );
    const row = rows[0];
    if (!row || !row.file_data) throw new NotFoundError('Datafile');
    return {
      buffer: row.file_data,
      mimeType: row.mime_type,
      originalFilename: row.original_filename,
    };
  }

  async rename(id: string, displayName: string): Promise<void> {
    const { rowCount } = await this.pool.query(
      `UPDATE uploaded_datafiles
       SET display_name = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, displayName.trim().slice(0, 500)],
    );
    if (!rowCount) throw new NotFoundError('Datafile');
  }

  async deleteById(id: string): Promise<void> {
    const { rowCount } = await this.pool.query(`DELETE FROM uploaded_datafiles WHERE id = $1`, [id]);
    if (!rowCount) throw new NotFoundError('Datafile');
  }
}
