'use client';

import React from 'react';
import { Employee, DaySchedule } from '@/lib/types';
import { getCurrentShiftStatus, formatSpanishDate } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  User, 
  Sparkles, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  FileImage,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PersistentHeaderProps {
  currentEmployee: Employee | null;
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  todaySchedule: DaySchedule | null;
  selectedWeekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onRefresh: () => void;
  onOpenOcrModal: () => void;
  isLoading: boolean;
}

export const PersistentHeader: React.FC<PersistentHeaderProps> = ({
  currentEmployee,
  employees,
  onSelectEmployee,
  todaySchedule,
  selectedWeekLabel,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onRefresh,
  onOpenOcrModal,
  isLoading
}) => {
  const shiftStatus = getCurrentShiftStatus(todaySchedule);
  const todayFormatted = formatSpanishDate(new Date().toISOString().substring(0, 10));

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 shadow-2xl backdrop-blur-xl">
      <div className="max-w-xl mx-auto px-4 py-3 sm:px-6">
        
        {/* Top bar: Employee Selector & Actions */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
          
          {/* Employee Dropdown */}
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <User className="w-4 h-4" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Empleado</span>
              <select
                className="bg-transparent text-sm font-bold text-white cursor-pointer focus:outline-none border-none pr-6 font-display"
                value={currentEmployee?.name || ''}
                onChange={(e) => {
                  const emp = employees.find(empItem => empItem.name === e.target.value);
                  if (emp) onSelectEmployee(emp);
                }}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name} className="bg-surface-900 text-white">
                    {emp.name} {emp.legajo ? `(#${emp.legajo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenOcrModal}
              title="Simular / Subir Foto de Planilla"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
              <span className="hidden xs:inline">OCR Vision</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Actualizar Horarios"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Persistent Indicator: HOY BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-white/10 shadow-inner"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  shiftStatus.type === 'WORKING_NOW' ? 'bg-emerald-400' :
                  shiftStatus.type === 'DAY_OFF' ? 'bg-indigo-400' : 'bg-amber-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  shiftStatus.type === 'WORKING_NOW' ? 'bg-emerald-500' :
                  shiftStatus.type === 'DAY_OFF' ? 'bg-indigo-500' : 'bg-amber-500'
                }`}></span>
              </span>

              <div className="truncate">
                <div className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                  HOY: <span className="text-slate-200 capitalize">{todayFormatted}</span>
                </div>
                <div className="text-sm font-extrabold text-white font-display flex items-center gap-2 truncate">
                  {todaySchedule ? (
                    todaySchedule.isDayOff ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        🏖️ FRANCO / LIBRE
                      </span>
                    ) : (
                      <span className="text-brand-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        {todaySchedule.timeRange} hs
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 text-xs">Sin horario cargado hoy</span>
                  )}
                </div>
              </div>
            </div>

            {/* Shift Real-time Status Badge */}
            <div className="flex-shrink-0">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${
                shiftStatus.type === 'WORKING_NOW' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                shiftStatus.type === 'DAY_OFF' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {shiftStatus.label}
              </span>
            </div>
          </div>

          {/* Shift Progress bar if working right now */}
          {shiftStatus.type === 'WORKING_NOW' && (
            <div className="mt-2 pt-1.5 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Progreso de Turno</span>
                <span className="text-emerald-400 font-semibold">{shiftStatus.timeRemaining}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${shiftStatus.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-300 h-1.5 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Week navigation strip */}
        <div className="flex items-center justify-between mt-2.5 pt-1 text-xs">
          <button
            onClick={onPrevWeek}
            className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Semana Ant.</span>
          </button>

          <button
            onClick={onCurrentWeek}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 font-medium border border-white/10 transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            <span>{selectedWeekLabel}</span>
          </button>

          <button
            onClick={onNextWeek}
            className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
          >
            <span className="hidden xs:inline">Semana Sig.</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
