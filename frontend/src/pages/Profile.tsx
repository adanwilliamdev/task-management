import { useEffect, useState, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import * as profileApi from '../api/profile';
import type { UserProfile } from '../types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const fieldClass =
  'w-full border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await profileApi.getMyProfile();
      setProfile(data);
      setFullName(data.fullName ?? '');
      setBio(data.bio ?? '');
      setPhone(data.phone ?? '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await profileApi.updateMyProfile({ fullName, bio, phone });
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const initial = (user?.username ?? '?').charAt(0).toUpperCase();

  return (
    <Layout>
      <h1 className="mb-6 font-display text-3xl tracking-wide uppercase">Perfil</h1>

      {loading ? (
        <p className="text-ink-500">Carregando…</p>
      ) : (
        <div className="max-w-lg space-y-6">
          <div className="border-t-4 border-amber-400 bg-board-800 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-amber-400 font-display text-2xl text-amber-400">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{user?.username}</p>
                <p className="truncate text-sm text-ink-500">{user?.email}</p>
              </div>
            </div>
            {profile?.createdAt && (
              <p className="mt-4 border-t border-board-700 pt-3 font-mono text-xs text-ink-500">
                Cadastrado em {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border border-board-700 bg-board-800 p-5">
            <div>
              <label className="mb-1 block text-sm text-ink-300">Nome completo</label>
              <input className={fieldClass} value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300">Bio</label>
              <textarea className={fieldClass} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300">Telefone</label>
              <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
            {error && <p className="text-sm text-rust-400">{error}</p>}
            {success && <p className="text-sm text-teal-400">Perfil atualizado.</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}
