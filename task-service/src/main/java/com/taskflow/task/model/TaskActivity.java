package com.taskflow.task.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Linha do histórico de uma tarefa (quem fez o quê e quando). */
@Entity
@Table(name = "task_activities", indexes = @Index(name = "idx_activities_task", columnList = "task_id,created_at"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "actor_name", nullable = false, length = 50)
    private String actorName;

    /** CREATED, STATUS_CHANGED, ASSIGNED, UNASSIGNED, UPDATED, COMMENTED. */
    @Column(nullable = false, length = 30)
    private String action;

    @Column(length = 300)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
