package com.taskflow.task.repository;

import com.taskflow.task.model.TaskActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {

    List<TaskActivity> findTop50ByTaskIdOrderByCreatedAtDesc(Long taskId);

    void deleteByTaskId(Long taskId);

    void deleteByTaskIdIn(Collection<Long> taskIds);
}
