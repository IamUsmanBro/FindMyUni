import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  DoNotDisturb as RejectIcon,
  Pending as PendingIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { applicationService } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Step definitions for different application statuses
const APPLICATION_STEPS = {
  'pending': 0,
  'submitted': 1,
  'under-review': 2,
  'accepted': 3,
  'rejected': 3
};

const ApplicationTracker = ({ applications, onRefresh }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [uploadApplicationId, setUploadApplicationId] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [notesApplicationId, setNotesApplicationId] = useState(null);
  const [notes, setNotes] = useState('');

  // Handle application card expansion
  const handleExpandClick = (applicationId) => {
    setExpandedId(expandedId === applicationId ? null : applicationId);
  };

  // Get step color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      case 'under-review':
        return theme.palette.info.main;
      case 'submitted':
        return theme.palette.primary.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <RejectIcon color="error" />;
      case 'under-review':
        return <PendingIcon color="info" />;
      case 'submitted':
        return <AssignmentIcon color="primary" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      if (typeof dateString === 'object' && dateString.toDate) {
        return format(dateString.toDate(), 'MMMM d, yyyy');
      }
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return String(dateString);
    }
  };

  // Handle delete confirmation dialog
  const handleDeleteClick = (applicationId) => {
    setDeleteId(applicationId);
    setOpenDeleteDialog(true);
  };

  // Delete an application
  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await applicationService.delete(deleteId);
      setOpenDeleteDialog(false);
      showToast('Application deleted successfully', 'success');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting application:', error);
      showToast(error.message || 'Failed to delete application', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open document upload dialog
  const handleUploadClick = (applicationId) => {
    setUploadApplicationId(applicationId);
    setDocumentType('');
    setSelectedFile(null);
    setOpenUploadDialog(true);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Upload document
  const handleUploadDocument = async () => {
    if (!selectedFile || !documentType || !uploadApplicationId) {
      showToast('Please select a file and document type', 'error');
      return;
    }

    try {
      setUploadLoading(true);
      await applicationService.uploadDocument(uploadApplicationId, selectedFile);
      setOpenUploadDialog(false);
      showToast('Document uploaded successfully', 'success');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error uploading document:', error);
      showToast(error.message || 'Failed to upload document', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  // Open notes dialog
  const handleNotesClick = (applicationId, currentNotes) => {
    setNotesApplicationId(applicationId);
    setNotes(currentNotes || '');
    setOpenNotesDialog(true);
  };

  // Save notes
  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      await applicationService.update(notesApplicationId, { notes });
      setOpenNotesDialog(false);
      showToast('Notes updated successfully', 'success');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating notes:', error);
      showToast(error.message || 'Failed to update notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sort applications by status priority and date
  const sortedApplications = [...applications].sort((a, b) => {
    // First sort by status priority
    const statusPriorityA = APPLICATION_STEPS[a.status] || 0;
    const statusPriorityB = APPLICATION_STEPS[b.status] || 0;
    
    if (statusPriorityA !== statusPriorityB) {
      return statusPriorityB - statusPriorityA; // Higher priority first
    }
    
    // Then sort by submission date (newest first)
    const dateA = new Date(a.submittedAt || a.createdAt || 0);
    const dateB = new Date(b.submittedAt || b.createdAt || 0);
    return dateB - dateA;
  });

  if (applications.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Applications Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          You haven't submitted any university applications yet.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => window.location.href = '/universities'}
        >
          Browse Universities
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {sortedApplications.map((application) => (
        <Card 
          key={application.id} 
          sx={{ 
            mb: 2, 
            border: `1px solid ${getStatusColor(application.status)}`,
            '&:hover': { boxShadow: 3 }
          }}
        >
          <CardContent 
            sx={{ 
              pb: 1,
              cursor: 'pointer',
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onClick={() => handleExpandClick(application.id)}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getStatusIcon(application.status)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {application.universityName}
                </Typography>
                <Chip 
                  label={application.program}
                  size="small"
                  sx={{ ml: 2, bgcolor: 'background.default' }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Status: <span style={{ color: getStatusColor(application.status), fontWeight: 'bold' }}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                </span>
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Submitted: {formatDate(application.submittedAt || application.createdAt)}
              </Typography>
            </Box>
            
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleExpandClick(application.id);
              }}
              sx={{ transform: expandedId === application.id ? 'rotate(180deg)' : 'none', transition: '0.3s' }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </CardContent>
          
          {expandedId === application.id && (
            <Box sx={{ p: 2, pt: 0 }}>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                {/* Left column: Application timeline */}
                <Box sx={{ flex: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Application Progress
                  </Typography>
                  
                  <Stepper activeStep={APPLICATION_STEPS[application.status] || 0} orientation="vertical">
                    <Step key="pending">
                      <StepLabel>Application Started</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Application has been created but not yet submitted.
                        </Typography>
                      </StepContent>
                    </Step>
                    
                    <Step key="submitted">
                      <StepLabel>Submitted</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Application has been submitted to the university.
                        </Typography>
                        {application.submittedAt && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(application.submittedAt)}
                          </Typography>
                        )}
                      </StepContent>
                    </Step>
                    
                    <Step key="under-review">
                      <StepLabel>Under Review</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          University is reviewing your application.
                        </Typography>
                      </StepContent>
                    </Step>
                    
                    <Step key="decision">
                      <StepLabel>Decision</StepLabel>
                      <StepContent>
                        <Typography variant="body2" color={application.status === 'accepted' ? 'success.main' : 'error.main'}>
                          {application.status === 'accepted' ? 'Congratulations! Your application has been accepted.' : 
                           application.status === 'rejected' ? 'Unfortunately, your application has been rejected.' : 
                           'Awaiting final decision from the university.'}
                        </Typography>
                      </StepContent>
                    </Step>
                  </Stepper>
                </Box>
                
                {/* Right column: Documents and actions */}
                <Box sx={{ flex: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Documents
                    </Typography>
                    
                    {application.documents && application.documents.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {application.documents.map((doc, index) => (
                          <Chip
                            key={index}
                            label={doc.name || doc.type}
                            color={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'default'}
                            icon={<AssignmentIcon />}
                            onClick={() => window.open(doc.url, '_blank')}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No documents uploaded yet.
                      </Typography>
                    )}
                    
                    <Button
                      startIcon={<UploadIcon />}
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => handleUploadClick(application.id)}
                    >
                      Upload Document
                    </Button>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Notes
                    </Typography>
                    
                    <Paper variant="outlined" sx={{ p: 2, minHeight: '60px', position: 'relative' }}>
                      <Typography variant="body2" color={application.notes ? 'text.primary' : 'text.secondary'}>
                        {application.notes || 'No notes added yet.'}
                      </Typography>
                      
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        onClick={() => handleNotesClick(application.id, application.notes)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Tooltip title="Delete Application">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(application.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Card>
      ))}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this application? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteConfirm}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Document Upload Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Document Type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            fullWidth
            margin="normal"
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Select document type</option>
            <option value="transcript">Academic Transcript</option>
            <option value="id_card">ID Card/Passport</option>
            <option value="photo">Photograph</option>
            <option value="letter">Recommendation Letter</option>
            <option value="cv">CV/Resume</option>
            <option value="statement">Personal Statement</option>
            <option value="other">Other Document</option>
          </TextField>
          
          <Box sx={{ my: 3, textAlign: 'center' }}>
            <input
              accept="application/pdf,image/*"
              style={{ display: 'none' }}
              id="contained-button-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="contained-button-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
              >
                Select File
              </Button>
            </label>
            
            {selectedFile && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleUploadDocument}
            disabled={!selectedFile || !documentType || uploadLoading}
          >
            {uploadLoading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notes Dialog */}
      <Dialog
        open={openNotesDialog}
        onClose={() => setOpenNotesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Application Notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            multiline
            rows={4}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes about this application here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotesDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveNotes}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationTracker; 