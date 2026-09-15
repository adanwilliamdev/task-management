import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as notificationsApi from '../api/notifications';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    notificationsApi
      .unreadCount()
      .then((r) => {
        if (active) setUnread(r.unread);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const navItems = [
    { to: '/tasks', label: 'Tarefas' },
    { to: '/notifications', label: 'Notificações', badge: unread > 0 ? unread : undefined },
    { to: '/profile', label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-board-950 text-ink-100">
      <header className="sticky top-0 z-10 border-b border-board-700 bg-board-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/tasks" className="flex items-baseline gap-1 font-display text-2xl tracking-wide uppercase">
            <span>Task</span>
            <span className="text-amber-400">Flow</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative border-b-2 px-2 py-1.5 transition-colors sm:px-3 ${
                    active
                      ? 'border-amber-400 text-ink-100'
                      : 'border-transparent text-ink-300 hover:text-ink-100'
                  }`}
                >
                  {item.label}
                  {item.badge !== undefined && (
                    <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-medium text-board-950">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="ml-2 flex items-center gap-3 border-l border-board-700 pl-3 sm:ml-3 sm:pl-4">
              <span className="hidden font-mono text-xs text-ink-500 sm:inline">{user?.username}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-ink-300 transition-colors hover:text-rust-400"
              >
                Sair
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
