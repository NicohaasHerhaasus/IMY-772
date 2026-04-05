import { useState, useRef, useCallback } from "react";
import { Button, Card, FormField, Select } from "../../../components/ui";
import "./UploadDatafiles.css";

const RIVER_OPTIONS = [
  "Apies River",
  "Hennops River",
  "Crocodile River",
  "Limpopo River",
  "Vaal River",
];

export default function UploadDatafiles() {
  const [riverName, setRiverName] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [sampleNumber, setSampleNumber] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!riverName || !collectionDate || !file) {
      alert("Please fill in all required fields.");
      return;
    }
    // TODO: POST to your backend API
    console.log({ riverName, collectionDate, sampleNumber: parseInt(sampleNumber, 10), file });
  };

  const handlePreview = () => {
    // TODO: open a preview modal or navigate to preview page
    console.log("Preview", file);
  };

  return (
    <div>
      <h1 className="text-[2rem] font-bold text-primary mb-7 tracking-[-0.3px]">
        Upload Data
      </h1>

      <Card className="gap-7">
        {/* Row 1: River Name + Date + Sample Number */}
        <div className="flex gap-6 items-end flex-wrap">
          <FormField label="River Name" required className="flex-1 min-w-[200px]">
            <Select
              value={riverName}
              onChange={setRiverName}
              options={RIVER_OPTIONS}
              placeholder="None"
            />
          </FormField>

          <FormField label="Date of Collection" required className="flex-1 min-w-[200px]">
            <div className="upload-date">
              <input
                type="date"
                className="upload-date__input"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
              />
              <svg
                className="upload-date__icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                width={18}
                height={18}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </FormField>

          <FormField label="Sample Upload Number" required>
            <div className="upload-stepper">
              <input
                type="text"
                inputMode="numeric"
                className="upload-stepper__input"
                value={sampleNumber}
                onChange={(e) => setSampleNumber(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </FormField>
        </div>

        {/* Row 2: File Dropzone */}
        <FormField label="Import Data" required>
          <div
            className={`upload-dropzone ${dragging ? "upload-dropzone--dragging" : ""} ${file ? "upload-dropzone--has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              className="upload-dropzone__input"
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a9e7a" strokeWidth={1.5} width={32} height={32}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="upload-dropzone__filename">{file.name}</p>
                <p className="upload-dropzone__hint">Click to replace</p>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={32} height={32}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p className="upload-dropzone__text">
                  Drag &amp; Drop or{" "}
                  <span className="upload-dropzone__link">Choose file</span>{" "}
                  to upload
                </p>
                <p className="upload-dropzone__hint">.csv, .tsv, .txt</p>
              </>
            )}
          </div>
        </FormField>

        {/* Row 3: Action Buttons */}
        <div className="flex gap-4 flex-wrap">
          <Button onClick={handleUpload} className="px-8">
            Upload your data
          </Button>
          <Button variant="outline" onClick={handlePreview} className="px-8">
            Preview data
          </Button>
        </div>
      </Card>
    </div>
  );
}
