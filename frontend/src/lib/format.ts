import type { Task } from '../types';

export function ticketNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

/** Converte "YYYY-MM-DD" em Date local (evita o deslocamento de fuso do `new Date(iso)`). */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value: string): string {
  return parseLocalDate(value).toLocaleDateString('pt-BR');
}

/** O backend serializa LocalDateTime em UTC, sem sufixo de fuso: assumimos UTC. */
export function parseServerDateTime(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatDateTime(value: string): string {
  return parseServerDateTime(value).toLocaleString('pt-BR');
}

export function relativeTime(value: string, now: Date = new Date()): string {
  const date = parseServerDateTime(value);
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (abs < 60) return 'agora mesmo';
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeconds / 86400), 'day');
  return date.toLocaleDateString('pt-BR');
}

export function isOverdue(task: Pick<Task, 'status' | 'dueDate'>): boolean {
  if (task.status === 'DONE' || !task.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseLocalDate(task.dueDate).getTime() < today.getTime();
}
