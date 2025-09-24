CREATE TABLE IF NOT EXISTS tbl_sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2) NOT NULL COMMENT 'Temperature in Celsius (-40 to 80)',
    humidity DECIMAL(5,2) NOT NULL COMMENT 'Humidity percentage (0 to 100)',
    light_intensity INT NOT NULL COMMENT 'Light intensity in lux (0 to 65535)',
    sensor_type ENUM('dht11', 'bh1750') NOT NULL COMMENT 'Type of sensor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
    
    INDEX idx_created_at (created_at),
    INDEX idx_sensor_type (sensor_type),
    INDEX idx_temperature (temperature),
    INDEX idx_humidity (humidity),
    INDEX idx_light_intensity (light_intensity),
    INDEX idx_created_at_sensor_type (created_at, sensor_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sensor data readings table';
