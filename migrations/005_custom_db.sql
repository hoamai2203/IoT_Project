SET GLOBAL log_bin_trust_function_creators = 1;
CREATE DATABASE IF NOT EXISTS iot_smart_home CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iot_smart_home;

SELECT 
    id,
    temperature,
    humidity,
    light_intensity,
    sensor_type,
    created_at
FROM tbl_sensor_data
WHERE sensor_type = 'dht11'
ORDER BY created_at DESC
LIMIT 10