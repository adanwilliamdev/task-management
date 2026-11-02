import { useCallback, useEffect, useState, type FormEvent } from 'react';
import * as projectsApi from '../api/projects';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../lib/roles';
import type { Member, ProjectRole } from '../types';
import { fieldClass } from './Field';
import { Modal } from './Modal';

interface Props {
  projectId: number;
  isOwner: boolean;
  onClose: () => void;
  /** Avisa a página para recarregar membros (lista de responsáveis). */
  onChanged: () => void;
  onLeft: () => void;
}

export function MembersModal({ projectId, isOwner, onClose, onChanged, onLeft }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<ProjectRole>('EDITOR');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setMembers(await projectsApi.listMembers(projectId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setError('');
    setBusy(true);
    try {
      await action();
      await load();
      onChanged();
      after?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    void run(async () => {
      await projectsApi.addMember(projectId, username.trim(), role);
      setUsername('');
    });
  }

  return (
    <Modal titleId="members-title" onClose={onClose} maxWidth="max-w-lg">
      <h2 id="members-title" className="font-display text-xl tracking-wide uppercase">
        Membros do projeto
      </h2>

      {error && (
        <p role="alert" className="mt-3 text-sm text-rust-400">
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-board-700 border border-board-700" aria-busy={loading}>
        {members.map((m) => {
          const isMe = m.userId === user?.userId;
          return (
            <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="font-mono text-sm">
                {m.username}
                {isMe && <span className="ml-1 text-ink-500">(você)</span>}
              </span>
              <span className="flex items-center gap-3 text-sm">
                {isOwner && m.role !== 'OWNER' ? (
                  <select
                    aria-label={`Papel de ${m.username}`}
                    value={m.role}
                    disabled={busy}
                    onChange={(e) =>
                      void run(() => projectsApi.changeMemberRole(projectId, m.userId, e.target.value as ProjectRole))
                    }
                    className="border border-board-700 bg-board-900 px-2 py-1 text-xs outline-none focus:border-amber-400"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Leitor</option>
                  </select>
                ) : (
                  <span className="text-ink-300">{ROLE_LABEL[m.role]}</span>
                )}
                {m.role !== 'OWNER' && (isOwner || isMe) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => projectsApi.removeMember(projectId, m.userId),
                        isMe ? onLeft : undefined
                      )
                    }
                    className="text-rust-400 hover:underline disabled:opacity-50"
                  >
                    {isMe ? 'Sair' : 'Remover'}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {isOwner && (
        <form onSubmit={handleInvite} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label htmlFor="invite-username" className="mb-1 block text-sm text-ink-300">
              Convidar por username
            </label>
            <input
              id="invite-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
              maxLength={50}
              autoComplete="off"
            />
          </div>
          <select
            aria-label="Papel do convidado"
            value={role}
            onChange={(e) => setRole(e.target.value as ProjectRole)}
            className="border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400"
          >
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Leitor</option>
          </select>
          <button
            type="submit"
            disabled={busy || !username.trim()}
            className="bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            Convidar
          </button>
        </form>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="px-2 py-2 text-ink-300 hover:text-ink-100">
          Fechar
        </button>
      </div>
    </Modal>
  );
}
