##Map View - possible ways to display river paths on map/dashboard

What has already been implemented:
- leaflet map container installed
- shows river location by coords and displays info from RIVER interface 
- maps to river risk to show overall river health
- all info is still static !!!

1. Heatmap 
- install heatmap : npm install leaflet.heat
shows AMR intensity

2. GeoJSON river shapes
- render actual river paths
- import { GeoJSON } from "react-leaflet";
- load: <GeoJSON data={riverGeoJson} />
- get river shapefiles from: 
    - DWS(South Africa water data) 
    - OpenStreetMap exports

3. Province filtering 
- when a user clicks a river or searches for a province:
    - setActiveRiver(r.id);
    - map.flyTo(r.coordinates, 10);
- you’ll need useMap() from react-leaflet

4. Add map focus when clicking an exisiting river in the sidebar
- 