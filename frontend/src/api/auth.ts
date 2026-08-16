import { api } from './client';
import type { AuthResponse } from '../types';

export function register(username: string, email: string, password: string) {
  return api.post<AuthResponse>('/auth/register', { username, email, password }).then((r) => r.data);
}

export function login(username: string, password: string) {
  return api.post<AuthResponse>('/auth/login', { username, password }).then((r) => r.data);
}
