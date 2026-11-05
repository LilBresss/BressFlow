import React, { useState, useEffect } from 'react';
import {
  Check,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Activity, Subject, Subtask } from '../types';
import {
  calculateUrgency,
  calculateCountdown,
  calculateDuration,
  calculateSubtaskProgress,
} from '../utils/urgency';

interface TaskCardProps {
  activity: Activity;
  subject?: Subject;
  onToggleStatus: (activity: Activity, completeSubtasks?: boolean) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onUpdateSubtask: (activity: Activity, subtaskId: string, newStatus: 'DA FARE' | 'COMPLETATA') => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, activity: Activity) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  activity,
  subject,
  onToggleStatus,
  onEdit,
  onDelete,
  onUpdateSubtask,
  draggable = true,
  onDragStart,
  onDragEnd,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update countdown every 10 seconds for crisp responsiveness
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const urgency = calculateUrgency(activity.dueDate, activity.dueTime, now);
  const countdown = calculateCountdown(activity.dueDate, activity.dueTime, now);
  const duration = calculateDuration(activity);
  const progress = calculateSubtaskProgress(activity.subtasks);

  const isCompleted = activity.status === 'COMPLETATA';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      // Trigger confetti celebration!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'],
        });
      } catch {}

      // If activity has incomplete subtasks, check with user
      const hasIncompleteSubtasks = activity.subtasks?.some((s) => s.status === 'DA FARE');
      if (hasIncompleteSubtasks) {
        const markSubtasks = window.confirm(
          'Questa attività ha delle sottoattività ancora da fare. Vuoi contrassegnare come completate anche tutte le sottoattività?'
        );
        onToggleStatus(activity, markSubtasks);
        return;
      }
    }
    onToggleStatus(activity, false);
  };

  const handleSubtaskCheck = (subtask: Subtask, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = subtask.status === 'COMPLETATA' ? 'DA FARE' : 'COMPLETATA';
    onUpdateSubtask(activity, subtask.id, nextStatus);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, activity)}
      onDragEnd={(e) => onDragEnd && onDragEnd(e)}
      className={`group relative rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md ${
        isCompleted
          ? 'border-slate-200/60 dark:border-slate-800/60 opacity-80 hover:opacity-100 bg-slate-50/50 dark:bg-slate-900/40'
          : urgency.isExpired
          ? 'border-red-300 dark:border-red-900/60 hover:border-red-400 ring-1 ring-red-400/20'
          : countdown.isUnder24Hours
          ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-400/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900'
      }`}
    >
      {/* Subject top indicator line */}
      {subject && (
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: subject.color }}
        />
      )}

      <div className="p-4 sm:p-5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {subject && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide"
                style={{
                  backgroundColor: `${subject.color}18`,
                  color: subject.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                {subject.name}
              </span>
            )}

            {/* Urgency Badge */}
            {!isCompleted && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${urgency.badgeBg} ${urgency.badgeText} ${urgency.badgeBorder}`}
              >
                {urgency.isExpired ? (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-extrabold animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    SCADUTA
                  </span>
                ) : (
                  <>
                    <span>Livello {urgency.level}</span>
                    <span className="opacity-60">•</span>
                    <span>{urgency.label}</span>
                  </>
                )}
              </span>
            )}

            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3 h-3" />
                Completata
              </span>
            )}
          </div>

          {/* Action buttons (Edit & Delete) */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(activity)}
              aria-label={`Modifica ${activity.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(activity)}
              aria-label={`Elimina ${activity.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title and Checkbox */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleCheckboxClick}
            aria-label={
              isCompleted
                ? `Riapri ${activity.title} (riporta a Da Fare)`
                : `Contrassegna ${activity.title} come completata`
            }
            className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
              }`}
            >
              {activity.title}
            </h3>

            {activity.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {activity.description}
              </p>
            )}
          </div>
        </div>

        {/* Info row: Scadenza, Countdown, Durata */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-y-2 gap-x-3 text-xs">
          {/* Due date & time */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {activity.dueDate} alle {activity.dueTime}
            </span>
          </div>

          {/* Duration */}
          {duration.totalMinutes > 0 && (
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{duration.formatted}</span>
            </div>
          )}
        </div>

        {/* Real-time Countdown bar */}
        {!isCompleted && (
          <div
            className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
              urgency.isExpired
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold'
                : countdown.isUnder24Hours
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold animate-pulse'
                : 'bg-slate-100/70 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400">
              Tempo rimanente:
            </span>
            <span className="text-right font-mono truncate">{countdown.formatted}</span>
          </div>
        )}

        {/* Subtasks Progress Bar & Toggle */}
        {activity.subtasks && activity.subtasks.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  Sottoattività ({progress.completed}/{progress.total})
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  {progress.percentage}%
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[11px]">{expanded ? 'Nascondi' : 'Mostra'}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Progress Bar */}
            <div className="mt-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            {/* Expanded subtasks checklist */}
            {expanded && (
              <div className="mt-3 space-y-1.5 pl-1 pr-1">
                {activity.subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={(e) => handleSubtaskCheck(st, e)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          st.status === 'COMPLETATA'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {st.status === 'COMPLETATA' && <Check className="w-3 h-3" />}
                      </div>
                      <span
                        className={`truncate ${
                          st.status === 'COMPLETATA'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>

                    {st.durationMinutes > 0 && (
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                        {st.durationMinutes}m
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
