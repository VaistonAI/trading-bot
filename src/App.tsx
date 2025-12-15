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
import { DailyReports } from './pages/reports/DailyReports';
import { Results2025 } from './pages/results/Results2025';
import { Results2024 } from './pages/results/Results2024';
import { Results2023 } from './pages/results/Results2023';
import { Results2022 } from './pages/results/Results2022';
import { ResultsMomentum2025 } from './pages/results/ResultsMomentum2025';
import { ResultsMomentum2024 } from './pages/results/ResultsMomentum2024';
import { ResultsMomentum2023 } from './pages/results/ResultsMomentum2023';
import { ResultsGrowth2025 } from './pages/results/ResultsGrowth2025';
import { ResultsGrowth2024 } from './pages/results/ResultsGrowth2024';
import { ResultsGrowth2023 } from './pages/results/ResultsGrowth2023';
import { ResultsMeanReversion2025 } from './pages/results/ResultsMeanReversion2025';
import { ResultsMeanReversion2024 } from './pages/results/ResultsMeanReversion2024';
import { ResultsMeanReversion2023 } from './pages/results/ResultsMeanReversion2023';
import { ResultsBreakout2025 } from './pages/results/ResultsBreakout2025';
import { ResultsBreakout2024 } from './pages/results/ResultsBreakout2024';
import { ResultsBreakout2023 } from './pages/results/ResultsBreakout2023';
import { ResultsRSI2025 } from './pages/results/ResultsRSI2025';
import { ResultsRSI2024 } from './pages/results/ResultsRSI2024';
import { ResultsRSI2023 } from './pages/results/ResultsRSI2023';
import { ResultsMACD2025 } from './pages/results/ResultsMACD2025';
import { ResultsMACD2024 } from './pages/results/ResultsMACD2024';
import { ResultsMACD2023 } from './pages/results/ResultsMACD2023';
import { ResultsVolumeWeighted2025 } from './pages/results/ResultsVolumeWeighted2025';
import { ResultsVolumeWeighted2024 } from './pages/results/ResultsVolumeWeighted2024';
import { ResultsVolumeWeighted2023 } from './pages/results/ResultsVolumeWeighted2023';
import { ResultsPairs2025 } from './pages/results/ResultsPairs2025';
import { ResultsPairs2024 } from './pages/results/ResultsPairs2024';
import { ResultsPairs2023 } from './pages/results/ResultsPairs2023';
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
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DailyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/2025"
            element={
              <ProtectedRoute requiredPermission="canViewStrategies">
                <Results2025 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/2024"
            element={
              <ProtectedRoute requiredPermission="canViewStrategies">
                <Results2024 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/2023"
            element={
              <ProtectedRoute>
                <Results2023 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/2022"
            element={
              <ProtectedRoute>
                <Results2022 />
              </ProtectedRoute>
            }
          />

          {/* Direct routes for strategies (2023-2025 period) */}
          <Route path="/results" element={<ProtectedRoute><Results2025 /></ProtectedRoute>} />
          <Route path="/results-momentum" element={<ProtectedRoute><ResultsMomentum2025 /></ProtectedRoute>} />
          <Route path="/results-growth" element={<ProtectedRoute><ResultsGrowth2025 /></ProtectedRoute>} />
          <Route path="/results-meanreversion" element={<ProtectedRoute><ResultsMeanReversion2025 /></ProtectedRoute>} />
          <Route path="/results-breakout" element={<ProtectedRoute><ResultsBreakout2025 /></ProtectedRoute>} />
          <Route path="/results-rsi" element={<ProtectedRoute><ResultsRSI2025 /></ProtectedRoute>} />
          <Route path="/results-macd" element={<ProtectedRoute><ResultsMACD2025 /></ProtectedRoute>} />
          <Route path="/results-volumeweighted" element={<ProtectedRoute><ResultsVolumeWeighted2025 /></ProtectedRoute>} />
          <Route path="/results-pairs" element={<ProtectedRoute><ResultsPairs2025 /></ProtectedRoute>} />

          <Route
            path="/results-momentum/2025"
            element={
              <ProtectedRoute>
                <ResultsMomentum2025 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results-momentum/2024"
            element={
              <ProtectedRoute>
                <ResultsMomentum2024 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results-momentum/2023"
            element={
              <ProtectedRoute>
                <ResultsMomentum2023 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results-growth/2025"
            element={
              <ProtectedRoute>
                <ResultsGrowth2025 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results-growth/2024"
            element={
              <ProtectedRoute>
                <ResultsGrowth2024 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results-growth/2023"
            element={
              <ProtectedRoute>
                <ResultsGrowth2023 />
              </ProtectedRoute>
            }
          />

          {/* Mean Reversion Strategy Results */}
          <Route path="/results-meanreversion/2025" element={<ProtectedRoute><ResultsMeanReversion2025 /></ProtectedRoute>} />
          <Route path="/results-meanreversion/2024" element={<ProtectedRoute><ResultsMeanReversion2024 /></ProtectedRoute>} />
          <Route path="/results-meanreversion/2023" element={<ProtectedRoute><ResultsMeanReversion2023 /></ProtectedRoute>} />

          {/* Breakout Strategy Results */}
          <Route path="/results-breakout/2025" element={<ProtectedRoute><ResultsBreakout2025 /></ProtectedRoute>} />
          <Route path="/results-breakout/2024" element={<ProtectedRoute><ResultsBreakout2024 /></ProtectedRoute>} />
          <Route path="/results-breakout/2023" element={<ProtectedRoute><ResultsBreakout2023 /></ProtectedRoute>} />

          {/* RSI Strategy Results */}
          <Route path="/results-rsi/2025" element={<ProtectedRoute><ResultsRSI2025 /></ProtectedRoute>} />
          <Route path="/results-rsi/2024" element={<ProtectedRoute><ResultsRSI2024 /></ProtectedRoute>} />
          <Route path="/results-rsi/2023" element={<ProtectedRoute><ResultsRSI2023 /></ProtectedRoute>} />

          {/* MACD Strategy Results */}
          <Route path="/results-macd/2025" element={<ProtectedRoute><ResultsMACD2025 /></ProtectedRoute>} />
          <Route path="/results-macd/2024" element={<ProtectedRoute><ResultsMACD2024 /></ProtectedRoute>} />
          <Route path="/results-macd/2023" element={<ProtectedRoute><ResultsMACD2023 /></ProtectedRoute>} />

          {/* Volume Weighted Strategy Results */}
          <Route path="/results-volumeweighted/2025" element={<ProtectedRoute><ResultsVolumeWeighted2025 /></ProtectedRoute>} />
          <Route path="/results-volumeweighted/2024" element={<ProtectedRoute><ResultsVolumeWeighted2024 /></ProtectedRoute>} />
          <Route path="/results-volumeweighted/2023" element={<ProtectedRoute><ResultsVolumeWeighted2023 /></ProtectedRoute>} />

          {/* Pairs Trading Strategy Results */}
          <Route path="/results-pairs/2025" element={<ProtectedRoute><ResultsPairs2025 /></ProtectedRoute>} />
          <Route path="/results-pairs/2024" element={<ProtectedRoute><ResultsPairs2024 /></ProtectedRoute>} />
          <Route path="/results-pairs/2023" element={<ProtectedRoute><ResultsPairs2023 /></ProtectedRoute>} />

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