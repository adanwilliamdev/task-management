package com.taskflow.task.client;

import com.taskflow.task.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Optional;

/** Consulta o auth-service (via Eureka) para resolver um username em userId. */
@Slf4j
@Component
public class UserDirectoryClient {

    public record UserRef(Long id, String username) {
    }

    private final RestTemplate restTemplate;
    private final String serviceId;

    public UserDirectoryClient(RestTemplate restTemplate,
                               @Value("${app.auth.service-id:AUTH-SERVICE}") String serviceId) {
        this.restTemplate = restTemplate;
        this.serviceId = serviceId;
    }

    public Optional<UserRef> findByUsername(String bearerToken, String username) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        String url = UriComponentsBuilder.fromUriString("http://" + serviceId + "/api/auth/users/lookup")
                .queryParam("username", username)
                .build().encode().toUriString();
        try {
            UserRef ref = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), UserRef.class).getBody();
            return Optional.ofNullable(ref);
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException e) {
            log.warn("Falha ao consultar o auth-service: {}", e.getMessage());
            throw new BusinessException("Não foi possível consultar usuários agora. Tente novamente.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
