package com.dashboardforge.action;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record ActionExecutionRequest(
    @NotNull(message = "inputs must be provided; use an empty object when no inputs are needed")
    Map<String, Object> inputs
) {}
