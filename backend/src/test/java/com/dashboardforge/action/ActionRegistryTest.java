package com.dashboardforge.action;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

class ActionRegistryTest {
    private ActionRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new ActionRegistry();
    }

    @Test
    void exposesOnlyRegisteredActions() {
        assertEquals(4, registry.listActions().size());
        assertTrue(registry.listActions().stream().anyMatch(action -> action.key().equals("math.add")));
    }

    @Test
    void addsNumericInputs() {
        Object result = registry.execute("math.add", Map.of("left", 12, "right", 3.5));
        assertEquals(0, new BigDecimal("15.5").compareTo((BigDecimal) result));
    }

    @Test
    void rejectsMissingRequiredInputs() {
        assertThrows(IllegalArgumentException.class,
            () -> registry.execute("math.add", Map.of("left", 1)));
    }

    @Test
    void rejectsUnknownInputs() {
        assertThrows(IllegalArgumentException.class,
            () -> registry.execute("system.ping", Map.of("className", "java.lang.Runtime")));
    }

    @Test
    void rejectsUnknownActionKeys() {
        assertThrows(NoSuchElementException.class,
            () -> registry.execute("java.lang.Runtime.exec", Map.of()));
    }

    @Test
    void convertsTextToUppercase() {
        assertEquals("DASHBOARDFORGE",
            registry.execute("text.uppercase", Map.of("text", "DashboardForge")));
    }
}
