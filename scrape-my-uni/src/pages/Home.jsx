import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { universityService } from '../services/api.service';
import SearchBar from '../components/SearchBar';
import UniversityCard from '../components/UniversityCard';
import OpenAdmissions from '../components/OpenAdmissions';
import VideoBackground from '../components/UI/VideoBackground';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  Divider,
  CircularProgress,
  Chip,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  useTheme,
  IconButton,
  Stack
} from '@mui/material';
import { 
  School, 
  LocationOn, 
  TrendingUp, 
  AccessTime, 
  ChevronRight,
  ChevronLeft,
  Notifications,
  Verified
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import universityHeroImage from '../assets/images/university-hero.jpg';

const MotionBox = motion.create(Box);

const FeaturedUniversityCard = ({ university, onClick }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClick = () => {
    if (onClick) {
      onClick(university.id);
    } else if (university.id) {
      navigate(`/universities/${university.id}`);
    }
  };

  return (
    <Card 
      elevation={2}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        border: university.admissionOpen ? `1px solid ${theme.palette.success.main}` : 'none',
      }}
    >
      <CardActionArea 
        onClick={handleClick}
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'stretch', 
          height: '100%' 
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper' }}>
          <Avatar
            src={university.logoUrl}
            alt={university.name}
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 1.5,
              bgcolor: theme.palette.primary.main,
            }}
          >
            {university.name ? university.name.charAt(0) : 'U'}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold" noWrap>
              {university.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
              <Typography variant="body2" color="text.secondary">
                {university.location}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        <CardContent sx={{ pt: 1.5, pb: 1.5, flexGrow: 1 }}>
          {university.admissionOpen && (
            <Chip 
              icon={<Verified fontSize="small" />}
              label="Admission Open" 
              size="small" 
              color="success" 
              sx={{ mb: 1 }} 
            />
          )}
          
          {university.deadline && (
            <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
              <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                Deadline: <strong>{new Date(university.deadline).toLocaleDateString()}</strong>
              </Typography>
            </Box>
          )}
          
          {university.sector && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <School fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                Sector: <strong>{university.sector}</strong>
              </Typography>
            </Box>
          )}
        </CardContent>

        <Box 
          sx={{ 
            p: 1.5, 
            bgcolor: theme.palette.grey[50], 
            borderTop: `1px solid ${theme.palette.grey[200]}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography 
            variant="button" 
            color="primary" 
            sx={{ fontWeight: 'medium', fontSize: '0.85rem' }}
          >
            View Details
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
};

const ImportantAdmissionsCard = ({ university, onClick }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClick = () => {
    if (onClick) {
      onClick(university.id);
    } else if (university.id) {
      navigate(`/universities/${university.id}`);
    }
  };

  return (
    <Paper 
      elevation={1}
      sx={{ 
        p: 2, 
        mb: 2, 
        display: 'flex', 
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateX(5px)',
          boxShadow: 2,
        },
        border: university.admissionOpen ? `1px solid ${theme.palette.success.main}` : 'none',
        borderLeft: university.admissionOpen ? `4px solid ${theme.palette.success.main}` : 'none',
      }}
      onClick={handleClick}
    >
      <Avatar
        src={university.logoUrl}
        alt={university.name}
        sx={{ 
          width: 50, 
          height: 50, 
          mr: 2,
          bgcolor: theme.palette.primary.main,
        }}
      >
        {university.name ? university.name.charAt(0) : 'U'}
      </Avatar>
      
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" component="div" fontWeight="bold">
            {university.name}
          </Typography>
          {university.admissionOpen && (
            <Chip 
              label="Open" 
              size="small" 
              color="success" 
              sx={{ ml: 1 }} 
            />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {university.location}
        </Typography>
        
        {university.deadline && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <AccessTime fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem', verticalAlign: 'middle' }} />
            Deadline: <strong>{new Date(university.deadline).toLocaleDateString()}</strong>
          </Typography>
        )}
      </Box>
      
      <ChevronRight color="action" />
    </Paper>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [types, setTypes] = useState([]);
  const [results, setResults] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch universities with upcoming deadlines
      const upcomingDeadlineUniversities = await universityService.getUniversitiesByDeadlineSoon(30, 5);
      setUpcomingDeadlines(upcomingDeadlineUniversities);
      
      // Fetch categories, provinces and types for filters
      const categoryData = await universityService.getPrograms();
      setCategories(categoryData);
      
      const locationData = await universityService.getLocations();
      setProvinces(locationData);
      
      setTypes([
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' },
        { value: 'semi-government', label: 'Semi Government' }
      ]);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load data. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      setLoading(true);
      const results = await universityService.search(query);
      setResults(results);
      navigate('/universities', { state: { searchQuery: query } });
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversityClick = (universityId) => {
    navigate(`/universities/${universityId}`);
  };

  const handleCategoryClick = async (categoryType, filterValue) => {
    try {
      setCategoryLoading(true);
      
      // Create proper filter state object that the universities page will recognize
      const filterState = {};
      
      // Make sure filter values are properly formatted based on the filter type
      if (categoryType === 'sector') {
        // Make sure sector values are properly cased for matching
        const formattedValues = filterValue.map(value => 
          value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
        );
        filterState[categoryType] = formattedValues;
      } else if (categoryType === 'programType') {
        // Format program types as needed
        const formattedValues = filterValue.map(value => value.toUpperCase());
        filterState[categoryType] = formattedValues;
      } else {
        filterState[categoryType] = filterValue;
      }
      
      // Add a debug flag to help troubleshoot
      filterState.source = 'home_category';
      
      // Log the filter being applied for debugging
      console.log(`Navigating to universities with ${categoryType} filter:`, filterState[categoryType]);
      
      // Navigate using replace to avoid history stacking
      navigate('/universities', { 
        state: filterState,
        replace: true 
      });
    } catch (err) {
      console.error(`Error navigating to ${categoryType} category:`, err);
      setError(`Failed to load ${categoryType} universities. Please try again.`);
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <VideoBackground
        videoSrc="/videos/university-hero.mp4"
        fallbackImage={universityHeroImage}
        overlay="rgba(0, 0, 0, 0.65)"
        sx={{
          height: { xs: '50vh', md: '60vh' },
          minHeight: 300,
          maxHeight: 600,
          width: '100vw',
          position: 'relative',
          overflow: 'hidden',
          mb: 6,
          p: 0,
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center" color="white">
            <MotionBox
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h2"
                component="h1"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
              >
                Find Your Perfect University
              </Typography>
            </MotionBox>
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{ mb: 4, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
              >
                Explore admissions, compare programs, and discover your path to higher education
              </Typography>
            </MotionBox>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Box sx={{ maxWidth: '700px', mx: 'auto' }}>
                <SearchBar onSearch={handleSearch} />
              </Box>
            </MotionBox>
          </Box>
        </Container>
      </VideoBackground>

      <Container maxWidth="lg">
        {/* Open Admissions Table */}
        <Box sx={{ mb: 8 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Typography 
              variant="h4" 
              component="h2" 
              fontWeight="bold"
              sx={{ 
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 60,
                  height: 4,
                  backgroundColor: theme.palette.primary.main
                }
              }}
            >
              Open Admissions
            </Typography>
            <Button 
              variant="outlined" 
              endIcon={<ChevronRight />}
              onClick={() => navigate('/universities')}
            >
              View All
            </Button>
          </Box>

          <OpenAdmissions />
        </Box>

        {/* Important Admissions Corner */}
        <Box sx={{ mb: 8 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Typography 
              variant="h4" 
              component="h2" 
              fontWeight="bold"
              sx={{ 
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 60,
                  height: 4,
                  backgroundColor: theme.palette.primary.main
                }
              }}
            >
              Important Admissions Corner
            </Typography>
            <Button 
              variant="outlined" 
              endIcon={<ChevronRight />}
              onClick={() => navigate('/universities')}
            >
              View All
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {upcomingDeadlines.slice(0, 6).map(university => (
                    <Grid item xs={12} sm={6} md={4} key={university.id}>
                      <ImportantAdmissionsCard
                        university={university}
                        onClick={handleUniversityClick}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </Box>
        
        {/* Quick Links Section */}
        <Box sx={{ mb: 8 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            fontWeight="bold"
            sx={{ 
              mb: 3,
              position: 'relative',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 60,
                height: 4,
                backgroundColor: theme.palette.primary.main
              }
            }}
          >
            Explore by Category
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleCategoryClick('sector', ['Public'])}
              >
                <School fontSize="large" color="primary" sx={{ mb: 2, fontSize: '3rem' }} />
                <Typography variant="h6" fontWeight="bold">Public Universities</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Explore government-funded higher education institutions
                </Typography>
                {categoryLoading && (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleCategoryClick('sector', ['Private'])}
              >
                <School fontSize="large" color="primary" sx={{ mb: 2, fontSize: '3rem' }} />
                <Typography variant="h6" fontWeight="bold">Private Universities</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Discover privately-owned academic institutions
                </Typography>
                {categoryLoading && (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleCategoryClick('programType', ['BS'])}
              >
                <School fontSize="large" color="primary" sx={{ mb: 2, fontSize: '3rem' }} />
                <Typography variant="h6" fontWeight="bold">Bachelors Programs</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Find undergraduate degree programs across Pakistan
                </Typography>
                {categoryLoading && (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleCategoryClick('programType', ['MS', 'PhD'])}
              >
                <School fontSize="large" color="primary" sx={{ mb: 2, fontSize: '3rem' }} />
                <Typography variant="h6" fontWeight="bold">Graduate Studies</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Browse Masters and PhD programs
                </Typography>
                {categoryLoading && (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box 
          sx={{ 
            position: 'relative',
            py: 6, 
            px: 4, 
            borderRadius: 2,
            color: 'white',
            textAlign: 'center',
            mb: 8,
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 80, 40, 0.7)' 
              : 'rgba(46, 125, 50, 0.7)',
            backdropFilter: 'blur(4px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 16px rgba(0, 0, 0, 0.4)' 
              : '0 8px 16px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            fontWeight="bold"
            sx={{ 
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              opacity: 0.9
            }}
          >
            Ready to Find Your Dream University?
          </Typography>
          <Typography 
            variant="h6" 
            component="p"
            sx={{ 
              mb: 4,
              opacity: 0.85,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Explore universities, compare programs, and track your applications all in one place.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            onClick={() => navigate('/universities')}
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
              backgroundColor: theme.palette.mode === 'dark' ? '#ffc107' : '#ffb74d',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#ffb300' : '#ffa726',
              }
            }}
          >
            Browse All Universities
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
