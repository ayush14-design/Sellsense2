import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SetupPage } from './pages/SetupPage';
import { ProductsPage } from './pages/ProductsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { GoogleReviewsPage } from './pages/GoogleReviewsPage';
import { AdminPage } from './pages/AdminPage';
import { PricingPage } from './pages/PricingPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import { authStorage } from './utils/auth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/zomato-connect" element={<Navigate to="/setup" replace />} />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <SetupPage mode="setup" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SetupPage mode="settings" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <AnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis/:productId"
          element={
            <ProtectedRoute>
              <AnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/google-reviews"
          element={
            <ProtectedRoute>
              <GoogleReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/google-reviews/:productId"
          element={
            <ProtectedRoute>
              <GoogleReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/connect-source" element={<Navigate to="/google-reviews" replace />} />
        <Route path="/google-maps" element={<Navigate to="/google-reviews" replace />} />
        <Route path="/maps" element={<Navigate to="/google-reviews" replace />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={<PricingPage />}
        />
        <Route
          path="/payment/:planId?"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/history"
          element={
            <ProtectedRoute>
              <PaymentHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authStorage.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Protected Route - requires admin access
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authStorage.isAuthenticated();
  const user = authStorage.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.email === 'admin@sellsense.ai';
  if (!isAdmin) {
    return <Navigate to="/products" replace />;
  }

  return <>{children}</>;
}

export default App;
