package com.taskflow.task.dto;

import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TaskRequest {

    @NotBlank(message = "Título é obrigatório")
    @Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
    private String title;

    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private LocalDate dueDate;

    /** Apenas na criação: projeto ao qual a tarefa pertence (nulo = tarefa pessoal). */
    private Long projectId;

    /** Responsável (precisa ser membro do projeto). Em atualização, nulo remove o responsável. */
    private Long assigneeId;

    /** Se informado, substitui as labels; nulo mantém as atuais. */
    @Size(max = 8, message = "Use no máximo 8 labels")
    private List<@Size(max = 30, message = "Cada label deve ter no máximo 30 caracteres") String> labels;
}
