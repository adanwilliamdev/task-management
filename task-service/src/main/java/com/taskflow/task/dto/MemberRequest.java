package com.taskflow.task.dto;

import com.taskflow.task.model.ProjectRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MemberRequest {

    @NotBlank(message = "Username é obrigatório")
    private String username;

    @NotNull(message = "Papel é obrigatório")
    private ProjectRole role;
}
