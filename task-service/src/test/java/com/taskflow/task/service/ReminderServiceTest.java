package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReminderServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 2);

    @Mock
    private TaskRepository repository;

    @Mock
    private NotificationClient notifications;

    @InjectMocks
    private ReminderService service;

    @Test
    void remindsAssigneeOnceAndMarksTaskAsReminded() {
        Task task = Task.builder().id(1L).title("Deploy").userId(1L).assigneeId(2L)
                .status(TaskStatus.TODO).dueDate(TODAY).build();
        when(repository.findByStatusNotAndDueReminderSentFalseAndDueDateLessThanEqual(TaskStatus.DONE, TODAY.plusDays(1)))
                .thenReturn(List.of(task));

        int sent = service.sendDueReminders(TODAY);

        assertThat(sent).isEqualTo(1);
        assertThat(task.isDueReminderSent()).isTrue();
        verify(repository).save(task);
        verify(notifications).sendTo(eq(2L), eq("TASK_DUE"), anyString(), contains("vence hoje"));
    }

    @Test
    void fallsBackToCreatorAndReportsLateTasks() {
        Task task = Task.builder().id(1L).title("Relatório").userId(1L)
                .status(TaskStatus.IN_PROGRESS).dueDate(TODAY.minusDays(3)).build();
        when(repository.findByStatusNotAndDueReminderSentFalseAndDueDateLessThanEqual(TaskStatus.DONE, TODAY.plusDays(1)))
                .thenReturn(List.of(task));

        service.sendDueReminders(TODAY);

        verify(notifications).sendTo(eq(1L), eq("TASK_DUE"), anyString(), contains("atrasada"));
    }
}
