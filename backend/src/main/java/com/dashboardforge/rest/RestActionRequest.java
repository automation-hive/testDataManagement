package com.dashboardforge.rest;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record RestActionRequest(
    @NotBlank String method,
    @NotBlank String url,
    Map<String, String> headers,
    Object body,
    Map<String, String> responseMappings
) {}
