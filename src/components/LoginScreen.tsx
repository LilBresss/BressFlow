import React from 'react';
import { Sparkles, Calendar, Clock, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onGoogleLogin: () => Promise<void>;
  onDemoLogin: () => void;
  loading: boolean;
  error?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onGoogleLogin,
  onDemoLogin,
  loading,
  error,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 selection:bg-indigo-500/20">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Bress<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              L'agenda digitale personale per organizzare attività, studio, materie e sincronizzare le scadenze con Google Calendar.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Calcolo automatico dell'urgenza e countdown dinamico</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold">
            <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Materie con colori personalizzati e sottoattività</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Sincronizzazione in tempo reale con Google Calendar</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 text-center font-medium">
            {error}
          </div>
        )}

        {/* Login CTA buttons */}
        <div className="mt-8 space-y-3">
          {/* Official Sign in with Google Button */}
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white text-sm font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{loading ? 'Accesso in corso...' : 'Accedi con Google'}</span>
          </button>

          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={onDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors"
          >
            <span>Esplora come Utente Ospite / Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Security guarantee footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>I tuoi dati rimangono privati e protetti sul tuo account personale.</span>
        </div>
      </div>
    </div>
  );
};
