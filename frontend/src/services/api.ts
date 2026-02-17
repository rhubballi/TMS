import axios from 'axios'

export const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({ baseURL: 'http://localhost:4000/api' })

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export async function register(userData: any) {
  const res = await api.post('/auth/register', userData)
  return res.data
}

export async function verifyOTP(data: { email: string; otp: string }) {
  const res = await api.post('/auth/verify-otp', data);
  return res.data;
}

export async function getUsers() {
  const res = await api.get('/auth/users');
  return res.data;
}

export const uploadDocument = async (file: File, assignedUsers?: string[] | string, dueDate?: string, departments?: string[]) => {
  const formData = new FormData();
  formData.append('document', file);
  if (dueDate) {
    formData.append('dueDate', dueDate);
  }

  if (assignedUsers) {
    if (Array.isArray(assignedUsers)) {
      formData.append('assignedUsers', JSON.stringify(assignedUsers));
    } else {
      formData.append('assignedUsers', assignedUsers);
    }
  }

  if (departments && departments.length > 0) {
    formData.append('departments', JSON.stringify(departments));
  }

  const response = await api.post('/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export async function generateQuestions(documentId: string) {
  const res = await api.post('/generate-questions', { documentId })
  return res.data
}

export async function submitAnswers(payload: any) {
  const res = await api.post('/submit-answers', payload)
  return res.data
}

export async function getSession(sessionId: string) {
  const res = await api.get(`/session/${sessionId}`)
  return res.data
}

export async function getMyTrainingRecords() {
  const res = await api.get('/training-records/my');
  return res.data;
}

export async function startTraining(recordId: string) {
  const res = await api.put(`/training-records/${recordId}/start`);
  return res.data;
}

export async function viewDocument(recordId: string) {
  const res = await api.put(`/training-records/${recordId}/view-document`);
  return res.data;
}

export async function completeTraining(recordId: string, score: number, passed: boolean) {
  const res = await api.put(`/training-records/${recordId}/complete`, { score, passed });
  return res.data;
}

export async function confirmAcknowledge(recordId: string) {
  const res = await api.put(`/training-records/${recordId}/acknowledge`);
  return res.data;
}

export async function getTrainingHistory() {
  const res = await api.get('/training-records/history');
  return res.data;
}

export async function getAllTrainingRecords() {
  const res = await api.get('/training-records');
  return res.data;
}

export async function getTrainings() {
  const res = await api.get('/trainings');
  return res.data;
}

export async function createTraining(data: any) {
  const res = await api.post('/trainings', data);
  return res.data;
}

export async function updateTraining(id: string, data: any) {
  const res = await api.put(`/trainings/${id}`, data);
  return res.data;
}

export async function deleteTraining(id: string) {
  const res = await api.delete(`/trainings/${id}`);
  return res.data;
}

export async function assignTraining(data: any) {
  const res = await api.post('/training-records', data);
  return res.data
}

export async function getMyNotifications() {
  const res = await api.get('/notifications');
  return res.data;
}

export async function markNotificationAsRead(notificationId: string) {
  const res = await api.put(`/notifications/${notificationId}/read`);
  return res.data;
}

export async function markAllNotificationsAsRead() {
  const res = await api.put('/notifications/read-all');
  return res.data;
}

export async function getMyLearningProgress() {
  const res = await api.get('/learning-progress/my');
  return res.data;
}

export async function getLearningProgress(trainingRecordId: string) {
  const res = await api.get(`/learning-progress/${trainingRecordId}`);
  return res.data;
}

export async function getResumePoint(trainingRecordId: string) {
  const res = await api.get(`/learning-progress/${trainingRecordId}/resume`);
  return res.data;
}

export async function updateReadingProgress(trainingRecordId: string, contentId: string, progressData: any) {
  const res = await api.put(`/learning-progress/${trainingRecordId}/content/${contentId}`, progressData);
  return res.data;
}

export async function getComplianceDetails(trainingId: string, department: string) {
  const res = await api.get(`/training-records/compliance/${trainingId}/${encodeURIComponent(department)}`);
  return res.data;
}

// Training Master
export async function getTrainingMasters() {
  const res = await api.get('/training-master');
  return res.data;
}

export async function createTrainingMaster(data: any) {
  const res = await api.post('/training-master', data);
  return res.data;
}

export async function updateTrainingMaster(id: string, data: any) {
  const res = await api.put(`/training-master/${id}`, data);
  return res.data;
}

export async function toggleTrainingMasterStatus(id: string) {
  const res = await api.patch(`/training-master/${id}/status`);
  return res.data;
}

export async function assignTrainingMaster(id: string, data: any) {
  const res = await api.post(`/training-master/${id}/assign`, data);
  return res.data;
}

export async function getTrainingContent(trainingMasterId: string) {
  const res = await api.get(`/training-content/${trainingMasterId}`);
  return res.data;
}

export async function attachTrainingContent(data: FormData) {
  const res = await api.post('/training-content/attach', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

// Assessment APIs
export async function getAssessment(trainingId: string) {
  const res = await api.get(`/assessments/training/${trainingId}`);
  return res.data;
}

export async function createAssessment(data: any) {
  const res = await api.post('/assessments', data);
  return res.data;
}

export async function updateAssessment(id: string, data: any) {
  const res = await api.put(`/assessments/${id}`, data);
  return res.data;
}

export async function getAuditLogs(params: {
  page?: number;
  user_id?: string;
  training_id?: string;
  event_type?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  const { page = 1, ...filters } = params;
  const queryParams: any = { pageNumber: page.toString() };
  Object.entries(filters).forEach(([key, value]) => {
    if (value) queryParams[key] = value;
  });
  const query = new URLSearchParams(queryParams).toString();
  const res = await api.get(`/audit-logs?${query}`);
  return res.data;
}


export default api;
