package com.taskflow.task.security;

/**
 * Usuário autenticado extraído do JWT. O token original é mantido para ser
 * repassado em chamadas a outros microsserviços (ex.: notification-service).
 */
public record AuthenticatedUser(Long userId, String username, String token) {

    @Override
    public String toString() {
        // nunca expor o token em logs
        return "AuthenticatedUser[userId=" + userId + ", username=" + username + "]";
    }
}
