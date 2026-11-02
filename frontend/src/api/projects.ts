import { api } from './client';
import type { Member, Project, ProjectInput, ProjectRole } from '../types';

export function listProjects() {
  return api.get<Project[]>('/projects').then((r) => r.data);
}

export function getProject(id: number) {
  return api.get<Project>(`/projects/${id}`).then((r) => r.data);
}

export function createProject(input: ProjectInput) {
  return api.post<Project>('/projects', input).then((r) => r.data);
}

export function updateProject(id: number, input: ProjectInput) {
  return api.put<Project>(`/projects/${id}`, input).then((r) => r.data);
}

export function deleteProject(id: number) {
  return api.delete(`/projects/${id}`);
}

export function listMembers(projectId: number) {
  return api.get<Member[]>(`/projects/${projectId}/members`).then((r) => r.data);
}

export function addMember(projectId: number, username: string, role: ProjectRole) {
  return api.post<Member>(`/projects/${projectId}/members`, { username, role }).then((r) => r.data);
}

export function changeMemberRole(projectId: number, userId: number, role: ProjectRole) {
  return api.patch<Member>(`/projects/${projectId}/members/${userId}`, { role }).then((r) => r.data);
}

export function removeMember(projectId: number, userId: number) {
  return api.delete(`/projects/${projectId}/members/${userId}`);
}
