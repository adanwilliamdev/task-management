package com.taskflow.notification.dto;

import com.taskflow.notification.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotificationRequest {

    @NotBlank(message = "Título é obrigatório")
    private String title;

    @NotBlank(message = "Mensagem é obrigatória")
    private String message;

    private NotificationType type;
}
