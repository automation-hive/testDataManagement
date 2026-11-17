package com.dashboardforge.action;

import java.util.List;

public record ActionDefinition(
    String key,
    String name,
    String description,
    List<String> requiredInputs,
    List<String> optionalInputs
) {}
