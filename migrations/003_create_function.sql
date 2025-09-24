CREATE OR REPLACE VIEW v_sensor_data_summary AS
SELECT 
    DATE(created_at) as date,
    sensor_type,
    COUNT(*) as total_readings,
    AVG(temperature) as avg_temperature,
    MIN(temperature) as min_temperature,
    MAX(temperature) as max_temperature,
    AVG(humidity) as avg_humidity,
    MIN(humidity) as min_humidity,
    MAX(humidity) as max_humidity,
    AVG(light_intensity) as avg_light_intensity,
    MIN(light_intensity) as min_light_intensity,
    MAX(light_intensity) as max_light_intensity
FROM tbl_sensor_data
GROUP BY DATE(created_at), sensor_type
ORDER BY date DESC, sensor_type;

CREATE OR REPLACE VIEW v_device_control_summary AS
SELECT 
    DATE(created_at) as date,
    device_id,
    action,
    COUNT(*) as total_commands,
    SUM(CASE WHEN status = 'on' THEN 1 ELSE 0 END) as on_commands,
    SUM(CASE WHEN status = 'off' THEN 1 ELSE 0 END) as off_commands
FROM tbl_device_control
GROUP BY DATE(created_at), device_id, action
ORDER BY date DESC, device_id, action;

CREATE OR REPLACE VIEW v_latest_sensor_data AS
SELECT 
    s1.*
FROM tbl_sensor_data s1
INNER JOIN (
    SELECT 
        sensor_type,
        MAX(created_at) as latest_created_at
    FROM tbl_sensor_data
    GROUP BY sensor_type
) s2 ON s1.sensor_type = s2.sensor_type AND s1.created_at = s2.latest_created_at
ORDER BY s1.sensor_type;

CREATE OR REPLACE VIEW v_latest_device_status AS
SELECT 
    d1.*
FROM tbl_device_control d1
INNER JOIN (
    SELECT 
        device_id,
        MAX(created_at) as latest_created_at
    FROM tbl_device_control
    GROUP BY device_id
) d2 ON d1.device_id = d2.device_id AND d1.created_at = d2.latest_created_at
ORDER BY d1.device_id;

