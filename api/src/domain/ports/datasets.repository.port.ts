export interface UploadedFileRecord {
  id: string;
  filename: string;
  file_type:
    | 'isolates'
    | 'staramr'
    | 'amrfinder-plus'
    | 'amrfinder-plus-tsv'
    | 'genotypic'
    | 'map-attachment';
  status: 'loaded' | 'processing' | 'error' | 'validating';
  row_count: number | null;
  error_message?: string | null;
  uploaded_at: string; // ISO string from database
  source_table: string;
}

export interface DatasetsRepositoryPort {
  /**
   * Fetch all uploaded files with metadata.
   */
  getAllFiles(): Promise<UploadedFileRecord[]>;

  /**
   * Fetch a specific file by ID.
   */
  getFileById(id: string): Promise<UploadedFileRecord | null>;

  /**
   * Record a new file upload.
   */
  recordFileUpload(
    filename: string,
    fileType: UploadedFileRecord['file_type'],
    rowCount: number,
    sourceTable: string,
    userId?: string,
  ): Promise<UploadedFileRecord>;

  /**
   * Fetch all rows from a specific table (source_table).
   */
  getRowsBySourceTable(sourceTable: string, fileId?: string): Promise<Record<string, unknown>[]>;
}
