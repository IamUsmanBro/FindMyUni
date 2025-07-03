// src/components/UniversityCard.jsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Avatar,
  Stack,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  EventAvailable as EventIcon,
  Public as PublicIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as DeadlinePassedIcon
} from '@mui/icons-material';
import { withScrollAnimation } from '../utils/scrollAnimationObserver';

const UniversityCard = ({ university, onClick, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const {
    name,
    location,
    city,
    province,
    description,
    deadline,
    sector,
    admissionOpen,
    logoUrl,
    programs = []
  } = university;

  // Format location for display
  const getDisplayLocation = () => {
    // If we have a structured location string with city and province
    if (location && typeof location === 'string' && location.includes(',')) {
      return location;
    }
    // If we have separate city and province fields
    if (city && province) {
      return `${city}, ${province}`;
    }
    // Otherwise use whatever location data is available
    return location || city || province || 'Location not specified';
  };

  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + '...' : str;
  };

  const getRandomColor = (name) => {
    const colors = [
      '#1976d2', // blue
      '#388e3c', // green
      '#d32f2f', // red
      '#7b1fa2', // purple
      '#f57c00', // orange
      '#0288d1', // light blue
      '#512da8'  // deep purple
    ];
    
    // Use the first character of the name to determine color
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get deadline from either direct property or basic_info
  const getDeadline = () => {
    if (deadline) {
      return deadline;
    }
    if (university.basic_info && university.basic_info["Deadline to Apply"]) {
      return university.basic_info["Deadline to Apply"];
    }
    return null;
  };

  const displayDeadline = getDeadline();
  
  // Check if the deadline has passed
  const isDeadlinePassed = () => {
    if (!displayDeadline) return false;
    
    // Try to parse the deadline
    let deadlineDate;
    try {
      // Handle string format like "14 May 2025"
      if (typeof displayDeadline === 'string' && !displayDeadline.includes('Date')) {
        const parts = displayDeadline.split(' ');
        const months = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        if (parts.length === 3) {
          deadlineDate = new Date(
            parseInt(parts[2]), // year
            months[parts[1]], // month
            parseInt(parts[0]) // day
          );
        } else {
          // Try as a date string
          deadlineDate = new Date(displayDeadline);
        }
      } else {
        // Handle as date object or string in ISO format
        deadlineDate = new Date(displayDeadline);
      }
      
      // Compare with current date
      const today = new Date();
      return deadlineDate < today;
    } catch (error) {
      console.error('Error parsing deadline date:', error);
      return false;
    }
  };
  
  // Determine if admission is still open (consider both admissionOpen flag and deadline)
  const isAdmissionStillOpen = admissionOpen && !isDeadlinePassed();

  // Calculate delay for staggered animation effect
  const animationDelay = (index % 10) * 100; // Stagger by 100ms up to 10 cards
  const scrollAnimationClass = withScrollAnimation('bottom', animationDelay);

  return (
    <div className={scrollAnimationClass}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '&:hover': {
            transform: 'translateY(-12px) scale(1.02)',
            boxShadow: '0 20px 30px rgba(0,0,0,0.15)',
          },
          borderLeft: isAdmissionStillOpen ? '4px solid #4caf50' : isDeadlinePassed() ? '4px solid #ff9800' : 'none',
          position: 'relative',
          overflow: 'hidden',
          '&:before': isHovered ? {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '5px',
            bottom: 0,
            left: 0,
            background: 'linear-gradient(90deg, #16a34a, #0ea5e9)',
            animation: 'scaleIn 0.3s ease forwards'
          } : {}
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardActionArea 
          onClick={onClick} 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'stretch', 
            height: '100%',
          }}
        >
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f5f5',
              borderBottom: `1px solid ${isDarkMode ? theme.palette.divider : '#e0e0e0'}`,
              transition: 'background-color 0.3s ease',
              ...(isHovered && { backgroundColor: isDarkMode ? theme.palette.action.hover : '#f0fdf4' })
            }}
          >
            <Avatar 
              src={logoUrl} 
              alt={name}
              sx={{ 
                width: 50, 
                height: 50,
                bgcolor: getRandomColor(name),
                color: 'white',
                mr: 2,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                ...(isHovered && { 
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                })
              }}
            >
              {name ? name.charAt(0) : 'U'}
            </Avatar>
            <Box sx={{ width: 'calc(100% - 66px)' }}>
              <Tooltip title={name} placement="top" arrow>
                <Typography 
                  variant="h6" 
                  component="div" 
                  fontWeight="bold" 
                  noWrap 
                  sx={{ 
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.3s ease, transform 0.3s ease',
                    '&:hover': {
                      color: '#16a34a',
                      transform: 'translateX(3px)'
                    }
                  }}
                >
                  {name}
                </Typography>
              </Tooltip>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <LocationIcon 
                  fontSize="small" 
                  color="action" 
                  sx={{ 
                    mr: 0.5, 
                    minWidth: 20,
                    transition: 'transform 0.3s ease',
                    ...(isHovered && { transform: 'scale(1.2)' })
                  }} 
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  noWrap
                  sx={{ maxWidth: '100%' }}
                >
                  {location || (university.basic_info && university.basic_info.Location) || 'Location not specified'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <CardContent sx={{ 
            flexGrow: 1, 
            pt: 2, 
            pb: 1, 
            bgcolor: isDarkMode ? theme.palette.background.paper : 'white'
          }}>
            <Stack spacing={1.5}>
              {/* Admission Status Badge */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {isAdmissionStillOpen && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Admission Open"
                    color="success"
                    size="small"
                    sx={{ 
                      fontWeight: 'medium',
                      transition: 'transform 0.3s ease',
                      ...(isHovered && { transform: 'scale(1.05)' })
                    }}
                  />
                )}
                {isDeadlinePassed() && (
                  <Chip
                    icon={<DeadlinePassedIcon />}
                    label="Deadline Passed"
                    color="warning"
                    size="small"
                    sx={{ 
                      fontWeight: 'medium',
                      transition: 'transform 0.3s ease',
                      ...(isHovered && { transform: 'scale(1.05)' })
                    }}
                  />
                )}
              </Box>

              {/* University Brief Description */}
              {description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1,
                    transition: 'color 0.3s ease',
                    ...(isHovered && { color: 'text.primary' })
                  }}
                >
                  {truncate(description, 100)}
                </Typography>
              )}

              <Grid container spacing={1}>
                {/* Sector */}
                {sector && (
                  <Grid item xs={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      transition: 'transform 0.3s ease',
                      ...(isHovered && { transform: 'translateX(3px)' })
                    }}>
                      <PublicIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.primary">
                        {sector}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Province/Location in Grid */}
                {province && (
                  <Grid item xs={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      transition: 'transform 0.3s ease',
                      ...(isHovered && { transform: 'translateX(3px)' })
                    }}>
                      <PublicIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.primary">
                        {province || (university.basic_info && university.basic_info.Location)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Add additional Location item if province but no location */}
                {!province && (university.basic_info && university.basic_info.Location) && (
                  <Grid item xs={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      transition: 'transform 0.3s ease',
                      ...(isHovered && { transform: 'translateX(3px)' })
                    }}>
                      <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.primary">
                        {university.basic_info.Location}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Deadline */}
                {displayDeadline && (
                  <Grid item xs={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      transition: 'transform 0.3s ease',
                      ...(isHovered && { transform: 'translateX(3px)' })
                    }}>
                      <EventIcon 
                        fontSize="small" 
                        color={isDeadlinePassed() ? "error" : "action"} 
                        sx={{ 
                          mr: 0.5,
                          transition: 'transform 0.3s ease',
                          ...(isHovered && isDeadlinePassed() && { animation: 'pulse 1s infinite ease-in-out' })
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color={isDeadlinePassed() ? "error" : "text.primary"}
                        fontWeight={isDeadlinePassed() ? "bold" : "normal"}
                      >
                        {typeof displayDeadline === 'string' && !displayDeadline.includes('Date') 
                          ? displayDeadline 
                          : new Date(displayDeadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Programs */}
              {programs && programs.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Popular Programs:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {programs.slice(0, 3).map((program, index) => (
                      <Chip
                        key={index}
                        label={program.name || program}
                        size="small"
                        variant="outlined"
                        icon={<SchoolIcon fontSize="small" />}
                        sx={{ 
                          transition: 'all 0.3s ease',
                          backgroundColor: isDarkMode ? theme.palette.background.paper : 'white',
                          ...(isHovered && { 
                            transform: `translateY(-${2 + index}px)`,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                          })
                        }}
                      />
                    ))}
                    {programs.length > 3 && (
                      <Chip
                        label={`+${programs.length - 3} more`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          transition: 'all 0.3s ease',
                          ...(isHovered && { 
                            transform: 'translateY(-5px)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                          })
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Stack>
          </CardContent>

          <Box 
            sx={{ 
              p: 2, 
              bgcolor: isDarkMode ? theme.palette.background.default : '#fafafa', 
              borderTop: `1px solid ${isDarkMode ? theme.palette.divider : '#e0e0e0'}`,
              transition: 'background-color 0.3s ease',
              ...(isHovered && { 
                backgroundColor: isDarkMode ? theme.palette.action.hover : '#f0fdf4',
                borderTop: isDarkMode ? `1px solid ${theme.palette.divider}` : '1px solid #d1fae5'
              })
            }}
          >
            <Typography 
              variant="button" 
              color="primary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 'medium',
                transition: 'all 0.3s ease',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: isHovered ? '100%' : '0%',
                  height: '2px',
                  bottom: '-2px',
                  left: '0',
                  backgroundColor: '#16a34a',
                  transition: 'width 0.3s ease'
                },
                ...(isHovered && { 
                  transform: 'scale(1.05)',
                  letterSpacing: '0.5px'
                })
              }}
            >
              View Details
            </Typography>
          </Box>
        </CardActionArea>
      </Card>
    </div>
  );
};

export default UniversityCard;
