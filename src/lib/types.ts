export interface Employee {
  id: string;
  legajo?: string | null;
  name: string;
  phone?: string | null;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DaySchedule {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  dayName: string; // 'Lunes', 'Martes', etc.
  timeRange: string; // '10:30 A 18:30', 'LIBRE'
  startTime: string | null; // '10:30'
  endTime: string | null; // '18:30'
  isDayOff: boolean;
  notes?: string | null;
  rawOcrText?: string | null;
  source: 'OCR_WHATSAPP' | 'MANUAL_OVERRIDE' | 'WEB_APP';
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchUpsertItem {
  date: string;
  dayName: string;
  timeRange: string;
  startTime?: string | null;
  endTime?: string | null;
  isDayOff: boolean;
  notes?: string | null;
  rawOcrText?: string | null;
  source?: 'OCR_WHATSAPP' | 'MANUAL_OVERRIDE' | 'WEB_APP';
}

export interface BatchUpsertPayload {
  employeeName: string;
  legajo?: string | null;
  phone?: string | null;
  days: BatchUpsertItem[];
}

export interface UpdateSchedulePayload {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  date: string;
  dayName?: string;
  timeRange: string;
  startTime?: string | null;
  endTime?: string | null;
  isDayOff: boolean;
  notes?: string | null;
}
