package com.dashboardforge.rest;

import java.time.Instant;
import java.util.Map;

public record RestActionResponse(
    String method,
    String url,
    int statusCode,
    boolean successful,
    Object data,
    Map<String, Object> mappedData,
    Instant executedAt,
    long durationMs
) {}
