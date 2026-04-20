import { Pool } from 'pg';
import { NotFoundError } from '../errors/app.errors';

/** Align coordinates so nearby clicks map to the same bucket (≈ 1.1 m). */
export function normalizeCoord(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

export type MapAttachmentMarker = {
  id: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

export type MapAttachmentListItem = {
  id: string;
  displayName: string;
  originalFilename: string;
  mimeType: string;
  createdAt: string;
};

export type MapAttachmentDownload = {
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
  displayName: string;
};

export class MapAttachmentService {
  constructor(private readonly pool: Pool) {}

  async listMarkers(): Promise<MapAttachmentMarker[]> {
    const { rows } = await this.pool.query<{
      id: string;
      latitude: string;
      longitude: string;
      display_name: string;
    }>(
      `SELECT id, latitude, longitude, display_name
       FROM map_attachments
       ORDER BY created_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      displayName: r.display_name,
    }));
  }

  async listForLocation(latitude: number, longitude: number): Promise<MapAttachmentListItem[]> {
    const lat = normalizeCoord(latitude);
    const lng = normalizeCoord(longitude);
    const { rows } = await this.pool.query<{
      id: string;
      display_name: string;
      original_filename: string;
      mime_type: string;
      created_at: Date;
    }>(
      `SELECT id, display_name, original_filename, mime_type, created_at
       FROM map_attachments
       WHERE ROUND(latitude::numeric, 5) = ROUND($1::numeric, 5)
         AND ROUND(longitude::numeric, 5) = ROUND($2::numeric, 5)
       ORDER BY created_at DESC`,
      [lat, lng],
    );
    return rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      originalFilename: r.original_filename,
      mimeType: r.mime_type,
      createdAt: r.created_at.toISOString(),
    }));
  }

  async create(params: {
    latitude: number;
    longitude: number;
    displayName: string;
    originalFilename: string;
    mimeType: string;
    fileBuffer: Buffer;
    uploadedBy: string;
  }): Promise<{ id: string }> {
    const lat = normalizeCoord(params.latitude);
    const lng = normalizeCoord(params.longitude);
    const displayName = params.displayName.trim();
    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO map_attachments (
        latitude, longitude, display_name, original_filename, mime_type, file_data, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        lat,
        lng,
        displayName,
        params.originalFilename.trim().slice(0, 500),
        params.mimeType.slice(0, 255),
        params.fileBuffer,
        params.uploadedBy,
      ],
    );
    return { id: rows[0]!.id };
  }

  async getForDownload(id: string): Promise<MapAttachmentDownload> {
    const { rows } = await this.pool.query<{
      file_data: Buffer;
      mime_type: string;
      original_filename: string;
      display_name: string;
    }>(
      `SELECT file_data, mime_type, original_filename, display_name
       FROM map_attachments WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundError('Attachment');
    }
    return {
      buffer: row.file_data,
      mimeType: row.mime_type,
      originalFilename: row.original_filename,
      displayName: row.display_name,
    };
  }
}
