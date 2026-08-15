package com.taskmanagement.repository;

import com.taskmanagement.model.Task;
import com.taskmanagement.model.TaskStatus;
import com.taskmanagement.model.TaskPriority;
import com.taskmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {
    List<Task> findByUserOrderByCreatedAtDesc(User user);
    
    List<Task> findByUserAndStatus(User user, TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.user = :user AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:dueDate IS NULL OR t.dueDate <= :dueDate)")
    List<Task> findByUserAndFilters(@Param("user") User user,
                                    @Param("status") TaskStatus status,
                                    @Param("priority") TaskPriority priority,
                                    @Param("dueDate") LocalDateTime dueDate);
}
