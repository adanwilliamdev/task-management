package com.taskflow.task.service;

import com.taskflow.task.client.NotificationClient;
import com.taskflow.task.client.UserDirectoryClient;
import com.taskflow.task.dto.MemberRequest;
import com.taskflow.task.dto.MemberResponse;
import com.taskflow.task.dto.MemberRoleRequest;
import com.taskflow.task.dto.ProjectRequest;
import com.taskflow.task.dto.ProjectResponse;
import com.taskflow.task.exception.BusinessException;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.Project;
import com.taskflow.task.model.ProjectMember;
import com.taskflow.task.model.ProjectRole;
import com.taskflow.task.model.Task;
import com.taskflow.task.repository.ProjectMemberRepository;
import com.taskflow.task.repository.ProjectRepository;
import com.taskflow.task.repository.TaskActivityRepository;
import com.taskflow.task.repository.TaskCommentRepository;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final TaskRepository tasks;
    private final TaskCommentRepository comments;
    private final TaskActivityRepository activities;
    private final AccessService access;
    private final UserDirectoryClient userDirectory;
    private final NotificationClient notifications;

    @Transactional
    public ProjectResponse create(AuthenticatedUser user, ProjectRequest request) {
        Project project = projects.save(Project.builder()
                .name(request.getName().trim())
                .description(blankToNull(request.getDescription()))
                .ownerId(user.userId())
                .build());
        members.save(ProjectMember.builder()
                .projectId(project.getId())
                .userId(user.userId())
                .username(user.username())
                .role(ProjectRole.OWNER)
                .build());
        return toResponse(project, ProjectRole.OWNER, 1);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMine(AuthenticatedUser user) {
        return members.findByUserId(user.userId()).stream()
                .map(m -> projects.findById(m.getProjectId())
                        .map(p -> toResponse(p, m.getRole(), members.countByProjectId(p.getId())))
                        .orElse(null))
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(ProjectResponse::getCreatedAt).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(AuthenticatedUser user, Long id) {
        ProjectMember me = access.requireMember(user.userId(), id, ProjectRole.VIEWER);
        return toResponse(findProject(id), me.getRole(), members.countByProjectId(id));
    }

    @Transactional
    public ProjectResponse update(AuthenticatedUser user, Long id, ProjectRequest request) {
        access.requireMember(user.userId(), id, ProjectRole.OWNER);
        Project project = findProject(id);
        project.setName(request.getName().trim());
        project.setDescription(blankToNull(request.getDescription()));
        Project saved = projects.save(project);
        return toResponse(saved, ProjectRole.OWNER, members.countByProjectId(id));
    }

    @Transactional
    public void delete(AuthenticatedUser user, Long id) {
        access.requireMember(user.userId(), id, ProjectRole.OWNER);
        List<Task> projectTasks = tasks.findByProjectId(id);
        List<Long> taskIds = projectTasks.stream().map(Task::getId).toList();
        if (!taskIds.isEmpty()) {
            comments.deleteByTaskIdIn(taskIds);
            activities.deleteByTaskIdIn(taskIds);
            tasks.deleteAll(projectTasks);
        }
        members.deleteByProjectId(id);
        projects.deleteById(id);
    }

    // ---- membros ----

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(AuthenticatedUser user, Long projectId) {
        access.requireMember(user.userId(), projectId, ProjectRole.VIEWER);
        return members.findByProjectIdOrderByJoinedAtAsc(projectId).stream().map(this::toMember).toList();
    }

    @Transactional
    public MemberResponse addMember(AuthenticatedUser user, Long projectId, MemberRequest request) {
        access.requireMember(user.userId(), projectId, ProjectRole.OWNER);
        if (request.getRole() == ProjectRole.OWNER) {
            throw new BusinessException("Um projeto tem um único dono; convide como Editor ou Leitor",
                    HttpStatus.BAD_REQUEST);
        }
        var target = userDirectory.findByUsername(user.token(), request.getUsername().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + request.getUsername().trim()));
        if (members.findByProjectIdAndUserId(projectId, target.id()).isPresent()) {
            throw new BusinessException("Este usuário já é membro do projeto", HttpStatus.CONFLICT);
        }
        ProjectMember saved = members.save(ProjectMember.builder()
                .projectId(projectId)
                .userId(target.id())
                .username(target.username())
                .role(request.getRole())
                .build());

        String projectName = findProject(projectId).getName();
        AfterCommit.run(() -> notifications.sendTo(target.id(), "INFO", "Você foi adicionado a um projeto",
                user.username() + " adicionou você ao projeto \"" + projectName + "\"."));
        return toMember(saved);
    }

    @Transactional
    public MemberResponse changeRole(AuthenticatedUser user, Long projectId, Long userId, MemberRoleRequest request) {
        access.requireMember(user.userId(), projectId, ProjectRole.OWNER);
        if (request.getRole() == ProjectRole.OWNER) {
            throw new BusinessException("Não é possível promover outro membro a dono", HttpStatus.BAD_REQUEST);
        }
        ProjectMember member = members.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membro não encontrado"));
        if (member.getRole() == ProjectRole.OWNER) {
            throw new BusinessException("O papel do dono não pode ser alterado", HttpStatus.BAD_REQUEST);
        }
        member.setRole(request.getRole());
        return toMember(members.save(member));
    }

    /** O dono remove qualquer membro; um membro pode sair por conta própria. O dono não pode sair. */
    @Transactional
    public void removeMember(AuthenticatedUser user, Long projectId, Long userId) {
        boolean leaving = user.userId().equals(userId);
        access.requireMember(user.userId(), projectId, leaving ? ProjectRole.VIEWER : ProjectRole.OWNER);

        ProjectMember member = members.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membro não encontrado"));
        if (member.getRole() == ProjectRole.OWNER) {
            throw new BusinessException("O dono não pode sair do projeto; exclua o projeto se necessário",
                    HttpStatus.BAD_REQUEST);
        }
        tasks.clearAssignee(projectId, userId);
        members.delete(member);
    }

    private Project findProject(Long id) {
        return projects.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + id));
    }

    private MemberResponse toMember(ProjectMember m) {
        return new MemberResponse(m.getUserId(), m.getUsername(), m.getRole(), m.getJoinedAt());
    }

    private ProjectResponse toResponse(Project p, ProjectRole myRole, long memberCount) {
        return ProjectResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .ownerId(p.getOwnerId())
                .myRole(myRole)
                .memberCount(memberCount)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
