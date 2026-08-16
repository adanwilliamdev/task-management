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
    { to: '/notifications', label: `Notificações${unread > 0 ? ` (${unread})` : ''}` },
    { to: '/profile', label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/tasks" className="font-semibold text-lg text-brand-500 flex items-center gap-2">
            <span>🚀</span> TaskFlow
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md transition ${
                  location.pathname.startsWith(item.to)
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-800">
              <span className="text-slate-400 hidden sm:inline">{user?.username}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-3 py-1.5 rounded-md text-slate-300 hover:bg-slate-800 transition"
              >
                Sair
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
