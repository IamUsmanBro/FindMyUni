import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const RequestScrape = ({ onSuccess }) => {
  const { user } = useAuth();
  const [universityId, setUniversityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [universities, setUniversities] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!universityId) {
        throw new Error('Please select a university');
      }

      const requestsRef = collection(db, 'scrape_requests');
      await addDoc(requestsRef, {
        universityId,
        status: 'pending',
        requestedBy: user.uid,
        requestedAt: serverTimestamp(),
        error: null
      });

      setUniversityId('');
      onSuccess?.();
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit scraping request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Request New Scrape
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Autocomplete
        options={universities}
        getOptionLabel={(option) => option.name}
        value={universityId}
        onChange={(event, newValue) => {
          setUniversityId(newValue?.id || '');
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select University"
            required
            fullWidth
            margin="normal"
            disabled={loading}
          />
        )}
        disabled={loading}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading || !universityId}
        sx={{ mt: 2 }}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : 'Submit Request'}
      </Button>
    </Box>
  );
};

export default RequestScrape; 