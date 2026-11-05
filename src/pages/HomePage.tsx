import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Activity, Subject } from '../types';
import { TaskCard } from '../components/TaskCard';
import { sortActivities } from '../utils/urgency';

interface HomePageProps {
  activities: Activity[];
  subjects: Subject[];
  onToggleStatus: (activity: Activity, completeSubtasks?: boolean) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
  onUpdateSubtask: (activity: Activity, subtaskId: string, newStatus: 'DA FARE' | 'COMPLETATA') => void;
  onOpenNewTask: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activities,
  subjects,
  onToggleStatus,
  onEditActivity,
  onDeleteActivity,
  onUpdateSubtask,
  onOpenNewTask,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate overview counts
  const todayStr = new Date().toISOString().split('T')[0];
  const totalCount = activities.length;
  const daFareCount = activities.filter((a) => a.status === 'DA FARE').length;
  const completateCount = activities.filter((a) => a.status === 'COMPLETATA').length;

  const dueTodayCount = activities.filter(
    (a) => a.status === 'DA FARE' && a.dueDate === todayStr
  ).length;

  const now = new Date();
  const nowMs = now.getTime();
  const expiredCount = activities.filter((a) => {
    if (a.status !== 'DA FARE') return false;
    const [y, m, d] = a.dueDate.split('-').map(Number);
    const [hh, mm] = a.dueTime.split(':').map(Number);
    const target = new Date(y, m - 1, d, hh, mm, 0, 0);
    return target.getTime() <= nowMs;
  }).length;

  // Active sorted activities for "Le Mie Attività"
  const activeActivities = activities.filter((a) => a.status === 'DA FARE');
  const sortedActive = sortActivities(activeActivities, now);

  // Daily deadlines for selectedDate
  const dailyDeadlines = activities.filter((a) => a.dueDate === selectedDate);
  const sortedDaily = sortActivities(dailyDeadlines, now);

  // Date manipulation helpers for Italian date label
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
  };

  // Format date in Italian: GIOVEDÌ 5 NOVEMBRE 2026
  const formatItalianDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj
      .toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      .toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* 8.1 PANORAMICA GENERALE (Indicatori) */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Panoramica Generale
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Totali */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Attività Totali</span>
              <ListTodo className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalCount}
            </p>
          </div>

          {/* Da Fare */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Da Fare</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {daFareCount}
            </p>
          </div>

          {/* Completate */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Completate</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {completateCount}
            </p>
          </div>

          {/* In scadenza oggi */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">In Scadenza Oggi</span>
              <Calendar className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
              {dueTodayCount}
            </p>
          </div>

          {/* Scadute */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Scadute</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
              {expiredCount}
            </p>
          </div>
        </div>
      </section>

      {/* 8.3 SCADENZE GIORNALIERE */}
      <section aria-labelledby="daily-deadlines-heading" className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="daily-deadlines-heading" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Scadenze Giornaliere
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizza le attività con consegna nel giorno selezionato
            </p>
          </div>

          {/* Date Picker Controls: < DATA > and OGGI */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              onClick={handlePrevDay}
              aria-label="Giorno precedente"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 px-3 tracking-wide select-none">
              &lt; {formatItalianDate(selectedDate)} &gt;
            </span>

            <button
              onClick={handleNextDay}
              aria-label="Giorno successivo"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleGoToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === todayStr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              OGGI
            </button>
          </div>
        </div>

        {/* Daily Tasks List */}
        <div className="mt-5">
          {sortedDaily.length === 0 ? (
            <div className="py-8 text-center text-sm font-medium text-slate-400">
              Nessuna scadenza per questa giornata.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedDaily.map((activity) => (
                <TaskCard
                  key={activity.id}
                  activity={activity}
                  subject={subjects.find((s) => s.id === activity.subjectId)}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                  onUpdateSubtask={onUpdateSubtask}
                  draggable={false}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8.2 LE MIE ATTIVITÀ (Da fare ordinate per: Scadute -> Scadenza più vicina -> Urgenza maggiore) */}
      <section aria-labelledby="my-tasks-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="my-tasks-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Le Mie Attività
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Attività da fare ordinate automaticamente per precedenza, scadenza e urgenza
            </p>
          </div>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi</span>
          </button>
        </div>

        {sortedActive.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tutto completato!
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Non hai attività in sospeso. Aggiungi nuove attività per pianificare il tuo studio o i tuoi impegni.
            </p>
            <button
              onClick={onOpenNewTask}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              + Nuova Attività
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedActive.map((activity) => (
              <TaskCard
                key={activity.id}
                activity={activity}
                subject={subjects.find((s) => s.id === activity.subjectId)}
                onToggleStatus={onToggleStatus}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onUpdateSubtask={onUpdateSubtask}
                draggable={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
