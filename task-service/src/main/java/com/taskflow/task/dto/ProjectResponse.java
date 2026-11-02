package com.taskflow.task.dto;

import com.taskflow.task.model.ProjectRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    /** Papel do usuário que fez a requisição neste projeto. */
    private ProjectRole myRole;
    private long memberCount;
    private LocalDateTime createdAt;
}
