import { useState, type FormEvent } from 'react';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types';
import { Modal } from './Modal';
import { getErrorMessage } from '../api/client';

interface Props {
  initial?: Task | null;
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'A fazer' },
  { value: 'IN_PROGRESS', label: 'Em progresso' },
  { value: 'DONE', label: 'Concluída' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: 'LOW', label: 'Baixa', dot: 'bg-sky-soft' },
  { value: 'MEDIUM', label: 'Média', dot: 'bg-sun-400' },
  { value: 'HIGH', label: 'Alta', dot: 'bg-rose-400' },
];

export function TaskFormModal({ initial, defaultStatus = 'TODO', onClose, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
      });
    } catch (err) {
      setError(getErrorMessage(err) || 'Não foi possível salvar a tarefa.');
      setSaving(false);
    }
  }

  return (
    <Modal
      title={initial ? 'Editar tarefa' : 'Nova tarefa'}
      subtitle={initial ? `Tarefa #${initial.id}` : 'Dê um nome claro ao que precisa ser feito.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="mb-1.5 block text-sm font-semibold text-fog-300">
            Título
          </label>
          <input
            id="task-title"
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Revisar proposta do cliente"
            required
            maxLength={150}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="task-desc" className="mb-1.5 block text-sm font-semibold text-fog-300">
            Descrição <span className="font-normal text-fog-500">(opcional)</span>
          </label>
          <textarea
            id="task-desc"
            className="field resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Detalhes, links ou contexto"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-fog-300">Prioridade</span>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-night-850 p-1">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                aria-pressed={priority === opt.value}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                  priority === opt.value
                    ? 'bg-night-600 text-fog-100 shadow-[0_2px_8px_rgb(0_0_0/0.4)]'
                    : 'text-fog-500 hover:text-fog-300'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-status" className="mb-1.5 block text-sm font-semibold text-fog-300">
              Status
            </label>
            <select
              id="task-status"
              className="field"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-due" className="mb-1.5 block text-sm font-semibold text-fog-300">
              Data de entrega
            </label>
            <input id="task-due" type="date" className="field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-400">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !title.trim()} className="btn btn-primary">
            {saving ? 'Salvando…' : initial ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
