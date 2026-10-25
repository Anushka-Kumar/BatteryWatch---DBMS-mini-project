-- BatteryWatch: views
USE BatteryWatch;

CREATE OR REPLACE VIEW battery_health_view AS
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
    ON b.laptop_id = l.laptop_id;

-- View preview:
-- SELECT * FROM battery_health_view;
