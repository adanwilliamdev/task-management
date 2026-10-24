import type { DragEvent } from 'react';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { formatDate, isOverdue, ticketNumber } from '../lib/format';

const PRIORITY_LABEL: Record<TaskPriority, string> = { LOW: 'BAIXA', MEDIUM: 'MÉDIA', HIGH: 'ALTA' };
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW: 'text-steel-300 border-steel-400',
  MEDIUM: 'text-amber-300 border-amber-400',
  HIGH: 'text-rust-300 border-rust-400',
};
const PRIORITY_STRIPE: Record<TaskPriority, string> = {
  LOW: 'border-l-steel-500',
  MEDIUM: 'border-l-amber-400',
  HIGH: 'border-l-rust-500',
};

interface Props {
  task: Task;
  dragging: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (e: DragEvent<HTMLElement>, task: Task) => void;
  onDragEnd: () => void;
}

export function TaskCard({ task, dragging, onStatusChange, onEdit, onDelete, onDragStart, onDragEnd }: Props) {
  const overdue = isOverdue(task);

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`cursor-grab border border-board-700 border-l-4 bg-board-800 p-4 transition-opacity active:cursor-grabbing ${
        PRIORITY_STRIPE[task.priority]
      } ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-500">{ticketNumber(task.id)}</span>
        <span className={`border px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${PRIORITY_COLOR[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>
      <h3 className={`font-medium leading-snug ${task.status === 'DONE' ? 'text-ink-300 line-through' : ''}`}>
        {task.title}
      </h3>
      {task.description && <p className="mt-1 line-clamp-2 text-sm text-ink-300">{task.description}</p>}
      {task.dueDate && (
        <p className={`mt-2 font-mono text-xs ${overdue ? 'text-rust-300' : 'text-ink-500'}`}>
          {overdue ? 'Atrasada · ' : 'Entrega '}
          {formatDate(task.dueDate)}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-board-700 pt-3">
        <select
          aria-label={`Status da tarefa ${task.title}`}
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
          className="border border-board-700 bg-board-900 px-2 py-1 text-xs text-ink-100 outline-none focus:border-amber-400"
        >
          <option value="TODO">A fazer</option>
          <option value="IN_PROGRESS">Em progresso</option>
          <option value="DONE">Concluída</option>
        </select>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={() => onEdit(task)} className="text-steel-300 hover:underline">
            Editar
          </button>
          <button type="button" onClick={() => onDelete(task)} className="text-rust-400 hover:underline">
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}
