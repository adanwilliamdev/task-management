package com.taskflow.task.client;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Envia notificações ao notification-service em segundo plano.
 * Falhas são apenas registradas em log: uma notificação perdida nunca
 * deve impedir a operação principal (criar/concluir tarefa).
 */
@Slf4j
@Component
public class NotificationClient {

    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String serviceId;
    private final ExecutorService executor = Executors.newFixedThreadPool(2, runnable -> {
        Thread thread = new Thread(runnable, "notification-client");
        thread.setDaemon(true);
        return thread;
    });

    public NotificationClient(RestTemplate restTemplate,
                              @Value("${app.notifications.enabled:true}") boolean enabled,
                              @Value("${app.notifications.service-id:NOTIFICATION-SERVICE}") String serviceId) {
        this.restTemplate = restTemplate;
        this.enabled = enabled;
        this.serviceId = serviceId;
    }

    public void send(String bearerToken, String type, String title, String message) {
        if (!enabled || bearerToken == null) {
            return;
        }
        executor.execute(() -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(bearerToken);
                headers.setContentType(MediaType.APPLICATION_JSON);
                Map<String, String> body = Map.of(
                        "title", truncate(title, 140),
                        "message", truncate(message, 900),
                        "type", type);
                restTemplate.postForEntity("http://" + serviceId + "/api/notifications",
                        new HttpEntity<>(body, headers), Void.class);
            } catch (Exception e) {
                log.warn("Não foi possível enviar notificação ({}): {}", type, e.getMessage());
            }
        });
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max - 1) + "…";
    }

    @PreDestroy
    void shutdown() {
        executor.shutdown();
    }
}
