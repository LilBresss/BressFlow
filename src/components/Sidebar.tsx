import React from 'react';
import {
  Home,
  Calendar,
  CheckSquare,
  BookOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';

export type AppPage = 'home' | 'calendario' | 'attivita' | 'materie' | 'statistiche' | 'impostazioni';

interface SidebarProps {
  currentPage: AppPage;
  onSelectPage: (page: AppPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  user: { name?: string; email?: string; photoURL?: string } | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  user,
  onLogout,
}) => {
  const menuItems = [
    { id: 'home' as AppPage, label: 'HOME', icon: Home },
    { id: 'calendario' as AppPage, label: 'CALENDARIO', icon: Calendar },
    { id: 'attivita' as AppPage, label: 'ATTIVITÀ', icon: CheckSquare },
    { id: 'materie' as AppPage, label: 'MATERIE', icon: BookOpen },
    { id: 'statistiche' as AppPage, label: 'STATISTICHE', icon: BarChart3 },
    { id: 'impostazioni' as AppPage, label: 'IMPOSTAZIONI', icon: Settings },
  ];

  const handleItemClick = (page: AppPage) => {
    onSelectPage(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside
      className={`h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Collapse Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Bress<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-0.5">
                  Agenda Digitale
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Espandi menu laterale' : 'Comprimi menu laterale'}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1.5 mt-2" aria-label="Menu principale">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                aria-label={`Apri ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-xs font-bold transition-all relative group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${collapsed ? 'justify-center' : 'justify-start'}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}
                />
                {!collapsed && <span className="tracking-wide">{item.label}</span>}

                {/* Tooltip in collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile & session footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <div
          className={`p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 flex items-center gap-3 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name || 'Account'}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/30 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Utente'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {user?.email || 'Connesso'}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={onLogout}
              aria-label="Disconnetti account"
              title="Esci"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigazione mobile"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
