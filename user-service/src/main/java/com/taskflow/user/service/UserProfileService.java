package com.taskflow.user.service;

import com.taskflow.user.dto.UpdateProfileRequest;
import com.taskflow.user.dto.UserProfileResponse;
import com.taskflow.user.model.UserProfile;
import com.taskflow.user.repository.UserProfileRepository;
import com.taskflow.user.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository repository;

    @Transactional
    public UserProfileResponse getOrCreateProfile(AuthenticatedUser user) {
        UserProfile profile = repository.findByUserId(user.userId())
                .orElseGet(() -> repository.save(UserProfile.builder()
                        .userId(user.userId())
                        .username(user.username())
                        .build()));
        return toResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateProfile(AuthenticatedUser user, UpdateProfileRequest request) {
        UserProfile profile = repository.findByUserId(user.userId())
                .orElseGet(() -> UserProfile.builder()
                        .userId(user.userId())
                        .username(user.username())
                        .build());

        // null = não alterar; string vazia = limpar o campo
        if (request.getFullName() != null) profile.setFullName(blankToNull(request.getFullName()));
        if (request.getBio() != null) profile.setBio(blankToNull(request.getBio()));
        if (request.getPhone() != null) profile.setPhone(blankToNull(request.getPhone()));

        return toResponse(repository.save(profile));
    }

    private static String blankToNull(String value) {
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserProfileResponse toResponse(UserProfile p) {
        return UserProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .username(p.getUsername())
                .fullName(p.getFullName())
                .bio(p.getBio())
                .phone(p.getPhone())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
