package com.taskflow.task.dto;

public record TaskStatsResponse(long total, long todo, long inProgress, long done, long overdue) {
}
