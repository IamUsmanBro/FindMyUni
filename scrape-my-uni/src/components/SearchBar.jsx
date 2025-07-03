// src/components/SearchBar.jsx
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  InputBase, 
  IconButton, 
  Box, 
  Typography,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  School as SchoolIcon
} from '@mui/icons-material';

const EXAMPLE_SEARCHES = [
  "Computer Science", 
  "Business Administration", 
  "Engineering", 
  "Medicine", 
  "Islamabad", 
  "Lahore"
];

const SearchBar = ({ onSearch, initialValue = '', placeholder = 'Search for universities, programs, or locations' }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowExamples(e.target.value === '');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      await onSearch(searchTerm.trim());
    } finally {
      setIsSearching(false);
      setShowExamples(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
    setShowExamples(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExampleClick = (example) => {
    setSearchTerm(example);
    onSearch(example);
    setShowExamples(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={3}
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}
      >
        <IconButton sx={{ p: 1 }} disabled={isSearching}>
          <SchoolIcon color="primary" />
        </IconButton>
        
        <InputBase
          sx={{ ml: 1, flex: 1, fontSize: '1.05rem' }}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          autoFocus
        />
        
        {searchTerm && (
          <IconButton 
            onClick={handleClear} 
            sx={{ 
              visibility: searchTerm ? 'visible' : 'hidden',
              p: 1
            }}
            disabled={isSearching}
          >
            <ClearIcon />
          </IconButton>
        )}
        
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        
        <IconButton 
          color="primary" 
          sx={{ p: 1, bgcolor: 'primary.main', color: 'white', borderRadius: 1, '&:hover': { bgcolor: 'primary.dark' } }} 
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim()}
        >
          {isSearching ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SearchIcon />
          )}
        </IconButton>
      </Paper>

      {showExamples && (
        <Box sx={{ mt: 1.5, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Popular searches:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {EXAMPLE_SEARCHES.map((example) => (
              <Chip
                key={example}
                label={example}
                onClick={() => handleExampleClick(example)}
                clickable
                size="medium"
                color="default"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SearchBar;
