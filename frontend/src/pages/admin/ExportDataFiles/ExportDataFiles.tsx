import { useState } from "react";
import { Button, Card, FormField, Select } from "../../../components/ui";
import type { SelectOption } from "../../../components/ui";

const DATA_SOURCES = [
  "Apies River",
  "Hennops River",
  "Crocodile River",
  "Limpopo River",
  "Vaal River",
];

const EXPORT_FORMATS: SelectOption[] = [
  { value: "JSON", label: "JSON", icon: "{ }" },
  { value: "CSV", label: "CSV", icon: "csv" },
  { value: "TSV", label: "TSV", icon: "tsv" },
  { value: "Excel (.xlsx)", label: "Excel (.xlsx)", icon: "xls" },
];

export default function ExportDatafiles() {
  const [dataSource, setDataSource] = useState("");
  const [format, setFormat] = useState("");

  const handleExport = () => {
    if (!dataSource || !format) {
      alert("Please select both a data source and a format.");
      return;
    }
    // TODO: call your backend export endpoint
    console.log({ dataSource, format });
  };

  return (
    <div>
      <h1 className="text-[2rem] font-bold mb-7 tracking-[-0.3px] transition-all duration-200" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#1c2f42' }}>
        Export Data{dataSource ? ` from ${dataSource}` : ""}
      </h1>

      <Card>
        <FormField label="Data Source" required>
          <Select
            value={dataSource}
            onChange={setDataSource}
            options={DATA_SOURCES}
            placeholder="Select a data source"
          />
        </FormField>

        <FormField label="Format" required>
          <Select
            value={format}
            onChange={setFormat}
            options={EXPORT_FORMATS}
            placeholder="Select a format"
          />
        </FormField>

        {dataSource && format && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border border-accent/30 rounded-lg text-[0.85rem] text-primary animate-fade-in">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              width={16}
              height={16}
              className="text-accent shrink-0"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Exporting <strong>{dataSource}</strong> as <strong>{format}</strong>
          </div>
        )}

        <div className="flex">
          <Button
            onClick={handleExport}
            disabled={!dataSource || !format}
            className="px-9"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              width={16}
              height={16}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </Button>
        </div>
      </Card>
    </div>
  );
}
