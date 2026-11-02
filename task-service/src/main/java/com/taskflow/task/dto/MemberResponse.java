package com.taskflow.task.dto;

import com.taskflow.task.model.ProjectRole;

import java.time.LocalDateTime;

public record MemberResponse(Long userId, String username, ProjectRole role, LocalDateTime joinedAt) {
}
