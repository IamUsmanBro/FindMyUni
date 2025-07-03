import { api } from './api.service';

class ApplicationService {
  async getUserApplications() {
    try {
      const response = await api.get('/applications/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }

  async createApplication(applicationData) {
    try {
      const response = await api.post('/applications', applicationData);
      return response.data;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  async updateApplication(applicationId, updateData) {
    try {
      const response = await api.put(`/applications/${applicationId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  }

  async deleteApplication(applicationId) {
    try {
      const response = await api.delete(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  }
}

export const applicationService = new ApplicationService(); 