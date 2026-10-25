-- BatteryWatch: unique indexes, foreign keys, and CHECK constraints
-- Run after 02_create_tables.sql.
USE BatteryWatch;

ALTER TABLE users
    ADD CONSTRAINT uq_users_email UNIQUE (email),
    ADD CONSTRAINT uq_users_phone UNIQUE (phone);

ALTER TABLE laptops
    ADD CONSTRAINT uq_laptops_serial_no UNIQUE (serial_no),
    ADD CONSTRAINT fk_laptop_user
        FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE batteries
    ADD CONSTRAINT uq_batteries_laptop_id UNIQUE (laptop_id),
    ADD CONSTRAINT fk_battery_laptop
        FOREIGN KEY (laptop_id) REFERENCES laptops(laptop_id),
    ADD CONSTRAINT fk_battery_type
        FOREIGN KEY (type_id) REFERENCES battery_type(type_id),
    ADD CONSTRAINT chk_initial_capacity CHECK (initial_capacity > 0),
    ADD CONSTRAINT chk_current_capacity CHECK (current_capacity >= 0),
    ADD CONSTRAINT chk_voltage CHECK (voltage >= 0),
    ADD CONSTRAINT chk_health_percentage CHECK (health_percentage BETWEEN 0 AND 100);

ALTER TABLE charging_session
    ADD CONSTRAINT fk_charging_battery
        FOREIGN KEY (battery_id) REFERENCES batteries(battery_id),
    ADD CONSTRAINT chk_start_percentage CHECK (start_percentage BETWEEN 0 AND 100),
    ADD CONSTRAINT chk_end_percentage CHECK (end_percentage BETWEEN 0 AND 100),
    ADD CONSTRAINT chk_charging_temperature CHECK (temperature BETWEEN -50 AND 150);

ALTER TABLE health_record
    ADD CONSTRAINT fk_health_battery
        FOREIGN KEY (battery_id) REFERENCES batteries(battery_id),
    ADD CONSTRAINT chk_record_health CHECK (health_percentage BETWEEN 0 AND 100),
    ADD CONSTRAINT chk_runtime CHECK (estimated_runtime >= 0),
    ADD CONSTRAINT chk_charge_cycles CHECK (charge_cycles >= 0);

ALTER TABLE maintenance_record
    ADD CONSTRAINT fk_maintenance_battery
        FOREIGN KEY (battery_id) REFERENCES batteries(battery_id),
    ADD CONSTRAINT fk_maintenance_location
        FOREIGN KEY (location_id) REFERENCES location(location_id),
    ADD CONSTRAINT chk_maintenance_cost CHECK (cost >= 0);

ALTER TABLE failure_record
    ADD CONSTRAINT fk_failure_battery
        FOREIGN KEY (battery_id) REFERENCES batteries(battery_id),
    ADD CONSTRAINT chk_resolved_date
        CHECK (resolved_date IS NULL OR resolved_date >= failure_date);
