// API Configuration
// Centralized configuration for API endpoints and keys

const API_CONFIG = {
    // Base URL for the backend API
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',

    // API Key for protected endpoints
    API_KEY: process.env.REACT_APP_API_KEY || 'demo-api-key-123',

    // API endpoints
    ENDPOINTS: {
        // Authentication
        LOGIN: '/api/auth/user/login',
        SIGNUP: '/api/auth/user/signup',
        USER: '/api/auth/user',

        // Core API
        HEALTH: '/api/health',
        CLIENTS: '/api/clients',
        UPLOAD: '/api/upload',
        PREDICT: '/api/predict',
        APPROVE: '/api/approve',
        TRAIN: '/api/train',
        TRAIN_STATUS: '/api/train_status',
        CLIENT_HISTORY: '/api/client',
        CLIENT_LAST_MONTH: '/api/client',
        DESCRIPTION_HISTORY: '/api/history',
        CLIENTS_SUMMARY: '/api/clients/summary',
    }
};

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get API headers
export const getApiHeaders = (includeApiKey = false) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (includeApiKey) {
        headers['X-API-Key'] = API_CONFIG.API_KEY;
    }

    return headers;
};

// Helper function to get API headers for file upload
export const getUploadHeaders = () => {
    return {
        'X-API-Key': API_CONFIG.API_KEY,
        // Don't set Content-Type for FormData - let browser set it with boundary
    };
};

export default API_CONFIG;
