import { api } from './client';
import type { NotificationItem } from '../types';

export function listNotifications(onlyUnread = false) {
  return api.get<NotificationItem[]>('/notifications', { params: { onlyUnread } }).then((r) => r.data);
}

export function unreadCount() {
  return api.get<{ unread: number }>('/notifications/unread-count').then((r) => r.data);
}

export function markAsRead(id: number) {
  return api.patch<NotificationItem>(`/notifications/${id}/read`).then((r) => r.data);
}

export function deleteNotification(id: number) {
  return api.delete(`/notifications/${id}`);
}
