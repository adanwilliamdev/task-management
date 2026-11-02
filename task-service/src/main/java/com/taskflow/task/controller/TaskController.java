package com.taskflow.task.controller;

import com.taskflow.task.dto.ActivityResponse;
import com.taskflow.task.dto.CommentRequest;
import com.taskflow.task.dto.CommentResponse;
import com.taskflow.task.dto.TaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.TaskStatsResponse;
import com.taskflow.task.dto.TaskStatusUpdateRequest;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.security.AuthenticatedUser;
import com.taskflow.task.service.CommentService;
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
    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(@AuthenticationPrincipal AuthenticatedUser user,
                                               @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
    }

    @GetMapping
    public List<TaskResponse> list(@AuthenticationPrincipal AuthenticatedUser user,
                                   @RequestParam(required = false) TaskStatus status,
                                   @RequestParam(required = false) TaskPriority priority,
                                   @RequestParam(required = false, name = "q") String query,
                                   @RequestParam(required = false) Long projectId,
                                   @RequestParam(required = false) String label,
                                   @RequestParam(required = false) Long assigneeId) {
        return service.list(user, projectId, status, priority, query, label, assigneeId);
    }

    @GetMapping("/stats")
    public TaskStatsResponse stats(@AuthenticationPrincipal AuthenticatedUser user,
                                   @RequestParam(required = false) Long projectId) {
        return service.stats(user, projectId);
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

    // ---- comentários e histórico ----

    @GetMapping("/{id}/comments")
    public List<CommentResponse> comments(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return commentService.list(user, id);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@AuthenticationPrincipal AuthenticatedUser user,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.add(user, id, request));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@AuthenticationPrincipal AuthenticatedUser user,
                                              @PathVariable Long id, @PathVariable Long commentId) {
        commentService.delete(user, id, commentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/activity")
    public List<ActivityResponse> activity(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return commentService.activity(user, id);
    }
}
