-- ============================================================================
-- SEED DATA: Empleados de prueba y horarios de la semana actual
-- ============================================================================

-- 1. Insertar Empleado Principal: SCHUSTER ADRIAN
INSERT INTO employees (id, legajo, name, phone, department)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '208376', 'SCHUSTER ADRIAN', '+5491112345678', 'Operaciones'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '208380', 'ANDRADE WALTER DANIEL', '+5491187654321', 'Ventas')
ON CONFLICT (name) DO UPDATE SET legajo = EXCLUDED.legajo;

-- 2. Insertar Horarios de la Semana (Ejemplo del Prompt para SCHUSTER ADRIAN)
-- Asumiendo semana del 10 al 16 de Agosto de 2026:
INSERT INTO schedules (employee_id, date, day_name, time_range, start_time, end_time, is_day_off, source)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-08-10', 'Lunes', '10:30 A 18:30', '10:30:00', '18:30:00', FALSE, 'OCR_WHATSAPP'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-08-11', 'Martes', '14:00 A 22:00', '14:00:00', '22:00:00', FALSE, 'OCR_WHATSAPP'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-08-12', 'Miércoles', '14:00 A 22:00', '14:00:00', '22:00:00', FALSE, 'OCR_WHATSAPP'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-08-13', 'Jueves', '14:00 A 22:00', '14:00:00', '22:00:00', FALSE, 'OCR_WHATSAPP'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-08-14', 'Viernes', '10:00 A 18:00', '10:00:00', '18:00:00', FALSE, 'OCR_WHATSAPP'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-08-15', 'Sábado', '10:00 A 18:00', '10:00:00', '18:00:00', FALSE, 'OCR_WHATSAPP'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-08-16', 'Domingo', 'LIBRE', NULL, NULL, TRUE, 'OCR_WHATSAPP')
ON CONFLICT (employee_id, date) 
DO UPDATE SET 
    time_range = EXCLUDED.time_range,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_day_off = EXCLUDED.is_day_off;
