import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import PageTransition from './components/UI/PageTransition';
import LoadingSpinner from './components/UI/LoadingSpinner';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import PageLoadingBar from './components/UI/PageLoadingBar';
import { ThemeProvider, createTheme, CssBaseline, IconButton, Box } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Eagerly loaded components (critical UI)
import Toast from './components/Toast';
import ConnectionStatus from './components/ConnectionStatus';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const SignUp = lazy(() => import('./pages/SignUp.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const UniversityList = lazy(() => import('./pages/UniversityList.jsx'));
const UniversityDetail = lazy(() => import('./pages/UniversityDetail.jsx'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Features = lazy(() => import('./pages/Features.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const ScrapeManagement = lazy(() => import('./pages/ScrapeManagement.jsx'));
const UniversityCompare = lazy(() => import('./components/UniversityCompare.jsx'));
const UIExamples = lazy(() => import('./pages/UIExamples.jsx'));

// Lazy-load non-critical components
const Chatbot = lazy(() => import('./components/Chatbot.jsx'));

const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setChecking(false);
        return;
      }
      
      try {
        // Query the admins collection to check if this user is an admin
        const adminQuery = query(
          collection(db, 'admins'), 
          where('email', '==', currentUser.email.toLowerCase())
        );
        
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          // User is an admin
          setIsAdmin(true);
        } else {
          console.log('User is not an admin:', currentUser.email);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setChecking(false);
      }
    };
    
    checkAdminStatus();
  }, [currentUser]);

  if (loading || checking) {
    return <LoadingSpinner />;
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return children;
};

// ScrollToTop component - will scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Scroll to top with smooth behavior
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' instead of 'smooth' to avoid visible scrolling
    });
  }, [pathname]);
  
  return null;
}

// Add the React Router future configuration to the main entry file
if (typeof window !== 'undefined') {
  // This will be executed only in the browser
  window.history.scrollRestoration = 'auto';
  
  // Add future configuration for React Router v7
  window.__reactRouterFuture = {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  };
}

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: { main: '#16a34a' },
          secondary: { main: '#f59e42' },
          background: { default: '#f9fafb', paper: '#fff' },
        }
      : {
          // palette values for dark mode
          primary: { main: '#4ade80' },
          secondary: { main: '#fbbf24' },
          background: { default: '#18181b', paper: '#23232a' },
          text: { primary: '#f3f4f6', secondary: '#a1a1aa' },
        }),
  },
});

// Component that handles both authentication & CSS transitions
function App() {
  const [mode, setMode] = useState('light');
  const theme = createTheme(getDesignTokens(mode));

  // Toggle theme mode
  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-50">
              <PageLoadingBar />
              <NavBar />
              {/* Floating theme toggle button */}
              <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 2000 }}>
                <IconButton onClick={toggleTheme} color="inherit" sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Box>
            </div>
            <main className="flex-grow">
              <ScrollToTop />
              <Suspense fallback={<LoadingSpinner />}>
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/universities" element={<UniversityList />} />
                    <Route path="/universities/:id" element={<UniversityDetail />} />
                    <Route path="/compare" element={<UniversityCompare />} />
                    <Route path="/ui-examples" element={<UIExamples />} />
                    
                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/apply/:universityId"
                      element={
                        <ProtectedRoute>
                          <ApplicationForm />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                      path="/admin/dashboard"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/scrape-management"
                      element={
                        <AdminRoute>
                          <ScrapeManagement />
                        </AdminRoute>
                      }
                    />
                    
                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </Suspense>
            </main>
            <Footer />
            
            {/* Lazy load chatbot to improve initial page load */}
            <Suspense fallback={null}>
              <Chatbot />
            </Suspense>
            
            <Toast />
            <ConnectionStatus />
          </div>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
