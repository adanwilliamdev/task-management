import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { TaskFormModal } from '../components/TaskFormModal';
import * as tasksApi from '../api/tasks';
import type { Task, TaskInput, TaskStatus } from '../types';
import { getErrorMessage } from '../api/client';

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em progresso',
  DONE: 'Concluída',
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  TODO: 'bg-slate-700 text-slate-200',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  DONE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await tasksApi.listTasks(filter === 'ALL' ? undefined : filter);
      setTasks(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Minhas tarefas</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-brand-600 hover:bg-brand-700 transition rounded-md px-4 py-2 font-medium"
        >
          + Nova tarefa
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm transition ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {f === 'ALL' ? 'Todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-md p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Carregando tarefas...</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">📋</p>
          <p>Nenhuma tarefa encontrada. Crie a primeira!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium">{task.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                  <span className={`text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-slate-400 mb-1 line-clamp-2">{task.description}</p>
                )}
                {task.dueDate && (
                  <p className="text-xs text-slate-500">Entrega: {task.dueDate}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1"
                >
                  <option value="TODO">A fazer</option>
                  <option value="IN_PROGRESS">Em progresso</option>
                  <option value="DONE">Concluída</option>
                </select>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditing(task);
                      setModalOpen(true);
                    }}
                    className="text-brand-400 hover:underline"
                  >
                    Editar
                  </button>
                  <button onClick={() => handleDelete(task)} className="text-red-400 hover:underline">
                    Excluir
                  </button>
                </div>
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
