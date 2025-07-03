import React from 'react';
import { CircularProgress, Box } from '@mui/material';

/**
 * LoadingSpinner component
 * A simple loading spinner centered on the page
 */
const LoadingSpinner = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
      <CircularProgress color="success" />
    </Box>
  );
};

export default LoadingSpinner; 