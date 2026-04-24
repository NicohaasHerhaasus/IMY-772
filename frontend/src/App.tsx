import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import { IsolatesProvider } from './context/IsolatesContext';

// Import your page components
import About from "./pages/about/About";
import MapView from "./pages/mapview/MapView";
import AmrProfiles from "./pages/amrprofiles/AmrProfiles";
import RiverFlows from "./pages/riverflows/RiverFlows";
import DataExplorer from "./pages/DataExplorer";
import IsolateExplorerPage from "./pages/IsolateExplorerPage";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import UploadDatafiles from "./pages/admin/UploadDataFiles/UploadDataFiles";
import ManageDatafiles from "./pages/admin/ManageDataFiles/ManageDataFiles";
import MapLocationUpload from "./pages/admin/MapLocationUpload/MapLocationUpload";
import Chatbot from "./pages/admin/Chatbot/Chatbot";
import CallbackPage from "./pages/CallbackPage";
import AboutLearnMore from "./pages/about/AboutLearnMore";

import { RiverProvider } from "./layouts/RiverContext";

function AppContent() {
  const { userAttributes } = useAuth();
  const isAdmin = userAttributes?.['custom:role'] === 'admin';

  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/map-view" element={<MapView />} />
          <Route path="/amr-profiles" element={<AmrProfiles />} />
          <Route path="/river-flows" element={<RiverFlows />} />
          <Route path="/data-explorer" element={<DataExplorer />} />
          <Route path="/isolates" element={<IsolateExplorerPage />} />
          <Route path="/admin/callback" element={<CallbackPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="upload" />} />
              <Route path="upload" element={<UploadDatafiles />} />
              <Route path="map-upload" element={<MapLocationUpload />} />
              <Route path="manage" element={<ManageDatafiles />} />
              <Route path="chatbot" element={<Chatbot />} />
            </Route>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/about" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/about/learn-more" element={<AboutLearnMore />} />
        <Route path="/map-view" element={<MapView />} />
        <Route path="/amr-profiles" element={<AmrProfiles />} />
        <Route path="/river-flows" element={<RiverFlows />} />
        <Route path="/data-explorer" element={<DataExplorer />} />
        <Route path="/isolates" element={<IsolateExplorerPage isAdmin={isAdmin} />} />
        <Route path="/admin/callback" element={<CallbackPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="upload" />} />
            <Route path="upload" element={<UploadDatafiles />} />
            <Route path="map-upload" element={<MapLocationUpload />} />
            <Route path="export" element={<ExportDataFiles />} />
            <Route path="manage" element={<ManageDatafiles />} />
            <Route path="chatbot" element={<Chatbot />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/about" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <IsolatesProvider>
        <RiverProvider>
          <AppContent />
        </RiverProvider>
      </IsolatesProvider>
    </AuthProvider>
  );
}

export default App;
