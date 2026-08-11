'use client';

import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
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

const REPEAT_CYCLES = 5; // 5 repeticiones es ideal: ligero, fluido y 100% infinito
const MID_CYCLE = Math.floor(REPEAT_CYCLES / 2); // Ciclo 2

export const ShortsFeed: React.FC<ShortsFeedProps> = ({
  schedules,
  onEditDay,
  isLoading,
  onOpenOcrModal,
  onActiveIndexChange,
  containerRef
}) => {
  const [isReady, setIsReady] = useState(false);
  const isInitializedRef = useRef(false);
  const isTeleportingRef = useRef(false);

  // Generar lista virtual de 5 ciclos de 7 días
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

  // Posicionamiento inicial instantáneo sin animaciones ni rebotes
  useEffect(() => {
    if (schedules.length === 0 || isInitializedRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    // Buscar qué día es hoy (0=Lunes, etc.) o arrancar en Lunes
    const todayDayNumber = new Date().getDay(); // 0=Domingo, 1=Lunes...
    const todayIdx = todayDayNumber === 0 ? 6 : todayDayNumber - 1; // 0=Lunes ... 6=Domingo
    
    const targetDayIndex = (todayIdx >= 0 && todayIdx < schedules.length) ? todayIdx : 0;
    const initialGlobalIndex = MID_CYCLE * schedules.length + targetDayIndex;

    const applyInitialPosition = () => {
      const slideHeight = el.clientHeight;
      if (slideHeight > 0) {
        // Desactivar scroll-snap temporalmente para posicionar al instante
        el.style.scrollSnapType = 'none';
        el.scrollTop = initialGlobalIndex * slideHeight;
        
        // Reactivar scroll-snap en el siguiente frame
        requestAnimationFrame(() => {
          if (el) {
            el.style.scrollSnapType = 'y mandatory';
            isInitializedRef.current = true;
            setIsReady(true);
            onActiveIndexChange(targetDayIndex);
          }
        });
      }
    };

    const frameId = requestAnimationFrame(applyInitialPosition);
    return () => cancelAnimationFrame(frameId);
  }, [schedules, containerRef, onActiveIndexChange]);

  // Manejo de Scroll Infinito en bucle continuo
  useEffect(() => {
    const el = containerRef.current;
    if (!el || schedules.length === 0) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (isTeleportingRef.current || !isInitializedRef.current) return;

      const slideHeight = el.clientHeight;
      if (slideHeight <= 0) return;

      const currentScroll = el.scrollTop;
      const cycleHeight = schedules.length * slideHeight;
      const minBound = 1 * cycleHeight;
      const maxBound = (REPEAT_CYCLES - 2) * cycleHeight;

      // Teletransporte invisible al llegar al límite superior
      if (currentScroll < minBound) {
        isTeleportingRef.current = true;
        el.style.scrollSnapType = 'none';
        el.scrollTop = currentScroll + cycleHeight;
        requestAnimationFrame(() => {
          el.style.scrollSnapType = 'y mandatory';
          setTimeout(() => { isTeleportingRef.current = false; }, 30);
        });
        return;
      }

      // Teletransporte invisible al llegar al límite inferior
      if (currentScroll > maxBound) {
        isTeleportingRef.current = true;
        el.style.scrollSnapType = 'none';
        el.scrollTop = currentScroll - cycleHeight;
        requestAnimationFrame(() => {
          el.style.scrollSnapType = 'y mandatory';
          setTimeout(() => { isTeleportingRef.current = false; }, 30);
        });
        return;
      }

      // Actualizar el indicador del día activo
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const rawGlobalIndex = Math.round(el.scrollTop / slideHeight);
        const dayIndexInWeek = ((rawGlobalIndex % schedules.length) + schedules.length) % schedules.length;
        onActiveIndexChange(dayIndexInWeek);
      }, 40);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [containerRef, schedules.length, onActiveIndexChange]);

  if (isLoading && schedules.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-[#180033] text-white p-6">
        <div className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-4 shadow-lg shadow-purple-500/20" />
        <p className="text-purple-200 font-medium tracking-wide">Cargando tus horarios...</p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-b from-[#180033] via-[#0f0022] to-[#080012] text-white p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl">
          <CalendarDays className="w-10 h-10 text-purple-300" />
        </div>
        <h2 className="text-3xl font-black mb-2 font-display">Sin Horarios Cargados</h2>
        <p className="text-purple-200/70 text-sm max-w-xs mb-8">
          Envía una foto de tu planilla por WhatsApp para que la IA la procese automáticamente.
        </p>
        <button
          onClick={onOpenOcrModal}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Simular Carga de Planilla</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`shorts-container select-none transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-90'}`}
      style={{
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'auto' // Evita que la inicialización anime un scroll descontrolado
      }}
    >
      {infiniteSchedules.map((item) => (
        <DayCard
          key={`card-${item.globalIndex}`}
          schedule={item.schedule}
          dayIndexInWeek={item.dayIndexInWeek}
          onEdit={onEditDay}
        />
      ))}
    </div>
  );
};
