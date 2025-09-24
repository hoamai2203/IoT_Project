-- Insert sample data for testing
INSERT INTO tbl_sensor_data (temperature, humidity, light_intensity, sensor_type) VALUES
(25.5, 60.2, 1200, 'dht11'),
(26.1, 58.7, 1350, 'dht11'),
(24.8, 62.1, 1100, 'dht11'),
(25.9, 59.3, 1400, 'dht11'),
(25.2, 61.5, 1250, 'dht11');

INSERT INTO tbl_device_control (device_id, action, status) VALUES
('led1', 'on', 'on'),
('led2', 'off', 'off'),
('led3', 'on', 'on'),
('led1', 'toggle', 'off'),
('led2', 'on', 'on'),
('led3', 'off', 'off');
