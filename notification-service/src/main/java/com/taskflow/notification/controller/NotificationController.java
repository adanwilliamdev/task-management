package com.taskflow.notification.controller;

import com.taskflow.notification.dto.InternalNotificationRequest;
import com.taskflow.notification.dto.NotificationRequest;
import com.taskflow.notification.dto.NotificationResponse;
import com.taskflow.notification.security.AuthenticatedUser;
import com.taskflow.notification.exception.BusinessException;
import com.taskflow.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @Value("${app.internal.key:}")
    private String internalKey;

    @PostMapping
    public ResponseEntity<NotificationResponse> create(@AuthenticationPrincipal AuthenticatedUser user,
                                                         @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
    }

    /**
     * Uso exclusivo entre microsserviços (ex.: task-service avisando o responsável por uma tarefa).
     * Protegido por chave compartilhada; o API Gateway bloqueia esta rota para o tráfego externo.
     */
    @PostMapping("/internal")
    public ResponseEntity<NotificationResponse> createInternal(
            @RequestHeader(value = "X-Internal-Key", required = false) String providedKey,
            @Valid @RequestBody InternalNotificationRequest request) {
        if (!keyMatches(providedKey)) {
            throw new BusinessException("Chave interna inválida", HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createFor(request));
    }

    private boolean keyMatches(String providedKey) {
        if (internalKey == null || internalKey.isBlank() || providedKey == null) {
            return false;
        }
        return java.security.MessageDigest.isEqual(
                internalKey.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                providedKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal AuthenticatedUser user,
                                            @RequestParam(defaultValue = "false") boolean onlyUnread) {
        return service.listMine(user, onlyUnread);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal AuthenticatedUser user) {
        return service.unreadCount(user);
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> markAllAsRead(@AuthenticationPrincipal AuthenticatedUser user) {
        return service.markAllAsRead(user);
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return service.markAsRead(user, id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        service.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
