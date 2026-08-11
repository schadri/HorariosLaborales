-- ============================================================================
-- DATABASE SCHEMA: Sistema Automatizado de Horarios Laborales (PostgreSQL)
-- Compatible with PostgreSQL 13+, Supabase, Neon, Railway, RDS, etc.
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- TABLE: employees (Catálogo de Empleados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legajo VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on employee name for fast lookup during OCR matching
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_legajo ON employees(legajo);

-- ----------------------------------------------------------------------------
-- TABLE: schedules (Horarios Laborales por Día)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_name VARCHAR(20) NOT NULL,            -- 'Lunes', 'Martes', etc.
    time_range VARCHAR(50) NOT NULL,          -- '10:30 A 18:30', 'LIBRE', etc.
    start_time TIME,                          -- '10:30:00' (NULL if franco)
    end_time TIME,                            -- '18:30:00' (NULL if franco)
    is_day_off BOOLEAN DEFAULT FALSE,         -- TRUE if FRANCO / LIBRE
    notes TEXT,                               -- Observaciones o notas de turno
    raw_ocr_text TEXT,                        -- Texto crudo detectado por OCR para auditoría
    source VARCHAR(50) DEFAULT 'OCR_WHATSAPP',-- 'OCR_WHATSAPP', 'MANUAL_OVERRIDE', 'WEB_APP'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restricción única para UPSERT idempotente: Un empleado solo tiene 1 horario por fecha
    CONSTRAINT uq_employee_schedule_date UNIQUE (employee_id, date)
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_schedules_employee_date ON schedules(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);

-- ----------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_schedules_updated_at ON schedules;
CREATE TRIGGER trg_schedules_updated_at
BEFORE UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- SQL UPSERT PATTERN (Usado por el Backend y n8n):
-- ============================================================================
-- INSERT INTO schedules (
--     employee_id, date, day_name, time_range, start_time, end_time, is_day_off, source, raw_ocr_text
-- ) VALUES (
--     $1, $2, $3, $4, $5, $6, $7, $8, $9
-- )
-- ON CONFLICT (employee_id, date)
-- DO UPDATE SET
--     day_name = EXCLUDED.day_name,
--     time_range = EXCLUDED.time_range,
--     start_time = EXCLUDED.start_time,
--     end_time = EXCLUDED.end_time,
--     is_day_off = EXCLUDED.is_day_off,
--     source = EXCLUDED.source,
--     raw_ocr_text = COALESCE(EXCLUDED.raw_ocr_text, schedules.raw_ocr_text),
--     updated_at = CURRENT_TIMESTAMP;
