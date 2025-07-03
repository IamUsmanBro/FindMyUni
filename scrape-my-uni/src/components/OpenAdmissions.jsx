import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  Pagination
} from '@mui/material';
import { Link } from 'react-router-dom';
import { universityService } from '../services/api.service';

const OpenAdmissions = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    program: '',
    sector: '',
    province: ''
  });
  const [showPastDeadlines, setShowPastDeadlines] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchOpenAdmissions();
  }, []);

  const fetchOpenAdmissions = async () => {
    try {
      setLoading(true);
      // Get universities with upcoming deadlines
      let data = [];
      
      try {
        // Try with the backend API first - limit to 50 items to comply with backend validation
        data = await universityService.getUniversitiesByDeadlineSoon(60, 50);
      } catch (apiError) {
        console.error('Error calling deadline API, falling back to all universities:', apiError);
        
        // Fallback: get all universities and filter locally
        try {
          const allUniversities = await universityService.getAll();
          
          // Filter universities with deadlines in the next 60 days
          const today = new Date();
          const maxDate = new Date(today);
          maxDate.setDate(today.getDate() + 60);
          
          data = allUniversities.filter(uni => {
            // Get deadline from university data
            const deadlineStr = uni.deadline || (uni.basic_info && uni.basic_info["Deadline to Apply"]);
            if (!deadlineStr) return false;
            
            try {
              // Parse deadline
              const deadlineDate = new Date(deadlineStr);
              return deadlineDate >= today && deadlineDate <= maxDate;
            } catch (parseError) {
              console.error(`Error parsing deadline for ${uni.name}:`, parseError);
              return false;
            }
          });
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw fallbackError;  // Let the outer catch handle it
        }
      }
      
      // Sort universities by deadline (ascending)
      const sortedData = [...data].sort((a, b) => {
        // If either doesn't have a deadline, put it at the end
        if (!a.deadline && !a.basic_info?.["Deadline to Apply"]) return 1;
        if (!b.deadline && !b.basic_info?.["Deadline to Apply"]) return -1;
        return new Date(a.deadline || a.basic_info?.["Deadline to Apply"]) - new Date(b.deadline || b.basic_info?.["Deadline to Apply"]);
      });
      
      setUniversities(sortedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching open admissions:', err);
      setError('Failed to load universities with open admissions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const filteredUniversities = universities.filter((uni) => {
    // Filter by program if selected
    if (filters.program && !Array.isArray(uni.programs)) {
      return false;
    }
    
    if (filters.program && Array.isArray(uni.programs) && !uni.programs.some(p => 
      (p.name ? p.name.toLowerCase() : (typeof p === 'string' ? p.toLowerCase() : '')).includes(filters.program.toLowerCase())
    )) {
      return false;
    }
    
    // Filter by sector if selected
    if (filters.sector && 
        (!uni.sector || uni.sector.toLowerCase() !== filters.sector.toLowerCase()) && 
        (!uni.basic_info || !uni.basic_info.Sector || uni.basic_info.Sector.toLowerCase() !== filters.sector.toLowerCase())) {
      return false;
    }
    
    // Filter by province if selected
    if (filters.province && 
        (!uni.province || uni.province.toLowerCase() !== filters.province.toLowerCase()) && 
        (!uni.basic_info || !uni.basic_info.Province || uni.basic_info.Province.toLowerCase() !== filters.province.toLowerCase())) {
      return false;
    }
    
    // Filter out universities with passed deadlines unless showPastDeadlines is true
    if (!showPastDeadlines) {
      const deadlineDate = uni.deadline || (uni.basic_info && uni.basic_info["Deadline to Apply"]);
      if (deadlineDate) {
        const daysRemaining = Math.ceil((new Date(deadlineDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Get unique program types, sectors, and provinces for filters
  const programTypes = [...new Set(
    universities.flatMap(uni => Array.isArray(uni.programs) ? uni.programs.map(p => p.name || p) : [])
  )];
  
  const sectors = [...new Set(
    universities.map(uni => uni.sector || (uni.basic_info && uni.basic_info.Sector)).filter(Boolean)
  )];
  
  const provinces = [...new Set(
    universities.map(uni => uni.province || (uni.basic_info && uni.basic_info.Province)).filter(Boolean)
  )];

  // Pagination
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedUniversities = filteredUniversities.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Universities with Open Admissions
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="program-filter-label">Program</InputLabel>
            <Select
              labelId="program-filter-label"
              name="program"
              value={filters.program}
              label="Program"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Programs</MenuItem>
              {programTypes.map((program) => (
                <MenuItem key={program} value={program}>
                  {program}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="sector-filter-label">Sector</InputLabel>
            <Select
              labelId="sector-filter-label"
              name="sector"
              value={filters.sector}
              label="Sector"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Sectors</MenuItem>
              {sectors.map((sector) => (
                <MenuItem key={sector} value={sector}>
                  {sector}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="province-filter-label">Province</InputLabel>
            <Select
              labelId="province-filter-label"
              name="province"
              value={filters.province}
              label="Province"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Provinces</MenuItem>
              {provinces.map((province) => (
                <MenuItem key={province} value={province}>
                  {province}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="deadline-filter-label">Deadlines</InputLabel>
            <Select
              labelId="deadline-filter-label"
              value={showPastDeadlines ? "all" : "upcoming"}
              label="Deadlines"
              onChange={(e) => setShowPastDeadlines(e.target.value === "all")}
            >
              <MenuItem value="upcoming">Upcoming Only</MenuItem>
              <MenuItem value="all">Show All Deadlines</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {filteredUniversities.length === 0 ? (
        <Alert severity="info">
          No universities matching your filters found.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }} aria-label="open admissions table">
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '5%' }}>SR.</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '35%' }}>UNIVERSITY</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '25%' }}>PROGRAMS</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '15%' }}>SECTOR</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '20%' }}>DEADLINE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUniversities.map((university, index) => (
                  <TableRow 
                    key={university.id || index}
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      {(page - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/universities/${university.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography 
                          fontWeight="medium" 
                          color="primary.main"
                          sx={{ '&:hover': { textDecoration: 'underline' } }}
                        >
                          {university.name}
                        </Typography>
                      </Link>
                      {/* Only render location if it exists */}
                      {university.location ? (
                        <Typography variant="body2" color="text.secondary">
                          {university.location}
                        </Typography>
                      ) : university.basic_info && university.basic_info.Location ? (
                        <Typography variant="body2" color="text.secondary">
                          {university.basic_info.Location}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(university.programs) && university.programs.length > 0 ? (
                        <Typography variant="body2">
                          {university.programs.slice(0, 3).map(program => 
                            typeof program === 'object' && program.name ? program.name : 
                            typeof program === 'string' ? program : ''
                          ).filter(Boolean).join(', ')}
                          {university.programs.length > 3 && ` +${university.programs.length - 3} more`}
                        </Typography>
                      ) : university.programs && typeof university.programs === 'string' ? (
                        <Typography variant="body2">
                          {university.programs}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          BS, MS, PhD
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {university.sector || (university.basic_info && university.basic_info.Sector) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        fontWeight="medium" 
                        color="error.main"
                      >
                        {university.deadline ? new Date(university.deadline).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : (university.basic_info && university.basic_info["Deadline to Apply"]) ? 
                            new Date(university.basic_info["Deadline to Apply"]).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : 'Not specified'}
                      </Typography>
                      {(university.deadline || (university.basic_info && university.basic_info["Deadline to Apply"])) && (
                        <Typography variant="caption" color={
                          Math.ceil((new Date(university.deadline || university.basic_info["Deadline to Apply"]) - new Date()) / (1000 * 60 * 60 * 24)) > 0 
                          ? "text.secondary" 
                          : "error.main"
                        }>
                          {(() => {
                            const daysRemaining = Math.ceil(
                              (new Date(university.deadline || university.basic_info["Deadline to Apply"]) - new Date()) / 
                              (1000 * 60 * 60 * 24)
                            );
                            if (daysRemaining > 0) {
                              return `(in ${daysRemaining} days)`;
                            } else if (daysRemaining === 0) {
                              return "(Today)";
                            } else {
                              return "(Deadline passed)";
                            }
                          })()}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(filteredUniversities.length / rowsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default OpenAdmissions; 