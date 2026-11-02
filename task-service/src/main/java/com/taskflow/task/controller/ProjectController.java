package com.taskflow.task.controller;

import com.taskflow.task.dto.MemberRequest;
import com.taskflow.task.dto.MemberResponse;
import com.taskflow.task.dto.MemberRoleRequest;
import com.taskflow.task.dto.ProjectRequest;
import com.taskflow.task.dto.ProjectResponse;
import com.taskflow.task.security.AuthenticatedUser;
import com.taskflow.task.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService service;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
    }

    @GetMapping
    public List<ProjectResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return service.listMine(user);
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return service.get(user, id);
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id,
                                  @Valid @RequestBody ProjectRequest request) {
        return service.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        service.delete(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public List<MemberResponse> members(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return service.listMembers(user, id);
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<MemberResponse> addMember(@AuthenticationPrincipal AuthenticatedUser user,
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody MemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addMember(user, id, request));
    }

    @PatchMapping("/{id}/members/{userId}")
    public MemberResponse changeRole(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id,
                                     @PathVariable Long userId, @Valid @RequestBody MemberRoleRequest request) {
        return service.changeRole(user, id, userId, request);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@AuthenticationPrincipal AuthenticatedUser user,
                                             @PathVariable Long id, @PathVariable Long userId) {
        service.removeMember(user, id, userId);
        return ResponseEntity.noContent().build();
    }
}
