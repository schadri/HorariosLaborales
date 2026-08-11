'use client';

import React, { useState, useEffect } from 'react';
import { DaySchedule, UpdateSchedulePayload } from '@/lib/types';
import { X, Save, Clock, Coffee, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualEditorModalProps {
  isOpen: boolean;
  schedule: DaySchedule | null;
  onClose: () => void;
  onSave: (updated: UpdateSchedulePayload) => Promise<void>;
}

const PRESET_HOURS = [
  { label: '10:30 a 18:30', start: '10:30', end: '18:30', range: '10:30 A 18:30' },
  { label: '14:00 a 22:00', start: '14:00', end: '22:00', range: '14:00 A 22:00' },
  { label: '10:00 a 18:00', start: '10:00', end: '18:00', range: '10:00 A 18:00' },
  { label: '06:00 a 14:00', start: '06:00', end: '14:00', range: '06:00 A 14:00' },
  { label: '08:00 a 16:00', start: '08:00', end: '16:00', range: '08:00 A 16:00' },
];

export const ManualEditorModal: React.FC<ManualEditorModalProps> = ({
  isOpen,
  schedule,
  onClose,
  onSave
}) => {
  const [isDayOff, setIsDayOff] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [timeRange, setTimeRange] = useState('10:00 A 18:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schedule) {
      const isOff = schedule.isDayOff || schedule.timeRange.toUpperCase() === 'LIBRE';
      setIsDayOff(isOff);
      setStartTime(schedule.startTime || '10:00');
      setEndTime(schedule.endTime || '18:00');
      setTimeRange(isOff ? 'LIBRE' : schedule.timeRange);
      setNotes(schedule.notes || '');
    }
  }, [schedule]);

  const handleApplyPreset = (preset: typeof PRESET_HOURS[0]) => {
    setIsDayOff(false);
    setStartTime(preset.start);
    setEndTime(preset.end);
    setTimeRange(preset.range);
  };

  const handleToggleDayOff = (off: boolean) => {
    setIsDayOff(off);
    if (off) {
      setTimeRange('LIBRE');
    } else {
      setTimeRange(`${startTime} A ${endTime}`);
    }
  };

  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    setTimeRange(`${start} A ${end}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: schedule.id,
        employeeId: schedule.employeeId,
        employeeName: schedule.employeeName,
        date: schedule.date,
        dayName: schedule.dayName,
        timeRange: isDayOff ? 'LIBRE' : timeRange,
        startTime: isDayOff ? null : startTime,
        endTime: isDayOff ? null : endTime,
        isDayOff: isDayOff,
        notes: notes.trim() || null
      });
      onClose();
    } catch (err) {
      console.error('Error saving schedule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !schedule) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl glass-panel bg-slate-900/95 border border-white/15 p-6 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                Fallback • Edición Manual
              </span>
              <h2 className="text-xl font-black text-white font-display">
                {schedule.dayName} {schedule.date}
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            
            {/* Toggle: Franco / Día Libre */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDayOff ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-sm font-bold text-white block cursor-pointer" htmlFor="toggle-franco">
                    Día de Franco / Libre
                  </label>
                  <span className="text-xs text-slate-400">Marca si no se trabaja en este día</span>
                </div>
              </div>

              <input
                type="checkbox"
                id="toggle-franco"
                checked={isDayOff}
                onChange={(e) => handleToggleDayOff(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Presets if not day off */}
            {!isDayOff && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Plantillas Rápidas de Horario:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_HOURS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        timeRange === preset.range
                          ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Time Pickers */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleTimeChange(e.target.value, endTime)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleTimeChange(startTime, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </div>

                {/* Text representation */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    Texto de Horario (Formato visual)
                  </label>
                  <input
                    type="text"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    placeholder="ej: 10:30 A 18:30"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-brand-400"
                  />
                </div>
              </div>
            )}

            {/* Notes / Reason */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Observaciones / Notas (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej: Cambio de turno acordado o corrección OCR"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Guardar en Base de Datos</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
