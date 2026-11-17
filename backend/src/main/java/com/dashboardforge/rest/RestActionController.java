package com.dashboardforge.rest;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rest-actions")
@CrossOrigin(origins = "http://localhost:5173")
public class RestActionController {
    private static final Logger log = LoggerFactory.getLogger(RestActionController.class);
    private final RestActionService service;

    public RestActionController(RestActionService service) {
        this.service = service;
    }

    @PostMapping("/execute")
    public RestActionResponse execute(@Valid @RequestBody RestActionRequest request) {
        RestActionResponse response = service.execute(request);
        log.info("REST action {} {} completed with status {} in {} ms",
            response.method(), response.url(), response.statusCode(), response.durationMs());
        return response;
    }
}
