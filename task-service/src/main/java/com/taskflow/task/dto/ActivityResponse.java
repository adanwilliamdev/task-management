package com.taskflow.task.dto;

import java.time.LocalDateTime;

public record ActivityResponse(Long id, String action, String actorName, String details, LocalDateTime createdAt) {
}
