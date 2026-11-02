package com.taskflow.task.dto;

import com.taskflow.task.model.ProjectRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MemberRoleRequest {

    @NotNull(message = "Papel é obrigatório")
    private ProjectRole role;
}
