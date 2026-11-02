package com.taskflow.task.service;

import com.taskflow.task.exception.BusinessException;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.ProjectMember;
import com.taskflow.task.model.ProjectRole;
import com.taskflow.task.model.Task;
import com.taskflow.task.repository.ProjectMemberRepository;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Ponto único das regras de autorização:
 * - quem não é membro do projeto recebe 404 (não revelamos que o projeto existe);
 * - membro sem papel suficiente recebe 403.
 */
@Service
@RequiredArgsConstructor
public class AccessService {

    private final ProjectMemberRepository members;
    private final TaskRepository tasks;

    public ProjectMember requireMember(Long userId, Long projectId, ProjectRole minimum) {
        ProjectMember member = members.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + projectId));
        if (!member.getRole().atLeast(minimum)) {
            throw new BusinessException("Você não tem permissão para esta ação neste projeto", HttpStatus.FORBIDDEN);
        }
        return member;
    }

    /**
     * Carrega a tarefa garantindo o acesso. Tarefas pessoais só o criador enxerga;
     * tarefas de projeto exigem o papel mínimo informado.
     */
    public Task loadTask(AuthenticatedUser user, Long taskId, ProjectRole minimum) {
        Task task = tasks.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada: " + taskId));
        if (task.getProjectId() == null) {
            if (!task.getUserId().equals(user.userId())) {
                throw new ResourceNotFoundException("Tarefa não encontrada: " + taskId);
            }
        } else {
            requireMember(user.userId(), task.getProjectId(), minimum);
        }
        return task;
    }
}