DELIMITER //
CREATE PROCEDURE sp_get_sensor_data_paginated(
    IN p_page INT,
    IN p_limit INT,
    IN p_sort_field VARCHAR(50),
    IN p_sort_order VARCHAR(10),
    IN p_start_date TIMESTAMP,
    IN p_end_date TIMESTAMP,
    IN p_sensor_type VARCHAR(20),
    IN p_min_temperature DECIMAL(5,2),
    IN p_max_temperature DECIMAL(5,2),
    IN p_min_humidity DECIMAL(5,2),
    IN p_max_humidity DECIMAL(5,2),
    IN p_min_light_intensity INT,
    IN p_max_light_intensity INT,
    OUT p_total_count INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_sql TEXT DEFAULT '';
    DECLARE v_where_conditions TEXT DEFAULT '';
    
    SET v_offset = (p_page - 1) * p_limit;
    
    IF p_start_date IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND created_at >= ''', p_start_date, '''');
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND created_at <= ''', p_end_date, '''');
    END IF;
    
    IF p_sensor_type IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND sensor_type = ''', p_sensor_type, '''');
    END IF;
    
    IF p_min_temperature IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND temperature >= ', p_min_temperature);
    END IF;
    
    IF p_max_temperature IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND temperature <= ', p_max_temperature);
    END IF;
    
    IF p_min_humidity IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND humidity >= ', p_min_humidity);
    END IF;
    
    IF p_max_humidity IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND humidity <= ', p_max_humidity);
    END IF;
    
    IF p_min_light_intensity IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND light_intensity >= ', p_min_light_intensity);
    END IF;
    
    IF p_max_light_intensity IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND light_intensity <= ', p_max_light_intensity);
    END IF;

    IF LENGTH(v_where_conditions) > 0 THEN
        SET v_where_conditions = SUBSTRING(v_where_conditions, 6);
    END IF;

    SET @count_sql = CONCAT('SELECT COUNT(*) INTO @total_count FROM tbl_sensor_data WHERE 1=1 ', v_where_conditions);
    PREPARE stmt FROM @count_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SET p_total_count = @total_count;

    SET v_sql = CONCAT(
        'SELECT * FROM tbl_sensor_data WHERE 1=1 ',
        v_where_conditions,
        ' ORDER BY ',
        p_sort_field,
        ' ',
        p_sort_order,
        ' LIMIT ',
        v_offset,
        ', ',
        p_limit
    );
    
    SET @sql = v_sql;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE sp_get_device_control_paginated(
    IN p_page INT,
    IN p_limit INT,
    IN p_sort_field VARCHAR(50),
    IN p_sort_order VARCHAR(10),
    IN p_start_date TIMESTAMP,
    IN p_end_date TIMESTAMP,
    IN p_device_id VARCHAR(50),
    IN p_action VARCHAR(20),
    OUT p_total_count INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_sql TEXT DEFAULT '';
    DECLARE v_where_conditions TEXT DEFAULT '';
    
    SET v_offset = (p_page - 1) * p_limit;

    IF p_start_date IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND created_at >= ''', p_start_date, '''');
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND created_at <= ''', p_end_date, '''');
    END IF;
    
    IF p_device_id IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND device_id = ''', p_device_id, '''');
    END IF;
    
    IF p_action IS NOT NULL THEN
        SET v_where_conditions = CONCAT(v_where_conditions, ' AND action = ''', p_action, '''');
    END IF;

    IF LENGTH(v_where_conditions) > 0 THEN
        SET v_where_conditions = SUBSTRING(v_where_conditions, 6);
    END IF;

    SET @count_sql = CONCAT('SELECT COUNT(*) INTO @total_count FROM tbl_device_control WHERE 1=1 ', v_where_conditions);
    PREPARE stmt FROM @count_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SET p_total_count = @total_count;

    SET v_sql = CONCAT(
        'SELECT * FROM tbl_device_control WHERE 1=1 ',
        v_where_conditions,
        ' ORDER BY ',
        p_sort_field,
        ' ',
        p_sort_order,
        ' LIMIT ',
        v_offset,
        ', ',
        p_limit
    );
    
    SET @sql = v_sql;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER tr_sensor_data_before_insert
BEFORE INSERT ON tbl_sensor_data
FOR EACH ROW
BEGIN
    IF NEW.temperature < -40 OR NEW.temperature > 80 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Temperature must be between -40 and 80 degrees Celsius';
    END IF;

    IF NEW.humidity < 0 OR NEW.humidity > 100 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Humidity must be between 0 and 100 percent';
    END IF;

    IF NEW.light_intensity < 0 OR NEW.light_intensity > 65535 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Light intensity must be between 0 and 65535 lux';
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER tr_device_control_before_insert
BEFORE INSERT ON tbl_device_control
FOR EACH ROW
BEGIN
    IF NEW.device_id NOT IN ('led1', 'led2', 'led3') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid device_id. Must be led1, led2, or led3';
    END IF;
    
    IF NEW.action NOT IN ('on', 'off', 'toggle') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid action. Must be on, off, or toggle';
    END IF;
    
    IF NEW.action = 'on' THEN
        SET NEW.status = 'on';
    ELSEIF NEW.action = 'off' THEN
        SET NEW.status = 'off';
    ELSEIF NEW.action = 'toggle' THEN
        SET NEW.status = 'on';
    END IF;
END //
DELIMITER ;

CREATE INDEX idx_sensor_data_composite ON tbl_sensor_data (sensor_type, created_at DESC);
CREATE INDEX idx_device_control_composite ON tbl_device_control (device_id, created_at DESC);

SHOW TABLES;
DESCRIBE tbl_sensor_data;
DESCRIBE tbl_device_control;
