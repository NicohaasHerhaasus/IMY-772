import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

// Import your page components (create these as empty components for now)
import About from "./pages/About"
import MapView from "./pages/MapView";
import AmrProfiles from "./pages/AmrProfiles";
import RiverFlows from "./pages/RiverFlows";
import DataExplorer from "./pages/DataExplorer";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import ExportDataFiles from "./pages/admin/ExportDataFiles/ExportDataFiles";
import UploadDatafiles from "./pages/admin/UploadDataFiles/UploadDataFiles";
import ManageDatafiles from "./pages/admin/ManageDataFiles/ManageDataFiles";


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/map-view" element={<MapView />} />
        <Route path="/amr-profiles" element={<AmrProfiles />} />
        <Route path="/river-flows" element={<RiverFlows />} />
        <Route path="/data-explorer" element={<DataExplorer />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="upload" />} />
          <Route path="upload" element={<UploadDatafiles />} />
          <Route path="export" element={<ExportDataFiles />} />
          <Route path="manage" element={<ManageDatafiles />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;