package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.dto.ActivityResponse;
import com.taskflow.task.dto.CommentRequest;
import com.taskflow.task.dto.CommentResponse;
import com.taskflow.task.exception.BusinessException;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.ProjectRole;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskActivity;
import com.taskflow.task.model.TaskComment;
import com.taskflow.task.repository.ProjectMemberRepository;
import com.taskflow.task.repository.TaskActivityRepository;
import com.taskflow.task.repository.TaskCommentRepository;
import com.taskflow.task.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final TaskCommentRepository comments;
    private final TaskActivityRepository activities;
    private final ProjectMemberRepository members;
    private final AccessService access;
    private final NotificationClient notifications;

    @Transactional(readOnly = true)
    public List<CommentResponse> list(AuthenticatedUser user, Long taskId) {
        access.loadTask(user, taskId, ProjectRole.VIEWER);
        return comments.findByTaskIdOrderByCreatedAtAsc(taskId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public CommentResponse add(AuthenticatedUser user, Long taskId, CommentRequest request) {
        Task task = access.loadTask(user, taskId, ProjectRole.EDITOR);
        TaskComment saved = comments.save(TaskComment.builder()
                .taskId(taskId)
                .authorId(user.userId())
                .authorName(user.username())
                .content(request.getContent().trim())
                .build());
        activities.save(TaskActivity.builder()
                .taskId(taskId).actorId(user.userId()).actorName(user.username())
                .action("COMMENTED").build());

        // avisa criador e responsável (menos quem comentou)
        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(task.getUserId());
        if (task.getAssigneeId() != null) recipients.add(task.getAssigneeId());
        recipients.remove(user.userId());
        AfterCommit.run(() -> recipients.forEach(id -> notifications.sendTo(id, "INFO",
                "Novo comentário",
                user.username() + " comentou em \"" + task.getTitle() + "\".")));
        return toResponse(saved);
    }

    @Transactional
    public void delete(AuthenticatedUser user, Long taskId, Long commentId) {
        Task task = access.loadTask(user, taskId, ProjectRole.VIEWER);
        TaskComment comment = comments.findById(commentId)
                .filter(c -> c.getTaskId().equals(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado: " + commentId));

        boolean author = comment.getAuthorId().equals(user.userId());
        boolean projectOwner = task.getProjectId() != null && members
                .findByProjectIdAndUserId(task.getProjectId(), user.userId())
                .map(m -> m.getRole() == ProjectRole.OWNER).orElse(false);
        if (!author && !projectOwner) {
            throw new BusinessException("Só o autor ou o dono do projeto pode excluir o comentário", HttpStatus.FORBIDDEN);
        }
        comments.delete(comment);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> activity(AuthenticatedUser user, Long taskId) {
        access.loadTask(user, taskId, ProjectRole.VIEWER);
        return activities.findTop50ByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(a -> new ActivityResponse(a.getId(), a.getAction(), a.getActorName(), a.getDetails(), a.getCreatedAt()))
                .toList();
    }

    private CommentResponse toResponse(TaskComment c) {
        return new CommentResponse(c.getId(), c.getTaskId(), c.getAuthorId(), c.getAuthorName(),
                c.getContent(), c.getCreatedAt());
    }
}
