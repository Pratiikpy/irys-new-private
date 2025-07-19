import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
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

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.put('/auth/preferences', preferences);
    return response.data;
  },
};

export const confessionAPI = {
  create: async (confession) => {
    const response = await api.post('/confessions', confession);
    return response.data;
  },

  getPublic: async (params = {}) => {
    const { limit = 50, offset = 0, sort_by = 'timestamp', order = 'desc' } = params;
    const response = await api.get('/confessions/public', {
      params: { limit, offset, sort_by, order }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/confessions/${id}`);
    return response.data;
  },

  vote: async (id, voteData) => {
    const response = await api.post(`/confessions/${id}/vote`, voteData);
    return response.data;
  },

  search: async (searchParams) => {
    const response = await api.post('/search', searchParams);
    return response.data;
  },

  getTrending: async (params = {}) => {
    const { limit = 20, timeframe = '24h' } = params;
    const response = await api.get('/trending', {
      params: { limit, timeframe }
    });
    return response.data;
  },
};

export const replyAPI = {
  create: async (confessionId, reply) => {
    const response = await api.post(`/confessions/${confessionId}/replies`, reply);
    return response.data;
  },

  getByConfession: async (confessionId, params = {}) => {
    const { limit = 50, offset = 0 } = params;
    const response = await api.get(`/confessions/${confessionId}/replies`, {
      params: { limit, offset }
    });
    return response.data;
  },

  vote: async (replyId, voteData) => {
    const response = await api.post(`/replies/${replyId}/vote`, voteData);
    return response.data;
  },
};

export const analyticsAPI = {
  getStats: async () => {
    const response = await api.get('/analytics/stats');
    return response.data;
  },

  getTrendingTags: async (limit = 20) => {
    const response = await api.get('/tags/trending', {
      params: { limit }
    });
    return response.data;
  },
};

export const irysAPI = {
  getNetworkInfo: async () => {
    const response = await api.get('/irys/network-info');
    return response.data;
  },

  getBalance: async () => {
    const response = await api.get('/irys/balance');
    return response.data;
  },

  getAddress: async () => {
    const response = await api.get('/irys/address');
    return response.data;
  },

  verify: async (txId) => {
    const response = await api.get(`/verify/${txId}`);
    return response.data;
  },
};

export default api;