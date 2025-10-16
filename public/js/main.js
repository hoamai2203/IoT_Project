// Main JavaScript - IoT Smart Home Application

// Global application state
const App = {
  // Application state
  state: {
    currentPage: 'dashboard',
    isConnected: false,
    isLoading: false,
    data: {
      sensors: {},
      devices: {},
      profile: {}
    }
  },

  // Initialize application
  init() {
    console.log('🚀 Initializing IoT Smart Home Application...');
    
    // Initialize components
    this.initNavigation();
    this.initWebSocket();
    this.initPages();
    this.initEventListeners();
    
    // Load initial data
    this.loadInitialData();
    
    console.log('✅ Application initialized successfully');
  },

  // Initialize navigation
  initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigateToPage(page);
      });
    });
  },

  // Navigate to page
  navigateToPage(pageName) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Show/hide pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');

    // Update state
    this.state.currentPage = pageName;

    // Initialize page-specific functionality
    this.initPageFunctionality(pageName);
  },

  // Initialize page-specific functionality
  initPageFunctionality(pageName) {
    switch (pageName) {
      case 'dashboard':
        Dashboard.init();
        break;
      case 'sensor-data':
        SensorData.init();
        break;
      case 'activity-history':
        ActivityHistory.init();
        break;
      case 'profile':
        Profile.init();
        break;
    }
  },

  // Initialize WebSocket connection
  initWebSocket() {
    WebSocketClient.init();
  },

  // Initialize pages
  initPages() {
    // Initialize all page modules
    Dashboard.init();
    SensorData.init();
    ActivityHistory.init();
    Profile.init();
  },

  // Initialize event listeners
  initEventListeners() {
    // Global event listeners
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Connection status updates
    WebSocketClient.on('connection', (data) => {
      this.updateConnectionStatus(data.status);
    });

    // Sensor data updates
    WebSocketClient.on('sensor_data', (data) => {
      this.updateSensorData(data);
    });

    // Device status updates
    WebSocketClient.on('device_response', (data) => {
      this.updateDeviceStatus(data);
    });

    // Error handling
    WebSocketClient.on('error', (error) => {
      this.showError('WebSocket Error', error.message);
    });
  },

  // Load initial data
  async loadInitialData() {
    try {
      this.showLoading();
      
      // Load profile data
      await this.loadProfileData();
      
      // Load sensor data
      await this.loadSensorData();
      
      // Load device status
      await this.loadDeviceStatus();
      
      this.hideLoading();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Loading Error', 'Failed to load initial data');
      this.hideLoading();
    }
  },

  // Load profile data
  async loadProfileData() {
    try {
      const response = await API.get('/profile');
      if (response.success) {
        this.state.data.profile = response.data;
        this.updateProfileDisplay();
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  },

  // Load sensor data
  async loadSensorData() {
    try {
      const response = await API.get('/sensors/latest');
      if (response.success) {
        this.state.data.sensors = response.data;
        this.updateSensorDisplay();
      }
    } catch (error) {
      console.error('Error loading sensor data:', error);
    }
  },

  // Load device status
  async loadDeviceStatus() {
    try {
      const response = await API.get('/devices/status');
      if (response.success) {
        this.state.data.devices = response.data;
        this.updateDeviceDisplay();
      }
    } catch (error) {
      console.error('Error loading device status:', error);
    }
  },

  // Update connection status
  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
      statusElement.textContent = status === 'connected' ? 'Đã kết nối' : 'Mất kết nối';
      statusElement.className = `status-indicator ${status === 'connected' ? 'connected' : 'disconnected'}`;
    }
    this.state.isConnected = status === 'connected';
  },

  // Update sensor data
  updateSensorData(data) {
    this.state.data.sensors = data;
    this.updateSensorDisplay();
  },

  // Update device status
  updateDeviceStatus(data) {
    this.state.data.devices = data;
    this.updateDeviceDisplay();
  },

  // Update sensor display
  updateSensorDisplay() {
    const sensors = this.state.data.sensors;
    
    // Update temperature
    if (sensors.temperature) {
      document.getElementById('temperatureValue').textContent = `${sensors.temperature}°C`;
      document.getElementById('temperatureTime').textContent = this.formatTime(sensors.timestamp);
    }
    
    // Update humidity
    if (sensors.humidity) {
      document.getElementById('humidityValue').textContent = `${sensors.humidity}%`;
      document.getElementById('humidityTime').textContent = this.formatTime(sensors.timestamp);
    }
    
    // Update light
    if (sensors.light_intensity) {
      document.getElementById('lightValue').textContent = `${sensors.light_intensity} lux`;
      document.getElementById('lightTime').textContent = this.formatTime(sensors.timestamp);
    }
  },

  // Update device display
  updateDeviceDisplay() {
    const devices = this.state.data.devices;
    
    Object.keys(devices).forEach(deviceId => {
      const device = devices[deviceId];
      const statusElement = document.getElementById(`${deviceId}Status`);
      const toggleElement = document.getElementById(`${deviceId}Toggle`);
      
      if (statusElement) {
        statusElement.textContent = device.status === 'on' ? 'Bật' : 'Tắt';
        statusElement.className = `device-status ${device.status === 'on' ? 'on' : 'off'}`;
      }
      
      if (toggleElement) {
        const toggleText = toggleElement.querySelector('.toggle-text');
        if (toggleText) {
          toggleText.textContent = device.status === 'on' ? 'Tắt' : 'Bật';
        }
        toggleElement.className = `device-toggle ${device.status === 'on' ? 'on' : 'off'}`;
      }
    });
  },

  // Update profile display
  updateProfileDisplay() {
    const profile = this.state.data.profile;
    
    if (profile.name) {
      document.getElementById('profileName').textContent = profile.name;
    }
    if (profile.email) {
      document.getElementById('profileEmail').textContent = profile.email;
    }
    if (profile.phone) {
      document.getElementById('profilePhone').textContent = profile.phone;
    }
    if (profile.address) {
      document.getElementById('profileAddress').textContent = profile.address;
    }
  },

  // Handle window resize
  handleResize() {
    // Update chart if on dashboard
    if (this.state.currentPage === 'dashboard') {
      Dashboard.handleResize();
    }
  },

  // Handle before unload
  handleBeforeUnload(e) {
    if (this.state.isConnected) {
      e.preventDefault();
      e.returnValue = '';
    }
  },

  // Show loading overlay
  showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }
    this.state.isLoading = true;
  },

  // Hide loading overlay
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    this.state.isLoading = false;
  },

  // Show error message
  showError(title, message) {
    console.error(`${title}: ${message}`);
    this.showToast('error', title, message);
  },

  // Show success message
  showSuccess(title, message) {
    console.log(`${title}: ${message}`);
    this.showToast('success', title, message);
  },

  // Show info message
  showInfo(title, message) {
    console.info(`${title}: ${message}`);
    this.showToast('info', title, message);
  },

  // Show toast notification
  showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-header">
        <h4>${title}</h4>
        <button class="toast-close">&times;</button>
      </div>
      <div class="toast-body">
        <p>${message}</p>
      </div>
    `;

    // Add close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);

    container.appendChild(toast);
  },

  // Format time
  formatTime(timestamp) {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Format date
  formatDate(timestamp) {
    if (!timestamp) return '--/--/----';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN');
  },

  // Format datetime
  formatDateTime(timestamp) {
    if (!timestamp) return '--/--/---- --:--';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN');
  },

  // Get current page
  getCurrentPage() {
    return this.state.currentPage;
  },

  // Get connection status
  isConnected() {
    return this.state.isConnected;
  },

  // Get loading status
  isLoading() {
    return this.state.isLoading;
  }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Export for global access
window.App = App;
