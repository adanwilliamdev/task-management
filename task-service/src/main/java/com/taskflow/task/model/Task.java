package com.taskflow.task.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tasks", indexes = {
        @Index(name = "idx_tasks_user_status", columnList = "user_id,status"),
        @Index(name = "idx_tasks_user_due", columnList = "user_id,due_date"),
        @Index(name = "idx_tasks_project", columnList = "project_id,status"),
        @Index(name = "idx_tasks_due_reminder", columnList = "due_reminder_sent,due_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "due_date")
    private LocalDate dueDate;

    /** Criador da tarefa. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Nulo = tarefa pessoal (visível só ao criador). */
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "assignee_username", length = 50)
    private String assigneeUsername;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "task_labels", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "label", length = 30)
    @BatchSize(size = 50)
    @Builder.Default
    private Set<String> labels = new LinkedHashSet<>();

    /** Evita enviar o lembrete de vencimento mais de uma vez. */
    @Column(name = "due_reminder_sent", nullable = false, columnDefinition = "boolean not null default false")
    @Builder.Default
    private boolean dueReminderSent = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
