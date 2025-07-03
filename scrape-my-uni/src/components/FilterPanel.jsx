import React, { useState, useEffect } from 'react';
import {
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Divider,
  Button,
  Chip,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { universityService } from '../services/api.service';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// Constants for filter options
const SECTORS = ["Public", "Private", "Semi Government"];
const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "AJK", "Gilgit"];
const PROGRAM_TYPES = ["BS", "MS", "PhD", "Associate", "Diploma", "Certificate"];
const CITIES = [
  "Islamabad", "Lahore", "Karachi", "Peshawar", "Quetta", "Multan", "Faisalabad", 
  "Rawalpindi", "Sialkot", "Bahawalpur", "Hyderabad", "Jamshoro"
];

const FilterPanel = ({ filters, onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Local state to manage filters before submitting
  const [localFilters, setLocalFilters] = useState({
    programType: filters.programType || [],
    location: filters.location || [],
    sector: filters.sector || [],
    province: filters.province || [],
    admissionOpen: filters.admissionOpen || false
  });

  useEffect(() => {
    // Safely merge filters with defaults to ensure all properties exist
    setLocalFilters(prevFilters => ({
      ...prevFilters,
      programType: filters.programType || prevFilters.programType || [],
      location: filters.location || prevFilters.location || [],
      sector: filters.sector || prevFilters.sector || [],
      province: filters.province || prevFilters.province || [],
      admissionOpen: filters.admissionOpen ?? prevFilters.admissionOpen ?? false
    }));
  }, [filters]);

  useEffect(() => {
    updateActiveFilters();
  }, [localFilters]);

  // Auto-apply filters whenever they change
  useEffect(() => {
    // Skip the initial render
    const isInitialRender = 
      localFilters.programType.length === 0 && 
      localFilters.location.length === 0 && 
      localFilters.sector.length === 0 &&
      localFilters.province.length === 0 &&
      !localFilters.admissionOpen;
    
    if (!isInitialRender) {
      applyFilters();
    }
  }, [localFilters]);

  const updateActiveFilters = () => {
    // Safety check: ensure localFilters has all required properties
    if (!localFilters) return;
    
    const newActiveFilters = [];

    if (Array.isArray(localFilters.programType) && localFilters.programType.length > 0) {
      newActiveFilters.push(`Programs: ${localFilters.programType.length} selected`);
    }

    if (Array.isArray(localFilters.location) && localFilters.location.length > 0) {
      newActiveFilters.push(`Cities: ${localFilters.location.length} selected`);
    }

    if (Array.isArray(localFilters.sector) && localFilters.sector.length > 0) {
      newActiveFilters.push(`Sectors: ${localFilters.sector.length} selected`);
    }

    if (Array.isArray(localFilters.province) && localFilters.province.length > 0) {
      newActiveFilters.push(`Provinces: ${localFilters.province.length} selected`);
    }

    if (localFilters.admissionOpen) {
      newActiveFilters.push('Admission Open');
    }

    setActiveFilters(newActiveFilters);
  };

  const handleCheckboxChange = (event) => {
    setLocalFilters(prev => ({
      ...prev,
      [event.target.name]: event.target.checked
    }));
  };

  const applyFilters = () => {
    if (typeof onFilterChange === 'function') {
      onFilterChange({...localFilters});
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      programType: [],
      location: [],
      sector: [],
      province: [],
      admissionOpen: false
    };
    
    setLocalFilters(clearedFilters);
    if (typeof onFilterChange === 'function') {
      onFilterChange(clearedFilters);
    }
  };

  const handleRemoveFilter = (filter) => {
    // Always use the function update form of setState to prevent stale state issues
    if (filter.includes('Programs:')) {
      setLocalFilters(prev => ({
        ...prev,
        programType: []
      }));
    } else if (filter.includes('Cities:')) {
      setLocalFilters(prev => ({
        ...prev,
        location: []
      }));
    } else if (filter.includes('Sectors:')) {
      setLocalFilters(prev => ({
        ...prev,
        sector: []
      }));
    } else if (filter.includes('Provinces:')) {
      setLocalFilters(prev => ({
        ...prev,
        province: []
      }));
    } else if (filter === 'Admission Open') {
      setLocalFilters(prev => ({
        ...prev,
        admissionOpen: false
      }));
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: 'fit-content' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1 }} />
          Quick Filters
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleClearFilters}
          disabled={activeFilters.length === 0}
        >
          Clear All
        </Button>
      </Box>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Active Filters:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter}
                size="small"
                onDelete={() => handleRemoveFilter(filter)}
                deleteIcon={<ClearIcon fontSize="small" />}
              />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        {/* Row 1 */}
        <Grid item xs={12} sm={6} md={3}>
          {/* Admission Status */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="admission" style={{ marginRight: '4px' }}>🎓</span> Admission
            </Typography>
            <FormGroup sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={localFilters.admissionOpen} 
                    onChange={handleCheckboxChange} 
                    name="admissionOpen" 
                    color="success"
                  />
                }
                label="Open Only"
              />
            </FormGroup>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {/* Sector Selection */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="sector" style={{ marginRight: '4px' }}>🏢</span> Sector
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {SECTORS.map(sector => (
                <Chip
                  key={sector}
                  label={sector}
                  size="small"
                  clickable
                  color={localFilters.sector.includes(sector) ? "primary" : "default"}
                  onClick={() => {
                    if (localFilters.sector.includes(sector)) {
                      setLocalFilters(prev => ({
                        ...prev,
                        sector: prev.sector.filter(s => s !== sector)
                      }));
                    } else {
                      setLocalFilters(prev => ({
                        ...prev,
                        sector: [...prev.sector, sector]
                      }));
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {/* Province Selection */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="province" style={{ marginRight: '4px' }}>🗺️</span> Province
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {PROVINCES.map(province => (
                <Chip
                  key={province}
                  label={province}
                  size="small"
                  clickable
                  color={localFilters.province.includes(province) ? "primary" : "default"}
                  onClick={() => {
                    if (localFilters.province.includes(province)) {
                      setLocalFilters(prev => ({
                        ...prev,
                        province: prev.province.filter(p => p !== province)
                      }));
                    } else {
                      setLocalFilters(prev => ({
                        ...prev,
                        province: [...prev.province, province]
                      }));
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {/* Program Types */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="program" style={{ marginRight: '4px' }}>📚</span> Program Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {["BS", "MS", "PhD", "Associate", "Diploma"].map(program => (
                <Chip
                  key={program}
                  label={program}
                  size="small"
                  clickable
                  color={localFilters.programType.includes(program) ? "primary" : "default"}
                  onClick={() => {
                    if (localFilters.programType.includes(program)) {
                      setLocalFilters(prev => ({
                        ...prev,
                        programType: prev.programType.filter(p => p !== program)
                      }));
                    } else {
                      setLocalFilters(prev => ({
                        ...prev,
                        programType: [...prev.programType, program]
                      }));
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Row 2 */}
        <Grid item xs={12}>
          {/* Cities */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="city" style={{ marginRight: '4px' }}>🏙️</span> Major Cities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {CITIES.map(city => (
                <Chip
                  key={city}
                  label={city}
                  size="small"
                  clickable
                  color={localFilters.location.includes(city) ? "primary" : "default"}
                  onClick={() => {
                    if (localFilters.location.includes(city)) {
                      setLocalFilters(prev => ({
                        ...prev,
                        location: prev.location.filter(c => c !== city)
                      }));
                    } else {
                      setLocalFilters(prev => ({
                        ...prev,
                        location: [...prev.location, city]
                      }));
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FilterPanel; 