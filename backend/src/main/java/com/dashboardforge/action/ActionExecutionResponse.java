package com.dashboardforge.action;

import java.time.Instant;

public record ActionExecutionResponse(
    String actionKey,
    String status,
    Object result,
    Instant executedAt,
    long durationMs
) {}
