// API Client - IoT Smart Home Application

class APIClient {
  constructor() {
    this.baseUrl = Config.api.baseUrl;
    this.timeout = Config.api.timeout;
    this.retryAttempts = Config.api.retryAttempts;
    this.retryDelay = Config.api.retryDelay;
    this.cache = new Map();
    this.cacheTimeout = Config.performance.cacheTimeout;
  }

  // Make HTTP request
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = this.getCacheKey(method, url, data);
    
    // Check cache for GET requests
    if (method === 'GET' && !options.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await this.fetchWithRetry(url, requestOptions);
      const result = await response.json();

      // Cache successful GET requests
      if (method === 'GET' && response.ok && !options.skipCache) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error(`API ${method} ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Fetch with retry logic
  async fetchWithRetry(url, options, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        console.warn(`API request failed, retrying (${attempt}/${this.retryAttempts}):`, error.message);
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  // Check if error should trigger retry
  shouldRetry(error) {
    return error.name === 'AbortError' || 
           error.message.includes('NetworkError') ||
           error.message.includes('Failed to fetch');
  }

  // Delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get cache key
  getCacheKey(method, url, data) {
    return `${method}:${url}:${data ? JSON.stringify(data) : ''}`;
  }

  // Get from cache
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // Set cache
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (this.cache.size > Config.performance.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  // Sensor Data API
  sensors = {
    // Get sensor data with pagination and filters
    getData: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/sensors${queryString ? `?${queryString}` : ''}`);
    },

    // Get latest sensor data
    getLatest: (sensorType = null) => {
      const params = sensorType ? { sensorType } : {};
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/sensors/latest${queryString ? `?${queryString}` : ''}`);
    },

    // Get sensor data for chart
    getChartData: (limit = 10, sensorType = null) => {
      const params = { limit, ...(sensorType && { sensorType }) };
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/sensors/chart?${queryString}`);
    },

    // Get sensor data statistics
    getStatistics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/sensors/statistics${queryString ? `?${queryString}` : ''}`);
    },

    // Search sensor data
    search: (searchValue, searchField, params = {}) => {
      const searchParams = { searchValue, searchField, ...params };
      const queryString = new URLSearchParams(searchParams).toString();
      return this.get(`/sensors/search?${queryString}`);
    },

    // Get sensor data count
    getCount: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/sensors/count${queryString ? `?${queryString}` : ''}`);
    },

    // Get dashboard summary
    getDashboardSummary: () => {
      return this.get('/sensors/dashboard');
    },

    // Get sensor data by ID
    getById: (id) => {
      return this.get(`/sensors/${id}`);
    },

    // Create sensor data
    create: (data) => {
      return this.post('/sensors', data);
    },

    // Clean up old data
    cleanup: (daysToKeep = 30) => {
      return this.post('/sensors/cleanup', { daysToKeep });
    }
  };

  // Device Control API
  devices = {
    // Get device control records with pagination and filters
    getData: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/devices${queryString ? `?${queryString}` : ''}`);
    },

    // Get latest device status
    getStatus: () => {
      return this.get('/devices/status');
    },

    // Get device status by ID
    getStatusById: (deviceId) => {
      return this.get(`/devices/status/${deviceId}`);
    },

    // Get device control history
    getHistory: (deviceId, limit = 50) => {
      return this.get(`/devices/${deviceId}/history?limit=${limit}`);
    },

    // Get device control statistics
    getStatistics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/devices/statistics${queryString ? `?${queryString}` : ''}`);
    },

    // Get device usage by hour
    getUsageByHour: (startDate, endDate) => {
      const params = { startDate, endDate };
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/devices/usage/hourly?${queryString}`);
    },

    // Search device control records
    search: (searchValue, searchField, params = {}) => {
      const searchParams = { searchValue, searchField, ...params };
      const queryString = new URLSearchParams(searchParams).toString();
      return this.get(`/devices/search?${queryString}`);
    },

    // Get device control count
    getCount: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return this.get(`/devices/count${queryString ? `?${queryString}` : ''}`);
    },

    // Get device status summary
    getSummary: () => {
      return this.get('/devices/summary');
    },

    // Get device control record by ID
    getById: (id) => {
      return this.get(`/devices/${id}`);
    },

    // Control device
    control: (deviceId, action) => {
      return this.post('/devices/control', { deviceId, action });
    },

    // Create device control record
    create: (data) => {
      return this.post('/devices', data);
    },

    // Clean up old data
    cleanup: (daysToKeep = 30) => {
      return this.post('/devices/cleanup', { daysToKeep });
    }
  };

  // Profile API
  profile = {
    // Get profile information
    get: () => {
      return this.get('/profile');
    },

    // Update profile information
    update: (data) => {
      return this.put('/profile', data);
    },

    // Get application configuration
    getConfig: () => {
      return this.get('/profile/config');
    },

    // Get system information
    getSystemInfo: () => {
      return this.get('/profile/system');
    },

    // Get health status
    getHealth: () => {
      return this.get('/profile/health');
    },

    // Get sensor configuration
    getSensorConfig: () => {
      return this.get('/profile/sensors');
    },

    // Get device configuration
    getDeviceConfig: () => {
      return this.get('/profile/devices');
    },

    // Get UI configuration
    getUIConfig: () => {
      return this.get('/profile/ui');
    }
  };

  // Utility methods
  utils = {
    // Build query string from object
    buildQueryString: (params) => {
      return new URLSearchParams(params).toString();
    },

    // Parse query string to object
    parseQueryString: (queryString) => {
      return Object.fromEntries(new URLSearchParams(queryString));
    },

    // Format date for API
    formatDate: (date) => {
      if (!date) return null;
      return new Date(date).toISOString();
    },

    // Parse API date
    parseDate: (dateString) => {
      if (!dateString) return null;
      return new Date(dateString);
    },

    // Validate response
    validateResponse: (response) => {
      if (!response.success) {
        throw new Error(response.message || 'API request failed');
      }
      return response;
    },

    // Handle API errors
    handleError: (error) => {
      console.error('API Error:', error);
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
      }
      
      if (error.message.includes('404')) {
        throw new Error('Không tìm thấy dữ liệu.');
      }
      
      if (error.message.includes('500')) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      
      throw error;
    }
  };
}

// Create API client instance
const API = new APIClient();

// Export for global access
window.API = API;
