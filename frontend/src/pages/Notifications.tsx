import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import * as notificationsApi from '../api/notifications';
import type { NotificationItem } from '../types';
import { getErrorMessage } from '../api/client';

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.listNotifications();
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkAsRead(id: number) {
    await notificationsApi.markAsRead(id);
    await load();
  }

  async function handleDelete(id: number) {
    await notificationsApi.deleteNotification(id);
    await load();
  }

  return (
    <Layout>
      <h1 className="mb-6 font-display text-3xl tracking-wide uppercase">Notificações</h1>

      {error && (
        <div className="mb-4 border border-rust-500/30 bg-rust-500/10 p-3 text-sm text-rust-300">{error}</div>
      )}

      {loading ? (
        <p className="text-ink-500">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="border border-dashed border-board-700 px-3 py-16 text-center text-ink-500">
          Nenhuma notificação registrada.
        </p>
      ) : (
        <div className="max-w-2xl divide-y divide-board-700 border border-board-700 bg-board-800">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 border-l-4 p-4 ${
                n.read ? 'border-l-transparent' : 'border-l-amber-400'
              }`}
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-500">
                    {new Date(n.createdAt).toLocaleString('pt-BR')}
                  </span>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                </div>
                <h3 className="font-medium">{n.title}</h3>
                <p className="mt-0.5 text-sm text-ink-300">{n.message}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                {!n.read && (
                  <button onClick={() => handleMarkAsRead(n.id)} className="text-steel-300 hover:underline">
                    Marcar como lida
                  </button>
                )}
                <button onClick={() => handleDelete(n.id)} className="text-rust-400 hover:underline">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
