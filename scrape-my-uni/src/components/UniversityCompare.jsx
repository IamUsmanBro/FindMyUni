import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Alert,
  Rating,
  Grid,
  Container,
  useTheme
} from '@mui/material';
import { 
  Close as CloseIcon,
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  School as SchoolIcon,
  Stars as RankingIcon,
  AttachMoney as MoneyIcon,
  Timer as TimerIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { universityService } from '../services/api.service.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './UniversityCompare.css'; // Import CSS file

const UniversityCompare = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [allUniversities, setAllUniversities] = useState([]);
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversities.length >= 2) {
      compareUniversities();
    } else {
      setComparisonData(null);
    }
  }, [selectedUniversities]);

  const fetchAllUniversities = async () => {
    try {
      setLoadingUniversities(true);
      setError('');
      
      // Try fetching from API
      const universities = await universityService.getAll();
      
      if (Array.isArray(universities) && universities.length > 0) {
        setAllUniversities(universities);
      } else {
        throw new Error('Failed to load universities or empty data received');
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      setError('Failed to load universities. Please try again later.');
      showToast('Failed to load universities', 'error');
    } finally {
      setLoadingUniversities(false);
    }
  };

  const compareUniversities = async () => {
    if (selectedUniversities.length < 2) return;

    try {
      setLoading(true);
      setError('');
      
      // Get detailed data for each selected university
      const universityIds = selectedUniversities.map(uni => uni.id);
      
      // Use the compare API endpoint if available, otherwise fetch each university
      try {
        const response = await universityService.compare(universityIds);
        
        if (response && response.universities && Array.isArray(response.universities)) {
          setComparisonData(response.universities);
        } else {
          throw new Error('Invalid response format from compare API');
        }
      } catch (apiError) {
        console.error('API compare failed, fetching individually:', apiError);
        
        // Fallback to individual fetching if compare endpoint fails
        const promises = selectedUniversities.map(uni => 
          universityService.getById(uni.id)
        );
        const universities = await Promise.all(promises);
        setComparisonData(universities);
      }
    } catch (error) {
      console.error('Error comparing universities:', error);
      setError('Failed to compare universities. Please try again.');
      showToast('Failed to compare universities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUniversity = (newValue) => {
    if (!newValue) return;
    
    if (selectedUniversities.length >= 4) {
      showToast('You can compare up to 4 universities at a time', 'warning');
      return;
    }
    
    if (selectedUniversities.some(uni => uni.id === newValue.id)) {
      showToast('This university is already in your comparison', 'warning');
      return;
    }
    
    setSelectedUniversities([...selectedUniversities, newValue]);
    setSearchValue('');
  };

  const handleRemoveUniversity = (universityId) => {
    setSelectedUniversities(selectedUniversities.filter(uni => uni.id !== universityId));
  };

  const clearComparison = () => {
    setSelectedUniversities([]);
    setComparisonData(null);
  };

  const formatTuition = (tuition) => {
    if (!tuition) return 'Not available';
    
    if (typeof tuition === 'number') {
      return `PKR ${tuition.toLocaleString()} / year`;
    }
    
    if (typeof tuition === 'object') {
      let result = [];
      if (tuition.international) result.push(`International: ${tuition.international}`);
      if (tuition.local) result.push(`Local: ${tuition.local}`);
      return result.length > 0 ? result.join(', ') : 'Not available';
    }
    
    return tuition;
  };

  // Utility function to get a field from university data
  const getUniversityField = (uni, fieldName) => {
    if (!uni) return null;

    // Check various common field paths based on fieldName
    switch (fieldName) {
      case 'name':
        return uni.university_name || uni.name || 'Unnamed University';
      case 'location':
        return uni.location || 
               (uni.basic_info?.Location) || 
               (uni.contact_info?.address ? 
                 (typeof uni.contact_info.address === 'string' ?
                   uni.contact_info.address :
                   JSON.stringify(uni.contact_info.address)) : 
                 null);
      case 'ranking':
        return uni.ranking || null;
      case 'studentRating':
        return uni.studentRating || uni.rating || null;
      case 'tuition':
        return uni.tuition || uni.tuitionFees || 
               (uni.fees?.tuition) || null;
      case 'deadline':
        return uni.deadline || 
               (uni.admissions && uni.admissions.length > 0 ? 
                 uni.admissions[0].deadline : null) ||
               (uni.basic_info && uni.basic_info["Deadline to Apply"]);
      case 'programs':
        // Handle the Firebase program structure from your example
        if (uni.programs) {
          if (typeof uni.programs === 'object' && !Array.isArray(uni.programs)) {
            // Process the program structure from Firebase
            const programsObj = {};
            
            // Collect all program types (BSPrograms, ADPPrograms, etc.)
            Object.keys(uni.programs).forEach(programType => {
              if (Array.isArray(uni.programs[programType])) {
                programsObj[programType] = uni.programs[programType];
              }
            });
            
            return programsObj;
          }
          return uni.programs;
        }
        return [];
      case 'facilities':
        return uni.facilities || [];
      case 'scholarships':
        return uni.scholarships || [];
      case 'contact_info':
        return uni.contact_info || {};
      default:
        return uni[fieldName] || null;
    }
  };

  const handleViewDetails = (universityId) => {
    navigate(`/universities/${universityId}`);
  };

  if (loadingUniversities) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" mt={3}>
            Loading Universities...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} className="compare-container">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary" className="compare-title">
          Compare Universities
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Select universities to compare their key metrics, rankings, and features to help you make an informed decision about your education future.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: theme.palette.background.paper }}>
        {/* University Selector */}
        <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Autocomplete
              value={searchValue}
              onChange={(event, newValue) => {
                if (newValue) {
                  handleAddUniversity(newValue);
                } else {
                  setSearchValue(null);
                }
              }}
              options={allUniversities}
              getOptionLabel={(option) => option.name || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search & Select Universities to Compare"
                  placeholder="Type university name to search and click to add to comparison"
                  variant="outlined"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box display="flex" alignItems="center">
                    <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      {option.location && (
                        <Typography variant="caption" color="text.secondary">
                          {option.location} {option.province ? `- ${option.province}` : ''}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </li>
              )}
              noOptionsText="No matching universities found"
            />
          </Grid>
        </Grid>

        {/* Selected Universities */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Selected Universities ({selectedUniversities.length}/4)
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedUniversities.length > 0 ? (
              selectedUniversities.map((uni) => (
                <Chip
                  key={uni.id}
                  label={uni.name}
                  onDelete={() => handleRemoveUniversity(uni.id)}
                  color="primary"
                  variant="outlined"
                  sx={{ py: 0.5 }}
                  className="university-chip"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No universities selected yet
              </Typography>
            )}
          </Box>
          {selectedUniversities.length > 0 && (
            <Box mt={2}>
              <Button 
                variant="outlined" 
                size="small" 
                color="error" 
                onClick={clearComparison}
                startIcon={<CloseIcon />}
              >
                Clear All
              </Button>
            </Box>
          )}
        </Box>

        {selectedUniversities.length < 2 && (
          <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
            Select at least two universities to compare their features.
          </Alert>
        )}
      </Paper>

      {/* Comparison Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : comparisonData && comparisonData.length >= 2 ? (
        <Box mb={6} className="comparison-results">
          <Typography variant="h5" component="h2" gutterBottom color="primary.dark" fontWeight="medium">
            Comparison Results
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, bgcolor: theme.palette.background.paper }}>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Feature</TableCell>
                  {comparisonData.map((uni, index) => (
                    <TableCell key={index} sx={{ fontWeight: 'bold', color: 'white' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle1">{getUniversityField(uni, 'name')}</Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveUniversity(selectedUniversities[index].id)}
                          sx={{ color: 'white' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Location */}
                <TableRow>
                  <TableCell sx={{ bgcolor: isDarkMode ? 'grey.900' : 'grey.100', fontWeight: 'bold' }}>Location</TableCell>
                  {comparisonData.map((uni, index) => (
                    <TableCell key={index}>
                      {getUniversityField(uni, 'location') || 'Not available'}
                      {uni.province && ` - ${uni.province}`}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Deadlines */}
                <TableRow>
                  <TableCell sx={{ bgcolor: isDarkMode ? 'grey.900' : 'grey.100', fontWeight: 'bold' }}>
                    <Box display="flex" alignItems="center">
                      <TimerIcon sx={{ mr: 1 }} />
                      Application Deadline
                    </Box>
                  </TableCell>
                  {comparisonData.map((uni, index) => (
                    <TableCell key={index}>
                      {getUniversityField(uni, 'deadline') || 'Contact university'}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Programs */}
                <TableRow>
                  <TableCell sx={{ bgcolor: isDarkMode ? 'grey.900' : 'grey.100', fontWeight: 'bold' }}>Programs</TableCell>
                  {comparisonData.map((uni, index) => (
                    <TableCell key={index}>
                      {(() => {
                        const programs = getUniversityField(uni, 'programs');
                        
                        // Handle the Firebase programs structure
                        if (programs && typeof programs === 'object' && !Array.isArray(programs)) {
                          return (
                            <Box sx={{ maxHeight: '300px', overflowY: 'auto' }} className="scrollable-cell">
                              {Object.keys(programs).map(programType => {
                                if (Array.isArray(programs[programType]) && programs[programType].length > 0) {
                                  return (
                                    <Box key={programType} mb={2}>
                                      <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                                        {programType.replace('Programs', ' Programs')}
                                      </Typography>
                                      {programs[programType].map((program, idx) => (
                                        <Chip 
                                          key={idx}
                                          label={program}
                                          size="small"
                                          variant="outlined"
                                          sx={{ m: 0.5 }}
                                        />
                                      ))}
                                    </Box>
                                  );
                                }
                                return null;
                              })}
                            </Box>
                          );
                        } else if (programs && Array.isArray(programs) && programs.length > 0) {
                          // Handle the original array format
                          return (
                            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }} className="scrollable-cell">
                              {programs.slice(0, 10).map((program, idx) => (
                                <Chip 
                                  key={idx}
                                  label={program.name || program}
                                  size="small"
                                  variant="outlined"
                                  sx={{ m: 0.5 }}
                                />
                              ))}
                              {programs.length > 10 && (
                                <Typography variant="caption" color="text.secondary">
                                  +{programs.length - 10} more
                                </Typography>
                              )}
                            </Box>
                          );
                        }
                        return <Typography variant="body2" color="text.secondary">No programs listed</Typography>;
                      })()}
                    </TableCell>
                  ))}
                </TableRow>

                {/* View Details Button */}
                <TableRow>
                  <TableCell sx={{ bgcolor: isDarkMode ? 'grey.900' : 'grey.100', fontWeight: 'bold' }}>Actions</TableCell>
                  {comparisonData.map((uni, index) => (
                    <TableCell key={index}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewDetails(uni.id)}
                      >
                        View Details
                      </Button>
                      {uni.apply_link && (
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          sx={{ ml: 1 }}
                          href={uni.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Apply
                        </Button>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : null}

      {/* Comparison Tips */}
      <Paper elevation={1} sx={{ 
        p: 3, 
        mb: 4, 
        bgcolor: isDarkMode ? 'primary.900' : 'primary.50',
        color: isDarkMode ? 'text.primary' : 'inherit'
      }}>
        <Typography variant="h6" gutterBottom color={isDarkMode ? "primary.light" : "primary.dark"} className="compare-tips-title" sx={{ fontWeight: 'bold' }}>
          Compare What Matters Most
        </Typography>
        <Typography variant="body2" paragraph>
          Our comparison tool helps you evaluate universities based on their actual offerings:
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color={isDarkMode ? "primary.light" : "primary.dark"} gutterBottom>
                Program Varieties
              </Typography>
              <Typography variant="body2">
                Compare the full range of academic programs including Bachelor's, ADP, MPhil, and PhD options to find the best match for your educational goals.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <TimerIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color={isDarkMode ? "primary.light" : "primary.dark"} gutterBottom>
                Application Deadlines
              </Typography>
              <Typography variant="body2">
                Track important application deadlines across multiple universities to ensure you never miss an opportunity to apply to your preferred institutions.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <InfoIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color={isDarkMode ? "primary.light" : "primary.dark"} gutterBottom>
                Location & Sector
              </Typography>
              <Typography variant="body2">
                Evaluate universities based on their location, sector (public/private), and other essential information to find the best environment for your studies.
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Box mt={3} sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>
            We're continuously expanding our comparison features to include more data points such as fees, rankings, and scholarship information as they become available.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default UniversityCompare; 