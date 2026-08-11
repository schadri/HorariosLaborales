'use client';

import React, { useState } from 'react';
import { Employee, DaySchedule } from '@/lib/types';
import { 
  MoreHorizontal, 
  X, 
  Pencil, 
  User, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopNavMenuProps {
  currentEmployee: Employee | null;
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  selectedWeekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onRefresh: () => void;
  onOpenOcrModal: () => void;
  schedules: DaySchedule[];
  onEditSchedule: (schedule: DaySchedule) => void;
  activeDayIndex: number;
  onJumpToDay: (index: number) => void;
  isLoading: boolean;
}

const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const TopNavMenu: React.FC<TopNavMenuProps> = ({
  currentEmployee,
  employees,
  onSelectEmployee,
  selectedWeekLabel,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onRefresh,
  onOpenOcrModal,
  schedules,
  onEditSchedule,
  activeDayIndex,
  onJumpToDay,
  isLoading
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 px-5 pt-4 pb-2 flex items-center justify-between pointer-events-none">
        
        {/* 3 Dots Button (Exact detail from user sketch: "...") */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/15 shadow-lg active:scale-95 transition-all"
          title="Menú de opciones y edición manual"
        >
          <span className="text-2xl font-black leading-none tracking-widest -mt-2">...</span>
        </button>

        {/* Employee Badge & Week Pill */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-black/30 hover:bg-black/50 border border-white/15 text-white backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <User className="w-3.5 h-3.5 text-purple-300" />
            <span className="max-w-[120px] truncate">{currentEmployee?.name || 'Empleado'}</span>
          </button>
        </div>

      </div>

      {/* Floating Side Indicators (L M M J V S D) */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pointer-events-auto">
        {schedules.map((day, idx) => {
          const isSelected = activeDayIndex === idx;
          const isOff = day.isDayOff || day.timeRange.toUpperCase() === 'LIBRE';
          
          return (
            <button
              key={idx}
              onClick={() => onJumpToDay(idx)}
              title={`${day.dayName} (${day.timeRange})`}
              className={`w-7 h-7 rounded-full text-[10px] font-black flex items-center justify-center transition-all shadow-md ${
                isSelected
                  ? 'bg-white text-slate-950 scale-125 ring-2 ring-purple-400'
                  : isOff
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                    : 'bg-black/30 text-purple-200/70 hover:text-white border border-white/10 hover:bg-black/50'
              }`}
            >
              {DAY_INITIALS[idx] || (idx + 1)}
            </button>
          );
        })}
      </div>

      {/* Slide-over Action Drawer / Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl glass-menu p-6 text-white shadow-2xl border border-white/20 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-lg">
                    ...
                  </div>
                  <div>
                    <h2 className="text-lg font-black font-display text-white">Panel de Opciones</h2>
                    <p className="text-xs text-purple-200/70">Gestión de horarios y edición manual</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                
                {/* 1. Empleado Fijo */}
                <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-500/25 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Empleado Titular</div>
                    <div className="text-base font-black text-white font-display">SCHUSTER ADRIAN</div>
                    <div className="text-xs text-purple-200/70 font-semibold">Legajo: 208376 • Operaciones</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-200">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. Selector de Semanas */}
                <div>
                  <label className="text-xs font-bold text-purple-200 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Semana Seleccionada:
                  </label>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/90 border border-white/15">
                    <button
                      onClick={onPrevWeek}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                      title="Semana Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={onCurrentWeek}
                      className="text-xs font-bold text-white px-2 py-1 rounded-lg hover:bg-white/5"
                    >
                      {selectedWeekLabel}
                    </button>

                    <button
                      onClick={onNextWeek}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                      title="Semana Siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3. Edición Manual Rápida Día por Día (Fallback) */}
                <div>
                  <label className="text-xs font-bold text-purple-200 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5 text-amber-300" />
                    Editar Horario Manualmente (Día por Día):
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {schedules.map((day, idx) => {
                      const isOff = day.isDayOff || day.timeRange.toUpperCase() === 'LIBRE';
                      return (
                        <div
                          key={day.id || idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white w-20">{day.dayName}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              isOff ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-200'
                            }`}>
                              {day.timeRange}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              onEditSchedule(day);
                            }}
                            className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Action Buttons (OCR Simulator & Refresh) */}
                <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenOcrModal();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Subir Foto / Simular Visión OCR</span>
                  </button>

                  <button
                    onClick={() => {
                      onRefresh();
                      setIsMenuOpen(false);
                    }}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sincronizar Horarios</span>
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
