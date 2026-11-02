package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Avisa o responsável (ou o criador, se não houver responsável) de tarefas que vencem
 * até amanhã ou já venceram. Cada tarefa é lembrada uma única vez por data de entrega.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final TaskRepository repository;
    private final NotificationClient notifications;

    @Transactional
    public int sendDueReminders(LocalDate today) {
        List<Task> due = repository
                .findByStatusNotAndDueReminderSentFalseAndDueDateLessThanEqual(TaskStatus.DONE, today.plusDays(1));

        for (Task task : due) {
            Long recipient = task.getAssigneeId() != null ? task.getAssigneeId() : task.getUserId();
            boolean late = task.getDueDate().isBefore(today);
            String message = late
                    ? "\"" + task.getTitle() + "\" está atrasada desde " + task.getDueDate() + "."
                    : task.getDueDate().equals(today)
                        ? "\"" + task.getTitle() + "\" vence hoje."
                        : "\"" + task.getTitle() + "\" vence amanhã.";
            task.setDueReminderSent(true);
            repository.save(task);
            AfterCommit.run(() -> notifications.sendTo(recipient, "TASK_DUE", "Lembrete de prazo", message));
        }
        if (!due.isEmpty()) {
            log.info("{} lembrete(s) de prazo enviado(s)", due.size());
        }
        return due.size();
    }
}
