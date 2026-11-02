package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.dto.TaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.TaskStatsResponse;
import com.taskflow.task.dto.TaskStatusUpdateRequest;
import com.taskflow.task.exception.BusinessException;
import com.taskflow.task.model.ProjectMember;
import com.taskflow.task.model.ProjectRole;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskActivity;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.repository.ProjectMemberRepository;
import com.taskflow.task.repository.TaskActivityRepository;
import com.taskflow.task.repository.TaskCommentRepository;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.repository.TaskSpecifications;
import com.taskflow.task.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository repository;
    private final NotificationClient notifications;
    private final AccessService access;
    private final ProjectMemberRepository members;
    private final TaskActivityRepository activities;
    private final TaskCommentRepository comments;

    @Transactional
    public TaskResponse create(AuthenticatedUser user, TaskRequest request) {
        Long projectId = request.getProjectId();
        if (projectId != null) {
            access.requireMember(user.userId(), projectId, ProjectRole.EDITOR);
        }

        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(blankToNull(request.getDescription()))
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .userId(user.userId())
                .projectId(projectId)
                .labels(normalizeLabels(request.getLabels()))
                .build();
        applyAssignee(task, request.getAssigneeId());

        Task saved = repository.save(task);
        record(user, saved, "CREATED", null);
        if (saved.getAssigneeId() != null) {
            record(user, saved, "ASSIGNED", "Responsável: " + saved.getAssigneeUsername());
        }

        AfterCommit.run(() -> notifications.send(user.token(), "TASK_ASSIGNED",
                "Nova tarefa criada", "A tarefa \"" + saved.getTitle() + "\" foi adicionada ao seu painel."));
        notifyAssignee(user, saved);
        if (saved.getStatus() == TaskStatus.DONE) {
            AfterCommit.run(() -> notifyCompleted(user, saved));
        }
        return toResponse(saved);
    }

    /**
     * Sem projectId: tarefas pessoais do usuário. Com projectId: tarefas do projeto
     * (exige ser membro). Os demais filtros são opcionais.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> list(AuthenticatedUser user, Long projectId, TaskStatus status, TaskPriority priority,
                                   String query, String label, Long assigneeId) {
        if (projectId != null) {
            access.requireMember(user.userId(), projectId, ProjectRole.VIEWER);
        }
        return repository
                .findAll(TaskSpecifications.filter(user.userId(), projectId, status, priority, query, label, assigneeId),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(AuthenticatedUser user, Long id) {
        return toResponse(access.loadTask(user, id, ProjectRole.VIEWER));
    }

    @Transactional(readOnly = true)
    public TaskStatsResponse stats(AuthenticatedUser user, Long projectId) {
        if (projectId != null) {
            access.requireMember(user.userId(), projectId, ProjectRole.VIEWER);
        }
        var scope = TaskSpecifications.scope(user.userId(), projectId);
        long todo = repository.count(scope.and(TaskSpecifications.hasStatus(TaskStatus.TODO)));
        long inProgress = repository.count(scope.and(TaskSpecifications.hasStatus(TaskStatus.IN_PROGRESS)));
        long done = repository.count(scope.and(TaskSpecifications.hasStatus(TaskStatus.DONE)));
        long overdue = repository.count(scope.and(TaskSpecifications.overdue(LocalDate.now())));
        return new TaskStatsResponse(todo + inProgress + done, todo, inProgress, done, overdue);
    }

    @Transactional
    public TaskResponse update(AuthenticatedUser user, Long id, TaskRequest request) {
        Task task = access.loadTask(user, id, ProjectRole.EDITOR);
        TaskStatus previousStatus = task.getStatus();
        Long previousAssignee = task.getAssigneeId();
        LocalDate previousDue = task.getDueDate();

        task.setTitle(request.getTitle().trim());
        task.setDescription(blankToNull(request.getDescription()));
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        if (request.getLabels() != null) task.setLabels(normalizeLabels(request.getLabels()));
        if (!Objects.equals(previousDue, task.getDueDate())) task.setDueReminderSent(false);
        applyAssignee(task, request.getAssigneeId());

        Task saved = repository.save(task);
        record(user, saved, "UPDATED", null);
        if (previousStatus != saved.getStatus()) {
            record(user, saved, "STATUS_CHANGED", previousStatus + " → " + saved.getStatus());
        }
        recordAssigneeChange(user, saved, previousAssignee);

        if (previousStatus != TaskStatus.DONE && saved.getStatus() == TaskStatus.DONE) {
            AfterCommit.run(() -> notifyCompleted(user, saved));
        }
        if (!Objects.equals(previousAssignee, saved.getAssigneeId())) {
            notifyAssignee(user, saved);
        }
        return toResponse(saved);
    }

    @Transactional
    public TaskResponse updateStatus(AuthenticatedUser user, Long id, TaskStatusUpdateRequest request) {
        Task task = access.loadTask(user, id, ProjectRole.EDITOR);
        TaskStatus previous = task.getStatus();
        task.setStatus(request.getStatus());

        Task saved = repository.save(task);
        if (previous != saved.getStatus()) {
            record(user, saved, "STATUS_CHANGED", previous + " → " + saved.getStatus());
        }
        if (previous != TaskStatus.DONE && saved.getStatus() == TaskStatus.DONE) {
            AfterCommit.run(() -> notifyCompleted(user, saved));
        }
        return toResponse(saved);
    }

    @Transactional
    public void delete(AuthenticatedUser user, Long id) {
        Task task = access.loadTask(user, id, ProjectRole.EDITOR);
        // em projeto, só o criador da tarefa ou o dono do projeto podem excluir
        if (task.getProjectId() != null && !task.getUserId().equals(user.userId())) {
            access.requireMember(user.userId(), task.getProjectId(), ProjectRole.OWNER);
        }
        comments.deleteByTaskId(id);
        activities.deleteByTaskId(id);
        repository.delete(task);
    }

    // ---- responsável ----

    private void applyAssignee(Task task, Long assigneeId) {
        if (assigneeId == null || task.getProjectId() == null) {
            task.setAssigneeId(null);
            task.setAssigneeUsername(null);
            return;
        }
        ProjectMember member = members.findByProjectIdAndUserId(task.getProjectId(), assigneeId)
                .orElseThrow(() -> new BusinessException(
                        "O responsável precisa ser membro do projeto", HttpStatus.BAD_REQUEST));
        task.setAssigneeId(member.getUserId());
        task.setAssigneeUsername(member.getUsername());
    }

    private void recordAssigneeChange(AuthenticatedUser user, Task task, Long previousAssignee) {
        if (Objects.equals(previousAssignee, task.getAssigneeId())) return;
        if (task.getAssigneeId() == null) {
            record(user, task, "UNASSIGNED", "Responsável removido");
        } else {
            record(user, task, "ASSIGNED", "Responsável: " + task.getAssigneeUsername());
        }
    }

    private void notifyAssignee(AuthenticatedUser actor, Task task) {
        Long assignee = task.getAssigneeId();
        if (assignee == null || assignee.equals(actor.userId())) return;
        AfterCommit.run(() -> notifications.sendTo(assignee, "TASK_ASSIGNED",
                "Tarefa atribuída a você",
                actor.username() + " atribuiu \"" + task.getTitle() + "\" a você."));
    }

    private void notifyCompleted(AuthenticatedUser user, Task task) {
        notifications.send(user.token(), "TASK_COMPLETED",
                "Tarefa concluída", "Você concluiu \"" + task.getTitle() + "\". Bom trabalho!");
        // se outra pessoa concluiu, avisa o criador da tarefa
        if (!task.getUserId().equals(user.userId())) {
            notifications.sendTo(task.getUserId(), "TASK_COMPLETED", "Tarefa concluída",
                    user.username() + " concluiu \"" + task.getTitle() + "\".");
        }
    }

    // ---- utilidades ----

    private void record(AuthenticatedUser user, Task task, String action, String details) {
        activities.save(TaskActivity.builder()
                .taskId(task.getId())
                .actorId(user.userId())
                .actorName(user.username())
                .action(action)
                .details(details)
                .build());
    }

    /** Remove vazias/duplicadas (sem diferenciar maiúsculas) e aplica trim. */
    static Set<String> normalizeLabels(List<String> raw) {
        Set<String> result = new LinkedHashSet<>();
        Set<String> seen = new LinkedHashSet<>();
        if (raw == null) return result;
        for (String label : raw) {
            if (label == null || label.isBlank()) continue;
            String trimmed = label.trim();
            if (seen.add(trimmed.toLowerCase())) result.add(trimmed);
        }
        return result;
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
                .projectId(t.getProjectId())
                .assigneeId(t.getAssigneeId())
                .assigneeUsername(t.getAssigneeUsername())
                .labels(List.copyOf(t.getLabels()))
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
