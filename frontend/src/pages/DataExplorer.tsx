import { useState } from "react";
import { Button, Card } from "../components/ui";
import { IsolateExplorer } from "../components/IsolateExplorer";
import "./DataExplorer.css";

export default function DataExplorer() {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="explorer-page">
      <header className="explorer-header">
        <h1 className="explorer-title">Data Explorer</h1>
        <p className="explorer-subtitle">
          Explore imported isolates. Upload StarAMR or genotypic TSV from{" "}
          <strong>Admin → Upload Datafiles</strong> (sign in required).
        </p>
      </header>

      <Card className="explorer-upload-card mb-6">
        <p className="explorer-hint mb-4">
          Data imports are done on the admin upload page so only authenticated users can send files to
          the API.
        </p>
        <Button variant="outline" onClick={() => setRefreshSignal((n) => n + 1)}>
          Refresh table
        </Button>
      </Card>

      <section className="explorer-grid-section">
        <IsolateExplorer refreshSignal={refreshSignal} showTitle={false} />
      </section>
    </div>
  );
}
