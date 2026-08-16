import { useEffect, useState, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import * as profileApi from '../api/profile';
import type { UserProfile } from '../types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

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

  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-6">Meu perfil</h1>

      {loading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : (
        <div className="max-w-lg">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-400">Usuário</p>
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-slate-400 mt-2">Email</p>
            <p className="font-medium">{user?.email}</p>
            {profile?.createdAt && (
              <>
                <p className="text-sm text-slate-400 mt-2">Perfil criado em</p>
                <p className="font-medium">{new Date(profile.createdAt).toLocaleDateString('pt-BR')}</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome completo</label>
              <input
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-brand-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bio</label>
              <textarea
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-brand-500"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone</label>
              <input
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-brand-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">Perfil atualizado!</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 transition rounded-md px-4 py-2 font-medium disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}
