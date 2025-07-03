import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error);
    
    // Store the error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // Reset error state and retry rendering
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Optionally refresh the page for a clean slate
    // window.location.reload();
  };

  getErrorMessage() {
    const { error } = this.state;
    if (!error) return "An unknown error occurred";
    
    // Check for specific error types and provide helpful messages
    if (error.message && error.message.includes('Objects are not valid as a React child')) {
      return "A data formatting error occurred. An object was rendered where only text is allowed.";
    }
    
    if (error.message && error.message.includes('Maximum update depth exceeded')) {
      return "An infinite loop in rendering was detected. Please report this issue.";
    }
    
    // Default to the original error message
    return error.message;
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          p={3}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center'
            }}
          >
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {this.getErrorMessage()}
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <Box
                component="pre"
                sx={{
                  textAlign: 'left',
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 200,
                  mt: 2
                }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleRetry}
              sx={{ mt: 3 }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 