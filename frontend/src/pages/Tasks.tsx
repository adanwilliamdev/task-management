import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { MembersModal } from '../components/MembersModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { TaskCard } from '../components/TaskCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { fieldClass } from '../components/Field';
import { useToast } from '../components/Toast';
import * as tasksApi from '../api/tasks';
import * as projectsApi from '../api/projects';
import { atLeast } from '../lib/roles';
import { announceNotificationsChanged } from '../api/notifications';
import { getErrorMessage } from '../api/client';
import { isOverdue } from '../lib/format';
import type { Member, Project, Task, TaskInput, TaskPriority, TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: 'TODO', label: 'A fazer', accent: 'border-steel-400' },
  { status: 'IN_PROGRESS', label: 'Em progresso', accent: 'border-amber-400' },
  { status: 'DONE', label: 'Concluída', accent: 'border-teal-400' },
];

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/** Dentro da coluna: prioridade mais alta primeiro, depois entrega mais próxima, depois mais recente. */
function compareTasks(a: Task, b: Task) {
  if (a.priority !== b.priority) return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return b.id - a.id;
}

/** O backend cria a notificação em segundo plano; damos um instante antes de atualizar o contador. */
function refreshNotificationsSoon() {
  window.setTimeout(announceNotificationsChanged, 1500);
}

interface Props {
  /** Sem projectId: painel de tarefas pessoais. */
  projectId?: number;
}

