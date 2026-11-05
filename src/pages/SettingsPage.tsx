import React, { useState } from 'react';
import {
  User,
  Moon,
  Sun,
  Bell,
  Calendar,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { GoogleCalendarItem, UserSettings } from '../types';

interface SettingsPageProps {
  user: { name?: string; email?: string; photoURL?: string } | null;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onLogout: () => void;
  // Google Calendar integration props
  googleAccessToken: string | null;
  onConnectGoogleCalendar: () => Promise<void>;
  onDisconnectGoogleCalendar: () => void;
  calendars: GoogleCalendarItem[];
  syncingCalendar: boolean;
  onManualSyncCalendar: () => Promise<void>;
  syncedActivitiesCount: number;
  lastSyncTimestamp?: string;
  syncError?: string | null;
  // Push notifications
  onEnablePushNotifications: () => Promise<void>;
  onTestPush: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  settings,
  onUpdateSettings,
  onLogout,
  googleAccessToken,
  onConnectGoogleCalendar,
  onDisconnectGoogleCalendar,
  calendars,
  syncingCalendar,
  onManualSyncCalendar,
  syncedActivitiesCount,
  lastSyncTimestamp,
  syncError,
  onEnablePushNotifications,
  onTestPush,
}) => {
  const [testingPush, setTestingPush] = useState(false);
  const [testPushFeedback, setTestPushFeedback] = useState<string | null>(null);

  const isCalendarConnected = Boolean(googleAccessToken);

  const handleToggleTheme = (theme: 'light' | 'dark') => {
    onUpdateSettings({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleTestPushClick = async () => {
    try {
      setTestingPush(true);
      setTestPushFeedback(null);
      await onTestPush();
      setTestPushFeedback('Notifica push inviata con successo!');
    } catch (err: any) {
      setTestPushFeedback(`Errore: ${err.message || 'Impossibile inviare la notifica'}`);
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Impostazioni
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gestisci account, aspetto, notifiche e sincronizzazione Google Calendar
        </p>
      </div>

      {/* 16.1 SEZIONE ACCOUNT */}
      <section aria-labelledby="account-heading" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 id="account-heading" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-600" />
          Account Utente
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center gap-3.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || 'Account'}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                <User className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {user?.name || 'Utente BressFlow'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email || 'Ambiente personale protetto'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sessione attiva e database sincronizzato</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnetti</span>
          </button>
        </div>
      </section>

      {/* 17. GOOGLE CALENDAR SINCRONIZZAZIONE (Core brief requirement!) */}
      <section aria-labelledby="gcal-heading" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 id="gcal-heading" className="text-base font-bold text-slate-900 dark:text-white">
                Integrazione Google Calendar
              </h2>
              <p className="text-xs text-slate-500">
                Sincronizzazione unidirezionale automatica: BressFlow → Google Calendar
              </p>
            </div>
          </div>

          {/* Connection status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isCalendarConnected
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCalendarConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {isCalendarConnected ? 'Connesso' : 'Non collegato'}
          </span>
        </div>

        {syncError && (
          <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 space-y-5">
          {/* Connection Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Stato autorizzazione
              </p>
              <p className="text-[11px] text-slate-500">
                {isCalendarConnected
                  ? `Accesso concesso a Google Calendar per ${user?.email || 'account corrente'}`
                  : 'Collega il tuo account per inviare automaticamente le scadenze a Google Calendar.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isCalendarConnected ? (
                <button
                  type="button"
                  onClick={onConnectGoogleCalendar}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  COLLEGA GOOGLE CALENDAR
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onConnectGoogleCalendar}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600"
                  >
                    Riconnetti
                  </button>
                  <button
                    type="button"
                    onClick={onDisconnectGoogleCalendar}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40"
                  >
                    Scollega
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 17.2 Selezione del Calendario */}
          {isCalendarConnected && (
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/50 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Seleziona il calendario di destinazione
                </label>
                <select
                  value={settings.selectedCalendarId || 'primary'}
                  onChange={(e) => onUpdateSettings({ selectedCalendarId: e.target.value })}
                  className="w-full sm:w-80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="primary">Calendario Principale</option>
                  {calendars
                    .filter((c) => !c.primary)
                    .map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.summary}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Le nuove attività create o modificate in BressFlow verranno sincronizzate in questo calendario.
                </p>
              </div>

              {/* 17.5 Opzione Sottoattività */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.syncSubtasks}
                  onChange={(e) => onUpdateSettings({ syncSubtasks: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Sincronizza anche le sottoattività
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Include l'elenco delle sottoattività nella descrizione dell'evento Google Calendar.
                  </span>
                </div>
              </label>

              {/* 17.6 Controllo della Sincronizzazione */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs space-y-0.5">
                  <p className="text-slate-500">
                    Attività sincronizzate:{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {syncedActivitiesCount}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Ultima sincronizzazione:{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {lastSyncTimestamp || 'Non ancora effettuata'}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onManualSyncCalendar}
                  disabled={syncingCalendar}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingCalendar ? 'animate-spin' : ''}`} />
                  <span>{syncingCalendar ? 'Sincronizzazione...' : 'SINCRONIZZA ORA'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 16.3 SEZIONE NOTIFICHE */}
      <section aria-labelledby="notif-heading" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 id="notif-heading" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-indigo-600" />
          Notifiche e Avvisi Scadenze
        </h2>

        <div className="space-y-4">
          {/* Notifiche interne */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Notifiche interne all'applicazione
              </p>
              <p className="text-[11px] text-slate-500">
                Mostra le scadenze nella campanella superiore dell'agenda.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.inAppNotifications}
              onChange={(e) => onUpdateSettings({ inAppNotifications: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {/* Notifiche Push Browser */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Notifiche Push del browser (Web Push API)
              </p>
              <p className="text-[11px] text-slate-500">
                Ricevi avvisi tramite Service Worker anche a browser in secondo piano o scheda chiusa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEnablePushNotifications}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings.pushNotifications
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {settings.pushNotifications ? '✓ Push Attive' : 'Attiva Notifiche Push'}
              </button>

              {settings.pushNotifications && (
                <button
                  type="button"
                  onClick={handleTestPushClick}
                  disabled={testingPush}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                >
                  <Send className="w-3 h-3" />
                  <span>Test Push</span>
                </button>
              )}
            </div>
          </div>

          {testPushFeedback && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2">
              {testPushFeedback}
            </p>
          )}

          {/* Anticipi personalizzati */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Anticipi degli avvisi
            </span>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Avviso 24 ore prima della scadenza
              </span>
              <input
                type="checkbox"
                checked={settings.notify24h}
                onChange={(e) => onUpdateSettings({ notify24h: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Avviso 1 ora prima della scadenza
              </span>
              <input
                type="checkbox"
                checked={settings.notify1h}
                onChange={(e) => onUpdateSettings({ notify1h: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Avviso nel momento in cui l'attività diventa scaduta
              </span>
              <input
                type="checkbox"
                checked={settings.notifyExpired}
                onChange={(e) => onUpdateSettings({ notifyExpired: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>
      </section>

      {/* 16.2 SEZIONE ASPETTO E FORMATO */}
      <section aria-labelledby="appearance-heading" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 id="appearance-heading" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-indigo-600" />
          Aspetto e Formato
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tema chiaro/scuro */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Tema interfaccia
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleTheme('light')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  settings.theme === 'light'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Chiaro</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleTheme('dark')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-slate-800 text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Scuro</span>
              </button>
            </div>
          </div>

          {/* Formato Data */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Formato data
            </span>
            <select
              value={settings.dateFormat}
              onChange={(e) => onUpdateSettings({ dateFormat: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Italiano)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            </select>
          </div>

          {/* Formato Orario */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Formato orario
            </span>
            <select
              value={settings.timeFormat}
              onChange={(e) => onUpdateSettings({ timeFormat: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            >
              <option value="24h">24 Ore (18:00)</option>
              <option value="12h">12 Ore (6:00 PM)</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};
