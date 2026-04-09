import { useState, type ChangeEvent } from "react";
import { Button, Card, FormField } from "../components/ui";
import { IsolateExplorer } from "../components/IsolateExplorer";
import "./DataExplorer.css";

const API_BASE_URL = "http://localhost:3000";

export default function DataExplorer() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshSignal, setRefreshSignal] = useState(0);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setMessage("");
    setError("");
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please choose an .xlsx file.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx files are supported.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/upload/staramr`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Upload failed.");
      }

      const isolatesCount = result?.data?.isolatesCount ?? 0;
      const genotypesCount = result?.data?.genotypesCount ?? 0;
      const phenotypesCount = result?.data?.phenotypesCount ?? 0;
      const plasmidsCount = result?.data?.plasmidsCount ?? 0;

      setMessage(
        `Import successful. Isolates: ${isolatesCount}, Genotypes: ${genotypesCount}, ` +
          `Phenotypes: ${phenotypesCount}, Plasmids: ${plasmidsCount}.`,
      );
      setRefreshSignal((prev) => prev + 1);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="explorer-page">
      <header className="explorer-header">
        <h1 className="explorer-title">Data Explorer</h1>
        <p className="explorer-subtitle">
          Upload one StarAMR workbook and instantly explore imported isolates.
        </p>
      </header>

      <Card className="explorer-upload-card">
        <FormField label="Upload StarAMR Workbook (.xlsx)" required>
          <input
            type="file"
            accept=".xlsx"
            onChange={onFileChange}
            className="explorer-file-input"
          />
        </FormField>

        <p className="explorer-hint">
          Required sheets in workbook: <strong>Summary</strong> and{" "}
          <strong>Detailed_Summary</strong>.
        </p>

        {file && <p className="explorer-selected-file">Selected file: {file.name}</p>}
        {message && <p className="explorer-banner explorer-banner--success">{message}</p>}
        {error && <p className="explorer-banner explorer-banner--error">{error}</p>}

        <div className="explorer-upload-action">
          <Button onClick={uploadFile} disabled={isUploading}>
            {isUploading ? "Importing..." : "Import .xlsx"}
          </Button>
        </div>
      </Card>

      <section className="explorer-grid-section">
        <IsolateExplorer refreshSignal={refreshSignal} showTitle={false} />
      </section>
    </div>
  );
}
