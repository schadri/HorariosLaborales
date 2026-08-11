import { NextRequest, NextResponse } from 'next/server';
import { batchUpsertSchedules } from '@/lib/db';
import { BatchUpsertPayload } from '@/lib/types';
import { format, startOfWeek, addDays } from 'date-fns';

/**
 * POST /api/vision/simulate
 * Simulates receiving a photo of the schedule sheet and extracting the employee row
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const employeeName = (body.employeeName || 'SCHUSTER ADRIAN').toUpperCase();

    // Generar la semana correspondiente a partir de hoy o fecha base
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });

    const sampleDays = [
      { dayOffset: 0, dayName: 'Lunes', timeRange: '10:30 A 18:30', startTime: '10:30', endTime: '18:30', isDayOff: false, notes: 'Turno Apertura' },
      { dayOffset: 1, dayName: 'Martes', timeRange: '14:00 A 22:00', startTime: '14:00', endTime: '22:00', isDayOff: false, notes: 'Turno Tarde' },
      { dayOffset: 2, dayName: 'Miércoles', timeRange: '14:00 A 22:00', startTime: '14:00', endTime: '22:00', isDayOff: false, notes: 'Turno Tarde' },
      { dayOffset: 3, dayName: 'Jueves', timeRange: '14:00 A 22:00', startTime: '14:00', endTime: '22:00', isDayOff: false, notes: 'Turno Tarde' },
      { dayOffset: 4, dayName: 'Viernes', timeRange: '10:00 A 18:00', startTime: '10:00', endTime: '18:00', isDayOff: false, notes: 'Turno Normal' },
      { dayOffset: 5, dayName: 'Sábado', timeRange: '10:00 A 18:00', startTime: '10:00', endTime: '18:00', isDayOff: false, notes: 'Turno Fin de Semana' },
      { dayOffset: 6, dayName: 'Domingo', timeRange: 'LIBRE', startTime: null, endTime: null, isDayOff: true, notes: 'Franco Semanal' },
    ];

    const days = sampleDays.map(item => {
      const date = addDays(monday, item.dayOffset);
      return {
        date: format(date, 'yyyy-MM-dd'),
        dayName: item.dayName,
        timeRange: item.timeRange,
        startTime: item.startTime,
        endTime: item.endTime,
        isDayOff: item.isDayOff,
        notes: item.notes,
        rawOcrText: `[OCR-RAW] ${item.dayName} ${item.timeRange}`,
        source: 'OCR_WHATSAPP' as const
      };
    });

    const payload: BatchUpsertPayload = {
      employeeName,
      legajo: employeeName.includes('SCHUSTER') ? '208376' : '208380',
      phone: '+5491112345678',
      days
    };

    const result = await batchUpsertSchedules(payload);

    return NextResponse.json({
      success: true,
      simulated: true,
      message: `Simulación de OCR ejecutada exitosamente para ${employeeName}`,
      employee: result.employee,
      daysCount: result.count,
      data: days
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error in OCR simulation', details: error.message },
      { status: 500 }
    );
  }
}
