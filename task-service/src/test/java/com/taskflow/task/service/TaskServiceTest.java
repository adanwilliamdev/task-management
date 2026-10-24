package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.dto.TaskRequest;
import com.taskflow.task.dto.TaskResponse;
import com.taskflow.task.dto.TaskStatusUpdateRequest;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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

    @Test
    void createUsesDefaultsAndNotifiesAssignment() {
        when(repository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskRequest request = new TaskRequest();
        request.setTitle("  Nova tarefa  ");

        TaskResponse response = service.create(USER, request);

        assertThat(response.getTitle()).isEqualTo("Nova tarefa");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(response.getPriority()).isEqualTo(TaskPriority.MEDIUM);
        assertThat(response.getUserId()).isEqualTo(1L);
        verify(notifications).send(eq("jwt-token"), eq("TASK_ASSIGNED"), anyString(), anyString());
    }

    @Test
    void createMarksPastDueTaskAsOverdue() {
        when(repository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskRequest request = new TaskRequest();
        request.setTitle("Atrasada");
        request.setDueDate(LocalDate.now().minusDays(1));

        assertThat(service.create(USER, request).isOverdue()).isTrue();
    }

    @Test
    void completingATaskSendsCompletionNotification() {
        when(repository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing(TaskStatus.IN_PROGRESS)));
        when(repository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus(TaskStatus.DONE);

        TaskResponse response = service.updateStatus(USER, 10L, request);

        assertThat(response.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(response.isOverdue()).isFalse();
        verify(notifications).send(eq("jwt-token"), eq("TASK_COMPLETED"), anyString(), anyString());
    }

    @Test
    void settingDoneAgainDoesNotNotifyTwice() {
        when(repository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing(TaskStatus.DONE)));
        when(repository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus(TaskStatus.DONE);

        service.updateStatus(USER, 10L, request);

        verify(notifications, never()).send(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void accessingAnotherUsersTaskIsNotFound() {
        when(repository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(USER, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
