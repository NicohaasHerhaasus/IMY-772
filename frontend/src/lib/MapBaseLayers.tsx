import { TileLayer } from "react-leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_BASE_URL, MAP_TILE_LABELS_URL } from "./mapTiles";

export function MapBaseLayers() {
  return (
    <>
      <TileLayer url={MAP_TILE_BASE_URL} attribution={MAP_TILE_ATTRIBUTION} />
      <TileLayer url={MAP_TILE_LABELS_URL} attribution="" />
    </>
  );
}
