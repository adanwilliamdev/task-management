import { api } from './client';
import type { Task, TaskActivity, TaskComment, TaskInput, TaskPriority, TaskStatus } from '../types';

export interface TaskQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  q?: string;
  projectId?: number;
  label?: string;
}

export function listTasks(query: TaskQuery = {}) {
  return api.get<Task[]>('/tasks', { params: query }).then((r) => r.data);
}

export function getTask(id: number) {
  return api.get<Task>(`/tasks/${id}`).then((r) => r.data);
}

export function createTask(input: TaskInput) {
  return api.post<Task>('/tasks', input).then((r) => r.data);
}

export function updateTask(id: number, input: TaskInput) {
  return api.put<Task>(`/tasks/${id}`, input).then((r) => r.data);
}

export function updateTaskStatus(id: number, status: TaskStatus) {
  return api.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data);
}

export function deleteTask(id: number) {
  return api.delete(`/tasks/${id}`);
}

export function listComments(taskId: number) {
  return api.get<TaskComment[]>(`/tasks/${taskId}/comments`).then((r) => r.data);
}

export function addComment(taskId: number, content: string) {
  return api.post<TaskComment>(`/tasks/${taskId}/comments`, { content }).then((r) => r.data);
}

export function deleteComment(taskId: number, commentId: number) {
  return api.delete(`/tasks/${taskId}/comments/${commentId}`);
}

export function listActivity(taskId: number) {
  return api.get<TaskActivity[]>(`/tasks/${taskId}/activity`).then((r) => r.data);
}
