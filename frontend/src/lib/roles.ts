import type { ProjectRole } from '../types';

export const ROLE_LABEL: Record<ProjectRole, string> = {
  OWNER: 'Dono',
  EDITOR: 'Editor',
  VIEWER: 'Leitor',
};

const ORDER: Record<ProjectRole, number> = { VIEWER: 0, EDITOR: 1, OWNER: 2 };

export function atLeast(role: ProjectRole | undefined, required: ProjectRole): boolean {
  return role !== undefined && ORDER[role] >= ORDER[required];
}
