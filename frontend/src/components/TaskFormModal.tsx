import { useEffect, useState, type FormEvent } from 'react';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types';

interface Props {
  initial?: Task | null;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
}

const fieldClass =
  'w-full border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400';

export function TaskFormModal({ initial, onClose, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'TODO');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        title,
        description: description || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
      });
    } catch {
      setError('Não foi possível salvar a tarefa.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-board-950/80 px-4">
      <div className="w-full max-w-md border-t-4 border-amber-400 bg-board-800 p-6">
        <div className="mb-4">
          <h2 className="font-display text-xl tracking-wide uppercase">
            {initial ? 'Editar bilhete' : 'Novo bilhete'}
          </h2>
          {initial && (
            <p className="font-mono text-xs text-ink-500">#{String(initial.id).padStart(4, '0')}</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-ink-300">Título</label>
            <input
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-300">Descrição</label>
            <textarea
              className={fieldClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-ink-300">Status</label>
              <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="TODO">A fazer</option>
                <option value="IN_PROGRESS">Em progresso</option>
                <option value="DONE">Concluída</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300">Prioridade</label>
              <select
                className={fieldClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-300">Data de entrega</label>
            <input type="date" className={fieldClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          {error && <p className="text-sm text-rust-400">{error}</p>}
          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={onClose} className="px-2 py-2 text-ink-300 hover:text-ink-100">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
