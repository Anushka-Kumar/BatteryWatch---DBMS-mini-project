-- BatteryWatch: triggers
USE BatteryWatch;

DROP TRIGGER IF EXISTS update_battery_health;

DELIMITER //
CREATE TRIGGER update_battery_health
BEFORE UPDATE ON batteries
FOR EACH ROW
BEGIN
    SET NEW.health_percentage =
        ROUND((NEW.current_capacity / NEW.initial_capacity) * 100, 2);
END//
DELIMITER ;

-- Test manually only if desired; this updates a live row:
-- UPDATE batteries SET current_capacity = current_capacity - 1 WHERE battery_id = 1;
-- Then restore the original current_capacity if testing on real data.
