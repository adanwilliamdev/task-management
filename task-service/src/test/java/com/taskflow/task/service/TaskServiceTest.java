package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.dto.TaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.TaskStatusUpdateRequest;
import com.taskflow.task.exception.BusinessException;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.ProjectMember;
import com.taskflow.task.model.ProjectRole;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.repository.ProjectMemberRepository;
import com.taskflow.task.repository.TaskActivityRepository;
import com.taskflow.task.repository.TaskCommentRepository;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    private static final AuthenticatedUser USER = new AuthenticatedUser(1L, "ana", "jwt-token");

    @Mock
    private TaskRepository repository;

    @Mock
    private NotificationClient notifications;

    @Mock
    private AccessService access;

    @Mock
    private ProjectMemberRepository members;

    @Mock
    private TaskActivityRepository activities;

    @Mock
    private TaskCommentRepository comments;

    @InjectMocks
    private TaskService service;

    private Task existing(TaskStatus status) {
        return Task.builder()
                .id(10L)
                .title("Escrever testes")
                .status(status)
                .priority(TaskPriority.MEDIUM)
                .userId(1L)
                .build();
    }

    private void saveReturnsArgument() {
        when(repository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createUsesDefaultsAndNotifiesCreation() {
        saveReturnsArgument();

        TaskRequest request = new TaskRequest();
        request.setTitle("  Nova tarefa  ");

        TaskResponse response = service.create(USER, request);

        assertThat(response.getTitle()).isEqualTo("Nova tarefa");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(response.getPriority()).isEqualTo(TaskPriority.MEDIUM);
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getProjectId()).isNull();
        verify(notifications).send(eq("jwt-token"), eq("TASK_ASSIGNED"), anyString(), anyString());
    }

    @Test
    void createMarksPastDueTaskAsOverdue() {
        saveReturnsArgument();

        TaskRequest request = new TaskRequest();
        request.setTitle("Atrasada");
        request.setDueDate(LocalDate.now().minusDays(1));

        assertThat(service.create(USER, request).isOverdue()).isTrue();
    }

    @Test
    void createInProjectAssignsMemberAndNotifiesAssignee() {
        saveReturnsArgument();
        when(members.findByProjectIdAndUserId(5L, 2L)).thenReturn(Optional.of(
                ProjectMember.builder().projectId(5L).userId(2L).username("bia").role(ProjectRole.EDITOR).build()));

        TaskRequest request = new TaskRequest();
        request.setTitle("Revisar PR");
        request.setProjectId(5L);
        request.setAssigneeId(2L);

        TaskResponse response = service.create(USER, request);

        assertThat(response.getProjectId()).isEqualTo(5L);
        assertThat(response.getAssigneeId()).isEqualTo(2L);
        assertThat(response.getAssigneeUsername()).isEqualTo("bia");
        verify(access).requireMember(1L, 5L, ProjectRole.EDITOR);
        verify(notifications).sendTo(eq(2L), eq("TASK_ASSIGNED"), anyString(), anyString());
    }

    @Test
    void assigningToYourselfDoesNotSendExtraNotification() {
        saveReturnsArgument();
        when(members.findByProjectIdAndUserId(5L, 1L)).thenReturn(Optional.of(
                ProjectMember.builder().projectId(5L).userId(1L).username("ana").role(ProjectRole.OWNER).build()));

        TaskRequest request = new TaskRequest();
        request.setTitle("Minha tarefa");
        request.setProjectId(5L);
        request.setAssigneeId(1L);

        service.create(USER, request);

        verify(notifications, never()).sendTo(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void createRejectsAssigneeThatIsNotAProjectMember() {
        when(members.findByProjectIdAndUserId(5L, 99L)).thenReturn(Optional.empty());

        TaskRequest request = new TaskRequest();
        request.setTitle("Tarefa");
        request.setProjectId(5L);
        request.setAssigneeId(99L);

        assertThatThrownBy(() -> service.create(USER, request))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any(Task.class));
    }

    @Test
    void viewerCannotCreateTaskInProject() {
        doThrow(new BusinessException("sem permissão", HttpStatus.FORBIDDEN))
                .when(access).requireMember(1L, 5L, ProjectRole.EDITOR);

        TaskRequest request = new TaskRequest();
        request.setTitle("Tarefa");
        request.setProjectId(5L);

        assertThatThrownBy(() -> service.create(USER, request)).isInstanceOf(BusinessException.class);
        verify(repository, never()).save(any(Task.class));
    }

    @Test
    void personalTaskIgnoresAssignee() {
        saveReturnsArgument();

        TaskRequest request = new TaskRequest();
        request.setTitle("Pessoal");
        request.setAssigneeId(2L);

        assertThat(service.create(USER, request).getAssigneeId()).isNull();
    }

    @Test
    void completingATaskSendsCompletionNotification() {
        when(access.loadTask(USER, 10L, ProjectRole.EDITOR)).thenReturn(existing(TaskStatus.IN_PROGRESS));
        saveReturnsArgument();

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus(TaskStatus.DONE);

        TaskResponse response = service.updateStatus(USER, 10L, request);

        assertThat(response.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(response.isOverdue()).isFalse();
        verify(notifications).send(eq("jwt-token"), eq("TASK_COMPLETED"), anyString(), anyString());
        verify(notifications, never()).sendTo(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void completingSomeoneElsesTaskNotifiesItsCreator() {
        Task task = existing(TaskStatus.IN_PROGRESS);
        task.setUserId(2L);
        when(access.loadTask(USER, 10L, ProjectRole.EDITOR)).thenReturn(task);
        saveReturnsArgument();

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus(TaskStatus.DONE);

        service.updateStatus(USER, 10L, request);

        verify(notifications).sendTo(eq(2L), eq("TASK_COMPLETED"), anyString(), anyString());
    }

    @Test
    void settingDoneAgainDoesNotNotifyTwice() {
        when(access.loadTask(USER, 10L, ProjectRole.EDITOR)).thenReturn(existing(TaskStatus.DONE));
        saveReturnsArgument();

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus(TaskStatus.DONE);

        service.updateStatus(USER, 10L, request);

        verify(notifications, never()).send(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void accessingATaskWithoutPermissionIsNotFound() {
        when(access.loadTask(USER, 99L, ProjectRole.VIEWER))
                .thenThrow(new ResourceNotFoundException("Tarefa não encontrada: 99"));

        assertThatThrownBy(() -> service.getById(USER, 99L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void onlyCreatorOrProjectOwnerCanDeleteProjectTask() {
        Task task = existing(TaskStatus.TODO);
        task.setUserId(2L);
        task.setProjectId(5L);
        when(access.loadTask(USER, 10L, ProjectRole.EDITOR)).thenReturn(task);
        doThrow(new BusinessException("sem permissão", HttpStatus.FORBIDDEN))
                .when(access).requireMember(1L, 5L, ProjectRole.OWNER);

        assertThatThrownBy(() -> service.delete(USER, 10L)).isInstanceOf(BusinessException.class);
        verify(repository, never()).delete(any(Task.class));
    }

    @Test
    void normalizeLabelsTrimsAndRemovesDuplicates() {
        Set<String> labels = TaskService.normalizeLabels(List.of(" Bug ", "bug", "", "Frontend"));

        assertThat(labels).containsExactly("Bug", "Frontend");
    }
}
