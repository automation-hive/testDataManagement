package com.dashboardforge.codegen;

import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code-generation")
@CrossOrigin(origins = "http://localhost:5173", exposedHeaders = HttpHeaders.CONTENT_DISPOSITION)
public class CodeGenerationController {
    private final CodeGenerationService service;

    public CodeGenerationController(CodeGenerationService service) {
        this.service = service;
    }

    @PostMapping(value = "/generate", produces = "application/zip")
    public ResponseEntity<byte[]> generate(@Valid @RequestBody CodeGenerationRequest request) {
        byte[] archive = service.generate(request);
        String filename = service.fileName(request.projectName()) + "-source.zip";
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/zip"))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(filename).build().toString())
            .body(archive);
    }
}
