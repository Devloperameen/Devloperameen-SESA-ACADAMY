import axios from 'axios';

// API Configuration
// Ensure the base URL always has the /api prefix for consistency
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = getApiBaseUrl();
console.log(`[API] Base URL configured as: ${API_BASE_URL}`);

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
      api.post('/auth/login', { email, password }),
    register: (data: any) => 
      api.post('/auth/register', data),
    logout: () => 
      api.post('/auth/logout'),
  },

  // Course endpoints
  courses: {
    getAll: (params?: any) => 
      api.get('/courses', { params }),
    getById: (id: string) => 
      api.get(`/courses/${id}`),
    create: (data: any) => 
      api.post('/courses', data),
    update: (id: string, data: any) => 
      api.put(`/courses/${id}`, data),
    delete: (id: string) => 
      api.delete(`/courses/${id}`),
    
    // Course management endpoints
    getFreePreview: (courseId: string) =>
      api.get(`/course-management/courses/${courseId}/free-preview`),
    getLesson: (courseId: string, lessonIndex: number) =>
      api.get(`/course-management/courses/${courseId}/lesson/${lessonIndex}`),
    getFullContent: (courseId: string) =>
      api.get(`/course-management/courses/${courseId}/full-content`),
  },

  // Enrollment endpoints
  enrollments: {
    requestAccess: (courseId: string, data: any) =>
      api.post(`/enrollments/request/${courseId}`, data),
    getMyEnrollments: () =>
      api.get('/courses/my/enrolled'),
  },

  // Teacher endpoints
  teacher: {
    getPendingCourses: () =>
      api.get('/course-management/teacher/courses/my-pending'),
    getPublishedCourses: () =>
      api.get('/course-management/teacher/courses/my-published'),
    getStats: () =>
      api.get('/course-management/teacher/courses/my-stats'),
  },

  // Admin endpoints
  admin: {
    // Course review
    getPendingReviewCourses: () =>
      api.get('/course-management/admin/courses/pending-review'),
    previewCourse: (courseId: string) =>
      api.get(`/course-management/admin/courses/${courseId}/preview`),
    reviewCourse: (courseId: string, decision: 'accept' | 'reject', adminComment?: string) =>
      api.put(`/course-management/admin/courses/${courseId}/review`, { decision, adminComment }),
    
    // Enrollment verification
    getEnrollmentsForVerification: () =>
      api.get('/course-management/admin/enrollments/verification'),
    verifyEnrollment: (enrollmentId: string, adminComment?: string) =>
      api.put(`/course-management/admin/enrollments/${enrollmentId}/verify`, { adminComment }),
    
    // Course management
    toggleCourseLock: (courseId: string, locked: boolean) =>
      api.patch(`/course-management/courses/${courseId}/toggle-lock`, { locked }),
    toggleCourseVisibility: (courseId: string, visible: boolean) =>
      api.patch(`/course-management/courses/${courseId}/toggle-visibility`, { visible }),
  },

  // Announcement endpoints
  announcements: {
    getAll: () => 
      api.get('/announcements'),
    create: (data: any) => 
      api.post('/announcements', data),
    toggle: (id: string, isActive: boolean) =>
      api.put(`/announcements/${id}/toggle`, { isActive }),
  },

  // User endpoints
  users: {
    getProfile: () =>
      api.get('/users/profile'),
    updateProfile: (data: any) =>
      api.put('/users/profile', data),
    getDashboardData: () =>
      api.get('/users/dashboard-data'),
  },

  // Category endpoints
  categories: {
    getAll: () =>
      api.get('/categories'),
    getById: (id: string) =>
      api.get(`/categories/${id}`),
    create: (data: any) =>
      api.post('/categories', data),
    update: (id: string, data: any) =>
      api.put(`/categories/${id}`, data),
    delete: (id: string) =>
      api.delete(`/categories/${id}`),
  },

  // Payment endpoints
  payments: {
    create: (data: any) =>
      api.post('/payments', data),
    getHistory: () =>
      api.get('/payments/history'),
  },

  // Utility function to check API health
  healthCheck: () => api.get('/health'),
};

export default apiService;