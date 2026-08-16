package com.taskflow.task.service;

import com.taskflow.task.dto.TaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.TaskStatusUpdateRequest;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository repository;

    @Transactional
    public TaskResponse create(AuthenticatedUser user, TaskRequest request) {
        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .userId(user.userId())
                .build();
        return toResponse(repository.save(task));
    }

    public List<TaskResponse> list(AuthenticatedUser user, TaskStatus status) {
        List<Task> tasks = status != null
                ? repository.findByUserIdAndStatus(user.userId(), status)
                : repository.findByUserId(user.userId());
        return tasks.stream().map(this::toResponse).toList();
    }

    public TaskResponse getById(AuthenticatedUser user, Long id) {
        Task task = findOwned(user, id);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse update(AuthenticatedUser user, Long id, TaskRequest request) {
        Task task = findOwned(user, id);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        return toResponse(repository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(AuthenticatedUser user, Long id, TaskStatusUpdateRequest request) {
        Task task = findOwned(user, id);
        task.setStatus(request.getStatus());
        return toResponse(repository.save(task));
    }

    @Transactional
    public void delete(AuthenticatedUser user, Long id) {
        Task task = findOwned(user, id);
        repository.delete(task);
    }

    private Task findOwned(AuthenticatedUser user, Long id) {
        return repository.findByIdAndUserId(id, user.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada: " + id));
    }

    private TaskResponse toResponse(Task t) {
        return TaskResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .dueDate(t.getDueDate())
                .userId(t.getUserId())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
