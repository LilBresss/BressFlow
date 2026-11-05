import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Sparkles,
  GripHorizontal,
} from 'lucide-react';
import { Activity, Subject, TaskStatus } from '../types';
import { TaskCard } from '../components/TaskCard';
import { sortActivities, calculateDuration, calculateUrgency } from '../utils/urgency';

interface TasksPageProps {
  activities: Activity[];
  subjects: Subject[];
  onToggleStatus: (activity: Activity, completeSubtasks?: boolean) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
  onUpdateSubtask: (activity: Activity, subtaskId: string, newStatus: TaskStatus) => void;
  onOpenNewTask: () => void;
}

type SortField = 'default' | 'dueDate' | 'urgency' | 'subject' | 'name' | 'duration';

export const TasksPage: React.FC<TasksPageProps> = ({
  activities,
  subjects,
  onToggleStatus,
  onEditActivity,
  onDeleteActivity,
  onUpdateSubtask,
  onOpenNewTask,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<SortField>('default');

  // Drag and Drop state
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Filtering function
  const filterList = (items: Activity[]) => {
    return items.filter((act) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description?.toLowerCase().includes(q);
        const subj = subjects.find((s) => s.id === act.subjectId);
        const matchSubj = subj?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSubj) return false;
      }

      // Subject filter
      if (selectedSubjectId !== 'all') {
        if (selectedSubjectId === 'none' && act.subjectId) return false;
        if (selectedSubjectId !== 'none' && act.subjectId !== selectedSubjectId) return false;
      }

      // Urgency filter
      const urg = calculateUrgency(act.dueDate, act.dueTime, now);
      if (selectedUrgency === 'expired' && !urg.isExpired) return false;
      if (selectedUrgency !== 'all' && selectedUrgency !== 'expired') {
        if (urg.level !== parseInt(selectedUrgency, 10)) return false;
      }

      // Date filter
      if (dateFilter === 'today' && act.dueDate !== todayStr) return false;
      if (dateFilter === 'expired' && !urg.isExpired) return false;
      if (dateFilter === 'week') {
        const diffDays =
          (new Date(act.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      return true;
    });
  };

  // Sorting function
  const sortList = (items: Activity[]) => {
    if (sortBy === 'default') {
      return sortActivities(items, now);
    }

    return [...items].sort((a, b) => {
      if (sortBy === 'dueDate') {
        return `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`);
      }
      if (sortBy === 'urgency') {
        const urgA = calculateUrgency(a.dueDate, a.dueTime, now).level;
        const urgB = calculateUrgency(b.dueDate, b.dueTime, now).level;
        return urgB - urgA;
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'duration') {
        const durA = calculateDuration(a).totalMinutes;
        const durB = calculateDuration(b).totalMinutes;
        return durB - durA;
      }
      if (sortBy === 'subject') {
        const subA = subjects.find((s) => s.id === a.subjectId)?.name || '';
        const subB = subjects.find((s) => s.id === b.subjectId)?.name || '';
        return subA.localeCompare(subB);
      }
      return 0;
    });
  };

  const daFareTasks = sortList(filterList(activities.filter((a) => a.status === 'DA FARE')));
  const completateTasks = sortList(filterList(activities.filter((a) => a.status === 'COMPLETATA')));

  // Calculate total minutes per column
  const totalMinutesDaFare = daFareTasks.reduce((sum, a) => sum + calculateDuration(a).totalMinutes, 0);
  const totalMinutesCompletate = completateTasks.reduce(
    (sum, a) => sum + calculateDuration(a).totalMinutes,
    0
  );

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, activity: Activity) => {
    setDraggedActivity(activity);
    e.dataTransfer.setData('text/plain', activity.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== col) {
      setDragOverCol(col);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedActivity) return;

    if (draggedActivity.status !== targetStatus) {
      onToggleStatus(draggedActivity, false);
    }
    setDraggedActivity(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header and Filter Controls */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestione Attività
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organizzazione a due colonne: DA FARE e COMPLETATE con trascinamento drag & drop
          </p>
        </div>

        {/* Filters and search toolbar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtra per nome o descrizione..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Tutte le materie</option>
              <option value="none">Senza materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Urgency Filter */}
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Tutti i livelli di urgenza</option>
              <option value="expired">Solo SCADUTE</option>
              <option value="5">Livello 5 - Molto alta</option>
              <option value="4">Livello 4 - Alta</option>
              <option value="3">Livello 3 - Media</option>
              <option value="2">Livello 2 - Bassa</option>
              <option value="1">Livello 1 - Molto bassa</option>
            </select>

            {/* Date Quick Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Tutte le date</option>
              <option value="today">In scadenza oggi</option>
              <option value="week">Prossimi 7 giorni</option>
              <option value="expired">Scadute</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="default">Predefinito (Scadute prima, poi scadenza)</option>
              <option value="dueDate">Data di consegna</option>
              <option value="urgency">Livello di urgenza</option>
              <option value="name">Nome attività</option>
              <option value="subject">Materia</option>
              <option value="duration">Durata stimata</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two Column Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLONNA SINISTRA: DA FARE */}
        <div
          onDragOver={(e) => handleDragOver(e, 'DA FARE')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'DA FARE')}
          className={`flex flex-col rounded-3xl p-4 sm:p-5 transition-all duration-200 min-h-[500px] ${
            dragOverCol === 'DA FARE'
              ? 'bg-indigo-50/60 dark:bg-indigo-950/20 ring-2 ring-indigo-500 border border-indigo-300'
              : 'bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                DA FARE
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                {daFareTasks.length}
              </span>
            </div>

            <div className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
              {Math.floor(totalMinutesDaFare / 60)}h {totalMinutesDaFare % 60}m previsti
            </div>
          </div>

          {/* Task cards */}
          <div className="space-y-3.5 flex-1">
            {daFareTasks.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  Nessuna attività da fare.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Trascina qui le schede per riaprirle o clicca su Nuova Attività.
                </p>
              </div>
            ) : (
              daFareTasks.map((activity) => (
                <TaskCard
                  key={activity.id}
                  activity={activity}
                  subject={subjects.find((s) => s.id === activity.subjectId)}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                  onUpdateSubtask={onUpdateSubtask}
                  draggable={true}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggedActivity(null)}
                />
              ))
            )}
          </div>
        </div>

        {/* COLONNA DESTRA: COMPLETATE */}
        <div
          onDragOver={(e) => handleDragOver(e, 'COMPLETATA')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'COMPLETATA')}
          className={`flex flex-col rounded-3xl p-4 sm:p-5 transition-all duration-200 min-h-[500px] ${
            dragOverCol === 'COMPLETATA'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-500 border border-emerald-300'
              : 'bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                COMPLETATE
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {completateTasks.length}
              </span>
            </div>

            <div className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
              {Math.floor(totalMinutesCompletate / 60)}h {totalMinutesCompletate % 60}m svolti
            </div>
          </div>

          {/* Task cards */}
          <div className="space-y-3.5 flex-1">
            {completateTasks.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  Nessuna attività completata.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Trascina qui le attività terminate per contrassegnarle come completate.
                </p>
              </div>
            ) : (
              completateTasks.map((activity) => (
                <TaskCard
                  key={activity.id}
                  activity={activity}
                  subject={subjects.find((s) => s.id === activity.subjectId)}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                  onUpdateSubtask={onUpdateSubtask}
                  draggable={true}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggedActivity(null)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
