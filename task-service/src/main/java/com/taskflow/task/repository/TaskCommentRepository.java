package com.taskflow.task.repository;

import com.taskflow.task.model.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {

    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    void deleteByTaskId(Long taskId);

    void deleteByTaskIdIn(Collection<Long> taskIds);
}
