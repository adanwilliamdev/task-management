package com.taskflow.auth.security;

public record AuthenticatedUser(Long userId, String username) {
}
