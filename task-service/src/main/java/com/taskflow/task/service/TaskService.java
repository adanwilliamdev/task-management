package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.dto.TaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.TaskStatsResponse;
import com.taskflow.task.dto.TaskStatusUpdateRequest;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.repository.TaskSpecifications;
import com.taskflow.task.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository repository;
    private final NotificationClient notifications;

    @Transactional
    public TaskResponse create(AuthenticatedUser user, TaskRequest request) {
        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(blankToNull(request.getDescription()))
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .userId(user.userId())
                .build();
        Task saved = repository.save(task);

        afterCommit(() -> notifications.send(user.token(), "TASK_ASSIGNED",
                "Nova tarefa criada", "A tarefa \"" + saved.getTitle() + "\" foi adicionada ao seu painel."));
        if (saved.getStatus() == TaskStatus.DONE) {
            afterCommit(() -> notifyCompleted(user, saved));
        }
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(AuthenticatedUser user, TaskStatus status, TaskPriority priority, String query) {
        return repository
                .findAll(TaskSpecifications.filter(user.userId(), status, priority, query),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(AuthenticatedUser user, Long id) {
        return toResponse(findOwned(user, id));
    }

    @Transactional(readOnly = true)
    public TaskStatsResponse stats(AuthenticatedUser user) {
        Long userId = user.userId();
        long todo = repository.countByUserIdAndStatus(userId, TaskStatus.TODO);
        long inProgress = repository.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS);
        long done = repository.countByUserIdAndStatus(userId, TaskStatus.DONE);
        long overdue = repository.countByUserIdAndStatusNotAndDueDateBefore(userId, TaskStatus.DONE, LocalDate.now());
        return new TaskStatsResponse(todo + inProgress + done, todo, inProgress, done, overdue);
    }

    @Transactional
    public TaskResponse update(AuthenticatedUser user, Long id, TaskRequest request) {
        Task task = findOwned(user, id);
        TaskStatus previous = task.getStatus();

        task.setTitle(request.getTitle().trim());
        task.setDescription(blankToNull(request.getDescription()));
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());

        Task saved = repository.save(task);
        if (previous != TaskStatus.DONE && saved.getStatus() == TaskStatus.DONE) {
            afterCommit(() -> notifyCompleted(user, saved));
        }
        return toResponse(saved);
    }

    @Transactional
    public TaskResponse updateStatus(AuthenticatedUser user, Long id, TaskStatusUpdateRequest request) {
        Task task = findOwned(user, id);
        TaskStatus previous = task.getStatus();
        task.setStatus(request.getStatus());

        Task saved = repository.save(task);
        if (previous != TaskStatus.DONE && saved.getStatus() == TaskStatus.DONE) {
            afterCommit(() -> notifyCompleted(user, saved));
        }
        return toResponse(saved);
    }

    @Transactional
    public void delete(AuthenticatedUser user, Long id) {
        repository.delete(findOwned(user, id));
    }

    private Task findOwned(AuthenticatedUser user, Long id) {
        return repository.findByIdAndUserId(id, user.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada: " + id));
    }

    private void notifyCompleted(AuthenticatedUser user, Task task) {
        notifications.send(user.token(), "TASK_COMPLETED",
                "Tarefa concluída", "Você concluiu \"" + task.getTitle() + "\". Bom trabalho!");
    }

    /** Executa a ação somente depois do commit, para não notificar sobre algo que sofreu rollback. */
    private void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private TaskResponse toResponse(Task t) {
        boolean overdue = t.getDueDate() != null
                && t.getStatus() != TaskStatus.DONE
                && t.getDueDate().isBefore(LocalDate.now());
        return TaskResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .dueDate(t.getDueDate())
                .overdue(overdue)
                .userId(t.getUserId())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
