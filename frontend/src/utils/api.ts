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
    
    // User management
    getAllUsers: () =>
      api.get('/users'),
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

  // Search endpoints
  search: {
    query: (q: string, filters?: any) => 
      api.get('/search', { params: { q, ...filters } }),
    getSuggestions: (q: string) => 
      api.get('/search/suggestions', { params: { q } }),
  },

  // Assessment & Gradebook endpoints
  assessments: {
    getStudentGradebook: (courseId: string) =>
      api.get(`/assessments/gradebook/${courseId}`),
    updateMark: (data: { studentId: string, courseId: string, assessmentType: string, score: number, feedback?: string }) =>
      api.post('/assessments/mark', data),
    getCourseGradebook: (courseId: string) =>
      api.get(`/assessments/gradebook/all/${courseId}`),
    submit: (data: any) =>
      api.post('/assessments/submit', data),
  },

  // Evaluation endpoints
  evaluations: {
    submit: (data: { courseId: string, instructorId: string, ratings: any, feedback? : string }) =>
      api.post('/evaluations', data),
    getInstructorEvaluations: (instructorId: string) =>
      api.get(`/evaluations/instructor/${instructorId}`),
  },

  // Video workflow & lesson access endpoints
  videoWorkflow: {
    // Lessons visible to a student for a given course
    getAccessibleLessons: (courseId: string) =>
      api.get(`/video-workflow/courses/${courseId}/lessons`),

    // Start a payment to unlock a specific lesson
    processLessonPayment: (
      lessonId: string,
      data: { paymentMethod: 'stripe' | 'paypal' | 'manual'; amount: number },
    ) =>
      api.post(`/video-workflow/lessons/${lessonId}/payment`, data),

    // Teacher: upload a lesson video (multipart/form-data)
    uploadVideo: (formData: FormData) =>
      api.post('/video-workflow/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    // Admin / moderator: list pending videos for review
    getPendingVideos: (params?: { page?: number; limit?: number }) =>
      api.get('/video-workflow/videos/pending', { params }),

    // Admin / moderator: approve or reject a video
    reviewVideo: (
      videoId: string,
      data: { decision: 'approved' | 'rejected'; feedback?: string; notes?: string },
    ) =>
      api.put(`/video-workflow/videos/${videoId}/review`, data),

    // Student: upload a lesson screenshot (multipart/form-data)
    uploadScreenshot: (formData: FormData) =>
      api.post('/video-workflow/screenshots/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    // Admin / moderator: list screenshots awaiting review
    getScreenshotsForReview: (params?: {
      courseId?: string;
      lessonId?: string;
      page?: number;
      limit?: number;
    }) =>
      api.get('/video-workflow/screenshots/review', { params }),

    // Admin / moderator: review a specific screenshot
    reviewScreenshot: (
      screenshotId: string,
      data: { approved: boolean; feedback?: string; flagged?: boolean; flagReason?: string },
    ) =>
      api.put(`/video-workflow/screenshots/${screenshotId}/review`, data),

    // Public: serve uploaded video/screenshot by type and filename
    getUploadUrl: (type: 'videos' | 'screenshots', filename: string) =>
      `${API_BASE_URL.replace(/\/api$/, '')}/api/video-workflow/uploads/${type}/${filename}`,
  },

  // AI / assistant endpoints
  ai: {
    chat: (message: string, context?: string) =>
      api.post('/ai/chat', { message, context }),
    generateLesson: (topic: string, level?: string, language?: string) =>
      api.post('/ai/generate-lesson', { topic, level, language }),
    summarize: (text: string, maxSentences?: number) =>
      api.post('/ai/summarize', { text, maxSentences }),
  },

  // Utility function to check API health
  healthCheck: () => api.get('/health'),
};

export default apiService;