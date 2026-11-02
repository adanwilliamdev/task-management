package com.taskflow.notification.dto;

import com.taskflow.notification.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Notificação criada por outro microsserviço em nome de um usuário-alvo. */
@Data
public class InternalNotificationRequest {

    @NotNull(message = "userId é obrigatório")
    private Long userId;

    @NotBlank(message = "Título é obrigatório")
    @Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
    private String title;

    @NotBlank(message = "Mensagem é obrigatória")
    @Size(max = 1000, message = "Mensagem deve ter no máximo 1000 caracteres")
    private String message;

    private NotificationType type;
}
