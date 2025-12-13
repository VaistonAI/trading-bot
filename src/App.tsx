import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { UserRegistration } from './pages/auth/UserRegistration';
import { TermsAndConditions } from './pages/auth/TermsAndConditions';

// App Pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { MomentumStrategy } from './pages/strategies/MomentumStrategy';
import { ValueStrategy } from './pages/strategies/ValueStrategy';
import { GrowthStrategy } from './pages/strategies/GrowthStrategy';
import { DividendStrategy } from './pages/strategies/DividendStrategy';
import { SectorRotationStrategy } from './pages/strategies/SectorRotationStrategy';
import { Simulation } from './pages/simulation/Simulation';
import { Research } from './pages/research/Research';
import { LiveTrading } from './pages/trading/LiveTrading';
import { UserManagement } from './pages/users/UserManagement';
import { HelpPage } from './pages/help/HelpPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<UserRegistration />} />
          <Route path="/terms" element={<TermsAndConditions />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Strategy Routes */}
          <Route
            path="/strategies/momentum"
            element={
              <ProtectedRoute>
                <MomentumStrategy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategies/value"
            element={
              <ProtectedRoute>
                <ValueStrategy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategies/growth"
            element={
              <ProtectedRoute>
                <GrowthStrategy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategies/dividend"
            element={
              <ProtectedRoute>
                <DividendStrategy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategies/sector"
            element={
              <ProtectedRoute>
                <SectorRotationStrategy />
              </ProtectedRoute>
            }
          />

          {/* Simulation Route */}
          <Route
            path="/simulation"
            element={
              <ProtectedRoute>
                <Simulation />
              </ProtectedRoute>
            }
          />

          {/* Research Route */}
          <Route
            path="/research"
            element={
              <ProtectedRoute>
                <Research />
              </ProtectedRoute>
            }
          />

          {/* Live Trading */}
          <Route
            path="/trading"
            element={
              <ProtectedRoute>
                <LiveTrading />
              </ProtectedRoute>
            }
          />

          {/* User Management */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Help */}
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;