package com.taskflow.task.controller;

import com.taskflow.task.dto.TaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.TaskStatsResponse;
import com.taskflow.task.dto.TaskStatusUpdateRequest;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.security.AuthenticatedUser;
import com.taskflow.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService service;

    @PostMapping
    public ResponseEntity<TaskResponse> create(@AuthenticationPrincipal AuthenticatedUser user,
                                               @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
    }

    @GetMapping
    public List<TaskResponse> list(@AuthenticationPrincipal AuthenticatedUser user,
                                   @RequestParam(required = false) TaskStatus status,
                                   @RequestParam(required = false) TaskPriority priority,
                                   @RequestParam(required = false, name = "q") String query) {
        return service.list(user, status, priority, query);
    }

    @GetMapping("/stats")
    public TaskStatsResponse stats(@AuthenticationPrincipal AuthenticatedUser user) {
        return service.stats(user);
    }

    @GetMapping("/{id}")
    public TaskResponse getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return service.getById(user, id);
    }

    @PutMapping("/{id}")
    public TaskResponse update(@AuthenticationPrincipal AuthenticatedUser user,
                               @PathVariable Long id,
                               @Valid @RequestBody TaskRequest request) {
        return service.update(user, id, request);
    }

    @PatchMapping("/{id}/status")
    public TaskResponse updateStatus(@AuthenticationPrincipal AuthenticatedUser user,
                                     @PathVariable Long id,
                                     @Valid @RequestBody TaskStatusUpdateRequest request) {
        return service.updateStatus(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        service.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
