import React from 'react';
import {
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';
import { Activity, Subject } from '../types';
import { calculateDuration } from '../utils/urgency';

interface StatsPageProps {
  activities: Activity[];
  subjects: Subject[];
}

export const StatsPage: React.FC<StatsPageProps> = ({ activities, subjects }) => {
  const now = new Date();
  const nowMs = now.getTime();

  // 14.1 Statistiche Generali
  const total = activities.length;
  const completed = activities.filter((a) => a.status === 'COMPLETATA').length;
  const pending = activities.filter((a) => a.status === 'DA FARE').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const expired = activities.filter((a) => {
    if (a.status !== 'DA FARE') return false;
    const [y, m, d] = a.dueDate.split('-').map(Number);
    const [hh, mm] = a.dueTime.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm).getTime() <= nowMs;
  }).length;

  // 14.2 Tempo di Lavoro (senza conteggiare due volte le durate delle attività e sottoattività)
  const totalMinutesEstimated = activities.reduce(
    (sum, a) => sum + calculateDuration(a).totalMinutes,
    0
  );
  const pendingMinutesEstimated = activities
    .filter((a) => a.status === 'DA FARE')
    .reduce((sum, a) => sum + calculateDuration(a).totalMinutes, 0);

  const totalHours = (totalMinutesEstimated / 60).toFixed(1);
  const pendingHours = (pendingMinutesEstimated / 60).toFixed(1);

  // 14.3 Andamento Settimanale (Settimana attuale vs Settimana precedente)
  // Determine start of current week (Monday)
  const currentDay = now.getDay();
  const diffToMonday = (currentDay + 6) % 7;
  const startOfCurrentWeek = new Date(now);
  startOfCurrentWeek.setDate(now.getDate() - diffToMonday);
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  const startOfPrevWeek = new Date(startOfCurrentWeek);
  startOfPrevWeek.setDate(startOfCurrentWeek.getDate() - 7);

  const endOfPrevWeek = new Date(startOfCurrentWeek);
  endOfPrevWeek.setMilliseconds(-1);

  const currentWeekCompleted = activities.filter((a) => {
    if (a.status !== 'COMPLETATA' || !a.completedAt) return false;
    const cDate = new Date(a.completedAt);
    return cDate >= startOfCurrentWeek && cDate <= now;
  }).length;

  const prevWeekCompleted = activities.filter((a) => {
    if (a.status !== 'COMPLETATA' || !a.completedAt) return false;
    const cDate = new Date(a.completedAt);
    return cDate >= startOfPrevWeek && cDate <= endOfPrevWeek;
  }).length;

  // 7-day daily activity completions trend
  const dailyCompletions = [0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
    const day = new Date(startOfCurrentWeek);
    day.setDate(day.getDate() + dayOffset);
    const dayStr = day.toISOString().split('T')[0];
    const dayName = day.toLocaleDateString('it-IT', { weekday: 'short' });

    const count = activities.filter((a) => {
      if (a.status !== 'COMPLETATA') return false;
      const dateToCheck = a.completedAt ? a.completedAt.split('T')[0] : a.dueDate;
      return dateToCheck === dayStr;
    }).length;

    return { dayName, dayStr, count };
  });

  const maxDayCompletions = Math.max(1, ...dailyCompletions.map((d) => d.count));

  // 14.4 Statistiche per Materia
  const subjectStats = subjects.map((sub) => {
    const subTasks = activities.filter((a) => a.subjectId === sub.id);
    const subTotal = subTasks.length;
    const subCompleted = subTasks.filter((a) => a.status === 'COMPLETATA').length;
    const subPending = subTasks.filter((a) => a.status === 'DA FARE').length;
    const subPercentage = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;
    const subMinutes = subTasks.reduce((sum, a) => sum + calculateDuration(a).totalMinutes, 0);
    const subHours = (subMinutes / 60).toFixed(1);

    return {
      sub,
      total: subTotal,
      completed: subCompleted,
      pending: subPending,
      percentage: subPercentage,
      hours: subHours,
      minutes: subMinutes,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Statistiche e Progressi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Analisi delle attività, carichi di studio e performance nel tempo
        </p>
      </div>

      {/* 14.1 Statistiche Generali (Griglia) */}
      <section aria-labelledby="general-stats-heading">
        <h2 id="general-stats-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Panoramica Generale
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Attività Totali</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{total}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-amber-500 font-semibold block mb-1">Da Fare</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{pending}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-emerald-500 font-semibold block mb-1">Completate</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{completed}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-indigo-500 font-semibold block mb-1">Completamento</span>
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {completionRate}%
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-red-500 font-semibold block mb-1">Scadute</span>
            <span className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">{expired}</span>
          </div>
        </div>
      </section>

      {/* 14.2 & 14.3 Tempo di Lavoro e Andamento Settimanale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tempo di lavoro */}
        <section aria-labelledby="work-time-heading" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 id="work-time-heading" className="text-base font-bold text-slate-900 dark:text-white">
                Tempo di Lavoro
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Ore stimate ricavate da attività e sottoattività
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-slate-400 font-medium block">Ore totali previste</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalHours}h</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block">Ore da svolgere</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{pendingHours}h</span>
              </div>
            </div>
          </div>

          {/* Ore per materia mini-breakdown */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
              Distribuzione Ore per Materia
            </span>
            <div className="space-y-2">
              {subjectStats.slice(0, 4).map(({ sub, hours, minutes }) => {
                const pct = totalMinutesEstimated > 0 ? Math.round((minutes / totalMinutesEstimated) * 100) : 0;
                return (
                  <div key={sub.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                        {sub.name}
                      </span>
                      <span className="font-mono text-slate-500">{hours}h ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: sub.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 14.3 Andamento Settimanale */}
        <section aria-labelledby="weekly-heading" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 id="weekly-heading" className="text-base font-bold text-slate-900 dark:text-white">
                Andamento Settimanale
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Confronto completamenti tra settimana corrente e precedente
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block">Settimana Attuale</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{currentWeekCompleted}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-slate-400 font-medium block">Settimana Precedente</span>
                <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{prevWeekCompleted}</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Trend */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
              Completamenti Giornalieri (Settimana in corso)
            </span>
            <div className="flex items-end justify-between gap-2 h-28 pt-4">
              {dailyCompletions.map((d, idx) => {
                const heightPercent = Math.max(12, Math.round((d.count / maxDayCompletions) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{d.count}</span>
                    <div
                      className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                        d.count > 0 ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] uppercase font-bold text-slate-400">{d.dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* 14.4 STATISTICHE PER MATERIA (Tabella e barre di distribuzione) */}
      <section aria-labelledby="subject-stats-heading" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 id="subject-stats-heading" className="text-base font-bold text-slate-900 dark:text-white">
            Statistiche per Materia
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Distribuzione dettagliata del carico di lavoro e tassi di successo per ogni materia
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Materia</th>
                <th className="pb-3 text-center">Totali</th>
                <th className="pb-3 text-center">Completate</th>
                <th className="pb-3 text-center">Da Fare</th>
                <th className="pb-3 text-center">Ore Previste</th>
                <th className="pb-3 pr-2 text-right">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {subjectStats.map(({ sub, total, completed, pending, percentage, hours }) => (
                <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pl-2 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                    {sub.name}
                  </td>
                  <td className="py-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">{total}</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">{completed}</td>
                  <td className="py-3.5 text-center font-bold text-amber-600">{pending}</td>
                  <td className="py-3.5 text-center font-mono text-slate-600 dark:text-slate-400">{hours}h</td>
                  <td className="py-3.5 pr-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{percentage}%</span>
                      <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: sub.color }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
