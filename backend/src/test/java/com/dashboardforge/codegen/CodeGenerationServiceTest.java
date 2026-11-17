package com.dashboardforge.codegen;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.*;

class CodeGenerationServiceTest {
    private CodeGenerationService service;

    @BeforeEach
    void setUp() {
        service = new CodeGenerationService(new ObjectMapper());
    }

    @Test
    void createsArchiveWithReactAndJavaScaffolds() throws Exception {
        String config = """
            {"version":2,"components":[
              {"id":"one","type":"BUTTON","label":"Run","actionKey":"system.ping","properties":{"disabled":false}}
            ]}
            """;
        byte[] archive = service.generate(new CodeGenerationRequest("My Dashboard", config));
        Set<String> entries = new HashSet<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(archive))) {
            for (var entry = zip.getNextEntry(); entry != null; entry = zip.getNextEntry()) {
                entries.add(entry.getName());
            }
        }
        assertTrue(entries.contains("react/src/generated/DashboardView.tsx"));
        assertTrue(entries.contains("java/src/main/java/generated/dashboard/DashboardActionController.java"));
        assertTrue(entries.contains("dashboard.config.json"));
    }

    @Test
    void rejectsInvalidJson() {
        assertThrows(ResponseStatusException.class,
            () -> service.generate(new CodeGenerationRequest("Broken", "{not-json")));
    }

    @Test
    void rejectsUnsupportedComponentType() {
        String config = """
            {"components":[{"type":"ARBITRARY","properties":{}}]}
            """;
        assertThrows(ResponseStatusException.class,
            () -> service.generate(new CodeGenerationRequest("Unsafe", config)));
    }

    @Test
    void createsSafeFileName() {
        assertEquals("sales-dashboard", service.fileName("Sales Dashboard"));
        assertEquals("dashboard", service.fileName("../../../"));
    }
}
