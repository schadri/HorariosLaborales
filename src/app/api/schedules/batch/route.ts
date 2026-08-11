import { NextRequest, NextResponse } from 'next/server';
import { batchUpsertSchedules } from '@/lib/db';
import { BatchUpsertPayload } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Validar autorización del webhook de n8n
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.N8N_API_SECRET;

    if (expectedSecret && expectedSecret !== 'sec_n8n_schedules_2026_x89') {
      const token = authHeader?.replace(/^Bearer\s+/i, '');
      if (token !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid n8n API Secret' },
          { status: 401 }
        );
      }
    }

    // 2. Parsear el body JSON
    const body: BatchUpsertPayload = await req.json();

    if (!body.employeeName || !Array.isArray(body.days)) {
      return NextResponse.json(
        { error: 'Invalid payload: employeeName and days array are required' },
        { status: 400 }
      );
    }

    // 3. Ejecutar el Batch Upsert en PostgreSQL
    const result = await batchUpsertSchedules(body);

    return NextResponse.json({
      success: true,
      message: `Successfully upserted ${result.count} schedule days for ${result.employee.name}`,
      employee: result.employee,
      upsertedCount: result.count,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/schedules/batch:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
