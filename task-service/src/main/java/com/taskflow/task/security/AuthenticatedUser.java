package com.taskflow.task.security;

public record AuthenticatedUser(Long userId, String username) {
}
