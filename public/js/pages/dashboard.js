// Dashboard Page - IoT Smart Home Application

const Dashboard = {
  // Chart instance
  chart: null,
  
  // Chart data
  chartData: {
    labels: [],
    datasets: []
  },

  // Initialize dashboard
  init() {
    console.log('📊 Initializing Dashboard...');
    
    this.initChart();
    this.initEventListeners();
    this.bindDeviceControls();
    this.loadInitialData();
  },

  // Initialize chart
  initChart() {
    const ctx = document.getElementById('sensorChart');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: this.chartData,
      options: {
        ...Config.chart.defaultOptions,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Thời gian'
            },
            type: 'time',
            time: {
              displayFormats: {
                hour: 'HH:mm',
                day: 'DD/MM'
              }
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
        plugins: {
          ...Config.chart.defaultOptions.plugins,
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(context) {
                return new Date(context[0].parsed.x).toLocaleString('vi-VN');
              },
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                const unit = context.dataset.unit || '';
                return `${label}: ${value}${unit}`;
              }
            }
          }
        }
      }
    });
  },

  // Bind device control buttons (button or checkbox switch)
  bindDeviceControls() {
    const toggles = document.querySelectorAll('.device-toggle, .device-switch');
    toggles.forEach((el) => {
      const handler = (e) => {
        if (el.classList.contains('device-toggle')) e.preventDefault();
        const deviceId = el.dataset.device;
        let action = 'toggle';
        if (el.type === 'checkbox') {
          action = el.checked ? 'on' : 'off';
        } else {
          const statusText = document.getElementById(`${deviceId}Status`)?.textContent || 'Tắt';
          action = statusText.trim() === 'Bật' ? 'off' : 'on';
        }
        this.handleDeviceControl(deviceId, action);
      };
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'click', handler);
    });
  },
  
  initEventListeners() {
    // Chart refresh button
    const refreshBtn = document.getElementById('refreshChart');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadChartData();
      });
    }

    // Chart sensor type filter
    const sensorTypeFilter = document.getElementById('chartSensorType');
    if (sensorTypeFilter) {
      sensorTypeFilter.addEventListener('change', () => {
        this.loadChartData();
      });
    }

    // WebSocket events
    WebSocketClient.on('sensor_data', (data) => this.onRealtimeSensor(data));
    WebSocketClient.on('device_response', (data) => this.onRealtimeDeviceStatus(data));
  },

  // Initial data load
  async loadInitialData() {
    try {
      App.showLoading();
      
      await Promise.all([
        this.fetchLatestSensor(),
        this.fetchLatestDeviceStatus(),
        this.fetchChartData()
      ]);
      
      App.hideLoading();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      App.showError('Dashboard Error', 'Failed to load dashboard data');
      App.hideLoading();
    }
  },

  // Load sensor data
  async fetchLatestSensor() {
    try {
      const response = await API.sensors.getLatest();
      if (response.success) {
        this.onRealtimeSensor(response.data);
      }
    } catch (error) {
      console.error('Error loading sensor data:', error);
    }
  },

  // Load device status
  async fetchLatestDeviceStatus() {
    try {
      const response = await API.devices.getStatus();
      if (response.success) {
        this.onRealtimeDeviceStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading device status:', error);
    }
  },

  // Load chart data
  async fetchChartData() {
    try {
      const response = await API.sensors.getChartData(30);
      
      if (response.success) {
        this.updateChart(response.data);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  },

  // Handle realtime sensor payload (single or array)
  onRealtimeSensor(data) {
    if (Array.isArray(data)) {
      data.forEach((sensor) => this.applySensorUpdate(sensor));
    } else {
      this.applySensorUpdate(data);
    }
  },

  // Apply one sensor update to UI and chart
  applySensorUpdate(sensor) {
    const { temperature, humidity, light_intensity, created_at, timestamp } = sensor;
    const ts = created_at || timestamp || new Date().toISOString();
    
    if (temperature !== undefined) this.updateSensorDisplay('temperature', Number(temperature), ts);
    if (humidity !== undefined) this.updateSensorDisplay('humidity', Number(humidity), ts);
    if (light_intensity !== undefined) this.updateSensorDisplay('light', Number(light_intensity), ts);
    this.appendRealtimePoint({ temperature, humidity, light_intensity, created_at: ts });
  },

  // Update sensor display
  updateSensorDisplay(type, value, timestamp) {
    const valueElement = document.getElementById(`${type}Value`);
    const timeElement = document.getElementById(`${type}Time`);
    
    if (valueElement) {
      let unit = '';
      let formattedValue = value;
      
      switch (type) {
        case 'temperature':
          unit = '°C';
          formattedValue = value.toFixed(1);
          break;
        case 'humidity':
          unit = '%';
          formattedValue = value.toFixed(1);
          break;
        case 'light':
          unit = ' lux';
          formattedValue = Math.round(value);
          break;
      }
      
      valueElement.textContent = `${formattedValue}${unit}`;
    }
    
    if (timeElement) {
      timeElement.textContent = App.formatTime(timestamp);
    }
  },

  // Handle realtime device status (single or array)
  onRealtimeDeviceStatus(data) {
    if (Array.isArray(data)) {
      data.forEach((device) => this.updateDeviceDisplay(device));
    } else {
      this.updateDeviceDisplay(data);
    }
  },

  // Update device display
  updateDeviceDisplay(device) {
    const { device_id, status } = device;
    
    const statusElement = document.getElementById(`${device_id}Status`);
    const toggleElement = document.getElementById(`${device_id}Toggle`);
    
    if (statusElement) {
      statusElement.textContent = status === 'on' ? 'Bật' : 'Tắt';
      statusElement.className = `device-status ${status === 'on' ? 'on' : 'off'}`;
    }
    
    if (toggleElement) {
      const toggleText = toggleElement.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = status === 'on' ? 'Tắt' : 'Bật';
      }
      toggleElement.className = `device-toggle ${status === 'on' ? 'on' : 'off'}`;
    }
  },

  // Handle device control from UI
  async handleDeviceControl(deviceId, action) {
    try {
      WebSocketClient.controlDevice(deviceId, action);
    } catch (error) {
      console.error('Error controlling device:', error);
    }
  },

  // Update chart
  updateChart(data) {
    if (!this.chart || !data || data.length === 0) return;

    // Prepare chart data
    const labels = data.map(item => new Date(item.created_at));
    const temperatureData = data.map(item => item.temperature || null);
    const humidityData = data.map(item => item.humidity || null);
    const lightData = data.map(item => item.light_intensity || null);

    // Update chart data
    this.chart.data.labels = labels;
    this.chart.data.datasets = [
      {
        label: 'Nhiệt độ (°C)',
        data: temperatureData,
        borderColor: Config.chart.colors.temperature,
        backgroundColor: Config.chart.colors.temperature + '20',
        tension: 0.4,
        unit: '°C'
      },
      {
        label: 'Độ ẩm (%)',
        data: humidityData,
        borderColor: Config.chart.colors.humidity,
        backgroundColor: Config.chart.colors.humidity + '20',
        tension: 0.4,
        unit: '%'
      },
      {
        label: 'Ánh sáng (lux)',
        data: lightData,
        borderColor: Config.chart.colors.light,
        backgroundColor: Config.chart.colors.light + '20',
        tension: 0.4,
        unit: ' lux'
      }
    ];

    // Update chart
    this.chart.update('none');
  },

  // Append realtime point to chart from WS data
  appendRealtimePoint(sensor) {
    if (!this.chart || !sensor) return;

    const timestamp = new Date(sensor.created_at || sensor.timestamp || Date.now());
    const temperature = sensor.temperature != null ? Number(sensor.temperature) : null;
    const humidity = sensor.humidity != null ? Number(sensor.humidity) : null;
    const light = sensor.light_intensity != null ? Number(sensor.light_intensity) : null;

    // If chart has no datasets yet (first WS before API), initialize empty datasets
    if (!this.chart.data.datasets || this.chart.data.datasets.length === 0) {
      this.chart.data.datasets = [
        { label: 'Nhiệt độ (°C)', data: [], borderColor: Config.chart.colors.temperature, backgroundColor: Config.chart.colors.temperature + '20', tension: 0.4, unit: '°C' },
        { label: 'Độ ẩm (%)', data: [], borderColor: Config.chart.colors.humidity, backgroundColor: Config.chart.colors.humidity + '20', tension: 0.4, unit: '%' },
        { label: 'Ánh sáng (lux)', data: [], borderColor: Config.chart.colors.light, backgroundColor: Config.chart.colors.light + '20', tension: 0.4, unit: ' lux' }
      ];
    }

    this.chart.data.labels.push(timestamp);
    this.chart.data.datasets[0].data.push(temperature);
    this.chart.data.datasets[1].data.push(humidity);
    this.chart.data.datasets[2].data.push(light);

    // Keep last 30 points
    const maxPoints = 30;
    if (this.chart.data.labels.length > maxPoints) {
      this.chart.data.labels.splice(0, this.chart.data.labels.length - maxPoints);
      this.chart.data.datasets.forEach(ds => {
        ds.data.splice(0, ds.data.length - maxPoints);
      });
    }

    this.chart.update('none');
  },

  // Handle window resize
  handleResize() {
    if (this.chart) {
      this.chart.resize();
    }
  },

  // Destroy chart
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
};

// Export for global access
window.Dashboard = Dashboard;
