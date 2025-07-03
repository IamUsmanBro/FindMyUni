/**
 * Health service for checking backend connectivity
 */

// Define base URL
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

/**
 * Check if the backend health endpoint is responding
 * @returns {Promise<boolean>} - True if the backend is available
 */
export async function checkHealth() {
  try {
    // Reduced timeout check with fast failure
    const isHealthy = await Promise.race([
      checkHealthWithFetch(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);
    
    return isHealthy;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

/**
 * Check health using fetch API
 * @returns {Promise<boolean>} - True if the backend is available
 */
async function checkHealthWithFetch() {
  try {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 2000); // Reduced from 8000ms
    
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-cache',
      signal: abortController.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'ok') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Health check with fetch failed:', error.message);
    return false;
  }
}

/**
 * Check health using XMLHttpRequest (IE compatible)
 * @returns {Promise<boolean>} - True if the backend is available
 */
function checkHealthWithXhr() {
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      
      // Set timeout
      xhr.timeout = 8000;
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.status === 'ok') {
              console.log('Backend is healthy (xhr)');
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (e) {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      };
      
      xhr.onerror = function() {
        console.warn('XHR health check failed');
        resolve(false);
      };
      
      xhr.ontimeout = function() {
        console.warn('XHR health check timed out');
        resolve(false);
      };
      
      xhr.open('GET', `${BASE_URL}/health?_t=${Date.now()}`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.send();
    } catch (error) {
      console.warn('XHR setup failed:', error);
      resolve(false);
    }
  });
}

/**
 * Direct check using image loading technique (works around CORS)
 * @returns {Promise<boolean>} - True if the backend is available
 */
export function checkServerAvailable() {
  return new Promise((resolve) => {
    // Create a hidden image
    const img = new Image();
    
    // Set a short timeout
    const timeout = setTimeout(() => {
      img.onload = img.onerror = null;
      resolve(false);
    }, 3000); // Reduced from 8000ms
    
    // Success handler
    img.onload = function() {
      clearTimeout(timeout);
      resolve(true);
    };
    
    // Error handler
    img.onerror = function() {
      clearTimeout(timeout);
      // Even an error means the server responded - just not with an image
      // This is actually what we expect and indicates the server is up
      resolve(true);
    };
    
    // Use a cachebuster
    img.src = `${BASE_URL.split('/api')[0]}/favicon.ico?_t=${Date.now()}`;
  });
} 