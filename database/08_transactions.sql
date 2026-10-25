-- BatteryWatch: transaction demonstrations
-- Run each example separately. The example below is intentionally rolled back.
USE BatteryWatch;

START TRANSACTION;
UPDATE batteries
SET current_capacity = current_capacity - 100
WHERE battery_id = 1;
SELECT battery_id, current_capacity
FROM batteries
WHERE battery_id = 1;
ROLLBACK;

-- COMMIT example (only use on purposefully chosen data):
-- START TRANSACTION;
-- UPDATE batteries SET status = 'HEALTHY' WHERE battery_id = 1;
-- COMMIT;
