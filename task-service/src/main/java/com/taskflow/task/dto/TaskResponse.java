package com.taskflow.task.dto;

import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private boolean overdue;
    private Long userId;
    private Long projectId;
    private Long assigneeId;
    private String assigneeUsername;
    private List<String> labels;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
