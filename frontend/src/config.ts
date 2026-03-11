// Application Configuration
export const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 10000,
    retryAttempts: 3,
  },

  // Application Settings
  app: {
    name: import.meta.env.VITE_APP_NAME || 'SESA Educational Platform',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Full-stack educational platform with course management',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    supportEmail: 'support@sesa.education',
  },

  // Feature Flags
  features: {
    enableFreePreview: true,
    enableCourseReviews: true,
    enableRealTimeNotifications: true,
    enableAnalytics: true,
    enableMultiLanguage: true,
  },

  // UI Configuration
  ui: {
    theme: {
      primaryColor: '#3B82F6', // Blue-500
      secondaryColor: '#10B981', // Emerald-500
      accentColor: '#8B5CF6', // Violet-500
      dangerColor: '#EF4444', // Red-500
      warningColor: '#F59E0B', // Amber-500
      successColor: '#10B981', // Emerald-500
    },
    layout: {
      navbarHeight: '64px',
      sidebarWidth: '280px',
      maxContentWidth: '1280px',
    },
    animations: {
      enable: true,
      duration: {
        fast: 150,
        normal: 300,
        slow: 500,
      },
    },
  },

  // Authentication Configuration
  auth: {
    tokenKey: 'token',
    userKey: 'user',
    tokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    refreshThreshold: 30 * 60 * 1000, // 30 minutes before expiry
  },

  // Course Configuration
  courses: {
    freePreviewLessonIndex: 0, // Part 1 is free
    maxLessonsPerCourse: 50,
    maxCourseTitleLength: 100,
    maxCourseDescriptionLength: 1000,
    priceRange: {
      min: 0,
      max: 1000,
    },
  },

  // Payment Configuration
  payments: {
    currency: 'USD',
    currencySymbol: '$',
    supportedMethods: ['stripe', 'paypal', 'bank_transfer'],
  },

  // Storage Configuration
  storage: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },

  // Performance Configuration
  performance: {
    debounceDelay: 300,
    throttleDelay: 1000,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    lazyLoadThreshold: 0.8, // 80% viewport
  },

  // Environment Detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',

  // Debug Configuration
  debug: {
    enable: import.meta.env.DEV,
    logLevel: import.meta.env.DEV ? 'debug' : 'error',
    enableReduxDevTools: import.meta.env.DEV,
  },
};

// Helper functions
export const getApiUrl = (endpoint: string) => {
  return `${config.api.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const getAssetUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export const formatCurrency = (amount: number) => {
  return `${config.payments.currencySymbol}${amount.toFixed(2)}`;
};

export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = ['VITE_API_URL'];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missingEnvVars.length > 0 && config.isProduction) {
    console.warn(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }

  return missingEnvVars.length === 0;
};

// Export default configuration
export default config;