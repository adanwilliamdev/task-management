package com.taskflow.notification.service;

import com.taskflow.notification.dto.NotificationRequest;
import com.taskflow.notification.dto.NotificationResponse;
import com.taskflow.notification.exception.ResourceNotFoundException;
import com.taskflow.notification.model.Notification;
import com.taskflow.notification.model.NotificationType;
import com.taskflow.notification.repository.NotificationRepository;
import com.taskflow.notification.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;

    @Transactional
    public NotificationResponse create(AuthenticatedUser user, NotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(user.userId())
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType() != null ? request.getType() : NotificationType.INFO)
                .read(false)
                .build();
        return toResponse(repository.save(notification));
    }

    public List<NotificationResponse> listMine(AuthenticatedUser user, boolean onlyUnread) {
        List<Notification> notifications = onlyUnread
                ? repository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user.userId())
                : repository.findByUserIdOrderByCreatedAtDesc(user.userId());
        return notifications.stream().map(this::toResponse).toList();
    }

    public Map<String, Long> unreadCount(AuthenticatedUser user) {
        return Map.of("unread", repository.countByUserIdAndReadFalse(user.userId()));
    }

    @Transactional
    public NotificationResponse markAsRead(AuthenticatedUser user, Long id) {
        Notification notification = repository.findByIdAndUserId(id, user.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada: " + id));
        notification.setRead(true);
        return toResponse(repository.save(notification));
    }

    @Transactional
    public void delete(AuthenticatedUser user, Long id) {
        Notification notification = repository.findByIdAndUserId(id, user.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada: " + id));
        repository.delete(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
