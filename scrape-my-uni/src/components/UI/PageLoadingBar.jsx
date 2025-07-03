import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageLoadingBar component shows a loading bar at the top of the page
 * during navigation between routes
 */
const PageLoadingBar = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Start loading animation
    setIsLoading(true);
    
    // Hide loading bar after transition (500ms + 200ms buffer)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  if (!isLoading) return null;
  
  return <div className="page-loading" aria-hidden="true" />;
};

export default PageLoadingBar; 