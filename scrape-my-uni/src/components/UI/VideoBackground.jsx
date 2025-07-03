import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

/**
 * VideoBackground component
 * Renders a video background with optional overlay
 */
const VideoBackground = ({ 
  videoSrc, 
  fallbackImage, 
  overlay = 'rgba(0, 0, 0, 0.6)', 
  children,
  ...boxProps 
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Auto-play the video when component mounts
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.play().catch(error => {
        console.warn('Video autoplay failed:', error);
      });
    }
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...boxProps.sx
      }}
      {...boxProps}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
        poster={fallbackImage}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* Fallback message if video is not supported */}
        Your browser does not support the video tag.
      </video>

      {/* Overlay to enhance text readability */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: overlay,
          zIndex: 1
        }}
      />

      {/* Content to display on top of the video */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

VideoBackground.propTypes = {
  videoSrc: PropTypes.string.isRequired,
  fallbackImage: PropTypes.string,
  overlay: PropTypes.string,
  children: PropTypes.node,
  sx: PropTypes.object
};

export default VideoBackground; 