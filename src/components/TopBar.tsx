import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Menu,
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Activity, AppNotification, Subject } from '../types';
import { calculateCountdown, calculateUrgency } from '../utils/urgency';

interface TopBarProps {
  onOpenNewTask: () => void;
  onOpenMobileMenu: () => void;
  activities: Activity[];
  subjects: Subject[];
  notifications: AppNotification[];
  onSelectActivity: (activity: Activity) => void;
  onMarkNotificationsRead: (ids?: string[], all?: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNewTask,
  onOpenMobileMenu,
  activities,
  subjects,
  notifications,
  onSelectActivity,
  onMarkNotificationsRead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Search logic across activities, subtasks, descriptions, subjects
  const searchResults = searchQuery.trim()
    ? activities.filter((act) => {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description?.toLowerCase().includes(q);
        const subject = subjects.find((s) => s.id === act.subjectId);
        const matchSubj = subject?.name.toLowerCase().includes(q);
        const matchSubtasks = act.subtasks?.some((st) => st.title.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchSubj || matchSubtasks;
      })
    : [];

  const handleResultClick = (act: Activity) => {
    onSelectActivity(act);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Mobile Hamburger & Logo preview */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Apri menu"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
          Bress<span className="text-indigo-600">Flow</span>
        </span>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Cerca attività, materie, sottoattività..."
            aria-label="Cerca in tutta l'agenda"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              aria-label="Cancella ricerca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Dropdown Results */}
        {searchOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nessun risultato trovato per "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Risultati ({searchResults.length})
                </div>
                {searchResults.map((act) => {
                  const subj = subjects.find((s) => s.id === act.subjectId);
                  const urgency = calculateUrgency(act.dueDate, act.dueTime);
                  const cd = calculateCountdown(act.dueDate, act.dueTime);

                  return (
                    <button
                      key={act.id}
                      onClick={() => handleResultClick(act)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-xs font-bold ${
                              act.status === 'COMPLETATA'
                                ? 'line-through text-slate-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {act.title}
                          </span>
                          {subj && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                backgroundColor: `${subj.color}15`,
                                color: subj.color,
                              }}
                            >
                              {subj.name}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              act.status === 'COMPLETATA'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}
                          >
                            {act.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Scadenza: {act.dueDate} {act.dueTime}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {act.status !== 'COMPLETATA' ? (
                          <span
                            className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                              urgency.isExpired
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/40'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}
                          >
                            {urgency.isExpired ? 'SCADUTA' : cd.formatted}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Fatto
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Notification Bell + "+ NUOVA ATTIVITÀ" */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            aria-label="Notifiche"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Bell Notifications Dropdown */}
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifiche Scadenze
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Avvisi automatici di consegna
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => onMarkNotificationsRead(undefined, true)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Segna tutte come lette
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Nessuna notifica presente.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const act = activities.find((a) => a.id === notif.activityId);

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (act) {
                            onSelectActivity(act);
                            setBellOpen(false);
                          }
                          onMarkNotificationsRead([notif.id]);
                        }}
                        className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              notif.type === 'expired'
                                ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                                : notif.type === '1h'
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                                : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {notif.activityTitle}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Scadenza: {notif.dueDateTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button "+ NUOVA ATTIVITÀ" (Always present on all pages!) */}
        <button
          onClick={onOpenNewTask}
          aria-label="Crea nuova attività"
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">NUOVA ATTIVITÀ</span>
          <span className="sm:hidden">NUOVA</span>
        </button>
      </div>
    </header>
  );
};
