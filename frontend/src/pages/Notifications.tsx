import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, NOTIFICATIONS_CHANGED } from '../components/Layout';
import { useToast } from '../components/Toast';
import { IconAlert, IconBell, IconCalendar, IconCheck, IconInfo, IconSparkle, IconTrash } from '../components/Icons';
import * as notificationsApi from '../api/notifications';
import type { NotificationItem, NotificationType } from '../types';
import { getErrorMessage } from '../api/client';
import { relativeTime } from '../lib/format';

const TYPE_STYLE: Record<NotificationType, { icon: typeof IconInfo; tone: string }> = {
  INFO: { icon: IconInfo, tone: 'bg-sky-soft/15 text-sky-soft' },
  TASK_ASSIGNED: { icon: IconSparkle, tone: 'bg-iris-500/15 text-iris-300' },
  TASK_DUE: { icon: IconCalendar, tone: 'bg-sun-400/15 text-sun-400' },
  SYSTEM: { icon: IconAlert, tone: 'bg-white/10 text-fog-300' },
};

function notifyChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export default function Notifications() {
  const toast = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await notificationsApi.listNotifications());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const visible = useMemo(() => (onlyUnread ? items.filter((n) => !n.read) : items), [items, onlyUnread]);

  async function handleMarkAsRead(id: number) {
    const previous = items;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markAsRead(id);
      notifyChanged();
    } catch (err) {
      setItems(previous);
      toast.error(getErrorMessage(err));
    }
  }

  async function handleMarkAll() {
    const previous = items;
    const unread = items.filter((n) => !n.read);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(unread.map((n) => notificationsApi.markAsRead(n.id)));
      notifyChanged();
      toast.success('Tudo marcado como lido');
    } catch (err) {
      setItems(previous);
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    const previous = items;
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationsApi.deleteNotification(id);
      notifyChanged();
    } catch (err) {
      setItems(previous);
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <Layout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Notificações</h1>
          <p className="mt-1.5 text-fog-500">
            {loading ? 'Carregando…' : unreadCount > 0 ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}` : 'Você está em dia.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="btn btn-ghost border-white/10">
            <IconCheck className="h-4 w-4" />
            Marcar tudo como lido
          </button>
        )}
      </div>

      <div className="mt-6 inline-flex gap-1 rounded-xl bg-night-850 p-1" role="group" aria-label="Filtrar notificações">
        {([[false, 'Todas'], [true, 'Não lidas']] as const).map(([value, label]) => (
          <button
            key={label}
            onClick={() => setOnlyUnread(value)}
            aria-pressed={onlyUnread === value}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
              onlyUnread === value ? 'bg-night-600 text-fog-100' : 'text-fog-500 hover:text-fog-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="anim-fade mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-400">
          <span>{error}</span>
          <button onClick={load} className="font-semibold hover:underline">
            Tentar de novo
          </button>
        </div>
      )}

      <div className="mt-5 max-w-2xl">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="surface anim-pop flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-fog-300">
              <IconBell className="h-7 w-7" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold">
              {onlyUnread ? 'Nada novo por aqui' : 'Nenhuma notificação ainda'}
            </h2>
            <p className="mt-1.5 max-w-xs text-sm text-fog-500">
              {onlyUnread ? 'Todas as notificações já foram lidas.' : 'Avisos sobre suas tarefas vão aparecer aqui.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((n, index) => {
              const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.INFO;
              const Icon = style.icon;
              return (
                <li
                  key={n.id}
                  style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                  className={`surface anim-card group flex items-start gap-4 p-4 transition-colors ${
                    n.read ? 'opacity-75 hover:opacity-100' : 'border-iris-400/25'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-snug">{n.title}</h3>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-iris-400" aria-label="Não lida" />}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-fog-300">{n.message}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <time className="text-xs text-fog-500" dateTime={n.createdAt} title={new Date(n.createdAt).toLocaleString('pt-BR')}>
                        {relativeTime(n.createdAt)}
                      </time>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-xs font-semibold text-iris-300 transition-colors hover:text-iris-400"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="icon-btn -mr-1 -mt-1 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                    data-tone="danger"
                    aria-label="Excluir notificação"
                    title="Excluir"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Layout>
  );
}
