import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  useMapEvents,
} from "react-leaflet";
import {
  downloadMapAttachment,
  fetchMapAttachmentMarkers,
  fetchMapAttachmentsForLocation,
  uploadMapAttachment,
  type MapAttachmentListItem,
  type MapAttachmentMarker,
} from "../../../lib/mapAttachmentsApi";
import "./MapLocationUpload.css";

const pinDropIcon = L.divIcon({
  className: "mlu-pin-drop",
  html: '<span class="mlu-pin-drop__dot" aria-hidden="true"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

function formatCoord(n: number) {
  return n.toFixed(5);
}

function MapPinController({
  pinPosition,
  onPinChange,
}: {
  pinPosition: [number, number] | null;
  onPinChange: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onPinChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!pinPosition) return null;

  return (
    <Marker
      position={pinPosition}
      icon={pinDropIcon}
      draggable
      eventHandlers={{
        dragend: (ev) => {
          const ll = ev.target.getLatLng();
          onPinChange([ll.lat, ll.lng]);
        },
      }}
    />
  );
}

export default function MapLocationUpload() {
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [mapMarkers, setMapMarkers] = useState<MapAttachmentMarker[]>([]);
  const [markersError, setMarkersError] = useState<string | null>(null);
  const [locationFiles, setLocationFiles] = useState<MapAttachmentListItem[]>([]);
  const [locationFilesLoading, setLocationFilesLoading] = useState(false);
  const [uploadDisplayName, setUploadDisplayName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [uploadSaving, setUploadSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePinPosition = useCallback((pos: [number, number]) => {
    setPinPosition(pos);
    setManualLat(formatCoord(pos[0]));
    setManualLng(formatCoord(pos[1]));
    setPanelError(null);
  }, []);

  const applyManualCoords = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      updatePinPosition([lat, lng]);
    }
  }, [manualLat, manualLng, updatePinPosition]);

  const refreshMarkers = useCallback(async () => {
    try {
      const markers = await fetchMapAttachmentMarkers();
      setMapMarkers(markers);
      setMarkersError(null);
    } catch (e) {
      setMarkersError(e instanceof Error ? e.message : "Failed to load markers");
      setMapMarkers([]);
    }
  }, []);

  useEffect(() => {
    void refreshMarkers();
  }, [refreshMarkers]);

  useEffect(() => {
    if (!pinPosition) {
      setLocationFiles([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLocationFilesLoading(true);
      try {
        const list = await fetchMapAttachmentsForLocation(pinPosition[0], pinPosition[1]);
        if (!cancelled) setLocationFiles(list);
      } catch {
        if (!cancelled) setLocationFiles([]);
      } finally {
        if (!cancelled) setLocationFilesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pinPosition]);

  const handlePickFile = useCallback((file: File | undefined) => {
    setPanelError(null);
    if (!file) return;
    setPendingFile(file);
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    if (!pinPosition || !pendingFile || !uploadDisplayName.trim()) {
      setPanelError("Enter a display name and choose a file.");
      return;
    }
    setPanelError(null);
    setUploadSaving(true);
    try {
      await uploadMapAttachment({
        file: pendingFile,
        displayName: uploadDisplayName.trim(),
        lat: pinPosition[0],
        lng: pinPosition[1],
      });
      setPendingFile(null);
      setUploadDisplayName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshMarkers();
      const list = await fetchMapAttachmentsForLocation(pinPosition[0], pinPosition[1]);
      setLocationFiles(list);
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadSaving(false);
    }
  }, [pinPosition, pendingFile, uploadDisplayName, refreshMarkers]);

  const handleDownload = useCallback(async (id: string) => {
    try {
      await downloadMapAttachment(id);
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Download failed.");
    }
  }, []);

  const openAttachmentLocation = useCallback(
    (lat: number, lng: number) => {
      updatePinPosition([lat, lng]);
    },
    [updatePinPosition],
  );

  return (
    <div className="map-location-upload">
      <header className="map-location-upload__header">
        <h1 className="map-location-upload__title">Map location files</h1>
        <p className="map-location-upload__lede">
          Upload CSV, Excel, or other files tied to a map coordinate. Files appear on the public Map View for
          signed-in users. Use the{" "}
          <Link to="/map-view" className="map-location-upload__link">
            Map View
          </Link>{" "}
          page to browse and download.
        </p>
        {markersError && (
          <div className="map-location-upload__warn" role="status">
            Could not load existing markers: {markersError}
          </div>
        )}
      </header>

      <div className="map-location-upload__layout">
        <div className="map-location-upload__map-wrap">
          <div className="map-location-upload__toolbar" role="region" aria-label="Pin location">
            <span className="map-location-upload__toolbar-label">Lat / lng</span>
            <input
              type="text"
              inputMode="decimal"
              className="map-location-upload__input"
              placeholder="Latitude"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              aria-label="Latitude"
            />
            <input
              type="text"
              inputMode="decimal"
              className="map-location-upload__input"
              placeholder="Longitude"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              aria-label="Longitude"
            />
            <button type="button" className="map-location-upload__btn" onClick={applyManualCoords}>
              Place pin
            </button>
            <span className="map-location-upload__toolbar-hint">Click the map or drag the pin.</span>
          </div>

          <MapContainer center={[-29.0, 24.0] as [number, number]} zoom={6} className="map-location-upload__map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapPinController pinPosition={pinPosition} onPinChange={updatePinPosition} />
            {mapMarkers.map((m) => (
              <CircleMarker
                key={m.id}
                center={[m.latitude, m.longitude]}
                radius={9}
                pathOptions={{
                  color: "#1a7f72",
                  fillColor: "#2a9d8f",
                  fillOpacity: 0.92,
                  weight: 2,
                  bubblingMouseEvents: false,
                }}
                eventHandlers={{
                  click: () => {
                    openAttachmentLocation(m.latitude, m.longitude);
                  },
                }}
              />
            ))}
          </MapContainer>
        </div>

        <aside className="map-location-upload__panel" aria-label="Location files">
          {!pinPosition ? (
            <p className="map-location-upload__panel-empty">Select a location on the map to manage files.</p>
          ) : (
            <>
              <p className="map-location-upload__coords">
                <strong>Coordinates</strong>
                <br />
                {formatCoord(pinPosition[0])}°, {formatCoord(pinPosition[1])}°
              </p>

              <h2 className="map-location-upload__panel-heading">Files here</h2>
              {locationFilesLoading ? (
                <p className="map-location-upload__muted">Loading…</p>
              ) : locationFiles.length === 0 ? (
                <p className="map-location-upload__muted">No files yet for this location.</p>
              ) : (
                <ul className="map-location-upload__file-list">
                  {locationFiles.map((f) => (
                    <li key={f.id} className="map-location-upload__file-row">
                      <span className="map-location-upload__file-name" title={f.originalFilename}>
                        {f.displayName}
                      </span>
                      <button
                        type="button"
                        className="map-location-upload__dl"
                        onClick={() => void handleDownload(f.id)}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="map-location-upload__panel-heading">Upload</h2>
              <label className="map-location-upload__field">
                <span className="map-location-upload__field-label">Display name</span>
                <input
                  type="text"
                  className="map-location-upload__text-input"
                  placeholder="e.g. Q4 sampling results"
                  value={uploadDisplayName}
                  onChange={(e) => {
                    setUploadDisplayName(e.target.value);
                    setPanelError(null);
                  }}
                  autoComplete="off"
                />
              </label>

              <label
                htmlFor="mlu-file-input"
                className={`map-location-upload__drop ${dropActive ? "map-location-upload__drop--active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDropActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropActive(false);
                  handlePickFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  id="mlu-file-input"
                  ref={fileInputRef}
                  type="file"
                  className="map-location-upload__file-input"
                  onChange={(e) => handlePickFile(e.target.files?.[0])}
                />
                <p className="map-location-upload__drop-text">
                  {pendingFile ? (
                    <>
                      Selected: <strong>{pendingFile.name}</strong>
                    </>
                  ) : (
                    <>Drop a file or click to browse (max 25 MB)</>
                  )}
                </p>
              </label>

              {panelError && <p className="map-location-upload__error">{panelError}</p>}

              <button
                type="button"
                className="map-location-upload__submit"
                disabled={uploadSaving || !pendingFile || !uploadDisplayName.trim()}
                onClick={() => void handleUploadSubmit()}
              >
                {uploadSaving ? "Uploading…" : "Upload file"}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
