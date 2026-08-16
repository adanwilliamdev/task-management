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
      <h1 className="text-2xl font-semibold mb-6">Notificações</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-md p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">🔔</p>
          <p>Você não tem notificações.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg p-4 border flex items-start justify-between gap-4 ${
                n.read ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-900 border-brand-600/50'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{n.title}</h3>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
                <p className="text-sm text-slate-400">{n.message}</p>
                <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-3 text-xs shrink-0">
                {!n.read && (
                  <button onClick={() => handleMarkAsRead(n.id)} className="text-brand-400 hover:underline">
                    Marcar como lida
                  </button>
                )}
                <button onClick={() => handleDelete(n.id)} className="text-red-400 hover:underline">
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
