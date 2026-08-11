import { NextRequest, NextResponse } from 'next/server';
import { batchUpsertSchedules } from '@/lib/db';
import { BatchUpsertPayload } from '@/lib/types';

/**
 * POST /api/vision/ocr
 * Receives an image of a schedule sheet, processes with Google Gemini 1.5 Flash Vision,
 * extracts employee row, and upserts directly to PostgreSQL database.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.N8N_API_SECRET || 'sec_n8n_schedules_2026_x89';
    
    // Optional Bearer token check
    if (authHeader && authHeader !== `Bearer ${secret}` && !authHeader.includes(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rawBase64 = body.base64 || body.rawBase64 || body.image || '';
    const targetEmployee = (body.targetEmployee || body.employeeName || 'SCHUSTER ADRIAN').trim().toUpperCase();
    const geminiKey = body.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!rawBase64) {
      return NextResponse.json({ error: 'base64 image is required' }, { status: 400 });
    }

    if (!geminiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured in environment variables or request body' 
      }, { status: 500 });
    }

    // Clean base64 string
    const cleanBase64 = rawBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log(`[OCR] Procesando imagen para empleado: ${targetEmployee}`);

    const promptText = `Eres un asistente experto en OCR y visión computacional para planillas de horarios laborales.
Tu tarea es:
1. Leer el encabezado de la planilla para identificar el rango de fechas (ej: 'Semana del : Domingo 2 de Agosto de 2026 Al Sabado 8 de Agosto de 2026') o el año y mes.
2. Buscar la fila correspondiente al empleado "${targetEmployee}" (ignora todas las demás filas).
3. Extraer los horarios de cada uno de los 7 días de la semana (Lunes a Domingo).
4. Calcular la fecha ISO exacta (YYYY-MM-DD) de cada día según la semana indicada en la planilla.
5. Responder ÚNICAMENTE con el siguiente JSON estructurado (sin markdown ni comillas triples):

{
  "empleado": "${targetEmployee}",
  "legajo": "208376",
  "rango_semana": "Texto del rango de la semana",
  "semana": [
    { "dia_semana": "Lunes", "fecha": "YYYY-MM-DD", "horario": "07:00 A 15:00", "franco": false },
    { "dia_semana": "Martes", "fecha": "YYYY-MM-DD", "horario": "07:00 A 15:00", "franco": false },
    { "dia_semana": "Miércoles", "fecha": "YYYY-MM-DD", "horario": "10:00 A 18:00", "franco": false },
    { "dia_semana": "Jueves", "fecha": "YYYY-MM-DD", "horario": "07:00 A 15:00", "franco": false },
    { "dia_semana": "Viernes", "fecha": "YYYY-MM-DD", "horario": "07:00 A 15:00", "franco": false },
    { "dia_semana": "Sábado", "fecha": "YYYY-MM-DD", "horario": "07:00 A 15:00", "franco": false },
    { "dia_semana": "Domingo", "fecha": "YYYY-MM-DD", "horario": "LIBRE", "franco": true }
  ]
}

Reglas:
- Si dice 'Libre', 'Franco' o la celda está vacía, coloca franco: true y horario: 'LIBRE'.
- Elimina notas secundarias como '(C)' o tiempos de corte '30'. Deja el horario limpio como '07:00 A 15:00'.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('[OCR Gemini Error]:', errorText);
      return NextResponse.json({ 
        error: 'Gemini OCR API error', 
        details: errorText 
      }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('[OCR JSON Parse Error]:', cleanJson);
      return NextResponse.json({ 
        error: 'Failed to parse JSON from AI model', 
        rawText: cleanJson 
      }, { status: 500 });
    }

    const employeeName = parsed.empleado || targetEmployee;
    const legajo = parsed.legajo || '208376';
    const semana = parsed.semana || [];

    const normalizedDays = semana.map((item: any) => {
      let startTime: string | null = null;
      let endTime: string | null = null;

      if (!item.franco && item.horario && item.horario.toLowerCase() !== 'libre') {
        const cleanRange = item.horario.replace(/\([a-zA-Z0-9]+\)/g, '').trim();
        const matches = cleanRange.match(/(\d{1,2}:\d{2})/g);
        if (matches && matches.length >= 2) {
          startTime = matches[0];
          endTime = matches[1];
        }
      }

      return {
        date: item.fecha,
        dayName: item.dia_semana,
        timeRange: item.horario ? item.horario.replace(/\([a-zA-Z0-9]+\)/g, '').trim() : (item.franco ? 'LIBRE' : '07:00 A 15:00'),
        startTime: startTime,
        endTime: endTime,
        isDayOff: Boolean(item.franco || item.horario?.toUpperCase() === 'LIBRE'),
        notes: null,
        source: 'OCR_WHATSAPP' as const
      };
    });

    const payload: BatchUpsertPayload = {
      employeeName,
      legajo,
      days: normalizedDays
    };

    const upsertResult = await batchUpsertSchedules(payload);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://horarios.adrianschuster.com.ar';
    const webAppUrl = `${appUrl}/?empleado=${encodeURIComponent(employeeName)}`;

    return NextResponse.json({
      success: true,
      message: `Horarios de ${employeeName} procesados y guardados con éxito`,
      employee: upsertResult.employee,
      upsertedCount: upsertResult.count,
      webAppUrl,
      days: normalizedDays
    });

  } catch (error: any) {
    console.error('Error in /api/vision/ocr:', error);
    return NextResponse.json({ 
      error: 'Internal OCR Error', 
      details: error.message 
    }, { status: 500 });
  }
}
