import { api } from './client';
import type { UserProfile } from '../types';

export function getMyProfile() {
  return api.get<UserProfile>('/users/me').then((r) => r.data);
}

export function updateMyProfile(input: { fullName?: string; bio?: string; phone?: string }) {
  return api.put<UserProfile>('/users/me', input).then((r) => r.data);
}
