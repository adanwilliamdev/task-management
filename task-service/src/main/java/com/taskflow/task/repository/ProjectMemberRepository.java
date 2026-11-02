package com.taskflow.task.repository;

import com.taskflow.task.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    List<ProjectMember> findByProjectIdOrderByJoinedAtAsc(Long projectId);

    List<ProjectMember> findByUserId(Long userId);

    long countByProjectId(Long projectId);

    void deleteByProjectId(Long projectId);
}
