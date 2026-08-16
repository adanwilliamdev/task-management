package com.taskflow.task.dto;

import com.taskflow.task.model.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TaskStatusUpdateRequest {

    @NotNull(message = "Status é obrigatório")
    private TaskStatus status;
}
