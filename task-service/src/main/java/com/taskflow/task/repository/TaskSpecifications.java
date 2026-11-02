package com.taskflow.task.repository;

import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Filtros dinâmicos. Usamos Specifications (e não JPQL com ":param IS NULL")
 * porque o PostgreSQL não consegue inferir o tipo de parâmetros nulos.
 */
public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    /**
     * Escopo de visibilidade: com projectId, as tarefas do projeto (o acesso já foi validado);
     * sem projectId, apenas as tarefas pessoais do usuário.
     */
    public static Specification<Task> scope(Long userId, Long projectId) {
        return (root, cq, cb) -> projectId != null
                ? cb.equal(root.get("projectId"), projectId)
                : cb.and(cb.isNull(root.get("projectId")), cb.equal(root.get("userId"), userId));
    }

    public static Specification<Task> hasStatus(TaskStatus status) {
        return (root, cq, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Task> overdue(LocalDate today) {
        return (root, cq, cb) -> cb.and(
                cb.notEqual(root.get("status"), TaskStatus.DONE),
                cb.lessThan(root.<LocalDate>get("dueDate"), today));
    }

    public static Specification<Task> filter(Long userId, Long projectId, TaskStatus status, TaskPriority priority,
                                             String query, String label, Long assigneeId) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(scope(userId, projectId).toPredicate(root, cq, cb));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assigneeId"), assigneeId));
            }
            if (label != null && !label.isBlank()) {
                predicates.add(cb.isMember(label.trim(), root.<java.util.Set<String>>get("labels")));
            }
            if (query != null && !query.isBlank()) {
                String like = "%" + escapeLike(query.trim().toLowerCase()) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.<String>get("title")), like, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("description"), "")), like, '\\')
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
