function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntil(dueDate: string): number {
  const diff = parseLocalDate(dueDate).getTime() - startOfToday().getTime();
  return Math.round(diff / 86_400_000);
}

export function formatDue(dueDate: string): { label: string; tone: 'overdue' | 'soon' | 'normal' } {
  const days = daysUntil(dueDate);
  if (days < 0) return { label: days === -1 ? 'Venceu ontem' : `Venceu há ${-days} dias`, tone: 'overdue' };
  if (days === 0) return { label: 'Vence hoje', tone: 'soon' };
  if (days === 1) return { label: 'Vence amanhã', tone: 'soon' };
  const label = parseLocalDate(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return { label: days <= 3 ? `Vence em ${days} dias` : label.replace('.', ''), tone: days <= 3 ? 'soon' : 'normal' };
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `há ${days} d`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
