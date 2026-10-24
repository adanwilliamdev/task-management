import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { useToast } from '../components/Toast';
import * as profileApi from '../api/profile';
import type { UserProfile } from '../types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await profileApi.updateMyProfile({ fullName, bio, phone });
      setProfile(updated);
      toast.success('Perfil atualizado');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const initial = (user?.username ?? '?').charAt(0).toUpperCase();
  const displayName = fullName.trim() || user?.username;

  return (
    <Layout>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Perfil</h1>
      <p className="mt-1.5 text-fog-500">Gerencie como você aparece no TaskFlow.</p>

      {loading ? (
        <div className="mt-8 max-w-xl space-y-4">
          <div className="skeleton h-40" />
          <div className="skeleton h-72" />
        </div>
      ) : (
        <div className="mt-8 max-w-xl space-y-5">
          <div className="surface anim-card overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-iris-600 via-iris-500 to-mint-400/70" />
            <div className="px-6 pb-6">
              <div className="-mt-9 flex items-end gap-4">
                <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl border-4 border-night-800 bg-gradient-to-br from-iris-400 to-iris-600 font-display text-3xl font-bold text-white">
                  {initial}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="truncate font-display text-xl font-semibold">{displayName}</p>
                  <p className="truncate text-sm text-fog-500">{user?.email}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-fog-500">Usuário</p>
                  <p className="font-semibold">@{user?.username}</p>
                </div>
                {profile?.createdAt && (
                  <div>
                    <p className="text-xs text-fog-500">Membro desde</p>
                    <p className="font-semibold">
                      {new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="surface anim-card space-y-4 p-6" style={{ animationDelay: '60ms' }}>
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-fog-300">
                Nome completo
              </label>
              <input id="fullName" className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label htmlFor="bio" className="mb-1.5 block text-sm font-semibold text-fog-300">
                Bio
              </label>
              <textarea
                id="bio"
                className="field resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Conte um pouco sobre você"
              />
              <p className="mt-1 text-right text-xs tabular-nums text-fog-500">{bio.length}/500</p>
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-fog-300">
                Telefone
              </label>
              <input id="phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} inputMode="tel" />
            </div>
            {error && (
              <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-400">{error}</p>
            )}
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
