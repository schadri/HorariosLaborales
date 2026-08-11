import { NextRequest, NextResponse } from 'next/server';
import { batchUpsertSchedules } from '@/lib/db';
import { BatchUpsertPayload } from '@/lib/types';

/**
 * POST /api/vision/ocr
 * Mapeo estricto por posición de columnas:
 * Columna 1 = Domingo (Libre / Gris)
 * Columna 2 = Lunes
 * Columna 3 = Martes
 * Columna 4 = Miércoles
 * Columna 5 = Jueves
 * Columna 6 = Viernes
 * Columna 7 = Sábado
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.N8N_API_SECRET || 'sec_n8n_schedules_2026_x89';
    
    if (authHeader && authHeader !== `Bearer ${secret}` && !authHeader.includes(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rawBase64 = body.base64 || body.rawBase64 || body.image || '';
    const TARGET_EMPLOYEE = 'SCHUSTER ADRIAN';
    const TARGET_LEGAJO = '208376';
    const geminiKey = body.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!rawBase64) {
      return NextResponse.json({ error: 'base64 image is required' }, { status: 400 });
    }

    const cleanBase64 = rawBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const promptText = `Eres un asistente experto en OCR para planillas de horarios laborales.
La tabla de turnos tiene un formato FIJO Y ESTRICTO.
En la fila de "${TARGET_EMPLOYEE}" (Legajo: ${TARGET_LEGAJO}):
Las 7 columnas de horarios van SIEMPRE en este orden de izquierda a derecha:
- Columna 1: DOMINGO (siempre la primera celda, normalmente en gris con 'Libre')
- Columna 2: LUNES
- Columna 3: MARTES
- Columna 4: MIÉRCOLES
- Columna 5: JUEVES
- Columna 6: VIERNES
- Columna 7: SÁBADO

Responde ÚNICAMENTE con el siguiente JSON estructurado:

{
  "empleado": "${TARGET_EMPLOYEE}",
  "legajo": "${TARGET_LEGAJO}",
  "columnas_ordenadas": [
    { "posicion": 1, "dia_semana": "Domingo", "horario": "LIBRE", "franco": true },
    { "posicion": 2, "dia_semana": "Lunes", "horario": "10:30 A 18:30", "franco": false },
    { "posicion": 3, "dia_semana": "Martes", "horario": "14:00 A 22:00", "franco": false },
    { "posicion": 4, "dia_semana": "Miércoles", "horario": "14:00 A 22:00", "franco": false },
    { "posicion": 5, "dia_semana": "Jueves", "horario": "14:00 A 22:00", "franco": false },
    { "posicion": 6, "dia_semana": "Viernes", "horario": "10:00 A 18:00", "franco": false },
    { "posicion": 7, "dia_semana": "Sábado", "horario": "10:00 A 18:00", "franco": false }
  ]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${geminiKey}`;

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
      return NextResponse.json({ error: 'Gemini OCR Error', details: errorText }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Extracción limpia
    let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(clean);

    const rawList = parsed.columnas_ordenadas || parsed.semana || [];

    const FIXED_DAYS = [
      { dayName: 'Domingo', date: '2026-08-16' },
      { dayName: 'Lunes', date: '2026-08-10' },
      { dayName: 'Martes', date: '2026-08-11' },
      { dayName: 'Miércoles', date: '2026-08-12' },
      { dayName: 'Jueves', date: '2026-08-13' },
      { dayName: 'Viernes', date: '2026-08-14' },
      { dayName: 'Sábado', date: '2026-08-15' }
    ];

    const normalizedDays = FIXED_DAYS.map((fixed, idx) => {
      const item = rawList[idx] || {};
      let timeRange = (item.horario || item.timeRange || '').trim();
      let isDayOff = Boolean(item.franco || timeRange.toUpperCase().includes('LIBRE') || timeRange.toUpperCase().includes('FRANCO') || !timeRange);

      if (idx === 0 && (isDayOff || timeRange.toUpperCase().includes('LIBRE'))) {
        timeRange = 'LIBRE';
        isDayOff = true;
      }

      let startTime = null;
      let endTime = null;

      if (!isDayOff && timeRange) {
        const cleanRange = timeRange.replace(/\([a-zA-Z0-9]+\)/g, '').replace(/P\d+/gi, '').trim();
        const matches = cleanRange.match(/(\d{1,2}:\d{2})/g);
        if (matches && matches.length >= 2) {
          startTime = matches[0];
          endTime = matches[1];
          timeRange = `${startTime} A ${endTime}`;
        }
      }

      return {
        date: fixed.date,
        dayName: fixed.dayName,
        timeRange: isDayOff ? 'LIBRE' : timeRange || '07:00 A 15:00',
        startTime: startTime,
        endTime: endTime,
        isDayOff: isDayOff,
        notes: null,
        source: 'OCR_WHATSAPP' as const
      };
    });

    const payload: BatchUpsertPayload = {
      employeeName: TARGET_EMPLOYEE,
      legajo: TARGET_LEGAJO,
      days: normalizedDays
    };

    const upsertResult = await batchUpsertSchedules(payload);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://horarios.adrianschuster.com.ar';
    const webAppUrl = `${appUrl}/?empleado=${encodeURIComponent(TARGET_EMPLOYEE)}`;

    return NextResponse.json({
      success: true,
      message: `Horarios de ${TARGET_EMPLOYEE} procesados y guardados con éxito`,
      employee: upsertResult.employee,
      upsertedCount: upsertResult.count,
      webAppUrl,
      days: normalizedDays
    });

  } catch (error: any) {
    console.error('Error in /api/vision/ocr:', error);
    return NextResponse.json({ error: 'Internal OCR Error', details: error.message }, { status: 500 });
  }
}
