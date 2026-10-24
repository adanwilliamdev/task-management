import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { TextArea, TextField } from '../components/Field';
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

  const applyProfile = useCallback((data: UserProfile) => {
    setProfile(data);
    setFullName(data.fullName ?? '');
    setBio(data.bio ?? '');
    setPhone(data.phone ?? '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      applyProfile(await profileApi.getMyProfile());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty =
    profile !== null &&
    (fullName !== (profile.fullName ?? '') || bio !== (profile.bio ?? '') || phone !== (profile.phone ?? ''));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      applyProfile(await profileApi.updateMyProfile({ fullName, bio, phone }));
      toast.success('Perfil atualizado.');
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
        <div className="max-w-lg space-y-6" aria-busy="true" aria-label="Carregando perfil">
          <div className="h-28 animate-pulse border-t-4 border-board-700 bg-board-800" />
          <div className="h-64 animate-pulse border border-board-700 bg-board-800" />
        </div>
      ) : (
        <div className="max-w-lg space-y-6">
          <div className="border-t-4 border-amber-400 bg-board-800 p-5">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center border border-amber-400 font-display text-2xl text-amber-400"
              >
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
            <TextField
              label="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              autoComplete="name"
            />
            <TextArea
              label="Bio"
              hint={`${bio.length}/500`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <TextField
              label="Telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
            />
            {error && (
              <p role="alert" className="text-sm text-rust-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving || !dirty}
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
