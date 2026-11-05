import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Activity, Subject } from '../types';
import { calculateUrgency } from '../utils/urgency';

interface CalendarPageProps {
  activities: Activity[];
  subjects: Subject[];
  onSelectActivity: (activity: Activity) => void;
  onCreateActivityOnDate: (dateStr: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  activities,
  subjects,
  onSelectActivity,
  onCreateActivityOnDate,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayActivities, setSelectedDayActivities] = useState<{
    dateStr: string;
    activities: Activity[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ];

  const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar matrix (Monday as first day)
  const firstDayOfMonth = new Date(year, month, 1);
  // getDay: 0 is Sun, 1 is Mon... in IT week starts on Mon (idx 0)
  const startDayIdx = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const totalSlots = Math.ceil((startDayIdx + daysInMonth) / 7) * 7;

  const calendarDays = [];
  for (let i = 0; i < totalSlots; i++) {
    if (i < startDayIdx) {
      // Prev month day
      const dayNum = daysInPrevMonth - startDayIdx + i + 1;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(dayNum).padStart(2, '0')}`;
      calendarDays.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
      });
    } else if (i < startDayIdx + daysInMonth) {
      // Current month day
      const dayNum = i - startDayIdx + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(
        2,
        '0'
      )}`;
      calendarDays.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
      });
    } else {
      // Next month day
      const dayNum = i - (startDayIdx + daysInMonth) + 1;
      const nextDate = new Date(year, month + 1, dayNum);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(dayNum).padStart(2, '0')}`;
      calendarDays.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
      });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Calendario Scadenze
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Panoramica mensile delle attività e delle scadenze programmate
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              aria-label="Mese precedente"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 min-w-[150px] text-center uppercase tracking-wide">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Mese successivo"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            Torna a Oggi
          </button>
        </div>
      </div>

      {/* Monthly Grid Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Days of week headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
          {daysOfWeek.map((day, idx) => (
            <div
              key={idx}
              className="py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Day Slots Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
          {calendarDays.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            const dayTasks = activities.filter((a) => a.dueDate === cell.dateStr);

            return (
              <div
                key={idx}
                onClick={() => {
                  if (dayTasks.length > 0) {
                    setSelectedDayActivities({ dateStr: cell.dateStr, activities: dayTasks });
                  } else {
                    onCreateActivityOnDate(cell.dateStr);
                  }
                }}
                className={`min-h-[95px] sm:min-h-[120px] p-1.5 sm:p-2.5 transition-colors group cursor-pointer relative ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-300 dark:text-slate-700'
                    : 'hover:bg-indigo-50/30 dark:hover:bg-slate-800/40'
                } ${isToday ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
              >
                {/* Day Header Row */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs font-black'
                        : cell.isCurrentMonth
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Add icon on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateActivityOnDate(cell.dateStr);
                    }}
                    aria-label={`Aggiungi attività per il ${cell.dateStr}`}
                    className="p-1 rounded-md text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Activities for this day */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((act) => {
                    const subject = subjects.find((s) => s.id === act.subjectId);
                    const isDone = act.status === 'COMPLETATA';
                    const urg = calculateUrgency(act.dueDate, act.dueTime);

                    return (
                      <div
                        key={act.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectActivity(act);
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold truncate border flex items-center gap-1 transition-transform hover:scale-[1.02] ${
                          isDone
                            ? 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800/60 dark:border-slate-700'
                            : urg.isExpired
                            ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs'
                        }`}
                        style={
                          subject && !isDone
                            ? { borderLeftWidth: '3px', borderLeftColor: subject.color }
                            : {}
                        }
                      >
                        <span className="font-mono text-[9px] text-slate-400">
                          {act.dueTime}
                        </span>
                        <span className="truncate">{act.title}</span>
                      </div>
                    );
                  })}

                  {/* "+ altre" indicator when day has > 3 activities */}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-1 hover:underline">
                      +{dayTasks.length - 3} altre...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Day Activities when clicking a day */}
      {selectedDayActivities && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <h3 id="day-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Attività per {selectedDayActivities.dateStr}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayActivities(null)}
                aria-label="Chiudi"
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedDayActivities.activities.map((act) => {
                const sub = subjects.find((s) => s.id === act.subjectId);
                const isDone = act.status === 'COMPLETATA';

                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      setSelectedDayActivities(null);
                      onSelectActivity(act);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-3 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {act.title}
                        </span>
                        {sub && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                          >
                            {sub.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Ora consegna: {act.dueTime}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  const d = selectedDayActivities.dateStr;
                  setSelectedDayActivities(null);
                  onCreateActivityOnDate(d);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuova Attività per questo giorno</span>
              </button>

              <button
                onClick={() => setSelectedDayActivities(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
