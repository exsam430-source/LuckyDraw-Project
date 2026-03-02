import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// CONTEXT
import { AuthProvider, useAuth } from './context/AuthContext';

// FRONTEND PAGES
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// AUTH PAGES
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// USER PAGES
import UserLayout from './components/user/UserLayout';
import UserDashboard from './pages/user/Dashboard';
import UserProfile from './pages/user/Profile';
import AvailableDraws from './pages/user/AvailableDraws';
import DrawDetails from './pages/user/DrawDetails';
import MyTokens from './pages/user/MyTokens';
import MyPayments from './pages/user/MyPayments';
import Referrals from './pages/user/Referrals';
import Results from './pages/user/Results';

// ADMIN PAGES
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDraws from './pages/admin/Draws';
import CreateDraw from './pages/admin/CreateDraw';
import DrawDetail from './pages/admin/DrawDetail';
import EditDraw from './pages/admin/EditDraw';
import AdminPayments from './pages/admin/Payments';
import AdminUsers from './pages/admin/Users';
import AdminPrizes from './pages/admin/Prizes';
import ExecuteDraw from './pages/admin/ExecuteDraw';
import AdminReports from './pages/admin/Reports';
import AdminReferrals from './pages/admin/Referrals';
import AdminSettings from './pages/admin/Settings';
import PaymentAccounts from './pages/admin/PaymentAccounts';

// COMPONENTS
import NavbarFrontend from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';

// ENV
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lucky Draw';

// Scroll to Top on Route Change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  if (!adminOnly && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Main App Routes Component
function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading {APP_NAME}...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        {/* ================= FRONTEND ROUTES ================= */}
        <Route
          path="/*"
          element={
            <>
              <NavbarFrontend />
              <div className="min-h-screen flex flex-col">
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </>
          }
        />

        {/* ================= USER ROUTES ================= */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="draws" element={<AvailableDraws />} />
          <Route path="draws/:id" element={<DrawDetails />} />
          <Route path="tokens" element={<MyTokens />} />
          <Route path="payments" element={<MyPayments />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="results" element={<Results />} />
        </Route>

        {/* ================= ADMIN ROUTES ================= */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="draws" element={<AdminDraws />} />
          <Route path="draws/create" element={<CreateDraw />} />
          <Route path="draws/:id" element={<DrawDetail />} />
          <Route path="draws/:id/edit" element={<EditDraw />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="prizes" element={<AdminPrizes />} />
          <Route path="execute" element={<ExecuteDraw />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="payment-accounts" element={<PaymentAccounts />} />
        </Route>

        {/* ================= 404 FALLBACK ================= */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;