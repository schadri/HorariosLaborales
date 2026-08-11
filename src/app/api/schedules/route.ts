import { NextRequest, NextResponse } from 'next/server';
import { getSchedules, updateSchedule } from '@/lib/db';
import { UpdateSchedulePayload } from '@/lib/types';

/**
 * GET /api/schedules
 * Query parameters:
 *  - employeeName: e.g. "SCHUSTER ADRIAN"
 *  - employeeId: UUID
 *  - startDate: YYYY-MM-DD
 *  - endDate: YYYY-MM-DD
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeName = searchParams.get('employeeName') || searchParams.get('empleado') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const schedules = await getSchedules({
      employeeName,
      employeeId,
      startDate,
      endDate
    });

    return NextResponse.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error: any) {
    console.error('Error in GET /api/schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT or PATCH /api/schedules
 * Manual Editor Fallback - updates a single day schedule
 */
export async function PATCH(req: NextRequest) {
  try {
    const body: UpdateSchedulePayload = await req.json();

    if (!body.date || !body.timeRange) {
      return NextResponse.json(
        { error: 'date and timeRange are required' },
        { status: 400 }
      );
    }

    const updated = await updateSchedule(body);

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/schedules:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}
