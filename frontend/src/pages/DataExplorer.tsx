import { useMemo, useState, type ChangeEvent } from "react";
import { Button, Card, FormField } from "../components/ui";

const TSV_HEADERS = [
  "University of Pretoria Culture number",
  "Isolate number",
  "Farm",
  "Trip",
  "Source",
  "Sample Number",
  "AR Code",
  "Isolate number",
  "Notes",
  "Organism Identity",
  "Owner",
  "IntI1 Positive",
  "IntI2 Positive",
  "IntI3 Positive",
  "CTX-M Gp1",
  "CTX-M Gp9",
  "CTX-M Gp8/25",
  "TEM",
  "SHV",
  "OXA",
  "ACC",
  "EBC",
  "DHA",
  "CIT",
  "FOX",
  "MOX",
] as const;

type UploadRow = {
  upCultureNumber: string;
  isolateNumber: string;
  farm: string;
  trip: string;
  source: string;
  sampleNumber: string;
  arCode: string;
  isolateNumberSecondary: string;
  notes: string;
  organismIdentity: string;
  owner: string;
  intI1Positive: string;
  intI2Positive: string;
  intI3Positive: string;
  ctxMGp1: string;
  ctxMGp9: string;
  ctxMGp825: string;
  tem: string;
  shv: string;
  oxa: string;
  acc: string;
  ebc: string;
  dha: string;
  cit: string;
  fox: string;
  mox: string;
};

const API_BASE_URL = "http://localhost:3000";

function parseTsv(content: string): UploadRow[] {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("The TSV file is empty.");
  }

  const [headerLine, ...dataLines] = lines;
  const actualHeaders = headerLine.split("\t").map((h) => h.trim());
  const requiredHeaderStart = TSV_HEADERS.slice(0, 7);

  for (let i = 0; i < requiredHeaderStart.length; i += 1) {
    if (actualHeaders[i] !== requiredHeaderStart[i]) {
      throw new Error("Invalid TSV header format. Please use the required template.");
    }
  }

  return dataLines.map((line) => {
    const cells = line.split("\t");
    const getCell = (index: number): string => (cells[index] ?? "").trim();

    return {
      upCultureNumber: getCell(0),
      isolateNumber: getCell(1),
      farm: getCell(2),
      trip: getCell(3),
      source: getCell(4),
      sampleNumber: getCell(5),
      arCode: getCell(6),
      isolateNumberSecondary: getCell(7),
      notes: getCell(8),
      organismIdentity: getCell(9),
      owner: getCell(10),
      intI1Positive: getCell(11),
      intI2Positive: getCell(12),
      intI3Positive: getCell(13),
      ctxMGp1: getCell(14),
      ctxMGp9: getCell(15),
      ctxMGp825: getCell(16),
      tem: getCell(17),
      shv: getCell(18),
      oxa: getCell(19),
      acc: getCell(20),
      ebc: getCell(21),
      dha: getCell(22),
      cit: getCell(23),
      fox: getCell(24),
      mox: getCell(25),
    };
  });
}

export default function DataExplorer() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const acceptedColumnsText = useMemo(() => TSV_HEADERS.join(" | "), []);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setMessage("");
    setError("");
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please choose a TSV file.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setMessage("");

      const fileContent = await file.text();
      const rows = parseTsv(fileContent);

      if (rows.length === 0) {
        setError("The file only has headers and no data rows.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/genotypic-analysis/upload-tsv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Upload failed.");
      }

      setMessage(`Upload successful. Inserted ${result?.data?.insertedCount ?? rows.length} rows.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-[2rem] font-bold text-primary mb-6 tracking-[-0.3px]">Data Explorer</h1>

      <Card className="max-w-[980px]">
        <FormField label="Upload Genotypic Analysis TSV" required>
          <input
            type="file"
            accept=".tsv,.txt"
            onChange={onFileChange}
            className="border border-black/15 rounded-lg bg-white px-3 py-2"
          />
        </FormField>

        <p className="text-sm text-text-muted">
          Required columns (in this order): {acceptedColumnsText}
        </p>

        {file && <p className="text-sm text-text-dark">Selected file: {file.name}</p>}
        {message && <p className="text-sm text-primary font-semibold">{message}</p>}
        {error && <p className="text-sm text-danger font-semibold">{error}</p>}

        <div>
          <Button onClick={uploadFile} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload TSV"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
