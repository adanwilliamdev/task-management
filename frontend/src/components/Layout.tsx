import { type ReactNode, useEffect, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as notificationsApi from '../api/notifications';
import { IconBell, IconBoard, IconLogout, IconUser, Logo } from './Icons';

export const NOTIFICATIONS_CHANGED = 'taskflow:notifications-changed';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    function refresh() {
      notificationsApi
        .unreadCount()
        .then((r) => {
          if (active) setUnread(r.unread);
        })
        .catch(() => {});
    }
    refresh();
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    return () => {
      active = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
    };
  }, [location.pathname]);

  const navItems = [
    { to: '/tasks', label: 'Tarefas', icon: IconBoard, badge: 0 },
    { to: '/notifications', label: 'Notificações', icon: IconBell, badge: unread },
    { to: '/profile', label: 'Perfil', icon: IconUser, badge: 0 },
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initial = (user?.username ?? '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen md:pl-64">
      {/* Barra lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-night-950/60 px-4 py-6 backdrop-blur-xl md:flex">
        <Link to="/tasks" className="flex items-center gap-3 px-2">
          <Logo className="h-9 w-9" />
          <span className="font-display text-xl font-bold tracking-tight">TaskFlow</span>
        </Link>

        <nav className="mt-10 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-iris-500/15 text-iris-300'
                    : 'text-fog-500 hover:bg-white/[0.05] hover:text-fog-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute -left-4 h-5 w-1 rounded-r-full bg-iris-400 transition-all duration-300 ${
                      isActive ? 'opacity-100' : 'h-0 opacity-0'
                    }`}
                  />
                  <Icon className="h-[1.15rem] w-[1.15rem]" />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className="rounded-full bg-iris-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-iris-400 to-iris-600 font-display text-lg font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.username}</p>
            <p className="truncate text-xs text-fog-500">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="icon-btn" data-tone="danger" aria-label="Sair" title="Sair">
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Barra superior (mobile) */}
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-x-0 border-t-0 px-4 py-3 md:hidden">
        <Link to="/tasks" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-lg font-bold tracking-tight">TaskFlow</span>
        </Link>
        <button onClick={handleLogout} className="icon-btn" aria-label="Sair">
          <IconLogout className="h-[1.1rem] w-[1.1rem]" />
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-12 md:pt-10">{children}</main>

      {/* Navegação inferior (mobile) */}
      <nav className="glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl p-1.5 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.7)] md:hidden">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors ${
                isActive ? 'bg-iris-500/15 text-iris-300' : 'text-fog-500'
              }`
            }
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge > 0 && (
                <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-iris-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {badge}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
