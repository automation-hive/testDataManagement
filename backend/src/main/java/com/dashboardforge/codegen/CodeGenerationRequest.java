package com.dashboardforge.codegen;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CodeGenerationRequest(
    @NotBlank @Size(max = 120) String projectName,
    @NotBlank @Size(max = 500_000) String configJson
) {}
