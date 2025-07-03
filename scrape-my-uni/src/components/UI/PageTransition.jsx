import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition component to create smooth transitions between pages
 * It wraps the children components and animates them in/out during navigation
 * Also handles scroll behavior during transitions
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      // Start the transition animation
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  // Ensure we scroll to top when location changes or transition completes
  useEffect(() => {
    // Scroll to top immediately when component mounts or location changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // 'auto' is faster than 'smooth' and more reliable across browsers
    });
    
    // Also prevent scrolling during transition
    if (transitionStage === "fadeOut") {
      // Add a class to body to prevent scrolling during transition
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scrolling after transition completes
      document.body.style.overflow = "";
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = "";
    };
  }, [location.pathname, transitionStage]);

  const handleAnimationEnd = () => {
    if (transitionStage === "fadeOut") {
      // When fadeOut animation ends, update the displayed location and start fadeIn
      setTransitionStage("fadeIn");
      setDisplayLocation(location);
      
      // Ensure we're at the top after the transition
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    }
  };

  return (
    <div
      className={`page-transition ${transitionStage}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
};

export default PageTransition; 