package com.taskflow.notification.controller;

import com.taskflow.notification.dto.NotificationRequest;
import com.taskflow.notification.dto.NotificationResponse;
import com.taskflow.notification.security.AuthenticatedUser;
import com.taskflow.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @PostMapping
    public ResponseEntity<NotificationResponse> create(@AuthenticationPrincipal AuthenticatedUser user,
                                                         @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
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
