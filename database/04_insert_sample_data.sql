-- BatteryWatch: sample data for demonstration
-- Illustrative seed data; IDs are explicitly supplied so related rows are stable.
USE BatteryWatch;

INSERT INTO users (user_id, name, email, phone, password) VALUES
(1, 'Aarav Sharma', 'aarav@example.com', '9000000001', 'demo_hash_1'),
(2, 'Diya Rao', 'diya@example.com', '9000000002', 'demo_hash_2'),
(3, 'Kabir Nair', 'kabir@example.com', NULL, 'demo_hash_3');

INSERT INTO location (location_id, name, type, description) VALUES
(1, 'Campus Service Desk', 'SERVICE_CENTER', 'University laptop support desk'),
(2, 'City Repair Hub', 'SERVICE_CENTER', 'General laptop and battery repairs'),
(3, 'Home', 'USER_LOCATION', 'User registered location');

INSERT INTO battery_type (type_id, type_name, chemistry, description) VALUES
(1, 'Lithium-ion', 'Li-ion', 'Rechargeable lithium-ion laptop battery'),
(2, 'Lithium-polymer', 'Li-poly', 'Rechargeable lithium-polymer laptop battery');

INSERT INTO laptops (laptop_id, user_id, brand, model, purchase_date, os, serial_no) VALUES
(1, 1, 'Dell', 'Inspiron 15', '2023-08-15', 'Windows 11', 'BW-LAP-0001'),
(2, 2, 'HP', 'Pavilion 14', '2024-01-10', 'Windows 11', 'BW-LAP-0002'),
(3, 3, 'Apple', 'MacBook Air', '2023-11-20', 'macOS', 'BW-LAP-0003');

INSERT INTO batteries
(battery_id, laptop_id, type_id, initial_capacity, current_capacity, install_date, status, voltage, health_percentage)
VALUES
(1, 1, 1, 50000.00, 42500.00, '2023-08-15', 'HEALTHY', 11.40, 85.00),
(2, 2, 2, 48000.00, 33600.00, '2024-01-10', 'WARNING', 11.10, 70.00),
(3, 3, 1, 52000.00, 46800.00, '2023-11-20', 'HEALTHY', 11.50, 90.00);

INSERT INTO charging_session
(session_id, battery_id, start_time, end_time, start_percentage, end_percentage, temperature, charge_cycles)
VALUES
(1, 1, '2026-10-20 08:00:00', '2026-10-20 09:15:00', 25.00, 85.00, 34.50, 120),
(2, 1, '2026-10-21 10:00:00', '2026-10-21 11:00:00', 35.00, 80.00, 36.00, 121),
(3, 2, '2026-10-21 13:00:00', '2026-10-21 14:30:00', 15.00, 90.00, 42.00, 260),
(4, 3, '2026-10-22 09:00:00', '2026-10-22 10:00:00', 40.00, 95.00, 33.00, 80);

INSERT INTO health_record
(record_id, battery_id, record_date, health_percentage, temperature, charge_cycles, estimated_runtime)
VALUES
(1, 1, '2026-10-20 09:30:00', 85.00, 34.50, 120, 5.50),
(2, 1, '2026-10-22 09:30:00', 85.00, 35.00, 121, 5.40),
(3, 2, '2026-10-21 14:45:00', 70.00, 42.00, 260, 3.20),
(4, 3, '2026-10-22 10:15:00', 90.00, 33.00, 80, 7.00);

INSERT INTO maintenance_record
(maintenance_id, battery_id, location_id, service_date, issue_description, action_taken, cost, service_center)
VALUES
(1, 2, 1, '2026-10-22', 'Battery drains quickly', 'Battery diagnostics and health inspection', 750.00, 'Campus Service Desk'),
(2, 1, 2, '2026-09-15', 'Routine battery check', 'Health report generated; no replacement needed', 300.00, 'City Repair Hub');

INSERT INTO failure_record
(failure_id, battery_id, failure_date, symptoms, resolved_date, cause, severity)
VALUES
(1, 2, '2026-10-10 12:00:00', 'Unexpected shutdown at low charge', '2026-10-12 15:00:00', 'Battery capacity degradation', 'MEDIUM'),
(2, 3, '2026-09-05 11:30:00', 'Battery temperature briefly elevated', NULL, 'Possible thermal stress', 'LOW');
