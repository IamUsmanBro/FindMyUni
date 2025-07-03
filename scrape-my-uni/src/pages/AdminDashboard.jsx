import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  Container, Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, 
  Alert, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Select, MenuItem, InputLabel, FormControl,
  Grid, Card, CardContent, Divider, Chip, List, ListItem, ListItemText,
  ListItemSecondaryAction, Switch
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, onSnapshot, getDoc, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { adminService, checkApiConnectivity, isUsingFirestoreFallback } from '../services/api.service';

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { verifyAdminStatus } = useAuth();
  const { showToast } = useToast();
  const [universities, setUniversities] = useState([]);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [scrapeJobs, setScrapeJobs] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUniversities: 0,
    totalApplications: 0,
    pendingScrapeJobs: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const theme = useTheme();
  const auth = getAuth();
  const { currentUser } = auth;

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time listener for users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    }, (error) => {
      console.error("Error setting up real-time listener for users:", error);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Verify admin status when component mounts
    const checkAdminStatus = async () => {
      try {
        const isAdmin = await verifyAdminStatus();
        if (!isAdmin) {
          showToast('Warning: Your admin status has issues. Attempting to fix...', 'warning');
          await verifyAdminStatus(); // Try again to fix it
        }
      } catch (err) {
        console.error('Error verifying admin status:', err);
      }
    };
    
    checkAdminStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check API connectivity first
      await checkApiConnectivity();
      
      // Show a notification if we're in fallback mode
      if (isUsingFirestoreFallback()) {
        showToast('Backend server is unreachable. Operating in Firestore-only mode.', 'warning');
      }
      
      // Fetch dashboard stats
      try {
        const dashboardStats = await adminService.getDashboardStats();
        setStats(dashboardStats);
      } catch (statsError) {
        console.error('Error fetching dashboard stats:', statsError);
      }
      
      // Fetch users
      try {
        // Get users directly from Firestore if backend is unreachable
        const usersList = isUsingFirestoreFallback() 
          ? await adminService.getUsersFromFirebase()
          : await adminService.getUsers();
        setUsers(usersList);
      } catch (usersError) {
        console.error('Error fetching users:', usersError);
        // Fallback to Firestore if API fails
        try {
          const fallbackUsers = await adminService.getUsersFromFirebase();
          setUsers(fallbackUsers);
        } catch (fbError) {
          console.error('Firestore fallback for users failed:', fbError);
        }
      }
      
      // Set up real-time listener for universities
      const unisRef = collection(db, 'universities');
      const unisQuery = query(unisRef);
      const unsubscribe = onSnapshot(unisQuery, (snapshot) => {
        const universitiesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setUniversities(universitiesList);
      }, (error) => {
        console.error('Error in universities snapshot listener:', error);
      });
      
      // Get applications in real-time
      const applicationsRef = collection(db, 'applications');
      onSnapshot(applicationsRef, (snapshot) => {
        const applicationsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setApplications(applicationsList);
      }, (error) => {
        console.error('Error in applications snapshot:', error);
      });
      
      // Get scrape jobs
      const scrapeJobsRef = collection(db, 'scrape_jobs');
      const scrapeJobsQuery = query(scrapeJobsRef, limit(20));
      onSnapshot(scrapeJobsQuery, (snapshot) => {
        const jobsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setScrapeJobs(jobsList);
      }, (error) => {
        console.error('Error in scrape jobs snapshot:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleScrapeRequest = async (universityId) => {
    try {
      await adminService.triggerScrapeJob(universityId);
      setSuccess('Scrape request submitted successfully');
      showToast('Scrape request submitted successfully', 'success');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to submit scrape request');
      console.error(err);
    }
  };

  // Handle batch scrape request for all universities
  const handleBatchScrapeRequest = async () => {
    try {
      setLoading(true);
      showToast('Batch scrape request initiated. This may take some time...', 'info');
      
      // First try the direct API endpoint
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/scrape-jobs/batch-direct`, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'API-Key': 'scraper-direct-access-key'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuccess('Batch scrape request submitted successfully');
          showToast('All universities will be updated. This process runs in the background.', 'success');
          setTimeout(() => setSuccess(''), 3000);
          setLoading(false);
          return;
        } else {
          console.warn('Direct API call failed, falling back to standard method');
        }
      } catch (directError) {
        console.error('Error with direct API call:', directError);
        // Continue with the standard approach
      }
      
      // If direct method failed, try the standard approach
      
      // First verify admin status
      try {
        const isAdmin = await verifyAdminStatus();
        if (!isAdmin) {
          setError('You do not have admin privileges.');
          showToast('Admin privileges required', 'error');
          setLoading(false);
          return;
        }
      } catch (adminErr) {
        console.error('Error verifying admin status:', adminErr);
        setError('Failed to verify admin status: ' + adminErr.message);
        showToast('Error verifying permissions', 'error');
        setLoading(false);
        return;
      }
      
      // Call the admin service to trigger the batch scrape
      try {
        await adminService.triggerBatchScrapeJob();
        
        setSuccess('Batch scrape request submitted successfully');
        showToast('All universities will be updated. This process runs in the background.', 'success');
        setTimeout(() => setSuccess(''), 3000);
      } catch (serviceErr) {
        console.error('Admin service error:', serviceErr);
        
        // Handle specific error cases
        if (serviceErr.response?.status === 401) {
          setError('Authentication error: You may not have admin privileges or your session has expired');
          showToast('Authentication error. Please try logging out and back in.', 'error');
        } else {
          setError(`Failed to submit batch scrape request: ${serviceErr.message || 'Unknown error'}`);
          showToast('Error: Failed to submit batch scrape request', 'error');
        }
      }
    } catch (err) {
      console.error('Error in batch scrape request:', err);
      setError(`Failed to submit batch scrape request: ${err.message || 'Unknown error'}`);
      showToast('Error: Failed to submit batch scrape request', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle direct script execution
  const handleRunScriptDirectly = async () => {
    try {
      setLoading(true);
      showToast('Running scraper directly...', 'info');

      // Run a fetch request to execute a PowerShell command via a direct endpoint
      const scriptPath = "C:/Users/Usman/Desktop/Project/NEwith modules/NE/backend_project/app/services/scraper_service.py";
      
      // Make a simple POST request to local backend on port 8000
      const response = await fetch(`http://localhost:8000/api/admin/scrape-jobs/batch-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': 'scraper-direct-access-key'
        },
        body: JSON.stringify({ scriptPath })
      });

      if (response.ok) {
        setSuccess('Scraper script started successfully. Check the console for output.');
        showToast('Scraper script started. It may take several minutes to complete.', 'success');
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error running script directly:', err);
      
      // As a FALLBACK - try to run using the local file protocol
      try {
        // For Windows, try using direct file protocol which can trigger scripts
        window.open('file:///C:/Users/Usman/Desktop/Project/NEwith%20modules/NE/backend_project/run_scraper.bat');
        setSuccess('Fallback: Script opened in a new window. Check your taskbar.');
        showToast('Scraper opened with fallback method. Check your taskbar.', 'success');
      } catch (fallbackErr) {
        setError(`Failed to run script: ${err.message}. Fallback also failed: ${fallbackErr.message}`);
        showToast('Error: Could not run the script by any method. Try manual execution.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    try {
      if (!currentUser || !currentUser.email) {
        setError('Cannot add admin: No user is currently logged in');
        return;
      }
      
      // Add the current user as an admin if they aren't already
      const adminsRef = collection(db, 'admins');
      
      // Check if the user is already an admin
      const existingAdminQuery = query(
        collection(db, 'admins'),
        where('email', '==', currentUser.email.toLowerCase())
      );
      
      const existingAdminSnapshot = await getDocs(existingAdminQuery);
      
      if (!existingAdminSnapshot.empty) {
        setSuccess('You are already registered as an admin');
        showToast('You are already registered as an admin', 'info');
        setTimeout(() => setSuccess(''), 3000);
        return;
      }
      
      // Add as admin
      await addDoc(adminsRef, {
        email: currentUser.email.toLowerCase(),
        name: currentUser.displayName || 'Admin User',
        createdAt: new Date().toISOString(),
        permissions: ['users.read', 'users.write', 'universities.read', 'universities.write']
      });
      
      setSuccess('Added yourself as an admin');
      showToast('Added yourself as an admin', 'success');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add admin: ' + (err.message || 'Unknown error'));
      showToast('Failed to add admin', 'error');
      console.error(err);
    }
  };

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    
    // Initialize form data based on dialog type
    if (type === 'editUser' || type === 'addUser') {
      setFormData({
        email: item?.email || '',
        name: item?.name || '',
        role: item?.role || 'user'
      });
    } else if (type === 'editUniversity') {
      // Check both direct properties and basic_info for location/sector
      setFormData({
        name: item?.name || '',
        location: item?.basic_info?.Location || item?.location || '',
        sector: item?.basic_info?.Sector || item?.sector || 'Public',
        ranking: item?.ranking || '',
        website: item?.website || item?.url || ''
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
    setSelectedItem(null);
    setFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    try {
      if (dialogType === 'editUser' && selectedItem) {
        await adminService.updateUser(selectedItem.id, formData);
        showToast('User updated successfully', 'success');
      } else if (dialogType === 'editUniversity' && selectedItem) {
        const universityRef = doc(db, 'universities', selectedItem.id);
        await updateDoc(universityRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        showToast('University updated successfully', 'success');
      }
      
      // Refresh data
      fetchDashboardData();
      handleCloseDialog();
    } catch (err) {
      console.error('Error submitting form:', err);
      showToast('Error: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleDeleteItem = async (type, id) => {
    try {
      if (type === 'university') {
        await deleteDoc(doc(db, 'universities', id));
        showToast('University deleted successfully', 'success');
      } else if (type === 'user') {
        // Handle user deletion (with caution)
        await adminService.deleteUser(id);
        showToast('User deleted successfully', 'success');
      }
      
      // Refresh data
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast('Error: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      await adminService.updateApplication(applicationId, status);
      showToast(`Application marked as ${status}`, 'success');
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating application status:', err);
      showToast('Error updating application status', 'error');
    }
  };

  // Handle promoting user to admin
  const handlePromoteToAdmin = async (userId) => {
    try {
      setLoading(true);
      await adminService.setUserAsAdmin(userId, true);
      showToast('User has been promoted to admin', 'success');
      // Refresh the user list
      fetchDashboardData();
    } catch (err) {
      console.error('Error promoting user to admin:', err);
      showToast('Error promoting user to admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle demoting admin to regular user
  const handleDemoteFromAdmin = async (userId) => {
    try {
      setLoading(true);
      await adminService.setUserAsAdmin(userId, false);
      showToast('User has been demoted from admin role', 'success');
      // Refresh the user list
      fetchDashboardData();
    } catch (err) {
      console.error('Error demoting user from admin:', err);
      showToast('Error demoting user from admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle QAU scraping specifically
  const handleQauScrape = async () => {
    try {
      setLoading(true);
      showToast('Starting QAU scraper...', 'info');
      
      // Use a direct fetch to the public endpoint without auth
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/scrape/qau-direct`, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuccess('QAU scrape request submitted successfully');
          showToast('QAU data will be updated. This process runs in the background.', 'success');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          console.error(`Server responded with status: ${response.status}`);
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (apiError) {
        console.error('Error with QAU API call:', apiError);
        
        // Try using the direct batch file as fallback
        try {
          window.open('file:///C:/Users/Usman/Desktop/Project/NEwith%20modules/NE/backend_project/run_qau_scraper.bat');
          setSuccess('Fallback: QAU Scraper opened in a new window. Check your taskbar.');
          showToast('QAU Scraper opened with fallback method. Check your taskbar.', 'success');
        } catch (fallbackErr) {
          setError(`Failed to run QAU scraper: ${apiError.message}. Fallback also failed: ${fallbackErr.message}`);
          showToast('Error: Could not run the QAU scraper by any method. Try manual execution.', 'error');
        }
      }
    } catch (err) {
      console.error('Error in QAU scrape request:', err);
      setError(`Failed to run QAU scraper: ${err.message || 'Unknown error'}`);
      showToast('Error: Failed to run QAU scraper', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderDialogContent = () => {
    switch (dialogType) {
      case 'editUser':
      case 'addUser':
        return (
          <>
            <DialogTitle>{dialogType === 'editUser' ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={formData.email || ''}
                onChange={handleFormChange}
                variant="outlined"
              />
              <TextField
                margin="dense"
                name="name"
                label="Name"
                fullWidth
                value={formData.name || ''}
                onChange={handleFormChange}
                variant="outlined"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role || 'user'}
                  onChange={handleFormChange}
                  label="Role"
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
          </>
        );
        
      case 'editUniversity':
        return (
          <>
            <DialogTitle>Edit University</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="University Name"
                fullWidth
                value={formData.name || ''}
                onChange={handleFormChange}
                variant="outlined"
              />
              <TextField
                margin="dense"
                name="location"
                label="Location"
                fullWidth
                value={formData.location || ''}
                onChange={handleFormChange}
                variant="outlined"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel id="sector-label">Sector</InputLabel>
                <Select
                  labelId="sector-label"
                  name="sector"
                  value={formData.sector || 'Public'}
                  onChange={handleFormChange}
                  label="Sector"
                >
                  <MenuItem value="Public">Public</MenuItem>
                  <MenuItem value="Private">Private</MenuItem>
                  <MenuItem value="Semi-Government">Semi-Government</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                name="ranking"
                label="Ranking"
                type="number"
                fullWidth
                value={formData.ranking || ''}
                onChange={handleFormChange}
                variant="outlined"
              />
              <TextField
                margin="dense"
                name="website"
                label="Website URL"
                fullWidth
                value={formData.website || ''}
                onChange={handleFormChange}
                variant="outlined"
              />
            </DialogContent>
          </>
        );
        
      default:
        return null;
    }
  };

  const renderDashboardStats = () => {
    // Count admins
    const adminCount = users.filter(user => user.role === 'admin').length;
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">
                {stats.totalUsers || users.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {adminCount} admin{adminCount !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Universities
              </Typography>
              <Typography variant="h4">
                {stats.totalUniversities || universities.length}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Applications
              </Typography>
              <Typography variant="h4">
                {stats.totalApplications || applications.length}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Scrape Jobs
              </Typography>
              <Typography variant="h4">
                {stats.pendingScrapeJobs || 0}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    );
  };

  const renderUniversitiesTab = () => (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" gutterBottom>
          Universities Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleRunScriptDirectly}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            Start Scraping
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleQauScrape}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            Scrape QAU
          </Button>
          <IconButton onClick={fetchDashboardData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {universities.length > 0 ? (
              universities.map((university) => (
                <TableRow key={university.id}>
                  <TableCell>{university.name}</TableCell>
                  <TableCell>{university.basic_info?.Location || university.location || 'N/A'}</TableCell>
                  <TableCell>{university.basic_info?.Sector || university.sector || 'N/A'}</TableCell>
                  <TableCell>
                    {university.scraped_at?.toDate?.() 
                      ? university.scraped_at.toDate().toLocaleDateString() 
                      : (university.updatedAt?.toDate?.() 
                        ? university.updatedAt.toDate().toLocaleDateString() 
                        : (university.updatedAt 
                          ? new Date(university.updatedAt).toLocaleDateString() 
                          : 'N/A'))}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog('editUniversity', university)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => handleDeleteItem('university', university.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No universities found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );

  const renderUsersTab = () => (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" gutterBottom>
          User Management
        </Typography>
        <IconButton onClick={fetchDashboardData} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.displayName || user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role === 'admin' ? 'Admin' : 'User'} 
                      color={user.role === 'admin' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => handleDemoteFromAdmin(user.id)}
                        sx={{ mr: 1 }}
                      >
                        Demote from Admin
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handlePromoteToAdmin(user.id)}
                        sx={{ mr: 1 }}
                      >
                        Make Admin
                      </Button>
                    )}
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog('editUser', user)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => handleDeleteItem('user', user.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );

  const renderApplicationsTab = () => (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" gutterBottom>
          Application Management
        </Typography>
        <IconButton onClick={fetchDashboardData} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>University</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.length > 0 ? (
              applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.userName || application.userId}</TableCell>
                  <TableCell>{application.universityName}</TableCell>
                  <TableCell>{application.programName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={application.status} 
                      color={
                        application.status === 'accepted' ? 'success' :
                        application.status === 'rejected' ? 'error' :
                        application.status === 'under-review' ? 'primary' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {application.submittedAt
                      ? new Date(application.submittedAt).toLocaleDateString()
                      : 'Not submitted'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleUpdateApplicationStatus(application.id, 'accepted')}
                      sx={{ mr: 1 }}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No applications found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );

  const renderSettingsTab = () => (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" gutterBottom>
          Admin Settings
        </Typography>
      </Box>
      <List>
        <ListItem>
          <ListItemText 
            primary="Add Current User as Admin" 
            secondary="Add yourself as an admin user in the system"
          />
          <ListItemSecondaryAction>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAddAdmin}
            >
              Add as Admin
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText 
            primary="Enable Automatic Scraping" 
            secondary="Automatically scrape university data on a schedule"
          />
          <ListItemSecondaryAction>
            <Switch />
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText 
            primary="University Data Retention" 
            secondary="How long to keep historical university data"
          />
          <ListItemSecondaryAction>
            <Select defaultValue={30}>
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
              <MenuItem value={365}>1 year</MenuItem>
            </Select>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </StyledPaper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <StyledContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Dashboard Stats */}
      {renderDashboardStats()}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SchoolIcon />} label="Universities" />
          <Tab icon={<PersonIcon />} label="Users" />
          <Tab icon={<AssessmentIcon />} label="Applications" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && renderUniversitiesTab()}
      {activeTab === 1 && renderUsersTab()}
      {activeTab === 2 && renderApplicationsTab()}
      {activeTab === 3 && renderSettingsTab()}

      {/* Dialogs */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {renderDialogContent()}
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained" color="primary">
            {dialogType.startsWith('edit') ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
};

export default AdminDashboard; 