import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  ListTodo,
  Layers,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Activity, Subject } from '../types';
import { calculateDuration } from '../utils/urgency';
import { TaskCard } from '../components/TaskCard';

interface SubjectsPageProps {
  subjects: Subject[];
  activities: Activity[];
  onSaveSubject: (subject: Partial<Subject>) => Promise<void>;
  onDeleteSubject: (subjectId: string, action: 'unassign' | 'delete_tasks') => Promise<void>;
  onToggleStatus: (activity: Activity, completeSubtasks?: boolean) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
  onUpdateSubtask: (activity: Activity, subtaskId: string, newStatus: 'DA FARE' | 'COMPLETATA') => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blu
  '#ef4444', // Rosso
  '#10b981', // Verde
  '#f97316', // Arancione
  '#8b5cf6', // Viola
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#eab308', // Giallo
];

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  subjects,
  activities,
  onSaveSubject,
  onDeleteSubject,
  onToggleStatus,
  onEditActivity,
  onDeleteActivity,
  onUpdateSubtask,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Subject details modal (shows activities for selected subject)
  const [selectedSubjectForDetail, setSelectedSubjectForDetail] = useState<Subject | null>(null);

  // Delete subject confirmation with choice modal
  const [deleteModalSubject, setDeleteModalSubject] = useState<Subject | null>(null);
  const [deleteAction, setDeleteAction] = useState<'unassign' | 'delete_tasks'>('unassign');

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setName('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubject(sub);
    setName(sub.name);
    setColor(sub.color);
    setModalOpen(true);
  };

  const handleOpenDelete = (sub: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalSubject(sub);
    setDeleteAction('unassign');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      await onSaveSubject({
        ...(editingSubject || {}),
        id: editingSubject?.id || `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        color,
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalSubject) return;
    try {
      await onDeleteSubject(deleteModalSubject.id, deleteAction);
      if (selectedSubjectForDetail?.id === deleteModalSubject.id) {
        setSelectedSubjectForDetail(null);
      }
      setDeleteModalSubject(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter activities for detail view
  const detailActivities = selectedSubjectForDetail
    ? activities.filter((a) => a.subjectId === selectedSubjectForDetail.id)
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Materie e Corsi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organizza le tue attività con colori dedicati e monitora il carico di studio
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ NUOVA MATERIA</span>
        </button>
      </div>

      {/* Grid of Subjects Cards (Section 7.1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => {
          const subTasks = activities.filter((a) => a.subjectId === sub.id);
          const totalTasks = subTasks.length;
          const completedTasks = subTasks.filter((a) => a.status === 'COMPLETATA').length;
          const daFareTasks = subTasks.filter((a) => a.status === 'DA FARE').length;
          const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Estimated total minutes
          const totalMinutes = subTasks.reduce((sum, a) => sum + calculateDuration(a).totalMinutes, 0);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubjectForDetail(sub)}
              className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Top Accent Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: sub.color }}
              />

              {/* Title & Actions */}
              <div className="flex items-center justify-between gap-3 mt-1 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: sub.color }}
                  />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {sub.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEdit(sub, e)}
                    aria-label={`Modifica materia ${sub.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(sub, e)}
                    aria-label={`Elimina materia ${sub.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats Metrics (Section 7.1) */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Totali</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {totalTasks}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-500 block">Da Fare</span>
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                    {daFareTasks}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 block">Fatte</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {completedTasks}
                  </span>
                </div>
              </div>

              {/* Completion Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Completamento
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {percentage}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: sub.color,
                    }}
                  />
                </div>
              </div>

              {/* Estimated Work Hours */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Ore di lavoro previste:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {hours > 0 ? `${hours}h ` : ''}
                  {minutes}m
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Subject Detail Panel / Modal */}
      {selectedSubjectForDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full shadow-xs"
                  style={{ backgroundColor: selectedSubjectForDetail.color }}
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Attività di {selectedSubjectForDetail.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {detailActivities.length} attività associate a questa materia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubjectForDetail(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto flex-1 space-y-3 pr-1">
              {detailActivities.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Nessuna attività associata a questa materia.
                </div>
              ) : (
                detailActivities.map((act) => (
                  <TaskCard
                    key={act.id}
                    activity={act}
                    subject={selectedSubjectForDetail}
                    onToggleStatus={onToggleStatus}
                    onEdit={onEditActivity}
                    onDelete={onDeleteActivity}
                    onUpdateSubtask={onUpdateSubtask}
                    draggable={false}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Subject Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSubject ? 'Modifica Materia' : 'Nuova Materia'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Nome della materia *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Matematica, Italiano, Fisica..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Colore distintivo
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c
                          ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {/* Custom color input */}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent"
                    title="Colore personalizzato"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {saving ? 'Salvataggio...' : 'Salva Materia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Choice (Prompt Section 7: evitare di eliminare automaticamente) */}
      {deleteModalSubject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Elimina materia "{deleteModalSubject.name}"
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Cosa desideri fare con le attività collegate a questa materia?
            </p>

            <div className="space-y-2 mb-6">
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteAction === 'unassign'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="deleteAction"
                  checked={deleteAction === 'unassign'}
                  onChange={() => setDeleteAction('unassign')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Mantieni le attività (Consigliato)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Le attività rimarranno nella tua agenda ma senza materia assegnata.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteAction === 'delete_tasks'
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="deleteAction"
                  checked={deleteAction === 'delete_tasks'}
                  onChange={() => setDeleteAction('delete_tasks')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 block">
                    Elimina anche tutte le attività collegate
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Tutte le attività associate a questa materia verranno cancellate definitivamente.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalSubject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs"
              >
                Conferma Eliminazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
