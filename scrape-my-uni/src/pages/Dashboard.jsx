import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Badge
} from '@mui/material';
import {
  School as SchoolIcon,
  DateRange as DateRangeIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  Compare as CompareIcon,
  Settings as SettingsIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { useAuth } from '../context/AuthContext';
import { universityService, applicationService, userService } from '../services/api.service';
import ApplicationTracker from '../components/ApplicationTracker';
import UniversityCard from '../components/UniversityCard';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [savedUniversities, setSavedUniversities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user applications
      const userApplications = await applicationService.getUserApplications();
      setApplications(userApplications);

      // Fetch recommended universities based on user profile and past interactions
      const recommendedUniversities = await universityService.getUniversitiesByRanking(5);
      setRecommendations(recommendedUniversities);

      // Fetch universities with upcoming deadlines
      const deadlineUniversities = await universityService.getUniversitiesByDeadlineSoon(30, 5);
      setUpcomingDeadlines(deadlineUniversities);

      // Fetch user's saved/bookmarked universities
      // This would be implemented when we have the saved universities feature
      setSavedUniversities([]); // Placeholder for now

      // Fetch user notifications
      const userNotifications = await userService.getNotifications();
      setNotifications(userNotifications);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUniversityClick = (universityId) => {
    navigate(`/universities/${universityId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {currentUser?.displayName || 'User'}! Here's your application progress.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Dashboard Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              aria-label="dashboard tabs"
            >
              <Tab icon={<SchoolIcon />} iconPosition="start" label="My Applications" />
              <Tab icon={<DateRangeIcon />} iconPosition="start" label="Upcoming Deadlines" />
              <Tab icon={<BookmarkIcon />} iconPosition="start" label="Saved Universities" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* My Applications Tab */}
              {activeTab === 0 && (
                <div>
                  <Typography variant="h6" gutterBottom>
                    Your Applications
                  </Typography>
                  <ApplicationTracker 
                    applications={applications} 
                    onRefresh={fetchDashboardData} 
                  />
                </div>
              )}

              {/* Upcoming Deadlines Tab */}
              {activeTab === 1 && (
                <div>
                  <Typography variant="h6" gutterBottom>
                    Universities with Upcoming Deadlines
                  </Typography>
                  {upcomingDeadlines.length > 0 ? (
                    <Grid container spacing={3}>
                      {upcomingDeadlines.map((university) => (
                        <Grid item xs={12} sm={6} key={university.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" component="div" noWrap>
                                {university.name}
                              </Typography>
                              <Box display="flex" alignItems="center" mt={1}>
                                <DateRangeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  Deadline: <strong>{formatDate(university.deadline)}</strong>
                                </Typography>
                              </Box>
                              {university.programs && university.programs.length > 0 && (
                                <Box mt={1}>
                                  <Typography variant="body2" color="text.secondary">
                                    Programs: {university.programs.slice(0, 2).map(p => p.name).join(', ')}
                                    {university.programs.length > 2 && ' and more...'}
                                  </Typography>
                                </Box>
                              )}
                            </CardContent>
                            <CardActions>
                              <Button 
                                size="small" 
                                onClick={() => handleUniversityClick(university.id)}
                                endIcon={<NavigateNextIcon />}
                              >
                                View Details
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      No upcoming deadlines found.
                    </Typography>
                  )}
                </div>
              )}

              {/* Saved Universities Tab */}
              {activeTab === 2 && (
                <div>
                  <Typography variant="h6" gutterBottom>
                    Saved Universities
                  </Typography>
                  {savedUniversities.length > 0 ? (
                    <Grid container spacing={3}>
                      {savedUniversities.map((university) => (
                        <Grid item xs={12} sm={6} key={university.id}>
                          <UniversityCard 
                            university={university} 
                            onClick={() => handleUniversityClick(university.id)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={3}>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        You haven't saved any universities yet.
                      </Typography>
                      <Button 
                        variant="contained" 
                        onClick={() => navigate('/universities')}
                      >
                        Browse Universities
                      </Button>
                    </Box>
                  )}
                </div>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Notifications Card */}
          <Paper sx={{ mb: 4, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon sx={{ mr: 1 }} />
                </Badge>
                Notifications
              </Typography>
              {notifications.length > 0 && (
                <Button size="small">Mark All Read</Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {notifications.length > 0 ? (
              <Box>
                {notifications.slice(0, 5).map((notification, index) => (
                  <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index !== notifications.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(notification.timestamp)}
                    </Typography>
                  </Box>
                ))}
                {notifications.length > 5 && (
                  <Button 
                    size="small" 
                    fullWidth 
                    onClick={() => navigate('/notifications')}
                  >
                    View All ({notifications.length})
                  </Button>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No new notifications.
              </Typography>
            )}
          </Paper>

          {/* Recommended Universities Card */}
          <Paper sx={{ mb: 4, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <AnalyticsIcon sx={{ mr: 1 }} />
              Recommended For You
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recommendations.length > 0 ? (
              <Box>
                {recommendations.slice(0, 3).map((university, index) => (
                  <Card 
                    key={index} 
                    variant="outlined" 
                    sx={{ mb: 2, cursor: 'pointer' }}
                    onClick={() => handleUniversityClick(university.id)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="body1" fontWeight="bold" noWrap>
                        {university.name}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={0.5}>
                        <SchoolIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {university.programs && university.programs.length > 0 
                            ? university.programs[0].name 
                            : 'Programs available'}
                        </Typography>
                      </Box>
                      {university.ranking && (
                        <Chip 
                          size="small" 
                          label={`Ranking: #${university.ranking}`} 
                          sx={{ mt: 1 }} 
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
                <Button 
                  fullWidth 
                  onClick={() => navigate('/universities')}
                  endIcon={<NavigateNextIcon />}
                >
                  See More Universities
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Complete your profile to get personalized recommendations.
              </Typography>
            )}
          </Paper>

          {/* Quick Links Card */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<CompareIcon />} 
              sx={{ mb: 1 }}
              onClick={() => navigate('/universities')}
            >
              Compare Universities
            </Button>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/profile')}
            >
              Profile Settings
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
