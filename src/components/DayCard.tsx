'use client';

import React from 'react';
import { DaySchedule } from '@/lib/types';
import { getDayBadge, calculateShiftHours, getCurrentShiftStatus } from '@/lib/utils';
import { Clock, Coffee, ChevronDown, Bot, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

// Gradiente progresivo de Violeta más oscuro (Lunes) a Violeta más claro (Domingo)
export const DAY_THEMES = [
  {
    // Lunes - Violeta muy oscuro / noche profunda
    bgGradient: 'bg-gradient-to-b from-[#180033] via-[#100024] to-[#090014]',
    accentGlow: 'bg-purple-900/30',
    toneLabel: 'Tono Profundo',
  },
  {
    // Martes - Violeta oscuro
    bgGradient: 'bg-gradient-to-b from-[#240049] via-[#190035] to-[#0f0022]',
    accentGlow: 'bg-purple-800/30',
    toneLabel: 'Tono Oscuro',
  },
  {
    // Miércoles - Violeta medio-oscuro
    bgGradient: 'bg-gradient-to-b from-[#340066] via-[#25004c] to-[#170030]',
    accentGlow: 'bg-purple-700/35',
    toneLabel: 'Tono Medio-Oscuro',
  },
  {
    // Jueves - Violeta real
    bgGradient: 'bg-gradient-to-b from-[#460085] via-[#330063] to-[#210041]',
    accentGlow: 'bg-purple-600/35',
    toneLabel: 'Tono Real',
  },
  {
    // Viernes - Violeta vibrante
    bgGradient: 'bg-gradient-to-b from-[#5c009f] via-[#440079] to-[#2e0052]',
    accentGlow: 'bg-purple-500/40',
    toneLabel: 'Tono Vibrante',
  },
  {
    // Sábado - Violeta brillante
    bgGradient: 'bg-gradient-to-b from-[#7209b7] via-[#540087] to-[#39005f]',
    accentGlow: 'bg-fuchsia-600/40',
    toneLabel: 'Tono Brillante',
  },
  {
    // Domingo - Violeta más claro / luminoso
    bgGradient: 'bg-gradient-to-b from-[#8f39ec] via-[#6d18c9] to-[#4e0996]',
    accentGlow: 'bg-fuchsia-500/50',
    toneLabel: 'Tono Luminoso',
  },
];

interface DayCardProps {
  schedule: DaySchedule;
  dayIndexInWeek: number; // 0 to 6 (Lunes to Domingo)
  onEdit: (schedule: DaySchedule) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  schedule,
  dayIndexInWeek,
  onEdit
}) => {
  const { dayNumber, monthShort, isToday } = getDayBadge(schedule.date);
  const isOff = schedule.isDayOff || schedule.timeRange.toUpperCase() === 'LIBRE';
  const totalHours = calculateShiftHours(schedule.startTime, schedule.endTime, schedule.timeRange);
  const shiftStatus = isToday ? getCurrentShiftStatus(schedule) : null;

  const themeIndex = Math.min(6, Math.max(0, dayIndexInWeek % 7));
  const theme = DAY_THEMES[themeIndex] || DAY_THEMES[0];

  // Formatting hours stacked
  let startFormatted = schedule.startTime ? `${schedule.startTime} hs` : '';
  let endFormatted = schedule.endTime ? `${schedule.endTime} hs` : '';

  if (!startFormatted || !endFormatted) {
    const match = schedule.timeRange.match(/(\d{1,2}:?\d{0,2})\s*(?:A|-|a|to)\s*(\d{1,2}:?\d{0,2})/i);
    if (match) {
      startFormatted = match[1].includes(':') ? `${match[1]} hs` : `${match[1]}:00 hs`;
      endFormatted = match[2].includes(':') ? `${match[2]} hs` : `${match[2]}:00 hs`;
    } else {
      startFormatted = schedule.timeRange;
    }
  }

  return (
    <div className={`shorts-slide flex flex-col justify-between items-center px-6 py-12 relative overflow-hidden transition-colors duration-500 ${theme.bgGradient}`}>
      
      {/* Background Decorative Ambient Glows */}
      <div className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${theme.accentGlow}`} />
      <div className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${theme.accentGlow}`} />

      {/* Top Header / Day Name */}
      <div className="w-full max-w-sm flex flex-col items-center text-center z-10 pt-4">
        
        {/* Today badge if applicable */}
        {isToday ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-2 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-400/40 flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
            <span>HOY • {dayNumber} {monthShort}</span>
          </motion.div>
        ) : (
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-200/80">
            {dayNumber} de {monthShort}
          </div>
        )}

        {/* Huge Bold Day Title */}
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white uppercase font-display drop-shadow-lg">
          {schedule.dayName}
        </h1>

        {/* Underline bar (Exact detail from user sketch) */}
        <div className="w-36 h-1 bg-white/40 rounded-full mt-3 shadow-sm" />
      </div>

      {/* Center White Card (Exact replica of user's sketch) */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 25 }}
        whileInView={{ scale: 1, opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[300px] sm:max-w-[320px] bg-white text-slate-900 rounded-[28px] p-7 flex flex-col items-center text-center shadow-2xl card-white-shadow z-10 my-auto"
      >
        {/* Top Icon inside card */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
          isOff ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-50 text-slate-900'
        }`}>
          {isOff ? (
            <Coffee className="w-8 h-8 stroke-[2.2]" />
          ) : (
            <Clock className="w-8 h-8 stroke-[2.2]" />
          )}
        </div>

        {/* Main Stacked Time / Text Content */}
        {isOff ? (
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight font-display block">
              FRANCO
            </span>
            <span className="text-sm font-bold text-slate-400 block py-0.5">
              •
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-display block">
              DÍA LIBRE
            </span>
          </div>
        ) : (
          <div className="space-y-0.5">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display block">
              {startFormatted}
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-400 block py-0.5">
              a
            </span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display block">
              {endFormatted}
            </span>
          </div>
        )}

        {/* Subtitle / Hours detail */}
        <div className="mt-5 pt-4 border-t border-slate-100 w-full flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            {isOff ? 'Descanso semanal' : totalHours ? `${totalHours} hrs de jornada` : 'Turno laboral'}
          </span>

          <button
            onClick={() => onEdit(schedule)}
            className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
        </div>

        {/* Live Status if TODAY */}
        {isToday && shiftStatus && (
          <div className="mt-3 w-full py-1.5 px-3 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-800 text-[11px] font-bold text-center">
            {shiftStatus.label}
          </div>
        )}
      </motion.div>

      {/* Bottom Footer Info & Infinite Scroll Helper */}
      <div className="w-full max-w-sm flex flex-col items-center text-center z-10 pb-4">
        
        {/* Source info */}
        <div className="text-[11px] text-purple-200/70 flex items-center gap-1.5 mb-2">
          {schedule.source === 'OCR_WHATSAPP' ? (
            <>
              <Bot className="w-3.5 h-3.5 text-purple-300" />
              <span>Sincronizado vía WhatsApp OCR</span>
            </>
          ) : (
            <>
              <Pencil className="w-3 h-3 text-amber-300" />
              <span>Editado manualmente</span>
            </>
          )}
          {schedule.notes && <span>• {schedule.notes}</span>}
        </div>

        {/* Infinite Scroll Indicator */}
        <div className="flex flex-col items-center text-purple-200/60 animate-bounce">
          <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
            {schedule.dayName === 'Domingo' ? 'Desliza para volver a Lunes ↺' : 'Desliza para ver más ↕'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </div>

      </div>

    </div>
  );
};
