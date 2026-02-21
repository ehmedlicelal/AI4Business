import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';


function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1729]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#85BB65]"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}

export function RoleProtectedRoute({ children, allowedRoles }) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1729]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#85BB65]"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = profile?.role || user.user_metadata?.role;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Find a fallback route for them
        if (userRole === 'Investor') return <Navigate to="/environment-selection" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1729]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#85BB65]"></div>
            </div>
        );
    }

    if (user) {
        const userRole = user.user_metadata?.role || 'Investor';
        let defaultPath = '/dashboard';
        if (userRole === 'Investor') defaultPath = '/environment-selection';
        else if (userRole === 'Admin') defaultPath = '/dashboard/admin';
        else if (userRole === 'Startup_Manager') defaultPath = '/dashboard/manager';
        else if (userRole === 'Business_Manager') defaultPath = '/dashboard/business';
        return <Navigate to={defaultPath} replace />;
    }

    return children;
}

import LandingPage from './pages/LandingPage';
import DestinationPage from './pages/DestinationPage';
import TechParkRegistration from './pages/TechParkRegistration';
import InvestorLayout from './layouts/InvestorLayout';
import InvestorDashboard from './pages/investor/Dashboard';
import InvestorHome from './pages/investor/Home';
import DiscoverStartups from './pages/investor/DiscoverStartups';
import Binder from './pages/investor/Binder';
import EnvironmentSelection from './pages/EnvironmentSelection';
import AdminPanel from './pages/admin/AdminPanel';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/destination" element={<DestinationPage />} />
            <Route path="/tech-park-register" element={<TechParkRegistration />} />
            <Route path="/environment-selection" element={<ProtectedRoute><EnvironmentSelection /></ProtectedRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Admin Panel */}
            <Route path="/admin/profiles" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

            {/* Main Application Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/manager" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />



            {/* Investor Panel Routes */}
            <Route path="/investor">
                <Route index element={<InvestorHome />} />
                <Route path="discover" element={<DiscoverStartups />} />
                <Route path="binder" element={<Binder />} />
                <Route path="dashboard" element={
                    <ProtectedRoute>
                        <InvestorLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<InvestorDashboard />} />
                    {/* Add other investor routes here e.g., portfolio, reports */}
                    <Route path="*" element={<Navigate to="" replace />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}


export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
