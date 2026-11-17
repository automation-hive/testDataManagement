package com.dashboardforge.action;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;

@Component
public class ActionRegistry {
    private final Map<String, RegisteredAction> actions;

    public ActionRegistry() {
        Map<String, RegisteredAction> registered = new LinkedHashMap<>();

        register(registered, new ActionDefinition(
            "system.ping", "Ping",
            "Returns a simple response to verify that the action engine is available.",
            List.of(), List.of()
        ), inputs -> Map.of("message", "pong"));

        register(registered, new ActionDefinition(
            "dashboard.greeting", "Greeting",
            "Creates a greeting for a dashboard user.",
            List.of(), List.of("name")
        ), inputs -> {
            String name = optionalString(inputs, "name", "there");
            return Map.of("message", "Hello, " + name + "!");
        });

        register(registered, new ActionDefinition(
            "math.add", "Add numbers",
            "Adds two numeric values and returns the sum.",
            List.of("left", "right"), List.of()
        ), inputs -> requireNumber(inputs, "left").add(requireNumber(inputs, "right")).stripTrailingZeros());

        register(registered, new ActionDefinition(
            "text.uppercase", "Uppercase text",
            "Converts the supplied text to uppercase using a locale-independent rule.",
            List.of("text"), List.of()
        ), inputs -> requireString(inputs, "text").toUpperCase(Locale.ROOT));

        this.actions = Collections.unmodifiableMap(registered);
    }

    public List<ActionDefinition> listActions() {
        return actions.values().stream().map(RegisteredAction::definition).toList();
    }

    public Object execute(String actionKey, Map<String, Object> inputs) {
        RegisteredAction action = actions.get(actionKey);
        if (action == null) {
            throw new NoSuchElementException("No registered action exists for key: " + actionKey);
        }
        Map<String, Object> safeInputs = inputs == null ? Map.of() : new LinkedHashMap<>(inputs);
        validateInputs(action.definition(), safeInputs);
        return action.handler().apply(safeInputs);
    }

    private static void register(
        Map<String, RegisteredAction> target,
        ActionDefinition definition,
        Function<Map<String, Object>, Object> handler
    ) {
        target.put(definition.key(), new RegisteredAction(definition, handler));
    }

    private static void validateInputs(ActionDefinition definition, Map<String, Object> inputs) {
        for (String key : definition.requiredInputs()) {
            if (!inputs.containsKey(key) || inputs.get(key) == null) {
                throw new IllegalArgumentException("Missing required input: " + key);
            }
        }
        List<String> allowed = new java.util.ArrayList<>(definition.requiredInputs());
        allowed.addAll(definition.optionalInputs());
        for (String key : inputs.keySet()) {
            if (!allowed.contains(key)) {
                throw new IllegalArgumentException("Unsupported input for " + definition.key() + ": " + key);
            }
        }
    }

    private static BigDecimal requireNumber(Map<String, Object> inputs, String key) {
        Object value = inputs.get(key);
        if (!(value instanceof Number)) {
            throw new IllegalArgumentException("Input '" + key + "' must be a number.");
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Input '" + key + "' must be a valid number.");
        }
    }

    private static String requireString(Map<String, Object> inputs, String key) {
        Object value = inputs.get(key);
        if (!(value instanceof String text)) {
            throw new IllegalArgumentException("Input '" + key + "' must be a string.");
        }
        return text;
    }

    private static String optionalString(Map<String, Object> inputs, String key, String fallback) {
        if (!inputs.containsKey(key)) {
            return fallback;
        }
        return requireString(inputs, key);
    }

    private record RegisteredAction(
        ActionDefinition definition,
        Function<Map<String, Object>, Object> handler
    ) {}
}
