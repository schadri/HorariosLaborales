import { Pool } from 'pg';
import { Employee, DaySchedule, BatchUpsertPayload, UpdateSchedulePayload } from './types';
import { randomUUID } from 'crypto';

// In-Memory fallback store for instant local testing and offline execution
let mockEmployees: Employee[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    legajo: '208376',
    name: 'SCHUSTER ADRIAN',
    phone: '+5491112345678',
    department: 'Operaciones',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let mockSchedules: DaySchedule[] = [
  {
    id: 's-1',
    employeeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    employeeName: 'SCHUSTER ADRIAN',
    date: '2026-08-10',
    dayName: 'Lunes',
    timeRange: '10:30 A 18:30',
    startTime: '10:30',
    endTime: '18:30',
    isDayOff: false,
    notes: 'Turno Mañana/Tarde',
    source: 'OCR_WHATSAPP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 's-2',
    employeeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    employeeName: 'SCHUSTER ADRIAN',
    date: '2026-08-11',
    dayName: 'Martes',
    timeRange: '14:00 A 22:00',
    startTime: '14:00',
    endTime: '22:00',
    isDayOff: false,
    notes: null,
    source: 'OCR_WHATSAPP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 's-3',
    employeeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    employeeName: 'SCHUSTER ADRIAN',
    date: '2026-08-12',
    dayName: 'Miércoles',
    timeRange: '14:00 A 22:00',
    startTime: '14:00',
    endTime: '22:00',
    isDayOff: false,
    notes: null,
    source: 'OCR_WHATSAPP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 's-4',
    employeeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    employeeName: 'SCHUSTER ADRIAN',
    date: '2026-08-13',
    dayName: 'Jueves',
    timeRange: '14:00 A 22:00',
    startTime: '14:00',
    endTime: '22:00',
    isDayOff: false,
    notes: null,
    source: 'OCR_WHATSAPP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 's-5',
    employeeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    employeeName: 'SCHUSTER ADRIAN',
    date: '2026-08-14',
    dayName: 'Viernes',
    timeRange: '10:00 A 18:00',
    startTime: '10:00',
    endTime: '18:00',
    isDayOff: false,
    notes: null,
    source: 'OCR_WHATSAPP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 's-6',
    employeeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    employeeName: 'SCHUSTER ADRIAN',
    date: '2026-08-15',
    dayName: 'Sábado',
    timeRange: '10:00 A 18:00',
    startTime: '10:00',
    endTime: '18:00',
    isDayOff: false,
    notes: null,
    source: 'OCR_WHATSAPP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 's-7',
    employeeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    employeeName: 'SCHUSTER ADRIAN',
    date: '2026-08-16',
    dayName: 'Domingo',
    timeRange: 'LIBRE',
    startTime: null,
    endTime: null,
    isDayOff: true,
    notes: 'Franco semanal',
    source: 'OCR_WHATSAPP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let pool: Pool | null = null;
let usePostgres = false;

function getDbPool(): Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    try {
      const isSsl = process.env.DATABASE_URL.includes('sslmode=require') || 
                    process.env.DATABASE_URL.includes('neon.tech') || 
                    process.env.DATABASE_URL.includes('aws.neon.tech');
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 10000,
        max: 10
      });
      usePostgres = true;
    } catch (e) {
      console.warn('PostgreSQL pool creation fallback:', e);
      usePostgres = false;
    }
  }
  return pool;
}

// Initial attempt
getDbPool();

/**
 * Get all employees
 */
