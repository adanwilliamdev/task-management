package com.taskflow.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String bio;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
