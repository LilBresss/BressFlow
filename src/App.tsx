import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, AppPage } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HomePage } from './pages/HomePage';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TaskModal } from './components/TaskModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginScreen } from './components/LoginScreen';
import {
  Activity,
  AppNotification,
  GoogleCalendarItem,
  Subject,
  TaskStatus,
  UserSettings,
} from './types';
import {
  fetchUserData,
  saveActivityApi,
  toggleActivityStatusApi,
  deleteActivityApi,
  saveSubjectApi,
  deleteSubjectApi,
  saveSettingsApi,
  markNotificationsReadApi,
  getVapidPublicKey,
  registerPushSubscription,
  testPushApi,
} from './services/api';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setAccessToken,
} from './services/firebase';
import {
  fetchGoogleCalendars,
  syncActivityToGoogleCalendar,
  deleteGoogleCalendarEvent,
} from './services/calendar';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  inAppNotifications: true,
  pushNotifications: false,
  notify24h: true,
  notify1h: true,
  notifyExpired: true,
  syncGoogleCalendar: false,
  selectedCalendarId: 'primary',
  syncSubtasks: false,
};

export default function App() {
  const [user, setUser] = useState<{
    id: string;
    name?: string;
    email?: string;
    photoURL?: string;
  } | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // App Navigation
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Google Calendar Integration
  const [googleAccessToken, setGoogleAccessTokenState] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [calendarSyncError, setCalendarSyncError] = useState<string | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | undefined>();

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load User Data from Backend
  const loadData = useCallback(async (userId: string) => {
    try {
      const data = await fetchUserData(userId);
      setActivities(data.activities || []);
      setSubjects(data.subjects || []);
      if (data.settings) {
        setSettings(data.settings);
        if (data.settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, []);

  // Initialize Auth
  useEffect(() => {
    // Check if ?autostart=1 or localStorage demo session exists
    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart');
    const savedUser = localStorage.getItem('bressflow_user');

    if (autostart === '1' || savedUser) {
      const parsedUser = savedUser
        ? JSON.parse(savedUser)
        : {
            id: 'demo_user',
            name: 'Simone Bressan',
            email: 'simonebressan2007@gmail.com',
            photoURL: undefined,
          };
      setUser(parsedUser);
      loadData(parsedUser.id);
      setAuthLoading(false);
      return;
    }

    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        if (firebaseUser) {
          const u = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Utente Google',
            email: firebaseUser.email || undefined,
            photoURL: firebaseUser.photoURL || undefined,
          };
          setUser(u);
          localStorage.setItem('bressflow_user', JSON.stringify(u));
          if (token) {
            setGoogleAccessTokenState(token);
            setAccessToken(token);
            try {
              const cals = await fetchGoogleCalendars(token);
              setCalendars(cals);
            } catch (e) {
              console.warn('Could not fetch initial calendars:', e);
            }
          }
          await loadData(u.id);
        } else {
          setUser(null);
          localStorage.removeItem('bressflow_user');
        }
        setAuthLoading(false);
      },
      () => {
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loadData]);

  // Periodic polling for notifications every 15s to keep UI fresh
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchUserData(user.id)
        .then((data) => {
          setNotifications(data.notifications || []);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Seed sample data for new user if empty
  useEffect(() => {
    if (user && activities.length === 0 && subjects.length > 0) {
      // Create initial seed tasks so user can test right away
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const mathSubject = subjects.find((s) => s.name === 'Matematica') || subjects[0];
      const italianSubject = subjects.find((s) => s.name === 'Italiano') || subjects[1];

      const seedTask1: Activity = {
        id: `act_seed_1`,
        userId: user.id,
        title: 'Preparazione verifica di matematica',
        description: 'Ripasso equazioni di secondo grado e studio capitoli 3-4.',
        dueDate: tomorrowStr,
        dueTime: '15:00',
        subjectId: mathSubject?.id,
        status: 'DA FARE',
        manualDurationMinutes: 120,
        subtasks: [
          {
            id: 'sub_seed_1',
            title: 'Ripassare capitolo 1 e definizioni',
            durationMinutes: 45,
            status: 'COMPLETATA',
          },
          {
            id: 'sub_seed_2',
            title: 'Svolgere esercizi pagina 120',
            durationMinutes: 60,
            status: 'DA FARE',
          },
          {
            id: 'sub_seed_3',
            title: 'Schematizzare formule',
            durationMinutes: 30,
            status: 'DA FARE',
          },
        ],
        createdAt: new Date().toISOString(),
      };

      const inThreeDays = new Date(now);
      inThreeDays.setDate(now.getDate() + 3);
      const inThreeDaysStr = inThreeDays.toISOString().split('T')[0];

      const seedTask2: Activity = {
        id: `act_seed_2`,
        userId: user.id,
        title: 'Tema di Italiano: testo argomentativo',
        description: 'Stesura saggio breve su tecnologia e società contemporanea.',
        dueDate: inThreeDaysStr,
        dueTime: '18:00',
        subjectId: italianSubject?.id,
        status: 'DA FARE',
        manualDurationMinutes: 90,
        subtasks: [],
        createdAt: new Date().toISOString(),
      };

      saveActivityApi(seedTask1, user.id).then((saved1) => {
        saveActivityApi(seedTask2, user.id).then((saved2) => {
          setActivities([saved1, saved2]);
        });
      });
    }
  }, [user, subjects, activities.length]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      setLoginError(null);
      const res = await googleSignIn();
      if (res) {
        const u = {
          id: res.user.uid,
          name: res.user.displayName || 'Utente Google',
          email: res.user.email || undefined,
          photoURL: res.user.photoURL || undefined,
        };
        setUser(u);
        localStorage.setItem('bressflow_user', JSON.stringify(u));
        setGoogleAccessTokenState(res.accessToken);
        setAccessToken(res.accessToken);
        await loadData(u.id);

        try {
          const cals = await fetchGoogleCalendars(res.accessToken);
          setCalendars(cals);
        } catch (e) {
          console.warn('Could not fetch calendars:', e);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Accesso Google non riuscito. Riprova o usa la modalità Demo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: 'demo_user',
      name: 'Simone Bressan',
      email: 'simonebressan2007@gmail.com',
    };
    setUser(demoUser);
    localStorage.setItem('bressflow_user', JSON.stringify(demoUser));
    loadData(demoUser.id);
  };

  const handleLogout = async () => {
    try {
      await logoutGoogle();
    } catch {}
    setUser(null);
    setGoogleAccessTokenState(null);
    localStorage.removeItem('bressflow_user');
    setCurrentPage('home');
  };

  // Google Calendar Connection Handlers
  const handleConnectGoogleCalendar = async () => {
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setGoogleAccessTokenState(res.accessToken);
        setAccessToken(res.accessToken);
        const cals = await fetchGoogleCalendars(res.accessToken);
        setCalendars(cals);
        showToast('Google Calendar collegato con successo!');
      }
    } catch (err: any) {
      setCalendarSyncError(err.message || 'Impossibile connettere Google Calendar');
    }
  };

  const handleDisconnectGoogleCalendar = () => {
    setGoogleAccessTokenState(null);
    setAccessToken(null);
    showToast('Google Calendar scollegato.');
  };

  // Automatic Google Calendar Event Sync when task is modified/created
  const syncSingleActivityToGoogle = async (
    activity: Activity,
    token: string | null = googleAccessToken
  ): Promise<string | undefined> => {
    if (!token) return undefined;
    try {
      const subject = subjects.find((s) => s.id === activity.subjectId);
      const result = await syncActivityToGoogleCalendar(
        token,
        settings.selectedCalendarId || 'primary',
        activity,
        subject?.name,
        settings.syncSubtasks
      );
      return result.eventId;
    } catch (err: any) {
      console.warn('Failed to sync event to Google Calendar:', err);
      setCalendarSyncError(err.message);
      return undefined;
    }
  };

  // Manual Batch Sync to Google Calendar
  const handleManualSyncCalendar = async () => {
    if (!googleAccessToken) {
      await handleConnectGoogleCalendar();
      return;
    }

    try {
      setSyncingCalendar(true);
      setCalendarSyncError(null);
      let count = 0;

      for (const act of activities) {
        const eventId = await syncSingleActivityToGoogle(act, googleAccessToken);
        if (eventId && eventId !== act.googleEventId) {
          act.googleEventId = eventId;
          await saveActivityApi(act, user?.id || 'default_user');
        }
        count++;
      }

      const nowStr = new Date().toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastSyncTimestamp(`Oggi alle ${nowStr}`);
      showToast(`${count} attività sincronizzate con Google Calendar!`);
    } catch (err: any) {
      setCalendarSyncError(err.message || 'Errore durante la sincronizzazione');
    } finally {
      setSyncingCalendar(false);
    }
  };

  // Web Push Subscription
  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Il tuo browser non supporta le notifiche Web Push.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permesso per le notifiche rifiutato nelle impostazioni del browser.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const publicKey = await getVapidPublicKey();
      // Convert VAPID public key to Uint8Array
      const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray,
      });

      await registerPushSubscription(subscription, user?.id || 'default_user');
      await saveSettingsApi({ pushNotifications: true }, user?.id || 'default_user');
      setSettings((prev) => ({ ...prev, pushNotifications: true }));
      showToast('Notifiche push abilitate con successo!');
    } catch (err: any) {
      console.error('Failed to enable push notifications:', err);
      alert(`Impossibile registrare le notifiche: ${err.message}`);
    }
  };

  const handleTestPush = async () => {
    await testPushApi(user?.id || 'default_user');
  };

  // Activity CRUD Operations
  const handleSaveActivity = async (activityData: Partial<Activity>) => {
    if (!user) return;
    const saved = await saveActivityApi(activityData, user.id);

    // Sync to Google Calendar if connected
    if (googleAccessToken) {
      syncSingleActivityToGoogle(saved, googleAccessToken).then(async (eventId) => {
        if (eventId && eventId !== saved.googleEventId) {
          saved.googleEventId = eventId;
          await saveActivityApi(saved, user.id);
          setActivities((prev) => prev.map((a) => (a.id === saved.id ? { ...a, googleEventId: eventId } : a)));
        }
      });
    }

    setActivities((prev) => {
      const index = prev.findIndex((a) => a.id === saved.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    showToast('Attività salvata con successo!');
  };

  const handleToggleActivityStatus = async (activity: Activity, completeSubtasks?: boolean) => {
    const updated = await toggleActivityStatusApi(activity.id, completeSubtasks);

    // Update in local state
    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    // Sync status change to Google Calendar if connected
    if (googleAccessToken) {
      syncSingleActivityToGoogle(updated, googleAccessToken);
    }

    const stateLabel = updated.status === 'COMPLETATA' ? 'completata' : 'riaperta';
    showToast(`Attività ${stateLabel}!`);
  };

  const handleDeleteActivity = (activity: Activity) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Elimina Attività',
      message: `Sei sicuro di voler eliminare definitivamente l'attività "${activity.title}"? Questa operazione non può essere annullata.`,
      confirmLabel: 'Elimina',
      isDestructive: true,
      onConfirm: async () => {
        // If event synced to Google Calendar, remove it
        if (googleAccessToken && activity.googleEventId) {
          deleteGoogleCalendarEvent(
            googleAccessToken,
            settings.selectedCalendarId || 'primary',
            activity.googleEventId
          ).catch((e) => console.warn('Could not delete calendar event:', e));
        }

        await deleteActivityApi(activity.id);
        setActivities((prev) => prev.filter((a) => a.id !== activity.id));
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('Attività eliminata.');
      },
    });
  };

  const handleUpdateSubtask = async (
    activity: Activity,
    subtaskId: string,
    newStatus: TaskStatus
  ) => {
    if (!user) return;
    const updatedSubtasks = (activity.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, status: newStatus } : s
    );

    const allSubtasksDone =
      updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.status === 'COMPLETATA');

    let updatedActivity: Activity = {
      ...activity,
      subtasks: updatedSubtasks,
    };

    if (allSubtasksDone && activity.status === 'DA FARE') {
      const confirmCompleteMain = window.confirm(
        'Tutte le sottoattività risultano completate. Vuoi completare anche l\'attività principale?'
      );
      if (confirmCompleteMain) {
        updatedActivity.status = 'COMPLETATA';
        updatedActivity.completedAt = new Date().toISOString();
      }
    }

    const saved = await saveActivityApi(updatedActivity, user.id);
    setActivities((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));

    if (googleAccessToken) {
      syncSingleActivityToGoogle(saved, googleAccessToken);
    }
  };

  // Subject CRUD Operations
  const handleSaveSubject = async (subjectData: Partial<Subject>) => {
    if (!user) return;
    const saved = await saveSubjectApi(subjectData, user.id);
    setSubjects((prev) => {
      const index = prev.findIndex((s) => s.id === saved.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = saved;
        return next;
      }
      return [...prev, saved];
    });
    showToast('Materia salvata!');
  };

  const handleDeleteSubject = async (
    subjectId: string,
    action: 'unassign' | 'delete_tasks'
  ) => {
    await deleteSubjectApi(subjectId, action);
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    if (action === 'delete_tasks') {
      setActivities((prev) => prev.filter((a) => a.subjectId !== subjectId));
    } else {
      setActivities((prev) =>
        prev.map((a) => (a.subjectId === subjectId ? { ...a, subjectId: undefined } : a))
      );
    }
    showToast('Materia eliminata.');
  };

  // Settings update
  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    const updated = await saveSettingsApi(newSettings, user.id);
    setSettings(updated);
    showToast('Impostazioni aggiornate!');
  };

  // Notifications mark read
  const handleMarkNotificationsRead = async (ids?: string[], all?: boolean) => {
    await markNotificationsReadApi(ids, all, user?.id);
    setNotifications((prev) =>
      prev.map((n) => (all || (ids && ids.includes(n.id)) ? { ...n, read: true } : n))
    );
  };

  // Open modal handlers
  const handleOpenNewTask = () => {
    setEditingActivity(null);
    setPrefilledDate(undefined);
    setTaskModalOpen(true);
  };

  const handleCreateActivityOnDate = (dateStr: string) => {
    setEditingActivity(null);
    setPrefilledDate(dateStr);
    setTaskModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setPrefilledDate(activity.dueDate);
    setTaskModalOpen(true);
  };

  // Show Login Screen if no user session
  if (!user && !authLoading) {
    return (
      <LoginScreen
        onGoogleLogin={handleGoogleLogin}
        onDemoLogin={handleDemoLogin}
        loading={authLoading}
        error={loginError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-row text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700/50 dark:border-slate-200 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar
          onOpenNewTask={handleOpenNewTask}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          activities={activities}
          subjects={subjects}
          notifications={notifications}
          onSelectActivity={handleEditActivity}
          onMarkNotificationsRead={handleMarkNotificationsRead}
        />

        <main className="flex-1 overflow-y-auto">
          {currentPage === 'home' && (
            <HomePage
              activities={activities}
              subjects={subjects}
              onToggleStatus={handleToggleActivityStatus}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onUpdateSubtask={handleUpdateSubtask}
              onOpenNewTask={handleOpenNewTask}
            />
          )}

          {currentPage === 'calendario' && (
            <CalendarPage
              activities={activities}
              subjects={subjects}
              onSelectActivity={handleEditActivity}
              onCreateActivityOnDate={handleCreateActivityOnDate}
            />
          )}

          {currentPage === 'attivita' && (
            <TasksPage
              activities={activities}
              subjects={subjects}
              onToggleStatus={handleToggleActivityStatus}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onUpdateSubtask={handleUpdateSubtask}
              onOpenNewTask={handleOpenNewTask}
            />
          )}

          {currentPage === 'materie' && (
            <SubjectsPage
              subjects={subjects}
              activities={activities}
              onSaveSubject={handleSaveSubject}
              onDeleteSubject={handleDeleteSubject}
              onToggleStatus={handleToggleActivityStatus}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onUpdateSubtask={handleUpdateSubtask}
            />
          )}

          {currentPage === 'statistiche' && (
            <StatsPage activities={activities} subjects={subjects} />
          )}

          {currentPage === 'impostazioni' && (
            <SettingsPage
              user={user}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onLogout={handleLogout}
              googleAccessToken={googleAccessToken}
              onConnectGoogleCalendar={handleConnectGoogleCalendar}
              onDisconnectGoogleCalendar={handleDisconnectGoogleCalendar}
              calendars={calendars}
              syncingCalendar={syncingCalendar}
              onManualSyncCalendar={handleManualSyncCalendar}
              syncedActivitiesCount={activities.filter((a) => Boolean(a.googleEventId)).length}
              lastSyncTimestamp={lastSyncTimestamp}
              syncError={calendarSyncError}
              onEnablePushNotifications={handleEnablePushNotifications}
              onTestPush={handleTestPush}
            />
          )}
        </main>
      </div>

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveActivity}
        initialActivity={editingActivity}
        initialDate={prefilledDate}
        subjects={subjects}
        availableParents={activities}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        isDestructive={confirmModalConfig.isDestructive}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