export async function getEmployees(): Promise<Employee[]> {
  if (usePostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM employees ORDER BY name ASC');
      return res.rows.map(r => ({
        id: r.id,
        legajo: r.legajo,
        name: r.name,
        phone: r.phone,
        department: r.department,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } catch (err) {
      console.warn('PostgreSQL query error, falling back to mock store:', err);
    }
  }

  return [...mockEmployees];
}

/**
 * Get or create employee by name
 */
export async function getOrCreateEmployee(name: string, legajo?: string | null, phone?: string | null): Promise<Employee> {
  const normalizedName = name.trim().toUpperCase();

  if (usePostgres && pool) {
    try {
      // Find or insert
      const selectRes = await pool.query('SELECT * FROM employees WHERE UPPER(name) = $1', [normalizedName]);
      if (selectRes.rows.length > 0) {
        return {
          id: selectRes.rows[0].id,
          legajo: selectRes.rows[0].legajo,
          name: selectRes.rows[0].name,
          phone: selectRes.rows[0].phone,
          department: selectRes.rows[0].department
        };
      }

      const insertRes = await pool.query(
        'INSERT INTO employees (name, legajo, phone) VALUES ($1, $2, $3) RETURNING *',
        [normalizedName, legajo || null, phone || null]
      );
      const row = insertRes.rows[0];
      return {
        id: row.id,
        legajo: row.legajo,
        name: row.name,
        phone: row.phone,
        department: row.department
      };
    } catch (err) {
      console.warn('Postgres getOrCreateEmployee error, using fallback:', err);
    }
  }

  let emp = mockEmployees.find(e => e.name.toUpperCase() === normalizedName);
  if (!emp) {
    emp = {
      id: randomUUID(),
      legajo: legajo || null,
      name: normalizedName,
      phone: phone || null,
      department: 'Operaciones',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockEmployees.push(emp);
  }
  return emp;
}

/**
 * Fetch schedules for an employee by date range or all
 */
export async function getSchedules(options: {
  employeeName?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<DaySchedule[]> {
  const { employeeName, employeeId, startDate, endDate } = options;

  if (usePostgres && pool) {
    try {
      let query = `
        SELECT s.*, e.name as employee_name
        FROM schedules s
        JOIN employees e ON s.employee_id = e.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (employeeId) {
        params.push(employeeId);
        query += ` AND s.employee_id = $${params.length}`;
      } else if (employeeName) {
        params.push(`%${employeeName.toUpperCase()}%`);
        query += ` AND UPPER(e.name) LIKE $${params.length}`;
      }

      if (startDate) {
        params.push(startDate);
        query += ` AND s.date >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        query += ` AND s.date <= $${params.length}`;
      }

      query += ` ORDER BY s.date ASC`;

      const res = await pool.query(query, params);
      return res.rows.map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        date: typeof r.date === 'string' ? r.date.substring(0, 10) : new Date(r.date).toISOString().substring(0, 10),
        dayName: r.day_name,
        timeRange: r.time_range,
        startTime: r.start_time ? String(r.start_time).substring(0, 5) : null,
        endTime: r.end_time ? String(r.end_time).substring(0, 5) : null,
        isDayOff: Boolean(r.is_day_off),
        notes: r.notes,
        rawOcrText: r.raw_ocr_text,
        source: r.source,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } catch (err) {
      console.warn('Postgres getSchedules error, using fallback:', err);
    }
  }

  // Fallback in-memory
  let targetEmpId = employeeId;
  if (!targetEmpId && employeeName) {
    const found = mockEmployees.find(e => e.name.toUpperCase().includes(employeeName.toUpperCase()));
    if (found) targetEmpId = found.id;
  }

  let filtered = mockSchedules;
  if (targetEmpId) {
    filtered = filtered.filter(s => s.employeeId === targetEmpId);
  }

  if (startDate) {
    filtered = filtered.filter(s => s.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(s => s.date <= endDate);
  }

  return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Batch UPSERT schedules from n8n / Vision OCR
 */
export async function batchUpsertSchedules(payload: BatchUpsertPayload): Promise<{ success: boolean; count: number; employee: Employee }> {
  const employee = await getOrCreateEmployee(payload.employeeName, payload.legajo, payload.phone);

  if (usePostgres && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const day of payload.days) {
        const query = `
          INSERT INTO schedules (
            employee_id, date, day_name, time_range, start_time, end_time, is_day_off, notes, raw_ocr_text, source
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          )
          ON CONFLICT (employee_id, date)
          DO UPDATE SET
            day_name = EXCLUDED.day_name,
            time_range = EXCLUDED.time_range,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            is_day_off = EXCLUDED.is_day_off,
            notes = COALESCE(EXCLUDED.notes, schedules.notes),
            raw_ocr_text = COALESCE(EXCLUDED.raw_ocr_text, schedules.raw_ocr_text),
            source = EXCLUDED.source,
            updated_at = CURRENT_TIMESTAMP
        `;

        await client.query(query, [
          employee.id,
          day.date,
          day.dayName,
          day.timeRange,
          day.startTime || null,
          day.endTime || null,
          day.isDayOff,
          day.notes || null,
          day.rawOcrText || null,
          day.source || 'OCR_WHATSAPP'
        ]);
      }

      await client.query('COMMIT');
      return { success: true, count: payload.days.length, employee };
    } catch (err) {
      await client.query('ROLLBACK');
      console.warn('Postgres batchUpsert error, falling back to mock:', err);
    } finally {
      client.release();
    }
  }

  // Fallback in-memory upsert
  for (const day of payload.days) {
    const existingIndex = mockSchedules.findIndex(
      s => s.employeeId === employee.id && s.date === day.date
    );

    const scheduleItem: DaySchedule = {
      id: existingIndex >= 0 ? mockSchedules[existingIndex].id : `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      date: day.date,
      dayName: day.dayName,
      timeRange: day.timeRange,
      startTime: day.startTime || null,
      endTime: day.endTime || null,
      isDayOff: day.isDayOff,
      notes: day.notes || null,
      rawOcrText: day.rawOcrText || null,
      source: day.source || 'OCR_WHATSAPP',
      createdAt: existingIndex >= 0 ? mockSchedules[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      mockSchedules[existingIndex] = scheduleItem;
    } else {
      mockSchedules.push(scheduleItem);
    }
  }

  return { success: true, count: payload.days.length, employee };
}

/**
 * Update a single day schedule (Fallback manual editor)
 */
export async function updateSchedule(payload: UpdateSchedulePayload): Promise<DaySchedule> {
  const { id, employeeId, employeeName, date, dayName, timeRange, startTime, endTime, isDayOff, notes } = payload;

  const emp = employeeId 
    ? (await getEmployees()).find(e => e.id === employeeId) || await getOrCreateEmployee(employeeName || 'SCHUSTER ADRIAN')
    : await getOrCreateEmployee(employeeName || 'SCHUSTER ADRIAN');

  if (usePostgres && pool) {
    try {
      const query = `
        INSERT INTO schedules (
          employee_id, date, day_name, time_range, start_time, end_time, is_day_off, notes, source
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'MANUAL_OVERRIDE'
        )
        ON CONFLICT (employee_id, date)
        DO UPDATE SET
          day_name = COALESCE(EXCLUDED.day_name, schedules.day_name),
          time_range = EXCLUDED.time_range,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          is_day_off = EXCLUDED.is_day_off,
          notes = EXCLUDED.notes,
          source = 'MANUAL_OVERRIDE',
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const res = await pool.query(query, [
        emp.id,
        date,
        dayName || 'Día',
        timeRange,
        startTime || null,
        endTime || null,
        isDayOff,
        notes || null
      ]);

      const r = res.rows[0];
      return {
        id: r.id,
        employeeId: r.employee_id,
        employeeName: emp.name,
        date: typeof r.date === 'string' ? r.date.substring(0, 10) : new Date(r.date).toISOString().substring(0, 10),
        dayName: r.day_name,
        timeRange: r.time_range,
        startTime: r.start_time ? String(r.start_time).substring(0, 5) : null,
        endTime: r.end_time ? String(r.end_time).substring(0, 5) : null,
        isDayOff: Boolean(r.is_day_off),
        notes: r.notes,
        rawOcrText: r.raw_ocr_text,
        source: 'MANUAL_OVERRIDE',
        updatedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Postgres updateSchedule error, fallback to mock:', err);
    }
  }

  // Fallback in-memory update
  const existingIdx = mockSchedules.findIndex(
    s => (s.id === id) || (s.employeeId === emp.id && s.date === date)
  );

  const updatedItem: DaySchedule = {
    id: existingIdx >= 0 ? mockSchedules[existingIdx].id : `s-manual-${Date.now()}`,
    employeeId: emp.id,
    employeeName: emp.name,
    date: date,
    dayName: dayName || (existingIdx >= 0 ? mockSchedules[existingIdx].dayName : 'Día'),
    timeRange: timeRange,
    startTime: startTime || null,
    endTime: endTime || null,
    isDayOff: isDayOff,
    notes: notes || null,
    source: 'MANUAL_OVERRIDE',
    createdAt: existingIdx >= 0 ? mockSchedules[existingIdx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    mockSchedules[existingIdx] = updatedItem;
  } else {
    mockSchedules.push(updatedItem);
  }

  return updatedItem;
}