export default function Tasks({ projectId }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [detail, setDetail] = useState<Task | null>(null);
  const [labelFilter, setLabelFilter] = useState('ALL');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTasks(await tasksApi.listTasks({ projectId }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadProject = useCallback(async () => {
    if (projectId === undefined) return;
    try {
      const [p, m] = await Promise.all([projectsApi.getProject(projectId), projectsApi.listMembers(projectId)]);
      setProject(p);
      setMembers(m);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    void loadProject();
  }, [load, loadProject]);

  const canWrite = projectId === undefined || atLeast(project?.myRole, 'EDITOR');
  const isOwner = project?.myRole === 'OWNER';
  const allLabels = useMemo(() => [...new Set(tasks.flatMap((t) => t.labels))].sort(), [tasks]);

  const filtering = search.trim() !== '' || priorityFilter !== 'ALL' || labelFilter !== 'ALL';

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (priorityFilter === 'ALL' || t.priority === priorityFilter) &&
        (labelFilter === 'ALL' || t.labels.includes(labelFilter)) &&
        (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
    );
  }, [tasks, search, priorityFilter, labelFilter]);

  const columns = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        items: visible.filter((t) => t.status === col.status).sort(compareTasks),
      })),
    [visible]
  );

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    return {
      total,
      open: total - done,
      overdue: tasks.filter(isOverdue).length,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [tasks]);

  function openCreate() {
    setEditing(null);
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

  // Erros são repassados ao modal, que os mostra no próprio formulário
  async function handleSave(input: TaskInput) {
    if (editing) {
      const updated = await tasksApi.updateTask(editing.id, input);
      setTasks((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Tarefa atualizada.');
      if (editing.status !== 'DONE' && updated.status === 'DONE') refreshNotificationsSoon();
    } else {
      const created = await tasksApi.createTask({ ...input, projectId });
      setTasks((cur) => [created, ...cur]);
      toast.success('Tarefa criada.');
      refreshNotificationsSoon();
    }
    closeModal();
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    // atualização otimista: a tela responde na hora e desfaz só esta tarefa se a API falhar
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      const updated = await tasksApi.updateTaskStatus(task.id, status);
      setTasks((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
      if (status === 'DONE') {
        toast.success('Tarefa concluída.');
        refreshNotificationsSoon();
      }
    } catch (err) {
      setTasks((cur) => cur.map((t) => (t.id === task.id ? task : t)));
      toast.error(getErrorMessage(err, 'Não foi possível atualizar o status da tarefa.'));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleteBusy(true);
    try {
      await tasksApi.deleteTask(target.id);
      setTasks((cur) => cur.filter((t) => t.id !== target.id));
      setDeleting(null);
      toast.success('Tarefa excluída.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível excluir a tarefa.'));
    } finally {
      setDeleteBusy(false);
    }
  }

  function handleDragStart(e: DragEvent<HTMLElement>, task: Task) {
    if (!canWrite) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(task.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOver(null);
  }

  function handleDrop(e: DragEvent<HTMLElement>, status: TaskStatus) {
    e.preventDefault();
    const task = tasks.find((t) => t.id === draggingId);
    handleDragEnd();
    if (task) void changeStatus(task, status);
  }

  function clearFilters() {
    setSearch('');
    setPriorityFilter('ALL');
    setLabelFilter('ALL');
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          {projectId !== undefined && (
            <Link to="/projects" className="font-mono text-xs text-ink-500 hover:text-ink-300">
              ← Projetos
            </Link>
          )}
          <h1 className="font-display text-3xl tracking-wide uppercase">
            {projectId !== undefined ? (project?.name ?? 'Projeto') : 'Painel de tarefas'}
          </h1>
          {project?.description && <p className="text-sm text-ink-300">{project.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {projectId !== undefined && (
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="border border-board-600 px-3 py-2 text-sm text-ink-100 transition-colors hover:border-amber-400"
            >
              Membros ({project?.memberCount ?? members.length})
            </button>
          )}
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300"
            >
              + Nova tarefa
            </button>
          )}
        </div>
      </div>
      {projectId !== undefined && project && !canWrite && (
        <p className="mb-4 border border-board-700 bg-board-900 px-3 py-2 text-sm text-ink-300">
          Você é <strong>Leitor</strong> neste projeto: pode ver tarefas e histórico, mas não alterar.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-4 border border-rust-500/30 bg-rust-500/10 p-3 text-sm text-rust-300"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="shrink-0 underline">
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <>
          <section aria-label="Resumo" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="border border-board-700 bg-board-800 p-3">
              <p className="font-mono text-xs text-ink-500">TOTAL</p>
              <p className="font-display text-2xl">{stats.total}</p>
            </div>
            <div className="border border-board-700 bg-board-800 p-3">
              <p className="font-mono text-xs text-ink-500">EM ABERTO</p>
              <p className="font-display text-2xl">{stats.open}</p>
            </div>
            <div className="border border-board-700 bg-board-800 p-3">
              <p className="font-mono text-xs text-ink-500">ATRASADAS</p>
              <p className={`font-display text-2xl ${stats.overdue > 0 ? 'text-rust-300' : ''}`}>{stats.overdue}</p>
            </div>
            <div className="border border-board-700 bg-board-800 p-3">
              <p className="font-mono text-xs text-ink-500">CONCLUÍDO</p>
              <p className="font-display text-2xl">{stats.percent}%</p>
              <div
                role="progressbar"
                aria-label="Percentual de tarefas concluídas"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stats.percent}
                className="mt-1 h-1 bg-board-700"
              >
                <div className="h-full bg-teal-400 transition-all" style={{ width: `${stats.percent}%` }} />
              </div>
            </div>
          </section>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <input
              type="search"
              aria-label="Buscar tarefas"
              placeholder="Buscar por título ou descrição…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${fieldClass} min-w-48 max-w-sm flex-1`}
            />
            <select
              aria-label="Filtrar por prioridade"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
              className="border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400"
            >
              <option value="ALL">Todas as prioridades</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
            {allLabels.length > 0 && (
              <select
                aria-label="Filtrar por label"
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                className="border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400"
              >
                <option value="ALL">Todas as labels</option>
                {allLabels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
            {filtering && (
              <button type="button" onClick={clearFilters} className="text-sm text-steel-300 hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        </>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Carregando tarefas">
          {COLUMNS.map((col) => (
            <div key={col.status}>
              <div className={`border-t-2 ${col.accent} pt-2`}>
                <div className="h-6 w-28 animate-pulse bg-board-800" />
              </div>
              <div className="mt-3 space-y-3">
                <div className="h-28 animate-pulse border border-board-700 bg-board-800" />
                <div className="h-28 animate-pulse border border-board-700 bg-board-800" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 && !error ? (
        <div className="border border-dashed border-board-700 px-4 py-16 text-center">
          <p className="font-display text-xl tracking-wide uppercase">Nenhuma tarefa ainda</p>
          <p className="mt-1 text-sm text-ink-500">Crie a primeira tarefa para começar a organizar seu painel.</p>
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300"
            >
              + Nova tarefa
            </button>
          )}
        </div>
      ) : (
        <>
          {filtering && visible.length === 0 && (
            <p className="mb-4 border border-dashed border-board-700 px-3 py-6 text-center text-sm text-ink-500">
              Nenhuma tarefa corresponde aos filtros aplicados.
            </p>
          )}
          <div className="grid gap-6 md:grid-cols-3">
            {columns.map((col) => (
              <section
                key={col.status}
                aria-label={col.label}
                onDragOver={(e) => {
                  if (draggingId === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOver(col.status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(null);
                }}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`pb-4 transition-colors ${dragOver === col.status ? 'bg-board-900 outline-2 outline-dashed outline-amber-400/60' : ''}`}
              >
                <div className={`flex items-baseline justify-between border-t-2 ${col.accent} pt-2`}>
                  <h2 className="font-display text-lg tracking-wide uppercase">{col.label}</h2>
                  <span className="font-mono text-xs text-ink-500">{col.items.length}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {col.items.length === 0 ? (
                    <p className="border border-dashed border-board-700 px-3 py-6 text-center text-sm text-ink-500">
                      {draggingId !== null ? 'Solte aqui' : 'Nenhuma tarefa aqui'}
                    </p>
                  ) : (
                    col.items.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        dragging={draggingId === task.id}
                        readOnly={!canWrite}
                        onDetails={setDetail}
                        onStatusChange={(t, status) => void changeStatus(t, status)}
                        onEdit={openEdit}
                        onDelete={setDeleting}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <TaskFormModal
          initial={editing}
          members={projectId !== undefined ? members : undefined}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {detail && (
        <TaskDetailModal
          task={detail}
          canComment={canWrite}
          isProjectOwner={isOwner}
          onClose={() => setDetail(null)}
        />
      )}

      {membersOpen && projectId !== undefined && (
        <MembersModal
          projectId={projectId}
          isOwner={isOwner}
          onClose={() => setMembersOpen(false)}
          onChanged={() => {
            void loadProject();
            void load();
          }}
          onLeft={() => navigate('/projects')}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Excluir tarefa"
          message={`Excluir "${deleting.title}"? Esta ação não pode ser desfeita.`}
          busy={deleteBusy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </Layout>
  );
}
