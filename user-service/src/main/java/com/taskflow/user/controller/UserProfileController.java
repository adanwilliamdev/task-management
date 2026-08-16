package com.taskflow.user.controller;

import com.taskflow.user.dto.UpdateProfileRequest;
import com.taskflow.user.dto.UserProfileResponse;
import com.taskflow.user.security.AuthenticatedUser;
import com.taskflow.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService service;

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return service.getOrCreateProfile(user);
    }

    @PutMapping("/me")
    public UserProfileResponse updateMe(@AuthenticationPrincipal AuthenticatedUser user,
                                         @Valid @RequestBody UpdateProfileRequest request) {
        return service.updateProfile(user, request);
    }

    @GetMapping("/{userId}")
    public UserProfileResponse getByUserId(@PathVariable Long userId) {
        return service.getByUserId(userId);
    }

    @GetMapping
    public List<UserProfileResponse> getAll() {
        return service.getAll();
    }
}
