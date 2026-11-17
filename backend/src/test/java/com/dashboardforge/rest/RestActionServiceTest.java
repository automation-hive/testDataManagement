package com.dashboardforge.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RestActionServiceTest {
    private RestActionService service;

    @BeforeEach
    void setUp() {
        service = new RestActionService(new ObjectMapper(), "api.example.com", "");
    }

    @Test
    void allowsConfiguredHttpsHost() {
        assertEquals("api.example.com",
            service.validateTarget("https://api.example.com/v1/items").getHost());
    }

    @Test
    void rejectsUnlistedHost() {
        assertThrows(ResponseStatusException.class,
            () -> service.validateTarget("https://unlisted.example/v1"));
    }

    @Test
    void rejectsPlainHttp() {
        assertThrows(ResponseStatusException.class,
            () -> service.validateTarget("http://api.example.com/v1"));
    }

    @Test
    void rejectsCredentialsInUrl() {
        assertThrows(ResponseStatusException.class,
            () -> service.validateTarget("https://user:pass@api.example.com/v1"));
    }

    @Test
    void rejectsUnsupportedMethod() {
        assertThrows(ResponseStatusException.class,
            () -> service.execute(new RestActionRequest("TRACE",
                "https://api.example.com/v1", Map.of(), null, Map.of())));
    }
}
