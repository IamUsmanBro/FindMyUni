import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  TablePagination,
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  failed: 'error'
};

// Safe date formatter
const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    if (typeof date === 'object' && date.toDate) {
      return format(date.toDate(), 'PPpp');
    }
    return format(new Date(date), 'PPpp');
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(date);
  }
};

const ScrapeRequests = ({ requests, onRefresh }) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!requests || requests.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={3}>
        <Typography variant="body1" color="text.secondary">
          No scraping requests found
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} sx={{ mt: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Recent Scraping Requests</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>University</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested At</TableCell>
              <TableCell>Completed At</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.universityId}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      color={statusColors[request.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(request.requestedAt)}
                  </TableCell>
                  <TableCell>
                    {formatDate(request.completedAt)}
                  </TableCell>
                  <TableCell>
                    {request.error ? (
                      <Tooltip title={request.error}>
                        <Typography color="error" variant="body2">
                          Error occurred
                        </Typography>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={requests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ScrapeRequests; 