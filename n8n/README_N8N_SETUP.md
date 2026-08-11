# 🚀 Guía de Configuración: Flujo n8n + WhatsApp + AI Vision OCR

Esta guía explica cómo importar y poner en marcha el workflow de **n8n** para procesar automáticamente fotos de planillas de horarios enviadas por WhatsApp, extraer los turnos de un empleado específico mediante GPT-4o / Gemini 1.5 Flash y guardarlos en PostgreSQL a través de la WebApp.

---

## 1. Importación en n8n
1. Abre tu panel de **n8n**.
2. Ve a **Workflows** > botón superior derecho `+ Add Workflow`.
3. Haz clic en el menú de tres puntos `...` > **Import from File...** y selecciona el archivo `n8n/workflow_schedule_ocr.json` (o copia y pega su contenido directamente).
4. Guarda y renombra el workflow como `WhatsApp Schedule Vision OCR`.

---

## 2. Variables de Entorno en n8n
En tu instancia de n8n o archivo `.env`, configura las siguientes variables:

```env
# Clave de OpenAI para el modelo de visión GPT-4o
OPENAI_API_KEY="sk-proj-tu_clave_aqui"

# URL pública de tu WebApp Next.js (donde está alojado el backend)
NEXT_PUBLIC_APP_URL="https://tu-dashboard-horarios.com"

# Token secreto para asegurar la comunicación entre n8n y la API
N8N_API_SECRET="sec_n8n_schedules_2026_x89"
```

---

## 3. Conexión con WhatsApp (Evolution API / Twilio / Meta)

### Opción A: Evolution API (Recomendada para WhatsApp Web)
1. En tu instancia de Evolution API, crea un webhook apuntando a:
   `https://tu-n8n.com/webhook/schedule-image-webhook`
2. Marca el evento: `MESSAGES_UPSERT`.
3. Cuando el usuario envíe una imagen con o sin texto, Evolution enviará el Base64 o URL de la imagen.

### Opción B: Twilio WhatsApp Sandbox
1. Configura el Webhook de WhatsApp entrante en Twilio apuntando a la URL del Webhook de n8n.
2. Twilio pasará el parámetro `MediaUrl0` con la URL temporal de la foto.

---

## 4. Prompt de Visión Computacional (Optimizado)
El nodo de visión utiliza la siguiente instrucción especializada para garantizar que **SOLO** se extraigan los datos del empleado deseado, ignorando al resto de filas:

> **System:**  
> *"Eres un asistente experto en OCR y visión computacional para extracción de planillas de horarios laborales. Tu tarea es analizar la imagen y extraer los horarios de los 7 días de la semana EXCLUSIVAMENTE para el empleado indicado. Ignora todas las demás filas. Debes responder con un JSON válido estrictamente estructurado."*

> **User:**  
> *"Analiza la tabla de horarios de la imagen adjunta. Busca la fila correspondiente al empleado '{{ $json.targetEmployee }}' (ej: SCHUSTER ADRIAN). Ignora las demás filas. Extrae los horarios de los 7 días de la semana para esta persona.*
> 
> *Esquema de salida JSON requerido:*
> ```json
> {
>   "empleado": "SCHUSTER ADRIAN",
>   "legajo": "208376",
>   "semana": [
>     { "dia_semana": "Lunes", "fecha": "YYYY-MM-DD", "horario": "10:30 A 18:30", "franco": false },
>     { "dia_semana": "Martes", "fecha": "YYYY-MM-DD", "horario": "14:00 A 22:00", "franco": false },
>     { "dia_semana": "Miércoles", "fecha": "YYYY-MM-DD", "horario": "14:00 A 22:00", "franco": false },
>     { "dia_semana": "Jueves", "fecha": "YYYY-MM-DD", "horario": "14:00 A 22:00", "franco": false },
>     { "dia_semana": "Viernes", "fecha": "YYYY-MM-DD", "horario": "10:00 A 18:00", "franco": false },
>     { "dia_semana": "Sábado", "fecha": "YYYY-MM-DD", "horario": "10:00 A 18:00", "franco": false },
>     { "dia_semana": "Domingo", "fecha": "YYYY-MM-DD", "horario": "LIBRE", "franco": true }
>   ]
> }
> ```
> *Si el turno dice FRANCO, LIBRE o está vacío, coloca franco: true y horario: 'LIBRE'."*

---

## 5. Pruebas y Validación
Para probar el workflow sin enviar una foto real por WhatsApp:
1. Haz clic en **Test Step** en el nodo `WhatsApp Webhook Trigger`.
2. O ejecuta un curl local hacia la API:
```bash
curl -X POST http://localhost:3000/api/schedules/batch \
  -H "Authorization: Bearer sec_n8n_schedules_2026_x89" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeName": "SCHUSTER ADRIAN",
    "legajo": "208376",
    "days": [
      { "date": "2026-08-10", "dayName": "Lunes", "timeRange": "10:30 A 18:30", "startTime": "10:30", "endTime": "18:30", "isDayOff": false, "source": "OCR_WHATSAPP" },
      { "date": "2026-08-11", "dayName": "Martes", "timeRange": "14:00 A 22:00", "startTime": "14:00", "endTime": "22:00", "isDayOff": false, "source": "OCR_WHATSAPP" },
      { "date": "2026-08-12", "dayName": "Miércoles", "timeRange": "14:00 A 22:00", "startTime": "14:00", "endTime": "22:00", "isDayOff": false, "source": "OCR_WHATSAPP" },
      { "date": "2026-08-13", "dayName": "Jueves", "timeRange": "14:00 A 22:00", "startTime": "14:00", "endTime": "22:00", "isDayOff": false, "source": "OCR_WHATSAPP" },
      { "date": "2026-08-14", "dayName": "Viernes", "timeRange": "10:00 A 18:00", "startTime": "10:00", "endTime": "18:00", "isDayOff": false, "source": "OCR_WHATSAPP" },
      { "date": "2026-08-15", "dayName": "Sábado", "timeRange": "10:00 A 18:00", "startTime": "10:00", "endTime": "18:00", "isDayOff": false, "source": "OCR_WHATSAPP" },
      { "date": "2026-08-16", "dayName": "Domingo", "timeRange": "LIBRE", "startTime": null, "endTime": null, "isDayOff": true, "source": "OCR_WHATSAPP" }
    ]
  }'
```
