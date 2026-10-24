import { useState, type FormEvent } from 'react';
import { getErrorMessage } from '../api/client';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types';
import { SelectField, TextArea, TextField } from './Field';
import { ticketNumber } from '../lib/format';
import { Modal } from './Modal';

interface Props {
  initial?: Task | null;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
}

export function TaskFormModal({ initial, onClose, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'TODO');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
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
      setError(getErrorMessage(err, 'Não foi possível salvar a tarefa.'));
      setSaving(false);
    }
  }

  return (
    <Modal titleId="task-modal-title" onClose={saving ? () => {} : onClose}>
      <>
        <div className="mb-4">
          <h2 id="task-modal-title" className="font-display text-xl tracking-wide uppercase">
            {initial ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          {initial && <p className="font-mono text-xs text-ink-500">{ticketNumber(initial.id)}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={150}
            autoFocus
          />
          <TextArea
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="TODO">A fazer</option>
              <option value="IN_PROGRESS">Em progresso</option>
              <option value="DONE">Concluída</option>
            </SelectField>
            <SelectField
              label="Prioridade"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </SelectField>
          </div>
          <TextField
            label="Data de entrega"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-rust-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-2 py-2 text-ink-300 transition-colors hover:text-ink-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </>
    </Modal>
  );
}
