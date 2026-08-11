'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Employee, DaySchedule, UpdateSchedulePayload } from '@/lib/types';
import { TopNavMenu } from '@/components/TopNavMenu';
import { ShortsFeed } from '@/components/ShortsFeed';
import { ManualEditorModal } from '@/components/ManualEditorModal';
import { UploadDemoModal } from '@/components/UploadDemoModal';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  
  // Modals state
  const [editingSchedule, setEditingSchedule] = useState<DaySchedule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Week calculation
  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');
  const selectedWeekLabel = `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(weekEnd, "d 'de' MMM", { locale: es })}`;

  // 1. Fetch initial employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setEmployees(json.data);
          const urlParams = new URLSearchParams(window.location.search);
          const empParam = urlParams.get('empleado') || urlParams.get('employeeName');
          
          if (empParam) {
            const found = json.data.find((e: Employee) => e.name.toUpperCase().includes(empParam.toUpperCase()));
            setCurrentEmployee(found || json.data[0]);
          } else {
            setCurrentEmployee(json.data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };

    fetchEmployees();
  }, []);

  // 2. Fetch schedules whenever employee or week changes
  const fetchSchedules = useCallback(async () => {
    if (!currentEmployee) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        employeeName: currentEmployee.name,
        startDate: startDateStr,
        endDate: endDateStr
      });

      const res = await fetch(`/api/schedules?${query.toString()}`);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setSchedules(json.data);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentEmployee, startDateStr, endDateStr]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Jump smoothly to specific day (0=Lunes, 6=Domingo) in the infinite feed
  const handleJumpToDay = (targetDayIndex: number) => {
    const el = containerRef.current;
    if (!el || schedules.length === 0) return;

    const slideHeight = el.clientHeight;
    if (slideHeight <= 0) return;

    const currentGlobalIndex = Math.round(el.scrollTop / slideHeight);
    const currentDayInWeek = ((currentGlobalIndex % schedules.length) + schedules.length) % schedules.length;
    const diff = targetDayIndex - currentDayInWeek;
    const nextGlobalIndex = currentGlobalIndex + diff;

    el.scrollTo({
      top: nextGlobalIndex * slideHeight,
      behavior: 'smooth'
    });
    setActiveDayIndex(targetDayIndex);
  };

  // Keyboard navigation (Arrow up / down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditorOpen || isOcrModalOpen) return;
      const el = containerRef.current;
      if (!el) return;
      const slideHeight = el.clientHeight;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        el.scrollBy({ top: slideHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        el.scrollBy({ top: -slideHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, isOcrModalOpen]);

  // Manual Editor Save Handler (Fallback)
  const handleSaveSchedule = async (payload: UpdateSchedulePayload) => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Horario actualizado exitosamente');
        setSchedules(prev => prev.map(item => item.date === payload.date ? data.data : item));
        fetchSchedules();
      }
    } catch (err) {
      console.error('Failed to update schedule:', err);
      showToast('❌ Error al actualizar horario');
    }
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-[#180033] text-white relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-white text-slate-900 text-xs font-black shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Navigation with 3 Dots Menu Button ("...") */}
      <TopNavMenu
        currentEmployee={currentEmployee}
        employees={employees}
        onSelectEmployee={(emp) => setCurrentEmployee(emp)}
        selectedWeekLabel={selectedWeekLabel}
        onPrevWeek={() => setCurrentWeekDate(d => subWeeks(d, 1))}
        onNextWeek={() => setCurrentWeekDate(d => addWeeks(d, 1))}
        onCurrentWeek={() => setCurrentWeekDate(new Date())}
        onRefresh={fetchSchedules}
        onOpenOcrModal={() => setIsOcrModalOpen(true)}
        schedules={schedules}
        onEditSchedule={(schedule) => {
          setEditingSchedule(schedule);
          setIsEditorOpen(true);
        }}
        activeDayIndex={activeDayIndex}
        onJumpToDay={handleJumpToDay}
        isLoading={isLoading}
      />

      {/* 2. Fullscreen Infinite Shorts Feed (Lunes a Domingo Loop) */}
      <main className="w-full h-full">
        <ShortsFeed
          containerRef={containerRef}
          schedules={schedules}
          onEditDay={(schedule) => {
            setEditingSchedule(schedule);
            setIsEditorOpen(true);
          }}
          isLoading={isLoading}
          onOpenOcrModal={() => setIsOcrModalOpen(true)}
          onActiveIndexChange={(idx) => setActiveDayIndex(idx)}
        />
      </main>

      {/* 3. Manual Fallback Editor Modal */}
      <ManualEditorModal
        isOpen={isEditorOpen}
        schedule={editingSchedule}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
      />

      {/* 4. Vision OCR / WhatsApp Simulator Modal */}
      <UploadDemoModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onSuccess={() => {
          showToast('✨ Planilla extraída y sincronizada');
          fetchSchedules();
        }}
        currentEmployeeName={currentEmployee?.name || 'SCHUSTER ADRIAN'}
      />

    </div>
  );
}
