'use client';

import React, { useRef, useEffect, useState } from 'react';
import { DaySchedule } from '@/lib/types';
import { DayCard } from './DayCard';
import { Sparkles, CalendarDays } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';

interface ShortsFeedProps {
  schedules: DaySchedule[];
  onEditDay: (schedule: DaySchedule) => void;
  isLoading: boolean;
  onOpenOcrModal: () => void;
  onActiveIndexChange: (dayIndexInWeek: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const REPEAT_CYCLES = 11; // 11 repetitions of the 7-day week for infinite scrolling
const MID_CYCLE = Math.floor(REPEAT_CYCLES / 2); // Cycle 5

export const ShortsFeed: React.FC<ShortsFeedProps> = ({
  schedules,
  onEditDay,
  isLoading,
  onOpenOcrModal,
  onActiveIndexChange,
  containerRef
}) => {
  const isInitializedRef = useRef(false);

  // Generate virtual infinite array
  const infiniteSchedules = React.useMemo(() => {
    if (schedules.length === 0) return [];
    const list: { schedule: DaySchedule; dayIndexInWeek: number; globalIndex: number }[] = [];
    for (let c = 0; c < REPEAT_CYCLES; c++) {
      schedules.forEach((sch, dayIdx) => {
        list.push({
          schedule: sch,
          dayIndexInWeek: dayIdx % 7,
          globalIndex: c * schedules.length + dayIdx
        });
      });
    }
    return list;
  }, [schedules]);

  // Initial scroll to middle cycle on today's day
  useEffect(() => {
    if (schedules.length === 0 || isInitializedRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const todayIdx = schedules.findIndex(s => {
      try {
        return isToday(parseISO(s.date));
      } catch {
        return false;
      }
    });

    const targetDayIndex = todayIdx >= 0 ? todayIdx : 0;
    const initialGlobalIndex = MID_CYCLE * schedules.length + targetDayIndex;

    const initScroll = () => {
      const slideHeight = el.clientHeight;
      if (slideHeight > 0) {
        el.scrollTop = initialGlobalIndex * slideHeight;
        isInitializedRef.current = true;
        onActiveIndexChange(targetDayIndex);
      }
    };

    // Run after layout
    setTimeout(initScroll, 50);
  }, [schedules, containerRef, onActiveIndexChange]);

  // Seamless Infinite Looping scroll listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el || schedules.length === 0) return;

    let isAdjusting = false;

    const handleScroll = () => {
      if (isAdjusting) return;
      const slideHeight = el.clientHeight;
      if (slideHeight <= 0) return;

      const currentScroll = el.scrollTop;
      const cycleHeight = schedules.length * slideHeight;
      const minBound = 2 * cycleHeight;
      const maxBound = (REPEAT_CYCLES - 3) * cycleHeight;

      // Teleport seamlessly if approaching top boundary
      if (currentScroll < minBound) {
        isAdjusting = true;
        el.scrollTop = currentScroll + 3 * cycleHeight;
        setTimeout(() => { isAdjusting = false; }, 50);
        return;
      }

      // Teleport seamlessly if approaching bottom boundary
      if (currentScroll > maxBound) {
        isAdjusting = true;
        el.scrollTop = currentScroll - 3 * cycleHeight;
        setTimeout(() => { isAdjusting = false; }, 50);
        return;
      }

      // Compute current active day (0 to 6)
      const rawGlobalIndex = Math.round(currentScroll / slideHeight);
      const dayIndexInWeek = ((rawGlobalIndex % schedules.length) + schedules.length) % schedules.length;
      onActiveIndexChange(dayIndexInWeek);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef, schedules.length, onActiveIndexChange]);

  if (isLoading && schedules.length === 0) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-[#180033] text-white">
        <div className="w-12 h-12 rounded-full border-4 border-purple-400 border-t-transparent animate-spin mb-4" />
        <p className="text-purple-200 font-bold text-sm">Cargando cronograma semanal...</p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#180033] text-center">
        <div className="w-20 h-20 rounded-3xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-5 border border-white/10">
          <CalendarDays className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white font-display mb-2">No hay horarios registrados</h2>
        <p className="text-sm text-purple-200/70 max-w-xs mb-8">
          Envía la foto de tu planilla por WhatsApp o usa el simulador para cargar la semana automáticamente.
        </p>
        <button
          onClick={onOpenOcrModal}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-purple-950 font-black text-sm shadow-xl active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-purple-700" />
          <span>Simular / Subir Foto OCR</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="shorts-viewport">
      {infiniteSchedules.map((item, idx) => (
        <DayCard
          key={`${item.schedule.id || item.schedule.date}-loop-${idx}`}
          schedule={item.schedule}
          dayIndexInWeek={item.dayIndexInWeek}
          onEdit={onEditDay}
        />
      ))}
    </div>
  );
};
