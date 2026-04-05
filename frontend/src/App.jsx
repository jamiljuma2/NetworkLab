import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ShellLayout from "./components/ShellLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ScannerPage = lazy(() => import("./pages/ScannerPage"));
const TopologyPage = lazy(() => import("./pages/TopologyPage"));
const VulnerabilitiesPage = lazy(() => import("./pages/VulnerabilitiesPage"));
const PacketsPage = lazy(() => import("./pages/PacketsPage"));
const LabsPage = lazy(() => import("./pages/LabsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const AccessDeniedPage = lazy(() => import("./pages/AccessDeniedPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="glass rounded-xl border border-neon/30 px-6 py-4 text-neon">Loading module...</div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ShellLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="topology" element={<TopologyPage />} />
              <Route path="vulnerabilities" element={<VulnerabilitiesPage />} />
              <Route path="packets" element={<PacketsPage />} />
              <Route path="labs" element={<LabsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={["Admin"]}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={["Admin"]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
