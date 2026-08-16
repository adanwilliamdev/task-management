package com.taskflow.user.security;

public record AuthenticatedUser(Long userId, String username) {
}
