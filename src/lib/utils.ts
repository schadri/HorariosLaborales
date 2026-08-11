import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isSameDay, isToday, parse } from "date-fns";
import { es } from "date-fns/locale";
import { DaySchedule } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string (YYYY-MM-DD) to a human-friendly Spanish string
 * e.g. "Lunes 10 de Agosto"
 */
export function formatSpanishDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return dateStr;
  }
}

/**
 * Gets day number (e.g. "10") and short month (e.g. "AGO")
 */
export function getDayBadge(dateStr: string) {
  try {
    const date = parseISO(dateStr);
    return {
      dayNumber: format(date, "d"),
      monthShort: format(date, "MMM", { locale: es }).toUpperCase().replace(".", ""),
      dayName: format(date, "EEEE", { locale: es }),
      isToday: isToday(date)
    };
  } catch {
    return {
      dayNumber: "--",
      monthShort: "---",
      dayName: "Día",
      isToday: false
    };
  }
}

/**
 * Calculates duration in hours between start and end time (e.g. 8.0)
 */
export function calculateShiftHours(startTime?: string | null, endTime?: string | null, timeRange?: string): number | null {
  if (!startTime || !endTime) {
    if (timeRange) {
      const match = timeRange.match(/(\d{1,2}):?(\d{2})?\s*(?:A|-|a|to)\s*(\d{1,2}):?(\d{2})?/i);
      if (match) {
        const startH = parseInt(match[1], 10);
        const startM = match[2] ? parseInt(match[2], 10) : 0;
        const endH = parseInt(match[3], 10);
        const endM = match[4] ? parseInt(match[4], 10) : 0;
        
        let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight shift
        return Math.round((diffMinutes / 60) * 10) / 10;
      }
    }
    return null;
  }

  try {
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    let diff = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
    if (diff < 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  } catch {
    return null;
  }
}

export type ShiftStatus = 
  | { type: 'WORKING_NOW'; label: string; progressPercent: number; timeRemaining: string }
  | { type: 'UPCOMING_TODAY'; label: string; timeRemaining: string }
  | { type: 'FINISHED_TODAY'; label: string; timeRemaining: string }
  | { type: 'DAY_OFF'; label: string; timeRemaining: string }
  | { type: 'SCHEDULED'; label: string; timeRemaining: string };

/**
 * Calculates real-time shift status for today's card
 */
export function getCurrentShiftStatus(schedule?: DaySchedule | null): ShiftStatus {
  if (!schedule || schedule.isDayOff || schedule.timeRange.toUpperCase() === 'LIBRE') {
    return { type: 'DAY_OFF', label: '🏖️ Día de descanso (Franco)', timeRemaining: '' };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let startMinutes = 0;
  let endMinutes = 0;

  if (schedule.startTime && schedule.endTime) {
    const [sH, sM] = schedule.startTime.split(":").map(Number);
    const [eH, eM] = schedule.endTime.split(":").map(Number);
    startMinutes = sH * 60 + (sM || 0);
    endMinutes = eH * 60 + (eM || 0);
  } else {
    const match = schedule.timeRange.match(/(\d{1,2}):?(\d{2})?\s*(?:A|-|a|to)\s*(\d{1,2}):?(\d{2})?/i);
    if (match) {
      startMinutes = parseInt(match[1], 10) * 60 + (match[2] ? parseInt(match[2], 10) : 0);
      endMinutes = parseInt(match[3], 10) * 60 + (match[4] ? parseInt(match[4], 10) : 0);
    } else {
      return { type: 'SCHEDULED', label: '📅 Turno programado', timeRemaining: '' };
    }
  }

  // Check if now is before start
  if (currentMinutes < startMinutes) {
    const minsLeft = startMinutes - currentMinutes;
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    const timeRemaining = hrs > 0 ? `Comienza en ${hrs}h ${mins}m` : `Comienza en ${mins} min`;
    return { type: 'UPCOMING_TODAY', label: `⏳ Próximo turno (${timeRemaining})`, timeRemaining };
  }

  // Check if now is within shift
  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    const totalShift = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalShift) * 100)));
    const minsLeft = endMinutes - currentMinutes;
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    const timeRemaining = hrs > 0 ? `Quedan ${hrs}h ${mins}m` : `Quedan ${mins}m`;
    return { type: 'WORKING_NOW', label: `🟢 En turno (${progressPercent}%)`, progressPercent, timeRemaining };
  }

  // Shift completed
  return { type: 'FINISHED_TODAY', label: '✔️ Turno completado', timeRemaining: '' };
}
