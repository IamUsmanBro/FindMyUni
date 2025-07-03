import React, { useState, useEffect } from 'react';
import { connectionStatus } from '../services/api.service';

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    isBackendConnected: false,
    usingFirestoreFallback: true,
    baseUrl: '',
    expanded: false
  });

  useEffect(() => {
    // Add a listener to the connection status emitter
    const listenerId = connectionStatus.addListener((newStatus) => {
      setStatus(prev => ({ ...prev, ...newStatus }));
    });
    
    // Clean up on unmount
    return () => connectionStatus.removeListener(listenerId);
  }, []);
  
  const toggleExpanded = () => {
    setStatus(prev => ({ ...prev, expanded: !prev.expanded }));
  };
  
  // Status indicator style based on connection state
  const indicatorStyle = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: status.isBackendConnected ? '#4CAF50' : '#F44336',
    display: 'inline-block',
    marginRight: '6px',
    verticalAlign: 'middle'
  };
  
  // Container style - moved from bottom right to bottom left
  const containerStyle = {
    position: 'fixed',
    bottom: '20px',
    left: '20px', // Changed from right to left
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '8px 16px',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    fontSize: '12px',
    zIndex: 1000,
    cursor: 'pointer',
    border: '1px solid #ddd',
    maxWidth: status.expanded ? '300px' : '150px'
  };
  
  // Alternative center position style (uncomment to use)
  // const containerStyle = {
  //   position: 'fixed',
  //   bottom: '20px',
  //   left: '50%', 
  //   transform: 'translateX(-50%)', // Center horizontally
  //   backgroundColor: 'rgba(255, 255, 255, 0.9)',
  //   padding: '8px 16px',
  //   borderRadius: '4px',
  //   boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  //   fontSize: '12px',
  //   zIndex: 1000,
  //   cursor: 'pointer',
  //   border: '1px solid #ddd',
  //   maxWidth: status.expanded ? '300px' : '150px'
  // };
  
  return (
    <div style={containerStyle} onClick={toggleExpanded}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={indicatorStyle}></span>
        <span style={{ fontWeight: 'bold' }}>
          {status.isBackendConnected ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {status.expanded && (
        <div style={{ marginTop: '8px', fontSize: '10px' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>API:</strong> {status.baseUrl}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Using Fallback:</strong> {status.usingFirestoreFallback ? 'Yes' : 'No'}
          </div>
          {status.lastError && (
            <div style={{ marginBottom: '4px', color: '#F44336' }}>
              <strong>Error:</strong> {status.lastError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 