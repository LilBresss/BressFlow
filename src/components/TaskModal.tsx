import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  BookOpen,
  AlertCircle,
  FolderTree,
} from 'lucide-react';
import { Activity, Subject, Subtask } from '../types';
import { calculateUrgency, formatDurationDescriptive } from '../utils/urgency';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Activity>) => Promise<void>;
  initialActivity?: Activity | null;
  initialDate?: string;
  subjects: Subject[];
  availableParents?: Activity[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialActivity,
  initialDate,
  subjects,
  availableParents = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('18:00');
  const [subjectId, setSubjectId] = useState<string>('');
  const [manualHours, setManualHours] = useState(1);
  const [manualMinutes, setManualMinutes] = useState(0);

  // Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskHours, setNewSubtaskHours] = useState(0);
  const [newSubtaskMinutes, setNewSubtaskMinutes] = useState(30);

  // Parent activity relation
  const [isSubActivity, setIsSubActivity] = useState(false);
  const [parentActivityId, setParentActivityId] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset or populate state when modal opens or initialActivity changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialActivity) {
        setTitle(initialActivity.title);
        setDescription(initialActivity.description || '');
        setDueDate(initialActivity.dueDate);
        setDueTime(initialActivity.dueTime || '18:00');
        setSubjectId(initialActivity.subjectId || '');

        const totalManual = initialActivity.manualDurationMinutes || 60;
        setManualHours(Math.floor(totalManual / 60));
        setManualMinutes(totalManual % 60);

        setSubtasks(initialActivity.subtasks ? [...initialActivity.subtasks] : []);
        setIsSubActivity(Boolean(initialActivity.parentActivityId));
        setParentActivityId(initialActivity.parentActivityId || '');
      } else {
        const today = initialDate || new Date().toISOString().split('T')[0];
        setTitle('');
        setDescription('');
        setDueDate(today);
        setDueTime('18:00');
        setSubjectId('');
        setManualHours(1);
        setManualMinutes(0);
        setSubtasks([]);
        setIsSubActivity(false);
        setParentActivityId('');
      }
    }
  }, [isOpen, initialActivity, initialDate]);

  if (!isOpen) return null;

  // Calculate live automatic urgency preview
  const urgencyPreview = dueDate && dueTime ? calculateUrgency(dueDate, dueTime) : null;

  // Calculate total duration (sum of subtasks or manual duration)
  const hasSubtasks = subtasks.length > 0;
  const totalSubtasksMinutes = subtasks.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalDurationMinutes = hasSubtasks
    ? totalSubtasksMinutes
    : (manualHours || 0) * 60 + (manualMinutes || 0);

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const dur = (newSubtaskHours || 0) * 60 + (newSubtaskMinutes || 0);
    const newSub: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      durationMinutes: dur > 0 ? dur : 30,
      status: 'DA FARE',
    };

    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
    setNewSubtaskHours(0);
    setNewSubtaskMinutes(30);
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleUpdateSubtaskDuration = (id: string, newTotalMinutes: number) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, durationMinutes: Math.max(0, newTotalMinutes) } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Inserisci il nome dell\'attività.');
      return;
    }
    if (!dueDate) {
      setError('Seleziona la data di consegna.');
      return;
    }
    if (!dueTime) {
      setError('Seleziona l\'ora di consegna.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Partial<Activity> = {
        ...(initialActivity || {}),
        id: initialActivity?.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime,
        subjectId: subjectId || undefined,
        manualDurationMinutes: hasSubtasks ? totalSubtasksMinutes : totalDurationMinutes,
        subtasks,
        parentActivityId: isSubActivity && parentActivityId ? parentActivityId : undefined,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  // Filter possible parent activities (avoid circular relation)
  const validParents = availableParents.filter(
    (a) => (!initialActivity || a.id !== initialActivity.id) && !a.parentActivityId
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2
              id="task-modal-heading"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {initialActivity ? 'Modifica Attività' : 'Nuova Attività'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organizza le scadenze e calcola automaticamente durate e urgenza
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi finestra"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Titolo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Nome dell'attività *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Preparazione verifica di matematica"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-sm font-medium transition-all"
            />
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Descrizione facoltativa
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aggiungi dettagli, capitoli, link o note..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-sm transition-all resize-none"
            />
          </div>

          {/* Data, Ora e Materia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Data di consegna *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Ora di consegna *
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Materia
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nessuna materia</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ANTEPRIMA URGENZA AUTOMATICA (Nessuna selezione manuale come da specifica) */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Urgenza calcolata automaticamente
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assegnata in base alla distanza temporale dalla scadenza
                </p>
              </div>
            </div>

            {urgencyPreview && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${urgencyPreview.badgeBg} ${urgencyPreview.badgeText} ${urgencyPreview.badgeBorder}`}
              >
                {urgencyPreview.isExpired ? (
                  <span className="animate-pulse">● SCADUTA</span>
                ) : (
                  <>
                    <span>Livello {urgencyPreview.level}</span>
                    <span>•</span>
                    <span>{urgencyPreview.label}</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* SOTTOATTIVITÀ E CALCOLO DURATE */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sottoattività e Durata Complessiva
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasSubtasks
                    ? 'La durata totale è calcolata automaticamente sommando le sottoattività.'
                    : 'Inserisci la durata stimata per l\'attività principale.'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Durata Totale</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {formatDurationDescriptive(totalDurationMinutes)}
                </span>
              </div>
            </div>

            {/* Manual Duration (visible only if no subtasks) */}
            {!hasSubtasks && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-4 flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Stima manuale:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={manualHours}
                    onChange={(e) => setManualHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-center"
                  />
                  <span className="text-xs text-slate-500">ore</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-center"
                  />
                  <span className="text-xs text-slate-500">minuti</span>
                </div>
              </div>
            )}

            {/* List of subtasks */}
            {subtasks.length > 0 && (
              <div className="space-y-2 mb-3">
                {subtasks.map((st, index) => {
                  const h = Math.floor(st.durationMinutes / 60);
                  const m = st.durationMinutes % 60;

                  return (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {st.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-xs">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={h}
                            onChange={(e) => {
                              const newH = Math.max(0, parseInt(e.target.value, 10) || 0);
                              handleUpdateSubtaskDuration(st.id, newH * 60 + m);
                            }}
                            className="w-10 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-center text-xs bg-white dark:bg-slate-800"
                            aria-label="Ore sottoattività"
                          />
                          <span className="text-[11px] text-slate-400">h</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            step="5"
                            value={m}
                            onChange={(e) => {
                              const newM = Math.max(0, parseInt(e.target.value, 10) || 0);
                              handleUpdateSubtaskDuration(st.id, h * 60 + newM);
                            }}
                            className="w-12 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-center text-xs bg-white dark:bg-slate-800"
                            aria-label="Minuti sottoattività"
                          />
                          <span className="text-[11px] text-slate-400">m</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          aria-label={`Elimina sottoattività ${st.title}`}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add subtask input row */}
            <div className="p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Aggiungi sottoattività (es. Ripassare capitolo 1)..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={newSubtaskHours}
                  onChange={(e) => setNewSubtaskHours(parseInt(e.target.value, 10) || 0)}
                  className="w-10 px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xs"
                  placeholder="0"
                />
                <span className="text-[11px]">h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={newSubtaskMinutes}
                  onChange={(e) => setNewSubtaskMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-12 px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xs"
                  placeholder="30"
                />
                <span className="text-[11px]">m</span>
              </div>
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi</span>
              </button>
            </div>
          </div>

          {/* ATTIVITÀ SUPERIORE (Collegamento gerarchico facoltativo) */}
          {validParents.length > 0 && !hasSubtasks && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={isSubActivity}
                  onChange={(e) => setIsSubActivity(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aggiungi come sottoattività di un'altra attività principale
                </span>
              </label>

              {isSubActivity && (
                <div className="mt-2 pl-6">
                  <select
                    value={parentActivityId}
                    onChange={(e) => setParentActivityId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleziona attività principale...</option>
                    {validParents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.title} ({parent.dueDate})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* PULSANTI ANNULLA E SALVA */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving ? 'Salvataggio in corso...' : 'Salva Attività'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
