package com.taskflow.task.service;

import com.taskflow.task.exception.BusinessException;
import com.taskflow.task.exception.ResourceNotFoundException;
import com.taskflow.task.model.ProjectMember;
import com.taskflow.task.model.ProjectRole;
import com.taskflow.task.model.Task;
import com.taskflow.task.repository.ProjectMemberRepository;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.task.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessServiceTest {

    private static final AuthenticatedUser USER = new AuthenticatedUser(1L, "ana", "t");

    @Mock
    private ProjectMemberRepository members;

    @Mock
    private TaskRepository tasks;

    @InjectMocks
    private AccessService access;

    private ProjectMember member(ProjectRole role) {
        return ProjectMember.builder().projectId(5L).userId(1L).username("ana").role(role).build();
    }

    @Test
    void nonMemberSeesProjectAsNotFound() {
        when(members.findByProjectIdAndUserId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> access.requireMember(1L, 5L, ProjectRole.VIEWER))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void viewerIsForbiddenFromEditing() {
        when(members.findByProjectIdAndUserId(5L, 1L)).thenReturn(Optional.of(member(ProjectRole.VIEWER)));

        assertThatThrownBy(() -> access.requireMember(1L, 5L, ProjectRole.EDITOR))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void ownerSatisfiesEveryRole() {
        when(members.findByProjectIdAndUserId(5L, 1L)).thenReturn(Optional.of(member(ProjectRole.OWNER)));

        assertThat(access.requireMember(1L, 5L, ProjectRole.OWNER).getRole()).isEqualTo(ProjectRole.OWNER);
    }

    @Test
    void personalTaskOfAnotherUserIsNotFound() {
        Task task = Task.builder().id(10L).userId(2L).build();
        when(tasks.findById(10L)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> access.loadTask(USER, 10L, ProjectRole.VIEWER))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void projectTaskIsVisibleToMembers() {
        Task task = Task.builder().id(10L).userId(2L).projectId(5L).build();
        when(tasks.findById(10L)).thenReturn(Optional.of(task));
        when(members.findByProjectIdAndUserId(5L, 1L)).thenReturn(Optional.of(member(ProjectRole.VIEWER)));

        assertThat(access.loadTask(USER, 10L, ProjectRole.VIEWER)).isSameAs(task);
    }
}
