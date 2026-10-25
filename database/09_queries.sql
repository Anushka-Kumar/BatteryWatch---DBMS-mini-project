-- BatteryWatch: demonstration and reporting queries
USE BatteryWatch;

-- 1. List batteries with laptop details.
SELECT * FROM battery_health_view;

-- 2. Batteries with health below 80 percent.
SELECT battery_id, initial_capacity, current_capacity, health_percentage, status
FROM batteries
WHERE health_percentage < 80
ORDER BY health_percentage ASC;

-- 3. Average health by battery chemistry.
SELECT bt.chemistry, ROUND(AVG(b.health_percentage), 2) AS average_health
FROM batteries AS b
JOIN battery_type AS bt ON b.type_id = bt.type_id
GROUP BY bt.chemistry
ORDER BY average_health DESC;

-- 4. Charging-session count and average temperature per battery.
SELECT battery_id, COUNT(*) AS session_count, ROUND(AVG(temperature), 2) AS avg_temperature
FROM charging_session
GROUP BY battery_id
HAVING COUNT(*) >= 1
ORDER BY session_count DESC;

-- 5. Maintenance cost by service location.
SELECT loc.name AS service_location, SUM(mr.cost) AS total_cost
FROM maintenance_record AS mr
JOIN location AS loc ON mr.location_id = loc.location_id
GROUP BY loc.location_id, loc.name
ORDER BY total_cost DESC;

-- 6. Batteries that have at least one failure record.
SELECT b.battery_id, b.status
FROM batteries AS b
WHERE EXISTS (
    SELECT 1
    FROM failure_record AS f
    WHERE f.battery_id = b.battery_id
);

-- 7. Retrieve one battery using the stored procedure.
-- CALL GetBatteryHealth(1);
