-- BatteryWatch: stored procedures
USE BatteryWatch;

DROP PROCEDURE IF EXISTS GetBatteryHealth;

DELIMITER //
CREATE PROCEDURE GetBatteryHealth(IN p_battery_id INT)
BEGIN
    SELECT
        b.battery_id,
        l.brand,
        l.model,
        b.initial_capacity,
        b.current_capacity,
        b.health_percentage,
        b.status
    FROM batteries AS b
    JOIN laptops AS l
        ON b.laptop_id = l.laptop_id
    WHERE b.battery_id = p_battery_id;
END//
DELIMITER ;

-- Example:
-- CALL GetBatteryHealth(1);
