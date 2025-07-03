/**
 * Scroll Animation Observer
 * 
 * A utility that uses IntersectionObserver to create scroll-triggered
 * animations throughout the application.
 */

// Initialize the observer when the component mounts
export const initScrollAnimations = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Options for the observer
  const options = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.1 // 10% of the element must be visible
  };

  // Callback function for the observer
  const handleIntersection = (entries, observer) => {
    entries.forEach(entry => {
      // Add the 'visible' class when element is intersecting
      if (entry.isIntersecting) {
        // Slight delay to ensure consistent animation
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 100);
        
        // Once animation is complete, we can stop observing this element
        observer.unobserve(entry.target);
      }
    });
  };

  // Create the observer
  const observer = new IntersectionObserver(handleIntersection, options);

  // Handle initial scrollAnimateElements
  const setupAnimations = () => {
    // Get all elements with the scroll-animate class
    const animatedElements = document.querySelectorAll('.scroll-animate');
    
    // Start observing each element
    animatedElements.forEach(element => {
      // Ensure the element is initially hidden
      element.classList.remove('visible');
      
      // Set proper visibility and opacity for initial state
      element.style.opacity = '0';
      
      // Start observing
      observer.observe(element);
    });
  };

  // Run initial setup
  setupAnimations();
  
  // Also setup a mutation observer to catch any dynamically added elements
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const animElements = node.querySelectorAll ? 
              node.querySelectorAll('.scroll-animate') : [];
            
            if (node.classList && node.classList.contains('scroll-animate')) {
              observer.observe(node);
            }
            
            animElements.forEach(el => {
              observer.observe(el);
            });
          }
        });
      }
    });
  });
  
  // Start observing the document body for dynamically added elements
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Return a cleanup function
  return () => {
    if (observer) {
      const animatedElements = document.querySelectorAll('.scroll-animate');
      animatedElements.forEach(element => {
        observer.unobserve(element);
      });
    }
    
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
  };
};

// Helper function to add animation classes to a component
export const withScrollAnimation = (direction = 'bottom', delay = 0) => {
  const delayClass = delay > 0 ? `delay-${delay}` : '';
  const directionClass = `from-${direction}`;
  
  return `scroll-animate ${directionClass} ${delayClass}`;
}; 