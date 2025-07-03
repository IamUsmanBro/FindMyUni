import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { universityService } from '../services/api.service';
import SearchBar from '../components/SearchBar';
import UniversityCard from '../components/UniversityCard';
import FilterPanel from '../components/FilterPanel';
import { 
  CircularProgress, 
  Alert, 
  Snackbar, 
  Button, 
  Grid, 
  Typography, 
  Box, 
  Container, 
  Paper, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase.js';
import { FilterAlt } from '@mui/icons-material';

const UniversityList = () => {
  const [universities, setUniversities] = useState([]);
  const [filteredUniversities, setFilteredUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [usingFirebase, setUsingFirebase] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [displayCount, setDisplayCount] = useState(12);
  const [initialFilterApplied, setInitialFilterApplied] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();
  const [filters, setFilters] = useState({
    programType: [],
    degreeLevel: [],
    location: [],
    sector: [],
    province: [],
    rankingRange: [0, 1000],
    tuitionRange: [0, 1000000],
    deadline: '',
    hasScholarship: false,
    hasHostel: false,
    admissionOpen: false,
    searchQuery: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Last element ref for infinite scrolling
  const lastUniversityElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreItems();
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchUniversities();
  }, []);

  // Handle navigation state when component mounts or location changes
  useEffect(() => {
    if (location.state && !initialFilterApplied && universities.length > 0) {
      console.log('NAVIGATION STATE RECEIVED:', location.state);
      
      // Apply filters from navigation state
      const newFilters = { ...filters };
      let hasFilters = false;
      
      Object.entries(location.state).forEach(([key, value]) => {
        if (key in filters && value) {
          console.log(`Setting filter: ${key} = ${JSON.stringify(value)}`);
          newFilters[key] = value;
          hasFilters = true;
        }
      });
      
      if (hasFilters) {
        console.log('APPLYING FILTERS FROM NAVIGATION:', newFilters);
        setFilters(newFilters);
        setInitialFilterApplied(true);
        
        // Simple direct filtering
        handleSearch('', newFilters, true);
      }
    }
  }, [location.state, universities]);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      let data = [];
      
      // Try to fetch from API first
      try {
        data = await universityService.getAll();
        if (Array.isArray(data) && data.length > 0) {
          setUsingFirebase(false);
        } else {
          // If API returns empty or invalid data, fall back to Firebase
          throw new Error('Invalid or empty data from API');
        }
      } catch (apiError) {
        console.error('API fetch failed, falling back to Firebase:', apiError);
        
        // Fallback to Firebase
        try {
          const universitiesCollection = collection(db, 'universities');
          const universitiesSnapshot = await getDocs(universitiesCollection);
          data = universitiesSnapshot.docs.map(doc => {
            const uniData = doc.data();
            
            // Extract basic_info data if available and not already set
            if (uniData.basic_info) {
              // Copy Location to location if missing
              if (uniData.basic_info.Location && !uniData.location) {
                uniData.location = uniData.basic_info.Location;
              }
              // Copy Sector to sector if missing
              if (uniData.basic_info.Sector && !uniData.sector) {
                uniData.sector = uniData.basic_info.Sector;
              }
            }
            
            return {
              id: doc.id,
              ...uniData
            };
          });
          
          // Debug: Log the data to see if location field exists
          console.log('Firebase university data (first 3 items):', data.slice(0, 3));
          console.log('Location fields exist in data:', data.some(uni => uni.location));
          
          setUsingFirebase(true);
          
          if (data.length === 0) {
            throw new Error('No universities found in Firebase');
          }
        } catch (firestoreError) {
          console.error('Firebase fallback also failed:', firestoreError);
          throw new Error('Failed to fetch university data from both API and database');
        }
      }
      
      // Sort data by deadline automatically (pre-sorted data)
      const sortedData = sortDataByDeadline(data);
      setUniversities(sortedData);
      setFilteredUniversities(sortedData);
      
    } catch (err) {
      setError('Failed to fetch universities. Please try again later.');
      setShowError(true);
      console.error(err);
      
      // Set empty arrays to prevent undefined errors
      setUniversities([]);
      setFilteredUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query, customFilters = null, isInitialFilter = false, abortSignal = null) => {
    try {
      // REMOVE the duplicate search prevention - it's causing problems
      setLoading(true);
      
      // Print debug info about the search
      console.log('==== SEARCH STARTED ====');
      console.log('Query:', query);
      console.log('Filters:', customFilters || filters);
      
      // Use provided custom filters or current filters
      const activeFilters = customFilters || filters;
      
      // If not using custom filters, update the search query in current filters
      if (!customFilters) {
        setFilters(prev => ({ ...prev, searchQuery: query }));
      }
      
      let results = [];
      
      // If no search query and no active filters, show all universities
      const hasActiveFilters = Object.entries(activeFilters).some(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) return true;
        if (typeof value === 'boolean' && value) return true;
        if (typeof value === 'string' && value) return true;
        return false;
      });
      
      if (!query && !hasActiveFilters) {
        console.log('No active filters, showing all universities');
        setFilteredUniversities(universities);
        setLoading(false);
        return;
      } else {
        console.log('Active filters detected, applying filtering');
      }
      
      // Debug filters state
      console.log('Applying filters:', JSON.stringify(activeFilters, null, 2));
      
      // Check for abort signal
      if (abortSignal && abortSignal.aborted) {
        console.log('Search aborted');
        return;
      }
      
      // Always use local filtering to ensure filters are correctly applied
      console.log('Using local filtering');
      results = filterUniversitiesLocally(universities, query, activeFilters);
      
      // Check for abort signal again
      if (abortSignal && abortSignal.aborted) {
        console.log('Search aborted during processing');
        return;
      }
      
      // Debug: Log filtered results
      console.log('Filtered results count:', results.length);
      
      if (Array.isArray(results)) {
        if (results.length === 0) {
          console.log('No universities matched the filter criteria');
          console.log('Check your filter values:', JSON.stringify(activeFilters, null, 2));
        } else {
          console.log('Filter successfully applied, showing filtered results');
          // Show first few results for debugging
          results.slice(0, 3).forEach(uni => {
            console.log(`Result: ${uni.name}, Sector: ${uni.sector || uni.basic_info?.Sector || 'unknown'}`);
          });
        }
        
        // Apply default deadline-based sorting
        const sortedResults = sortDataByDeadline(results);
        setFilteredUniversities(sortedResults);
      } else {
        console.warn('Invalid results format, showing empty results');
        setFilteredUniversities([]);
      }
    } catch (err) {
      console.error('Error during search process:', err);
      setError(`Failed to search universities: ${err.message}. Showing all results instead.`);
      setShowError(true);
      
      // Recovery: Show all universities on critical error
      setFilteredUniversities(universities);
    } finally {
      setLoading(false);
      console.log('==== SEARCH COMPLETED ====');
    }
  };

  // Helper function to filter universities locally
  const filterUniversitiesLocally = (data, query, activeFilters) => {
    // Print raw filter values
    console.log('FILTERING WITH:', {
      sector: activeFilters.sector,
      location: activeFilters.location,
      province: activeFilters.province,
      programType: activeFilters.programType
    });

    // Examine sample university data to understand structure
    if (data.length > 0) {
      const sampleUni = data[0];
      console.log('SAMPLE UNIVERSITY DATA:', {
        name: sampleUni.name,
        location: sampleUni.basic_info?.Location,
        sector: sampleUni.basic_info?.Sector,
        programs: sampleUni.programs ? Object.keys(sampleUni.programs) : []
      });
    }

    // Show the sector values in the first 10 universities
    console.log('SECTOR VALUES IN DATA:');
    data.slice(0, 10).forEach(uni => {
      console.log(`"${uni.name}" - Sector: "${uni.basic_info?.Sector || 'missing'}"`);
    });

    // Start with all data
    let results = [...data];
    const totalBefore = results.length;
    
    // ====== CORRECT FILTERING BASED ON ACTUAL DATA STRUCTURE ======
    
    // Filter by sector (public/private)
    if (activeFilters.sector && activeFilters.sector.length > 0) {
      const sectorFilters = activeFilters.sector.map(s => s.toLowerCase());
      console.log('Filtering by sectors:', sectorFilters);
      
      results = results.filter(uni => {
        // Get sector from basic_info.Sector
        const sectorValue = uni.basic_info?.Sector || '';
        const sectorLower = sectorValue.toLowerCase();
        
        // More detailed matching logic specifically for Public/Private
        let matches = false;
        
        // Try exact match first
        if (sectorFilters.includes(sectorLower)) {
          matches = true;
          console.log(`University "${uni.name}" sector "${sectorValue}" - ✓ EXACT MATCH`);
        }
        // Then try contains match (for partial matches)
        else {
          for (const filter of sectorFilters) {
            // Special handling for "public" which might be stored differently
            if (filter === "public") {
              // Check for common variations of public
              if (sectorLower.includes("public") || 
                  sectorLower.includes("government") || 
                  sectorLower.includes("govt") || 
                  sectorLower === "state") {
                matches = true;
                console.log(`University "${uni.name}" sector "${sectorValue}" - ✓ PUBLIC MATCH (special handling)`);
                break;
              }
            } 
            // Normal contains check for other sectors
            else if (sectorLower.includes(filter)) {
              matches = true;
              console.log(`University "${uni.name}" sector "${sectorValue}" - ✓ CONTAINS MATCH`);
              break;
            }
          }
        }
        
        if (!matches) {
          console.log(`University "${uni.name}" sector "${sectorValue}" - ✗ NO MATCH`);
        }
        
        return matches;
      });
      
      console.log(`Sector filter: ${totalBefore} → ${results.length} universities`);
    }

    // Filter by location (city/region)
    if (activeFilters.location && activeFilters.location.length > 0) {
      const locationFilters = activeFilters.location.map(l => l.toLowerCase());
      console.log('Filtering by locations:', locationFilters);
      
      const beforeCount = results.length;
      results = results.filter(uni => {
        // Get location from basic_info.Location
        const locationValue = uni.basic_info?.Location || '';
        const locationLower = locationValue.toLowerCase();
        
        // Priority city names that should always be matched independently
        const priorityCities = ['islamabad', 'karachi', 'lahore', 'peshawar', 'quetta'];
        
        // First check if the location contains any of the priority cities
        for (const city of priorityCities) {
          if (locationLower.includes(city)) {
            // If filtering for this priority city, it's a match
            if (locationFilters.includes(city)) {
              console.log(`University "${uni.name}" location "${locationValue}" - ✓ PRIORITY CITY MATCH (${city})`);
              return true;
            }
          }
        }
        
        // Try to extract city from location (usually before the comma)
        let city = '';
        if (locationLower.includes(',')) {
          city = locationLower.split(',')[0].trim();
        } else {
          // If no comma, use the whole location
          city = locationLower;
        }
        
        // Check if any location filter matches
        const matches = locationFilters.some(filter => city.includes(filter) || filter.includes(city));
        
        // Debug output
        console.log(`University "${uni.name}" city "${city}" - ${matches ? '✓ MATCH' : '✗ NO MATCH'}`);
        
        return matches;
      });
      
      console.log(`Location filter: ${beforeCount} → ${results.length} universities`);
    }

    // Filter by province (which is part of the Location field, e.g., "Hyderabad,Sindh")
    if (activeFilters.province && activeFilters.province.length > 0) {
      const provinceFilters = activeFilters.province.map(p => p.toLowerCase());
      console.log('Filtering by provinces:', provinceFilters);
      
      const beforeCount = results.length;
      results = results.filter(uni => {
        // Get location from basic_info.Location
        const locationValue = uni.basic_info?.Location || '';
        const locationLower = locationValue.toLowerCase();
        
        // Priority locations that belong to specific cities not provinces
        if (locationLower.includes('islamabad')) {
          // If filtering for Islamabad, match as special case
          if (provinceFilters.includes('islamabad')) {
            console.log(`University "${uni.name}" location "${locationValue}" - ✓ SPECIAL CITY MATCH`);
            return true;
          }
          
          // Islamabad universities should NOT match Punjab even if labeled as "Islamabad,Punjab"
          if (provinceFilters.includes('punjab')) {
            console.log(`University "${uni.name}" location "${locationValue}" - ✗ IGNORED FOR PUNJAB (ISLAMABAD)`);
            return false;
          }
        }
        
        // Try to extract province from location (usually after the comma)
        let province = '';
        if (locationLower.includes(',')) {
          province = locationLower.split(',')[1].trim();
        } else {
          // If no comma, check if the location contains the province name directly
          province = locationLower;
        }
        
        // Check if any province filter matches
        const matches = provinceFilters.some(filter => province.includes(filter));
        
        // Debug output
        console.log(`University "${uni.name}" province "${province}" - ${matches ? '✓ MATCH' : '✗ NO MATCH'}`);
        
        return matches;
      });
      
      console.log(`Province filter: ${beforeCount} → ${results.length} universities`);
    }

    // Filter by program type (BS, MS, etc.)
    if (activeFilters.programType && activeFilters.programType.length > 0) {
      const programFilters = activeFilters.programType.map(p => p.toLowerCase());
      console.log('Filtering by programs:', programFilters);
      
      const beforeCount = results.length;
      results = results.filter(uni => {
        // Check if university has programs
        if (!uni.programs) {
          return false;
        }
        
        // Get all program categories (BSPrograms, MSPrograms, etc.)
        const programCategories = Object.keys(uni.programs);
        
        // Check if any program category matches our filters
        const matches = programCategories.some(category => {
          const categoryLower = category.toLowerCase();
          return programFilters.some(filter => {
            // Check if category contains the filter (e.g., "BSPrograms" contains "bs")
            return categoryLower.includes(filter.toLowerCase());
          });
        });
        
        // Debug output
        console.log(`University "${uni.name}" programs ${JSON.stringify(programCategories)} - ${matches ? '✓ MATCH' : '✗ NO MATCH'}`);
        
        return matches;
      });
      
      console.log(`Program filter: ${beforeCount} → ${results.length} universities`);
    }

    // Apply text search if provided
    if (query) {
      const queryLower = query.toLowerCase();
      
      const beforeCount = results.length;
      results = results.filter(uni => {
        const name = (uni.name || '').toLowerCase();
        const description = (uni.description || '').toLowerCase();
        return name.includes(queryLower) || description.includes(queryLower);
      });
      
      console.log(`Text search filter: ${beforeCount} → ${results.length} universities`);
    }

    // Final results
    console.log(`FILTERING COMPLETE: ${totalBefore} → ${results.length} universities`);
    return results;
  };

  // Default sorting by deadline
  const sortDataByDeadline = (data) => {
    return [...data].sort((a, b) => {
      // Parse deadlines
      const parseDeadline = (uni) => {
        const deadline = uni.deadline || (uni.basic_info && uni.basic_info["Deadline to Apply"]);
        if (!deadline) return null;
        
        try {
          // Handle string format like "14 May 2025"
          if (typeof deadline === 'string' && !deadline.includes('Date')) {
            const parts = deadline.split(' ');
            const months = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            if (parts.length === 3) {
              return new Date(
                parseInt(parts[2]), // year
                months[parts[1]], // month
                parseInt(parts[0]) // day
              );
            }
          }
          return new Date(deadline);
        } catch (e) {
          return null;
        }
      };
      
      // Get deadline dates
      const deadlineA = parseDeadline(a);
      const deadlineB = parseDeadline(b);
      
      // Get admission statuses (considering both deadline and admissionOpen flag)
      const isDeadlinePassedA = deadlineA ? deadlineA < new Date() : false;
      const isDeadlinePassedB = deadlineB ? deadlineB < new Date() : false;
      const admissionOpenA = a.admissionOpen && !isDeadlinePassedA;
      const admissionOpenB = b.admissionOpen && !isDeadlinePassedB;
      
      // First sort by admission status (open admissions first)
      if (admissionOpenA && !admissionOpenB) return -1;
      if (!admissionOpenA && admissionOpenB) return 1;
      
      // If both have same admission status, sort by deadline
      if (deadlineA && deadlineB) {
        // If both have valid deadlines, sort by nearest deadline first
        return deadlineA - deadlineB;
      } else if (deadlineA) {
        return -1;
      } else if (deadlineB) {
        return 1;
      }
      
      // If no deadlines available, sort by name as fallback
      return a.name?.localeCompare(b.name) || 0;
    });
  };

  const handleFilterChange = (newFilters) => {
    console.log('Filter change called with:', newFilters);
    
    // Only proceed if we're not already loading
    if (loading) {
      console.log('Ignoring filter change while loading');
      return;
    }
    
    // Always update the filters directly
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        ...newFilters,
      };
      
      console.log('UPDATED FILTERS:', updatedFilters);
      
      // Apply filters immediately
      handleSearch(updatedFilters.searchQuery || prev.searchQuery, updatedFilters);
      
      return updatedFilters;
    });
  };

  const handleUniversityClick = (universityId) => {
    if (universityId) {
      navigate(`/universities/${universityId}`);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleRetry = () => {
    setError(null);
    setShowError(false);
    fetchUniversities();
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Load more items for infinite scroll
  const loadMoreItems = () => {
    if (filteredUniversities.length <= displayCount) {
      setHasMore(false);
      return;
    }
    
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 12);
      setLoadingMore(false);
      
      // Check if we've loaded all items
      if (displayCount + 12 >= filteredUniversities.length) {
        setHasMore(false);
      }
    }, 500); // Small timeout to prevent rapid loading
  };
  
  // Update hasMore when filteredUniversities changes
  useEffect(() => {
    setHasMore(filteredUniversities.length > displayCount);
  }, [filteredUniversities, displayCount]);

  if (loading && universities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Snackbar open={showError} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Snackbar>
      
      {usingFirebase && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Using local database due to API connection issues. Some features may be limited.
          <Button 
            size="small" 
            color="primary"
            onClick={() => {
              // Simple fix to extract data from basic_info
              const fixedUniversities = universities.map(uni => {
                const fixedUni = {...uni};
                
                // Copy values from basic_info if available
                if (fixedUni.basic_info) {
                  if (fixedUni.basic_info.Location && !fixedUni.location) {
                    fixedUni.location = fixedUni.basic_info.Location;
                  }
                  if (fixedUni.basic_info.Sector && !fixedUni.sector) {
                    fixedUni.sector = fixedUni.basic_info.Sector;
                  }
                }
                
                return fixedUni;
              });
              
              // Update universities data
              setUniversities(fixedUniversities);
              setFilteredUniversities(fixedUniversities);
              setError('University data has been updated. Location information should now display correctly.');
              setShowError(true);
            }}
            sx={{ ml: 2 }}
          >
            Fix Location Data
          </Button>
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#294B29' }}>
          University Admissions
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Find and compare universities, explore admission requirements, and discover your perfect path to higher education
        </Typography>
      </Box>

      <SearchBar onSearch={handleSearch} initialValue={filters.searchQuery} />

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ my: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterAlt sx={{ mr: 1 }} />
              Filters
            </Typography>
            <Button 
              variant={viewMode === 'grid' ? "contained" : "outlined"} 
              onClick={() => handleViewModeChange('grid')}
              size="small"
              sx={{ minWidth: 100 }}
            >
              Grid View
            </Button>
            <Button 
              variant={viewMode === 'table' ? "contained" : "outlined"} 
              onClick={() => handleViewModeChange('table')}
              size="small"
              sx={{ minWidth: 100 }}
            >
              Table View
            </Button>
          </Box>
        </Box>

        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      </Paper>

      {loading && universities.length > 0 ? (
        <div className="flex justify-center my-4">
          <CircularProgress size={24} />
        </div>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="body1">
              Showing <strong>{filteredUniversities.length}</strong> universities
              {filters.searchQuery && <> matching "<strong>{filters.searchQuery}</strong>"</>}
            </Typography>
          </Paper>

          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {filteredUniversities.slice(0, displayCount).map((university, index) => (
                <Grid 
                  item 
                  key={university.id || Math.random().toString()} 
                  xs={12} 
                  sm={6} 
                  md={6}
                  ref={index === displayCount - 1 ? lastUniversityElementRef : null}
                >
                  <UniversityCard
                    university={university}
                    onClick={() => handleUniversityClick(university.id)}
                    index={index}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                    >
                      University 
                    </TableCell>
                    <TableCell 
                      sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                    >
                      Location
                    </TableCell>
                    <TableCell 
                      sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                    >
                      Sector
                    </TableCell>
                    <TableCell 
                      sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                    >
                      Deadline
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                    >
                      Details
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUniversities.slice(0, displayCount).map((university, index) => (
                    <TableRow 
                      key={university.id || Math.random().toString()}
                      hover
                      ref={index === displayCount - 1 ? lastUniversityElementRef : null}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">{university.name}</Typography>
                        {(() => {
                          // Parse deadline
                          const deadline = university.deadline || 
                            (university.basic_info && university.basic_info["Deadline to Apply"]);
                          let isDeadlinePassed = false;
                          
                          if (deadline) {
                            try {
                              // Handle string format like "14 May 2025"
                              let deadlineDate;
                              if (typeof deadline === 'string' && !deadline.includes('Date')) {
                                const parts = deadline.split(' ');
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
                                  deadlineDate = new Date(deadline);
                                }
                              } else {
                                deadlineDate = new Date(deadline);
                              }
                              
                              isDeadlinePassed = deadlineDate < new Date();
                            } catch (e) {
                              console.error("Error parsing deadline:", e);
                            }
                          }
                          
                          const isAdmissionStillOpen = university.admissionOpen && !isDeadlinePassed;
                          
                          return (
                            <>
                              {isAdmissionStillOpen && (
                                <Chip 
                                  label="Admission Open" 
                                  size="small" 
                                  color="success" 
                                  sx={{ mt: 1 }} 
                                />
                              )}
                              {isDeadlinePassed && (
                                <Chip 
                                  label="Deadline Passed" 
                                  size="small" 
                                  color="warning" 
                                  sx={{ mt: 1 }} 
                                />
                              )}
                            </>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{university.location || (university.basic_info && university.basic_info.Location) || 'N/A'}</TableCell>
                      <TableCell>{university.sector || (university.basic_info && university.basic_info.Sector) || 'N/A'}</TableCell>
                      <TableCell>
                        {university.deadline || 
                         (university.basic_info && university.basic_info["Deadline to Apply"]) || 
                         'Contact university'}
                      </TableCell>
                      <TableCell align="center">
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          size="small"
                          onClick={() => handleUniversityClick(university.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
              <CircularProgress size={30} thickness={4} />
            </Box>
          )}

          {!loading && filteredUniversities.length === 0 && (
            <Paper sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">No universities found matching your criteria</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or search terms
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 3 }}
                onClick={() => {
                  setFilters({
                    programType: [],
                    degreeLevel: [],
                    location: [],
                    sector: [],
                    province: [],
                    rankingRange: [0, 1000],
                    tuitionRange: [0, 1000000],
                    deadline: '',
                    hasScholarship: false,
                    hasHostel: false,
                    admissionOpen: false,
                    searchQuery: ''
                  });
                  handleSearch('');
                }}
              >
                Clear All Filters
              </Button>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default UniversityList; 