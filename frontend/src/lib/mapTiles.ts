/** Water-focused base — rivers/lakes emphasised, no POI icons or labels. */
export const MAP_TILE_BASE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";

/** Transparent label overlay — city/town/river names for orientation. */
export const MAP_TILE_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";

/** @deprecated Use MapBaseLayers — kept for single-layer fallbacks */
export const MAP_TILE_URL = MAP_TILE_BASE_URL;

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
