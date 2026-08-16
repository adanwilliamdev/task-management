package com.taskflow.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 120, message = "Nome completo deve ter no máximo 120 caracteres")
    private String fullName;

    @Size(max = 500, message = "Bio deve ter no máximo 500 caracteres")
    private String bio;

    @Size(max = 30, message = "Telefone deve ter no máximo 30 caracteres")
    private String phone;
}
