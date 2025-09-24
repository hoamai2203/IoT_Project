// Configuration - IoT Smart Home Application

const Config = {
  // API Configuration
  api: {
    baseUrl: window.location.origin + '/api',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // WebSocket Configuration
  websocket: {
    url: `ws://${window.location.host.replace(/:.*/, '')}:${window.location.port || 3000}`,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
  },

  // UI Configuration
  ui: {
    // Colors
    colors: {
      primary: '#2196F3',
      secondary: '#FFC107',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
      background: '#F5F5F5',
      text: '#333333',
      border: '#E0E0E0'
    },

    // Typography
    typography: {
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },

    // Spacing
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },

    // Border Radius
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },

    // Shadows
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },

    // Transitions
    transitions: {
      fast: '150ms ease-in-out',
      normal: '250ms ease-in-out',
      slow: '350ms ease-in-out'
    },

    // Breakpoints
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }
  },

  // Chart Configuration
  chart: {
    defaultOptions: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Thời gian'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Giá trị'
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    },
    colors: {
      temperature: '#F44336',
      humidity: '#2196F3',
      light: '#FF9800',
      primary: '#2196F3',
      secondary: '#FFC107',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3'
    }
  },

  // Table Configuration
  table: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    defaultSortField: 'created_at',
    defaultSortOrder: 'DESC',
    sortableFields: {
      'sensor-data': ['id', 'temperature', 'humidity', 'light_intensity', 'sensor_type', 'created_at'],
      'activity-history': ['id', 'device_id', 'action', 'status', 'created_at']
    }
  },

  // Sensor Configuration
  sensors: {
    dht11: {
      name: 'DHT11',
      description: 'Temperature & Humidity Sensor',
      unit: {
        temperature: '°C',
        humidity: '%'
      },
      min: {
        temperature: -40,
        humidity: 0
      },
      max: {
        temperature: 80,
        humidity: 100
      },
      color: {
        temperature: '#F44336',
        humidity: '#2196F3'
      }
    },
    bh1750: {
      name: 'BH1750',
      description: 'Light Intensity Sensor',
      unit: 'lux',
      min: 0,
      max: 65535,
      color: '#FF9800'
    }
  },

  // Device Configuration
  devices: {
    led1: {
      name: 'Đèn 1',
      description: 'LED Light 1',
      type: 'light',
      location: 'Phòng khách',
      icon: '💡'
    },
    led2: {
      name: 'Đèn 2',
      description: 'LED Light 2',
      type: 'light',
      location: 'Phòng ngủ',
      icon: '💡'
    },
    led3: {
      name: 'Đèn 3',
      description: 'LED Light 3',
      type: 'light',
      location: 'Nhà bếp',
      icon: '💡'
    }
  },

  // Validation Configuration
  validation: {
    sensorData: {
      temperature: {
        min: -40,
        max: 80,
        required: true
      },
      humidity: {
        min: 0,
        max: 100,
        required: true
      },
      lightIntensity: {
        min: 0,
        max: 65535,
        required: true
      }
    },
    deviceControl: {
      deviceId: {
        required: true,
        values: ['led1', 'led2', 'led3']
      },
      action: {
        required: true,
        values: ['on', 'off', 'toggle']
      }
    }
  },

  // Localization
  localization: {
    language: 'vi',
    messages: {
      vi: {
        // Common
        loading: 'Đang tải...',
        error: 'Lỗi',
        success: 'Thành công',
        warning: 'Cảnh báo',
        info: 'Thông tin',
        confirm: 'Xác nhận',
        cancel: 'Hủy',
        save: 'Lưu',
        delete: 'Xóa',
        edit: 'Sửa',
        add: 'Thêm',
        search: 'Tìm kiếm',
        filter: 'Lọc',
        reset: 'Đặt lại',
        refresh: 'Làm mới',
        close: 'Đóng',
        back: 'Quay lại',
        next: 'Tiếp theo',
        previous: 'Trước đó',
        
        // Navigation
        dashboard: 'Dashboard',
        sensorData: 'Dữ liệu cảm biến',
        activityHistory: 'Lịch sử hoạt động',
        profile: 'Hồ sơ',
        
        // Status
        connected: 'Đã kết nối',
        disconnected: 'Mất kết nối',
        connecting: 'Đang kết nối...',
        online: 'Trực tuyến',
        offline: 'Ngoại tuyến',
        
        // Sensors
        temperature: 'Nhiệt độ',
        humidity: 'Độ ẩm',
        lightIntensity: 'Ánh sáng',
        sensorType: 'Loại cảm biến',
        sensorValue: 'Giá trị cảm biến',
        sensorTime: 'Thời gian',
        
        // Devices
        device: 'Thiết bị',
        deviceStatus: 'Trạng thái thiết bị',
        deviceControl: 'Điều khiển thiết bị',
        turnOn: 'Bật',
        turnOff: 'Tắt',
        toggle: 'Chuyển đổi',
        on: 'Bật',
        off: 'Tắt',
        
        // Table
        id: 'ID',
        time: 'Thời gian',
        date: 'Ngày',
        action: 'Hoạt động',
        status: 'Trạng thái',
        noData: 'Không có dữ liệu',
        totalRecords: 'Tổng số bản ghi',
        page: 'Trang',
        of: 'của',
        recordsPerPage: 'Bản ghi mỗi trang',
        
        // Errors
        networkError: 'Lỗi kết nối mạng',
        serverError: 'Lỗi máy chủ',
        validationError: 'Lỗi xác thực',
        notFound: 'Không tìm thấy',
        unauthorized: 'Không có quyền truy cập',
        forbidden: 'Bị cấm',
        timeout: 'Hết thời gian chờ',
        
        // Success messages
        dataLoaded: 'Dữ liệu đã được tải',
        dataSaved: 'Dữ liệu đã được lưu',
        dataDeleted: 'Dữ liệu đã được xóa',
        deviceControlled: 'Thiết bị đã được điều khiển',
        connectionEstablished: 'Kết nối đã được thiết lập'
      }
    }
  },

  // Feature Flags
  features: {
    realtimeUpdates: true,
    chartAnimations: true,
    soundNotifications: false,
    pushNotifications: false,
    darkMode: false,
    autoRefresh: true,
    autoRefreshInterval: 30000, // 30 seconds
    dataExport: true,
    dataImport: false
  },

  // Performance Configuration
  performance: {
    debounceDelay: 300,
    throttleDelay: 1000,
    maxRetries: 3,
    retryDelay: 1000,
    cacheTimeout: 300000, // 5 minutes
    maxCacheSize: 100
  },

  // Debug Configuration
  debug: {
    enabled: false,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    logToConsole: true,
    logToServer: false,
    showPerformanceMetrics: false
  }
};

// Export for global access
window.Config = Config;
