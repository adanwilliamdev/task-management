package com.taskflow.task.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final ReminderService reminders;

    @Value("${app.reminders.enabled:true}")
    private boolean enabled;

    @Scheduled(initialDelay = 60_000, fixedDelayString = "${app.reminders.interval-ms:3600000}")
    public void run() {
        if (!enabled) return;
        try {
            reminders.sendDueReminders(LocalDate.now());
        } catch (Exception e) {
            log.error("Falha ao processar lembretes de prazo", e);
        }
    }
}
