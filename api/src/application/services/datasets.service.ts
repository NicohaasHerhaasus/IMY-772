import { DatasetsRepositoryPort, UploadedFileRecord } from '../../domain/ports/datasets.repository.port';

export class DatasetsService {
  constructor(private readonly datasetsRepository: DatasetsRepositoryPort) {}

  async getAllDatasets(): Promise<UploadedFileRecord[]> {
    return this.datasetsRepository.getAllFiles();
  }

  async getDatasetById(id: string): Promise<UploadedFileRecord | null> {
    return this.datasetsRepository.getFileById(id);
  }

  async getDatasetRows(id: string): Promise<Record<string, unknown>[]> {
    const file = await this.datasetsRepository.getFileById(id);
    if (!file) {
      throw new Error(`File not found: ${id}`);
    }

    return this.datasetsRepository.getRowsBySourceTable(file.source_table, file.id);
  }

  async recordFileUpload(
    filename: string,
    fileType: UploadedFileRecord['file_type'],
    rowCount: number,
    sourceTable: string,
    userId?: string,
  ): Promise<UploadedFileRecord> {
    return this.datasetsRepository.recordFileUpload(
      filename,
      fileType,
      rowCount,
      sourceTable,
      userId
    );
  }
}
