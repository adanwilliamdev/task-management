import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { Layout } from '../components/Layout';
import { TaskFormModal } from '../components/TaskFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { IconArrowRight, IconCalendar, IconCheck, IconEdit, IconInbox, IconPlus, IconSearch, IconTrash } from '../components/Icons';
import * as tasksApi from '../api/tasks';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types';
import { getErrorMessage } from '../api/client';
import { formatDue, greeting } from '../lib/format';

const COLUMNS: { status: TaskStatus; label: string; dot: string; hint: string }[] = [
  { status: 'TODO', label: 'A fazer', dot: 'bg-sky-soft', hint: 'Nada pendente por aqui.' },
  { status: 'IN_PROGRESS', label: 'Em progresso', dot: 'bg-sun-400', hint: 'Arraste uma tarefa para cá ao começar.' },
  { status: 'DONE', label: 'Concluída', dot: 'bg-mint-400', hint: 'As tarefas finalizadas aparecem aqui.' },
];

const PRIORITY: Record<TaskPriority, { label: string; chip: string; dot: string }> = {
  HIGH: { label: 'Alta', chip: 'bg-rose-400/12 text-rose-400', dot: 'bg-rose-400' },
  MEDIUM: { label: 'Média', chip: 'bg-sun-400/12 text-sun-400', dot: 'bg-sun-400' },
  LOW: { label: 'Baixa', chip: 'bg-sky-soft/12 text-sky-soft', dot: 'bg-sky-soft' },
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const NEXT_ACTION: Record<TaskStatus, { label: string; to: TaskStatus }> = {
  TODO: { label: 'Iniciar', to: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Concluir', to: 'DONE' },
  DONE: { label: 'Reabrir', to: 'TODO' },
};

type PriorityFilter = 'ALL' | TaskPriority;

export default function Tasks() {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<TaskStatus>('TODO');
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [mobileTab, setMobileTab] = useState<TaskStatus>('TODO');
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setTasks(await tasksApi.listTasks());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q);
    });
  }, [tasks, query, priorityFilter]);

  const columns = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        items: filtered
          .filter((t) => t.status === col.status)
          .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]),
      })),
    [filtered]
  );

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const doing = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const overdue = tasks.filter((t) => t.status !== 'DONE' && t.dueDate && formatDue(t.dueDate).tone === 'overdue').length;
    return { total, done, doing, overdue, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [tasks]);

  function openCreate(status: TaskStatus = 'TODO') {
    setEditing(null);
    setNewStatus(status);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSave(input: TaskInput) {
    if (editing) {
      await tasksApi.updateTask(editing.id, input);
      toast.success('Tarefa atualizada');
    } else {
      await tasksApi.createTask(input);
      toast.success('Tarefa criada');
    }
    closeModal();
    await load();
  }

  async function moveTask(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    setMobileTab((tab) => (tab === task.status ? status : tab));
    try {
      await tasksApi.updateTaskStatus(task.id, status);
      if (status === 'DONE') toast.success('Tarefa concluída');
    } catch (err) {
      setTasks(previous);
      toast.error(getErrorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    try {
      await tasksApi.deleteTask(target.id);
      setTasks((prev) => prev.filter((t) => t.id !== target.id));
      toast.success('Tarefa excluída');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  }

  function onDragStart(e: DragEvent, task: Task) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(task.id));
    setDraggingId(task.id);
  }

  function onDragEnd() {
    setDraggingId(null);
    setOverColumn(null);
  }

  function onDrop(e: DragEvent, status: TaskStatus) {
    e.preventDefault();
    const id = draggingId ?? Number(e.dataTransfer.getData('text/plain'));
    const task = tasks.find((t) => t.id === id);
    setDraggingId(null);
    setOverColumn(null);
    if (task) moveTask(task, status);
  }

  const filtersActive = query.trim() !== '' || priorityFilter !== 'ALL';
  const openCount = stats.total - stats.done;

  return (
    <Layout>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-iris-300">
            {greeting()}, {user?.username}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Suas tarefas</h1>
          <p className="mt-1.5 text-fog-500">
            {loading
              ? 'Carregando…'
              : stats.total === 0
                ? 'Comece criando sua primeira tarefa.'
                : `${openCount} ${openCount === 1 ? 'tarefa em aberto' : 'tarefas em aberto'}${
                    stats.overdue > 0 ? ` · ${stats.overdue} ${stats.overdue === 1 ? 'atrasada' : 'atrasadas'}` : ''
                  }`}
          </p>
        </div>
        <button onClick={() => openCreate()} className="btn btn-primary">
          <IconPlus className="h-4 w-4" />
          Nova tarefa
        </button>
      </div>

      {/* Progresso */}
      {!loading && stats.total > 0 && (
        <div className="surface anim-fade mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
          <div className="min-w-[12rem] flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-fog-300">Progresso geral</span>
              <span className="font-display text-2xl font-bold tabular-nums">{stats.pct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-night-600/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-iris-500 to-mint-400 transition-[width] duration-700 ease-out"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>
          <div className="flex gap-8">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Em progresso', value: stats.doing },
              { label: 'Concluídas', value: stats.done },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-fog-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-500" />
          <input
            className="field pl-10"
            placeholder="Buscar tarefas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar tarefas"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-night-850 p-1" role="group" aria-label="Filtrar por prioridade">
          {([['ALL', 'Todas'], ['HIGH', 'Alta'], ['MEDIUM', 'Média'], ['LOW', 'Baixa']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPriorityFilter(value)}
              aria-pressed={priorityFilter === value}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                priorityFilter === value ? 'bg-night-600 text-fog-100' : 'text-fog-500 hover:text-fog-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="anim-fade mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-400">
          <span>{error}</span>
          <button onClick={load} className="font-semibold underline-offset-2 hover:underline">
            Tentar de novo
          </button>
        </div>
      )}

      {/* Abas (mobile) */}
      <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl bg-night-850 p-1 md:hidden" role="tablist">
        {columns.map((col) => (
          <button
            key={col.status}
            role="tab"
            aria-selected={mobileTab === col.status}
            onClick={() => setMobileTab(col.status)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
              mobileTab === col.status ? 'bg-night-600 text-fog-100' : 'text-fog-500'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
            {col.label}
            <span className="tabular-nums text-fog-500">{col.items.length}</span>
          </button>
        ))}
      </div>

      {/* Quadro */}
      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton h-6 w-32" />
              <div className="skeleton h-32" />
              <div className="skeleton h-28" />
            </div>
          ))}
        </div>
      ) : stats.total === 0 && !error ? (
        <div className="surface anim-pop mt-6 flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-iris-500/15 text-iris-300">
            <IconInbox className="h-7 w-7" />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold">Seu quadro está vazio</h2>
          <p className="mt-1.5 max-w-xs text-sm text-fog-500">
            Crie uma tarefa e mova entre as colunas conforme ela avança.
          </p>
          <button onClick={() => openCreate()} className="btn btn-primary mt-6">
            <IconPlus className="h-4 w-4" />
            Criar primeira tarefa
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 md:mt-6 md:grid-cols-3">
          {columns.map((col) => {
            const isOver = overColumn === col.status && draggingId !== null;
            return (
              <section
                key={col.status}
                aria-label={col.label}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (overColumn !== col.status) setOverColumn(col.status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn(null);
                }}
                onDrop={(e) => onDrop(e, col.status)}
                className={`rounded-2xl p-2 transition-all duration-200 md:p-3 ${
                  mobileTab === col.status ? 'block' : 'hidden md:block'
                } ${isOver ? 'bg-iris-500/[0.09] ring-1 ring-iris-400/50' : 'md:bg-white/[0.02]'}`}
              >
                <header className="mb-3 hidden items-center justify-between px-1 md:flex">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                    <h2 className="font-display text-base font-semibold">{col.label}</h2>
                    <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-xs font-semibold tabular-nums text-fog-300">
                      {col.items.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreate(col.status)}
                    className="icon-btn"
                    aria-label={`Adicionar em ${col.label}`}
                    title="Adicionar tarefa"
                  >
                    <IconPlus className="h-4 w-4" />
                  </button>
                </header>

                <div className="space-y-3">
                  {col.items.length === 0 ? (
                    <div
                      className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm transition-colors ${
                        isOver ? 'border-iris-400/60 text-iris-300' : 'border-night-600 text-fog-500'
                      }`}
                    >
                      {filtersActive ? 'Nenhuma tarefa com esses filtros.' : isOver ? 'Solte aqui' : col.hint}
                    </div>
                  ) : (
                    col.items.map((task, index) => {
                      const due = task.dueDate ? formatDue(task.dueDate) : null;
                      const done = task.status === 'DONE';
                      const action = NEXT_ACTION[task.status];
                      const p = PRIORITY[task.priority];
                      return (
                        <article
                          key={task.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, task)}
                          onDragEnd={onDragEnd}
                          style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                          className={`surface anim-card group cursor-grab p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[var(--shadow-lift)] active:cursor-grabbing ${
                            draggingId === task.id ? 'scale-[0.98] opacity-40' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => moveTask(task, done ? 'TODO' : 'DONE')}
                              aria-label={done ? 'Reabrir tarefa' : 'Marcar como concluída'}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                done
                                  ? 'border-mint-400 bg-mint-400 text-night-950'
                                  : 'border-night-600 text-transparent hover:border-mint-400 hover:text-mint-400'
                              }`}
                            >
                              <IconCheck className="h-3 w-3" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <h3
                                className={`font-semibold leading-snug transition-colors ${
                                  done ? 'text-fog-500 line-through decoration-fog-500/50' : ''
                                }`}
                              >
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-fog-500">{task.description}</p>
                              )}
                            </div>
                            <div className="-mr-1.5 -mt-1.5 flex shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                              <button onClick={() => openEdit(task)} className="icon-btn" aria-label="Editar tarefa" title="Editar">
                                <IconEdit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setToDelete(task)}
                                className="icon-btn"
                                data-tone="danger"
                                aria-label="Excluir tarefa"
                                title="Excluir"
                              >
                                <IconTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-8">
                            <span className={`chip ${p.chip}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                              {p.label}
                            </span>
                            {due && !done && (
                              <span
                                className={`chip ${
                                  due.tone === 'overdue'
                                    ? 'bg-rose-400/12 text-rose-400'
                                    : due.tone === 'soon'
                                      ? 'bg-sun-400/12 text-sun-400'
                                      : 'bg-white/[0.06] text-fog-300'
                                }`}
                              >
                                <IconCalendar className="h-3 w-3" />
                                {due.label}
                              </span>
                            )}
                            <button
                              onClick={() => moveTask(task, action.to)}
                              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-iris-300 transition-colors hover:bg-iris-500/15"
                            >
                              {action.label}
                              <IconArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <TaskFormModal initial={editing} defaultStatus={newStatus} onClose={closeModal} onSave={handleSave} />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Excluir tarefa?"
          message={`“${toDelete.title}” será removida permanentemente. Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </Layout>
  );
}
