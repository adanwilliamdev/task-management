package com.taskflow.auth.dto;

/** Dados mínimos e públicos de um usuário (usado para convidar membros em projetos). */
public record UserLookupResponse(Long id, String username) {
}
