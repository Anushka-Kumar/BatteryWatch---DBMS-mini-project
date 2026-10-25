-- BatteryWatch: core relational tables
-- Column definitions are based on the live SHOW CREATE TABLE screenshots.
-- Keys and CHECK constraints are defined in 03_constraints_indexes.sql.
USE BatteryWatch;

CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(15) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS location (
    location_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS battery_type (
    type_id INT NOT NULL AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL,
    chemistry VARCHAR(50) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS laptops (
    laptop_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    purchase_date DATE DEFAULT NULL,
    os VARCHAR(50) DEFAULT NULL,
    serial_no VARCHAR(100) NOT NULL,
    PRIMARY KEY (laptop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS batteries (
    battery_id INT NOT NULL AUTO_INCREMENT,
    laptop_id INT NOT NULL,
    type_id INT NOT NULL,
    initial_capacity DECIMAL(10,2) NOT NULL,
    current_capacity DECIMAL(10,2) NOT NULL,
    install_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'HEALTHY',
    voltage DECIMAL(6,2) DEFAULT NULL,
    health_percentage DECIMAL(5,2) DEFAULT NULL,
    PRIMARY KEY (battery_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS charging_session (
    session_id INT NOT NULL AUTO_INCREMENT,
    battery_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME DEFAULT NULL,
    start_percentage DECIMAL(5,2) NOT NULL,
    end_percentage DECIMAL(5,2) NOT NULL,
    temperature DECIMAL(5,2) DEFAULT NULL,
    charge_cycles INT NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS health_record (
    record_id INT NOT NULL AUTO_INCREMENT,
    battery_id INT NOT NULL,
    record_date DATETIME NOT NULL,
    health_percentage DECIMAL(5,2) NOT NULL,
    temperature DECIMAL(5,2) DEFAULT NULL,
    charge_cycles INT DEFAULT 0,
    estimated_runtime DECIMAL(6,2) DEFAULT NULL,
    PRIMARY KEY (record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS maintenance_record (
    maintenance_id INT NOT NULL AUTO_INCREMENT,
    battery_id INT NOT NULL,
    location_id INT NOT NULL,
    service_date DATE NOT NULL,
    issue_description TEXT,
    action_taken TEXT,
    cost DECIMAL(10,2) DEFAULT '0.00',
    service_center VARCHAR(150) DEFAULT NULL,
    PRIMARY KEY (maintenance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS failure_record (
    failure_id INT NOT NULL AUTO_INCREMENT,
    battery_id INT NOT NULL,
    failure_date DATETIME NOT NULL,
    symptoms TEXT NOT NULL,
    resolved_date DATETIME DEFAULT NULL,
    cause VARCHAR(255) DEFAULT NULL,
    severity VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (failure_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
