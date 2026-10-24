import { api } from './client';
import type { NotificationItem } from '../types';

export const NOTIFICATIONS_CHANGED_EVENT = 'taskflow:notifications-changed';

/** Avisa o Layout (badge do menu) que as notificações mudaram. */
export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function listNotifications(onlyUnread = false) {
  return api.get<NotificationItem[]>('/notifications', { params: { onlyUnread } }).then((r) => r.data);
}

export function unreadCount() {
  return api.get<{ unread: number }>('/notifications/unread-count').then((r) => r.data);
}

export function markAsRead(id: number) {
  return api.patch<NotificationItem>(`/notifications/${id}/read`).then((r) => r.data);
}

export function markAllAsRead() {
  return api.patch<{ updated: number }>('/notifications/read-all').then((r) => r.data);
}

export function deleteNotification(id: number) {
  return api.delete(`/notifications/${id}`);
}
