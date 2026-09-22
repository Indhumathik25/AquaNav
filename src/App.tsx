import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Authentication pages
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";

// Application pages
import DashboardPage from "./pages/DashboardPage.tsx";
import LogTripPage from "./pages/LogTripPage.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import AnalyticsPage from "./pages/AnalyticsPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import RouteOptimizerPage from "./pages/RouteOptimizerPage.tsx";


// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


// ==========================================
// APP
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================================ */}
        {/* PUBLIC ROUTES */}
        {/* ================================ */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />


        {/* ================================ */}
        {/* PROTECTED ROUTES */}
        {/* ================================ */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/log-trip"
          element={
            <ProtectedRoute>
              <LogTripPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/route-optimizer"
          element={
            <ProtectedRoute>
              <RouteOptimizerPage />
            </ProtectedRoute>
          }
        />


        {/* ================================ */}
        {/* DEFAULT ROUTE */}
        {/* ================================ */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* ================================ */}
        {/* UNKNOWN ROUTE */}
        {/* ================================ */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;