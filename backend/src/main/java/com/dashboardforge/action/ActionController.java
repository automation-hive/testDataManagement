package com.dashboardforge.action;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/actions")
@CrossOrigin(origins = "http://localhost:5173")
public class ActionController {
    private static final Logger log = LoggerFactory.getLogger(ActionController.class);
    private final ActionRegistry actionRegistry;

    public ActionController(ActionRegistry actionRegistry) {
        this.actionRegistry = actionRegistry;
    }

    @GetMapping
    public List<ActionDefinition> listActions() {
        return actionRegistry.listActions();
    }

    @PostMapping("/{actionKey}/execute")
    public ActionExecutionResponse execute(
        @PathVariable String actionKey,
        @Valid @RequestBody ActionExecutionRequest request
    ) {
        long startedAt = System.nanoTime();
        try {
            Object result = actionRegistry.execute(actionKey, request.inputs());
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Action '{}' completed in {} ms", actionKey, durationMs);
            return new ActionExecutionResponse(actionKey, "SUCCESS", result, Instant.now(), durationMs);
        } catch (NoSuchElementException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
        } catch (IllegalArgumentException exception) {
            log.warn("Action '{}' rejected: {}", actionKey, exception.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }
}
