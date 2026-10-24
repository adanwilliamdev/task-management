import axios from 'axios';
import type { ApiError } from '../types';

export const TOKEN_KEY = 'taskflow_token';
export const USER_KEY = 'taskflow_user';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

/** O AuthProvider registra aqui o que fazer quando a sessão expira (sem recarregar a página). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      // 401 em login/cadastro significa credenciais erradas, não sessão expirada
      const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register');
      if (!isAuthCall) onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = 'Erro inesperado. Tente novamente.'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
    const data = error.response.data;
    if (data?.validationErrors) {
      const messages = Object.values(data.validationErrors);
      if (messages.length > 0) return messages.join(' · ');
    }
    if (data?.message) return data.message;
    if (error.response.status >= 500) {
      return 'O servidor encontrou um problema. Tente novamente em instantes.';
    }
  }
  return fallback;
}
