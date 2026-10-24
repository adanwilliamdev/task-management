import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { useToast } from '../components/Toast';
import * as notificationsApi from '../api/notifications';
import { getErrorMessage } from '../api/client';
import { formatDateTime, relativeTime } from '../lib/format';
import type { NotificationItem, NotificationType } from '../types';

const TYPE_META: Record<NotificationType, { label: string; className: string }> = {
  INFO: { label: 'INFO', className: 'text-steel-300 border-steel-400' },
  TASK_ASSIGNED: { label: 'TAREFA', className: 'text-amber-300 border-amber-400' },
  TASK_COMPLETED: { label: 'CONCLUÍDA', className: 'text-teal-300 border-teal-400' },
  TASK_DUE: { label: 'PRAZO', className: 'text-rust-300 border-rust-400' },
  SYSTEM: { label: 'SISTEMA', className: 'text-steel-300 border-steel-400' },
};

type Filter = 'all' | 'unread';

export default function Notifications() {
  const toast = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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
    void load();
  }, [load]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const visible = filter === 'unread' ? items.filter((n) => !n.read) : items;

  async function handleMarkAsRead(id: number) {
    try {
      const updated = await notificationsApi.markAsRead(id);
      setItems((cur) => cur.map((n) => (n.id === id ? updated : n)));
      notificationsApi.announceNotificationsChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível marcar como lida.'));
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setItems((cur) => cur.map((n) => ({ ...n, read: true })));
      notificationsApi.announceNotificationsChanged();
      toast.success('Todas as notificações foram marcadas como lidas.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível marcar todas como lidas.'));
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await notificationsApi.deleteNotification(id);
      setItems((cur) => cur.filter((n) => n.id !== id));
      notificationsApi.announceNotificationsChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível excluir a notificação.'));
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide uppercase">Notificações</h1>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={markingAll}
            className="text-sm text-steel-300 hover:underline disabled:opacity-50"
          >
            {markingAll ? 'Marcando…' : `Marcar todas como lidas (${unread})`}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex max-w-2xl items-center justify-between gap-4 border border-rust-500/30 bg-rust-500/10 p-3 text-sm text-rust-300"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="shrink-0 underline">
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="mb-4 flex gap-4 border-b border-board-700 text-sm" role="tablist" aria-label="Filtro">
          {(
            [
              ['all', `Todas (${items.length})`],
              ['unread', `Não lidas (${unread})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`-mb-px border-b-2 px-1 py-2 transition-colors ${
                filter === value ? 'border-amber-400 text-ink-100' : 'border-transparent text-ink-300 hover:text-ink-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="max-w-2xl space-y-px" aria-busy="true" aria-label="Carregando notificações">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse border border-board-700 bg-board-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="max-w-2xl border border-dashed border-board-700 px-3 py-16 text-center text-ink-500">
          Nenhuma notificação por enquanto. Quando você criar ou concluir tarefas, os avisos aparecem aqui.
        </p>
      ) : visible.length === 0 ? (
        <p className="max-w-2xl border border-dashed border-board-700 px-3 py-12 text-center text-ink-500">
          Nenhuma notificação não lida.
        </p>
      ) : (
        <ul className="max-w-2xl divide-y divide-board-700 border border-board-700 bg-board-800">
          {visible.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.INFO;
            return (
              <li
                key={n.id}
                className={`flex items-start justify-between gap-4 border-l-4 p-4 ${
                  n.read ? 'border-l-transparent' : 'border-l-amber-400'
                }`}
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`border px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${meta.className}`}>
                      {meta.label}
                    </span>
                    <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)} className="font-mono text-xs text-ink-500">
                      {relativeTime(n.createdAt)}
                    </time>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Não lida" />}
                  </div>
                  <h3 className="font-medium">{n.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-300">{n.message}</p>
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  {!n.read && (
                    <button type="button" onClick={() => void handleMarkAsRead(n.id)} className="text-steel-300 hover:underline">
                      Marcar como lida
                    </button>
                  )}
                  <button type="button" onClick={() => void handleDelete(n.id)} className="text-rust-400 hover:underline">
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Layout>
  );
}
