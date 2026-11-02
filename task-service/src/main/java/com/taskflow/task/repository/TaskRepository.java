package com.taskflow.task.repository;

import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    List<Task> findByProjectId(Long projectId);

    /** Tarefas ainda não concluídas, com vencimento até a data e lembrete pendente. */
    List<Task> findByStatusNotAndDueReminderSentFalseAndDueDateLessThanEqual(TaskStatus status, LocalDate date);

    /** Ao remover um membro do projeto, suas tarefas ficam sem responsável. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Task t set t.assigneeId = null, t.assigneeUsername = null "
            + "where t.projectId = :projectId and t.assigneeId = :userId")
    int clearAssignee(@Param("projectId") Long projectId, @Param("userId") Long userId);
}
