# DashboardForge

A configuration-driven dashboard builder with a React + TypeScript frontend, Java 21 / Spring Boot backend, and PostgreSQL persistence.

## Requirements
- Java 21+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+

## Run locally

### Backend
Create the database, then configure the connection using environment variables:
```bash
createdb dashboardforge
export DB_URL="jdbc:postgresql://localhost:5432/dashboardforge"
export DB_USERNAME="your_postgres_role"
export DB_PASSWORD="your_local_database_password"
cd backend
mvn spring-boot:run
```
The API runs at `http://localhost:8080`.

### Frontend
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Phase 2 — Global component library

The designer includes a reusable global library of nine component types:
- **Basic:** Button, Text field, Dropdown, Checkbox
- **Data:** Metric card, Data table, Chart
- **Utility:** Alert, Status badge

Each component has a definition in `frontend/src/componentRegistry.ts`, including default properties and its editable property schema. The same registry is shared by all dashboard projects. Components are configured per project and rendered in the live canvas preview.

## Phase 3 — Java backend action engine

The backend exposes a server-side allowlisted Java action registry. Dashboard configurations may store an action key, but the browser cannot supply Java class names, method names, source code, or shell commands for execution.

### Action endpoints
- `GET /api/actions` — list registered actions.
- `POST /api/actions/{actionKey}/execute` — execute one registered action.

Starter actions: `system.ping`, `dashboard.greeting`, `math.add`, and `text.uppercase`.

Run backend tests with `mvn test` from `backend`.

## Phase 4 — REST API integration

The REST action endpoint accepts a method, URL, safe request headers, optional JSON body, and optional response mappings.

```http
POST /api/rest-actions/execute
Content-Type: application/json

{
  "method": "GET",
  "url": "https://api.example.com/v1/users/42",
  "headers": { "Accept": "application/json" },
  "responseMappings": {
    "userId": "/id",
    "userName": "/name"
  }
}
```

The response includes the upstream HTTP status, response data, mapped values, timestamp, and duration. Response mappings use JSON Pointer paths (for example, `/data/id`).

### REST security controls
- Set `REST_ALLOWED_HOSTS` to a comma-separated list of exact hostnames controlled by your team. Requests to other hosts are rejected.
- Only HTTPS URLs on port 443 are accepted; URL credentials and fragments are rejected.
- Local, private, link-local, and multicast DNS addresses are blocked.
- Redirects are disabled; request timeout is 10 seconds.
- Request and response bodies are limited to 1 MB.
- Configurable headers are limited to `Accept`, `Content-Type`, and `X-Request-Id`.
- Optional server-side bearer authentication is supplied using `REST_API_BEARER_TOKEN`. Do not send secrets from browser configuration.
- Supported methods: GET, POST, PUT, PATCH, DELETE.

Example:
```bash
export REST_ALLOWED_HOSTS="api.example.com"
export REST_API_BEARER_TOKEN="your-server-side-token"
```

This endpoint is a controlled integration foundation, not a substitute for authentication and per-user authorization. Do not expose it publicly until authentication, rate limits, audit controls, and per-project permissions are implemented.

## Existing project API
- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`

Project configuration is stored as JSON in PostgreSQL.

## Security boundary
Never execute arbitrary Java class names, method names, source code, or shell commands supplied by the browser. Java actions must be registered in a server-side allowlist. External REST requests must use exact server-configured host allowlists and server-side secret storage.
