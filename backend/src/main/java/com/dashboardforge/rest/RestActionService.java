package com.dashboardforge.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class RestActionService {
    private static final int MAX_BODY_BYTES = 1_048_576;
    private static final Set<String> METHODS = Set.of("GET", "POST", "PUT", "PATCH", "DELETE");
    private static final Set<String> SAFE_HEADERS = Set.of("accept", "content-type", "x-request-id");

    private final ObjectMapper objectMapper;
    private final Set<String> allowedHosts;
    private final String bearerToken;
    private final HttpClient httpClient;

    public RestActionService(
        ObjectMapper objectMapper,
        @Value("${dashboardforge.rest.allowed-hosts:}") String configuredHosts,
        @Value("${dashboardforge.rest.bearer-token:}") String bearerToken
    ) {
        this.objectMapper = objectMapper;
        this.allowedHosts = Arrays.stream(configuredHosts.split(","))
            .map(value -> value.trim().toLowerCase(Locale.ROOT))
            .filter(value -> !value.isBlank())
            .collect(java.util.stream.Collectors.toUnmodifiableSet());
        this.bearerToken = bearerToken == null ? "" : bearerToken;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();
    }

    public RestActionResponse execute(RestActionRequest request) {
        long started = System.nanoTime();
        String method = request.method().toUpperCase(Locale.ROOT);
        if (!METHODS.contains(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported HTTP method.");
        }

        URI uri = validateTarget(request.url());
        validateHeaders(request.headers());

        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json");

            if (!bearerToken.isBlank()) {
                builder.header("Authorization", "Bearer " + bearerToken);
            }
            if (request.headers() != null) {
                request.headers().forEach(builder::header);
            }

            HttpRequest.BodyPublisher publisher = HttpRequest.BodyPublishers.noBody();
            if (request.body() != null) {
                byte[] bytes = objectMapper.writeValueAsBytes(request.body());
                if (bytes.length > MAX_BODY_BYTES) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body exceeds 1 MB.");
                }
                if (request.headers() == null || request.headers().keySet().stream()
                    .noneMatch(key -> key.equalsIgnoreCase("Content-Type"))) {
                    builder.header("Content-Type", "application/json");
                }
                publisher = HttpRequest.BodyPublishers.ofByteArray(bytes);
            }

            builder.method(method, publisher);
            HttpResponse<java.io.InputStream> response = httpClient.send(
                builder.build(), HttpResponse.BodyHandlers.ofInputStream()
            );

            byte[] responseBytes;
            try (java.io.InputStream stream = response.body()) {
                responseBytes = stream.readNBytes(MAX_BODY_BYTES + 1);
            }
            if (responseBytes.length > MAX_BODY_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "External response exceeds 1 MB.");
            }

            Object data = parseResponse(responseBytes);
            Map<String, Object> mapped = mapResponse(data, request.responseMappings());
            long duration = (System.nanoTime() - started) / 1_000_000;
            return new RestActionResponse(
                method, uri.toString(), response.statusCode(),
                response.statusCode() >= 200 && response.statusCode() < 300,
                data, mapped, Instant.now(), duration
            );
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "External API request was interrupted.");
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "External API request failed.");
        }
    }

    URI validateTarget(String rawUrl) {
        final URI uri;
        try {
            uri = URI.create(rawUrl);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid API URL is required.");
        }

        String host = uri.getHost();
        if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null
            || uri.getUserInfo() != null || uri.getFragment() != null
            || (uri.getPort() != -1 && uri.getPort() != 443)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Only HTTPS URLs on port 443 without credentials or fragments are allowed.");
        }

        host = host.toLowerCase(Locale.ROOT);
        if (!allowedHosts.contains(host)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "API host is not in REST_ALLOWED_HOSTS.");
        }

        try {
            for (InetAddress address : InetAddress.getAllByName(host)) {
                if (address.isAnyLocalAddress() || address.isLoopbackAddress()
                    || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                    || address.isMulticastAddress()) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Private or local API addresses are blocked.");
                }
            }
        } catch (UnknownHostException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "API host could not be resolved.");
        }
        return uri;
    }

    private static void validateHeaders(Map<String, String> headers) {
        if (headers == null) return;
        for (Map.Entry<String, String> header : headers.entrySet()) {
            String name = header.getKey().toLowerCase(Locale.ROOT);
            if (!SAFE_HEADERS.contains(name) || header.getValue() == null
                || header.getValue().contains("\r") || header.getValue().contains("\n")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only Accept, Content-Type, and X-Request-Id headers are configurable.");
            }
        }
    }

    private Object parseResponse(byte[] bytes) {
        if (bytes.length == 0) return null;
        try {
            return objectMapper.readTree(bytes);
        } catch (IOException exception) {
            return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    private Map<String, Object> mapResponse(Object data, Map<String, String> mappings) {
        if (mappings == null || mappings.isEmpty()) return Map.of();
        if (!(data instanceof JsonNode node)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Response mappings require a JSON response body.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        mappings.forEach((name, pointer) -> {
            if (name == null || name.isBlank() || pointer == null || !pointer.startsWith("/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Response mappings must use named JSON Pointer paths, such as /data/id.");
            }
            JsonNode value = node.at(pointer);
            result.put(name, value.isMissingNode() || value.isNull() ? null : objectMapper.convertValue(value, Object.class));
        });
        return result;
    }
}
