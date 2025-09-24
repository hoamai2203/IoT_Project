CREATE TABLE IF NOT EXISTS tbl_device_control (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL COMMENT 'Device identifier (led1, led2, led3)',
    action ENUM('on', 'off', 'toggle') NOT NULL COMMENT 'Action performed on device',
    status ENUM('on', 'off') NOT NULL COMMENT 'Resulting device status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Command execution timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
    
    INDEX idx_created_at (created_at),
    INDEX idx_device_id (device_id),
    INDEX idx_action (action),
    INDEX idx_status (status),
    INDEX idx_device_id_created_at (device_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Device control commands and status table';
