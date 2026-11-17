package com.dashboardforge.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Size(max = 200000) String configJson
) {}
