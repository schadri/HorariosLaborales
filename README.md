# 📅 Dashboard de Horarios Laborales (AI Vision OCR + WhatsApp + n8n + PostgreSQL + Vercel)

Sistema moderno y minimalista de lectura automatizada de planillas de horarios laborales mediante WhatsApp, orquestación en n8n con GPT-4o Vision OCR, almacenamiento en PostgreSQL y visualización interactiva móvil en Next.js con feed tipo Shorts y editor manual de respaldo.

---

## 🚀 Arquitectura del Flujo

```mermaid
flowchart LR
    A[📱 WhatsApp User] -->|Foto Planilla| B[🤖 WhatsApp API / Gateway]
    B -->|Webhook| C[⚙️ n8n Workflow]
    C -->|AI Vision OCR| D[🧠 GPT-4o Vision]
    D -->|JSON 7 Días| C
    C -->|POST /api/schedules/batch| E[▲ Vercel API & PostgreSQL]
    E -->|Confirmación con Link| A
    E -->|Feed Shorts & Fallback Edit| F[📱 WebApp UI]
```

---

## 🛠️ Tecnologías

* **Frontend & Backend API:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons.
* **Base de Datos:** PostgreSQL (compatible con Supabase, Neon, Railway, RDS) con queries `UPSERT` atómicas.
* **Automatización:** n8n (Workflow exportable incluido en `/n8n`).
* **Visión AI:** OpenAI GPT-4o / Gemini 1.5 Flash.
* **Hosting:** Vercel.

---

## 📦 Puesta en Producción

### 1. Variables de Entorno en Vercel
Configura las siguientes variables en tu proyecto de Vercel:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | Conexión a PostgreSQL (Supabase / Neon) | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `N8N_API_SECRET` | Token Bearer para autenticar el webhook de n8n | `sec_n8n_schedules_2026_x89` |
| `NEXT_PUBLIC_APP_URL` | URL de tu despliegue en Vercel | `https://tu-proyecto.vercel.app` |

---

## 🤖 Configuración en n8n
1. Importa el archivo `n8n/workflow_schedule_ocr.json` en tu instancia de n8n.
2. Agrega tus credenciales de `OPENAI_API_KEY` y `N8N_API_SECRET`.
3. Configura el Webhook de WhatsApp (Evolution API, Twilio o Meta Cloud API) apuntando al Trigger de n8n.
