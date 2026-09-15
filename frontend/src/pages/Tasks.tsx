import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { TaskFormModal } from '../components/TaskFormModal';
import * as tasksApi from '../api/tasks';
import type { Task, TaskInput, TaskStatus } from '../types';
import { getErrorMessage } from '../api/client';

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: 'TODO', label: 'A fazer', accent: 'border-steel-400' },
  { status: 'IN_PROGRESS', label: 'Em progresso', accent: 'border-amber-400' },
  { status: 'DONE', label: 'Concluída', accent: 'border-teal-400' },
];

const PRIORITY_LABEL: Record<string, string> = { LOW: 'BAIXA', MEDIUM: 'MÉDIA', HIGH: 'ALTA' };
const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-steel-300 border-steel-400',
  MEDIUM: 'text-amber-300 border-amber-400',
  HIGH: 'text-rust-300 border-rust-400',
};
const PRIORITY_STRIPE: Record<string, string> = {
  LOW: 'border-l-steel-500',
  MEDIUM: 'border-l-amber-400',
  HIGH: 'border-l-rust-500',
};

function ticketNumber(id: number) {
  return `#${String(id).padStart(4, '0')}`;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await tasksApi.listTasks();
      setTasks(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => COLUMNS.map((col) => ({ ...col, items: tasks.filter((t) => t.status === col.status) })),
    [tasks]
  );

  async function handleSave(input: TaskInput) {
    if (editing) {
      await tasksApi.updateTask(editing.id, input);
    } else {
      await tasksApi.createTask(input);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    await tasksApi.updateTaskStatus(task.id, status);
    await load();
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    await tasksApi.deleteTask(task.id);
    await load();
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide uppercase">Painel de tarefas</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300"
        >
          + Nova tarefa
        </button>
      </div>

      {error && (
        <div className="mb-4 border border-rust-500/30 bg-rust-500/10 p-3 text-sm text-rust-300">{error}</div>
      )}

      {loading ? (
        <p className="text-ink-500">Carregando tarefas…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.status}>
              <div className={`flex items-baseline justify-between border-t-2 ${col.accent} pt-2`}>
                <h2 className="font-display text-lg tracking-wide uppercase">{col.label}</h2>
                <span className="font-mono text-xs text-ink-500">{col.items.length}</span>
              </div>
              <div className="mt-3 space-y-3">
                {col.items.length === 0 ? (
                  <p className="border border-dashed border-board-700 px-3 py-6 text-center text-sm text-ink-500">
                    Nenhuma tarefa aqui
                  </p>
                ) : (
                  col.items.map((task) => (
                    <div
                      key={task.id}
                      className={`border border-board-700 border-l-4 bg-board-800 p-4 ${PRIORITY_STRIPE[task.priority]}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-ink-500">{ticketNumber(task.id)}</span>
                        <span
                          className={`border px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${PRIORITY_COLOR[task.priority]}`}
                        >
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                      </div>
                      <h3 className="font-medium leading-snug">{task.title}</h3>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-ink-300">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="mt-2 font-mono text-xs text-ink-500">Entrega {task.dueDate}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-board-700 pt-3">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          className="border border-board-700 bg-board-900 px-2 py-1 text-xs text-ink-100 outline-none focus:border-amber-400"
                        >
                          <option value="TODO">A fazer</option>
                          <option value="IN_PROGRESS">Em progresso</option>
                          <option value="DONE">Concluída</option>
                        </select>
                        <div className="flex gap-3 text-xs">
                          <button
                            onClick={() => {
                              setEditing(task);
                              setModalOpen(true);
                            }}
                            className="text-steel-300 hover:underline"
                          >
                            Editar
                          </button>
                          <button onClick={() => handleDelete(task)} className="text-rust-400 hover:underline">
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <TaskFormModal
          initial={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </Layout>
  );
}
