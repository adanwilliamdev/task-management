package com.taskflow.notification.security;

public record AuthenticatedUser(Long userId, String username) {
}
