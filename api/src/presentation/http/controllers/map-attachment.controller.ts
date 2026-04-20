import { NextFunction, Response } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';
import { MapAttachmentService, normalizeCoord } from '../../../application/services/map-attachment.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function parseCoord(raw: unknown, label: string): number {
  if (typeof raw !== 'string' && typeof raw !== 'number') {
    throw new ValidationError([`${label} is required.`]);
  }
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  if (!Number.isFinite(n)) {
    throw new ValidationError([`${label} must be a valid number.`]);
  }
  return n;
}

export class MapAttachmentController {
  constructor(private readonly mapAttachmentService: MapAttachmentService) {}

  listMarkers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.mapAttachmentService.listMarkers();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error as Error);
    }
  };

  listForLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = parseCoord(req.query.lat, 'lat');
      const lng = parseCoord(req.query.lng, 'lng');
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new ValidationError(['lat/lng are out of range.']);
      }
      const data = await this.mapAttachmentService.listForLocation(lat, lng);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error as Error);
    }
  };

  upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['A file is required in the "file" field.']);
      }
      const userId = req.userId;
      if (!userId) {
        throw new ValidationError(['User id missing from token.']);
      }

      const displayRaw = req.body?.displayName ?? req.body?.display_name;
      if (typeof displayRaw !== 'string' || !displayRaw.trim()) {
        throw new ValidationError(['displayName is required.']);
      }

      const lat = parseCoord(req.body?.lat, 'lat');
      const lng = parseCoord(req.body?.lng, 'lng');
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new ValidationError(['lat/lng are out of range.']);
      }

      const mimeType =
        req.file.mimetype && req.file.mimetype !== 'application/octet-stream'
          ? req.file.mimetype
          : 'application/octet-stream';

      const result = await this.mapAttachmentService.create({
        latitude: lat,
        longitude: lng,
        displayName: displayRaw,
        originalFilename: req.file.originalname || 'upload.bin',
        mimeType,
        fileBuffer: req.file.buffer,
        uploadedBy: userId,
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: result.id,
          latitude: normalizeCoord(lat),
          longitude: normalizeCoord(lng),
        },
      });
    } catch (error) {
      next(error as Error);
    }
  };

  download = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new ValidationError(['Invalid attachment id.']);
      }

      const file = await this.mapAttachmentService.getForDownload(id);

      const safeName = file.originalFilename.replace(/[^\w.\- ()]+/g, '_').slice(0, 200);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.setHeader('Content-Length', String(file.buffer.length));
      res.status(200).send(file.buffer);
    } catch (error) {
      next(error as Error);
    }
  };
}
