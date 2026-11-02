package com.taskflow.task.dto;

import java.time.LocalDateTime;

public record CommentResponse(Long id, Long taskId, Long authorId, String authorName,
                              String content, LocalDateTime createdAt) {
}
