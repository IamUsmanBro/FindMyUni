import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/ui-enhancements.css';
import './index.css';
import './styles/animations.css';
import { initScrollAnimations } from './utils/scrollAnimationObserver';
import ScrollToTop from './components/UI/ScrollToTop';

// Loading indicator
const LoadingFallback = () => (
  <div className="text-center p-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Lazy load the App component to speed up initial rendering
const App = lazy(() => import('./App'));

// Ensure Firebase is initialized, but don't block rendering
import('./firebase.js');

// Load the console helpers in development mode
if (import.meta.env.DEV) {
  // Defer loading console helpers
  setTimeout(() => {
    import('./utils/consoleHelpers').then(() => {
      console.log('Development console helpers loaded');
    });
  }, 2000);
}

// Set React Router v7 future configuration
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Component to set up scroll animations
const ScrollAnimationProvider = ({ children }) => {
  useEffect(() => {
    // Initialize scroll animations
    const cleanup = initScrollAnimations();
    
    // Clean up the observer when the component unmounts
    return cleanup;
  }, []);
  
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router {...routerOptions}>
      <AuthProvider>
        <ScrollAnimationProvider>
          <Suspense fallback={<LoadingFallback />}>
            <App />
          </Suspense>
          <ScrollToTop />
        </ScrollAnimationProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
