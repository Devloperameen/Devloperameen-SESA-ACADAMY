import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear local storage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
          break;
        case 403:
          // Forbidden - show access denied message
          console.error('Access denied:', error.response.data.message);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', error.response.data.message);
          break;
        case 500:
          // Server error
          console.error('Server error:', error.response.data.message);
          break;
        default:
          console.error('API error:', error.response.data.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other errors
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) => 
      api.post('/api/auth/login', { email, password }),
    register: (data: any) => 
      api.post('/api/auth/register', data),
    logout: () => 
      api.post('/api/auth/logout'),
  },

  // Course endpoints
  courses: {
    getAll: (params?: any) => 
      api.get('/api/courses', { params }),
    getById: (id: string) => 
      api.get(`/api/courses/${id}`),
    create: (data: any) => 
      api.post('/api/courses', data),
    update: (id: string, data: any) => 
      api.put(`/api/courses/${id}`, data),
    delete: (id: string) => 
      api.delete(`/api/courses/${id}`),
    
    // Course management endpoints
    getFreePreview: (courseId: string) =>
      api.get(`/api/course-management/courses/${courseId}/free-preview`),
    getLesson: (courseId: string, lessonIndex: number) =>
      api.get(`/api/course-management/courses/${courseId}/lesson/${lessonIndex}`),
    getFullContent: (courseId: string) =>
      api.get(`/api/course-management/courses/${courseId}/full-content`),
  },

  // Enrollment endpoints
  enrollments: {
    requestAccess: (courseId: string, data: any) =>
      api.post(`/api/enrollments/request/${courseId}`, data),
    getMyEnrollments: () =>
      api.get('/api/courses/my/enrolled'),
  },

  // Teacher endpoints
  teacher: {
    getPendingCourses: () =>
      api.get('/api/course-management/teacher/courses/my-pending'),
    getPublishedCourses: () =>
      api.get('/api/course-management/teacher/courses/my-published'),
    getStats: () =>
      api.get('/api/course-management/teacher/courses/my-stats'),
  },

  // Admin endpoints
  admin: {
    // Course review
    getPendingReviewCourses: () =>
      api.get('/api/course-management/admin/courses/pending-review'),
    previewCourse: (courseId: string) =>
      api.get(`/api/course-management/admin/courses/${courseId}/preview`),
    reviewCourse: (courseId: string, decision: 'accept' | 'reject', adminComment?: string) =>
      api.put(`/api/course-management/admin/courses/${courseId}/review`, { decision, adminComment }),
    
    // Enrollment verification
    getEnrollmentsForVerification: () =>
      api.get('/api/course-management/admin/enrollments/verification'),
    verifyEnrollment: (enrollmentId: string, adminComment?: string) =>
      api.put(`/api/course-management/admin/enrollments/${enrollmentId}/verify`, { adminComment }),
    
    // Course management
    toggleCourseLock: (courseId: string, locked: boolean) =>
      api.patch(`/api/course-management/courses/${courseId}/toggle-lock`, { locked }),
    toggleCourseVisibility: (courseId: string, visible: boolean) =>
      api.patch(`/api/course-management/courses/${courseId}/toggle-visibility`, { visible }),
  },

  // User endpoints
  users: {
    getProfile: () =>
      api.get('/api/users/profile'),
    updateProfile: (data: any) =>
      api.put('/api/users/profile', data),
  },

  // Payment endpoints
  payments: {
    create: (data: any) =>
      api.post('/api/payments', data),
    getHistory: () =>
      api.get('/api/payments/history'),
  },

  // Utility function to check API health
  healthCheck: () => api.get('/'),
};

export default apiService;