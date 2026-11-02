package com.taskflow.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequest {

    @NotBlank(message = "O comentário não pode ficar vazio")
    @Size(max = 1000, message = "Comentário deve ter no máximo 1000 caracteres")
    private String content;
}
