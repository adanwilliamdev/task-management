import { useCallback, useEffect, useState, type FormEvent } from 'react';
import * as tasksApi from '../api/tasks';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, relativeTime, ticketNumber } from '../lib/format';
import type { Task, TaskActivity, TaskComment } from '../types';
import { fieldClass } from './Field';
import { Modal } from './Modal';

const ACTION_LABEL: Record<string, string> = {
  CREATED: 'criou a tarefa',
  UPDATED: 'editou a tarefa',
  STATUS_CHANGED: 'mudou o status',
  ASSIGNED: 'atribuiu a tarefa',
  UNASSIGNED: 'removeu o responsável',
  COMMENTED: 'comentou',
};

interface Props {
  task: Task;
  canComment: boolean;
  isProjectOwner: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, canComment, isProjectOwner, onClose }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([tasksApi.listComments(task.id), tasksApi.listActivity(task.id)]);
      setComments(c);
      setActivity(a);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [task.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await tasksApi.addComment(task.id, text.trim());
      setText('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível comentar.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: TaskComment) {
    setError('');
    try {
      await tasksApi.deleteComment(task.id, c.id);
      setComments((cur) => cur.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível excluir o comentário.'));
    }
  }

  const tabClass = (active: boolean) =>
    `border-b-2 px-2 py-1.5 text-sm ${
      active ? 'border-amber-400 text-ink-100' : 'border-transparent text-ink-300 hover:text-ink-100'
    }`;

  return (
    <Modal titleId="detail-title" onClose={onClose} maxWidth="max-w-xl">
      <p className="font-mono text-xs text-ink-500">{ticketNumber(task.id)}</p>
      <h2 id="detail-title" className="font-display text-xl tracking-wide uppercase">
        {task.title}
      </h2>
      {task.description && <p className="mt-2 whitespace-pre-line text-sm text-ink-300">{task.description}</p>}
      <p className="mt-2 font-mono text-xs text-ink-500">
        {task.assigneeUsername ? `Responsável: ${task.assigneeUsername}` : 'Sem responsável'}
      </p>

      <div role="tablist" className="mt-4 flex gap-2 border-b border-board-700">
        <button type="button" role="tab" aria-selected={tab === 'comments'} onClick={() => setTab('comments')} className={tabClass(tab === 'comments')}>
          Comentários ({comments.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'activity'} onClick={() => setTab('activity')} className={tabClass(tab === 'activity')}>
          Histórico
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-rust-400">
          {error}
        </p>
      )}

      {tab === 'comments' ? (
        <div className="mt-3">
          {comments.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-500">Nenhum comentário ainda.</p>
          ) : (
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {comments.map((c) => (
                <li key={c.id} className="border border-board-700 bg-board-900 p-3">
                  <div className="flex items-center justify-between gap-2 font-mono text-xs text-ink-500">
                    <span>
                      {c.authorName} · <span title={formatDateTime(c.createdAt)}>{relativeTime(c.createdAt)}</span>
                    </span>
                    {(c.authorId === user?.userId || isProjectOwner) && (
                      <button type="button" onClick={() => void remove(c)} className="text-rust-400 hover:underline">
                        Excluir
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
          {canComment && (
            <form onSubmit={submit} className="mt-3 flex gap-2">
              <input
                aria-label="Novo comentário"
                placeholder="Escreva um comentário…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="bg-amber-400 px-4 py-2 font-medium text-board-950 hover:bg-amber-300 disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          )}
        </div>
      ) : (
        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
          {activity.length === 0 && <li className="py-4 text-center text-ink-500">Sem atividade registrada.</li>}
          {activity.map((a) => (
            <li key={a.id} className="border-l-2 border-board-600 pl-3">
              <span className="font-mono text-xs text-ink-500" title={formatDateTime(a.createdAt)}>
                {relativeTime(a.createdAt)}
              </span>
              <p>
                <strong className="font-medium">{a.actorName}</strong> {ACTION_LABEL[a.action] ?? a.action.toLowerCase()}
                {a.details && <span className="text-ink-300"> — {a.details}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="px-2 py-2 text-ink-300 hover:text-ink-100">
          Fechar
        </button>
      </div>
    </Modal>
  );
}
