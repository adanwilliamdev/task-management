package com.taskflow.notification.dto;

import com.taskflow.notification.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationRequest {

    @NotNull(message = "userId é obrigatório")
    private Long userId;

    @NotBlank(message = "Título é obrigatório")
    private String title;

    @NotBlank(message = "Mensagem é obrigatória")
    private String message;

    private NotificationType type;
}
