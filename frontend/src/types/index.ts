export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type NotificationType = 'INFO' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'TASK_DUE' | 'SYSTEM';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface CurrentUser {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export type ProjectRole = 'VIEWER' | 'EDITOR' | 'OWNER';

export interface Project {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  myRole: ProjectRole;
  memberCount: number;
  createdAt: string;
}

export interface ProjectInput {
  name: string;
  description?: string;
}

export interface Member {
  userId: number;
  username: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: number;
  action: string;
  actorName: string;
  details?: string;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  overdue: boolean;
  userId: number;
  projectId?: number | null;
  assigneeId?: number | null;
  assigneeUsername?: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: number;
  /** null remove o responsável ao editar */
  assigneeId?: number | null;
  labels?: string[];
}

export interface UserProfile {
  id: number;
  userId: number;
  username: string;
  fullName?: string;
  bio?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string> | null;
}
