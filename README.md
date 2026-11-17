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
export DB_PASSWORD="your_password"
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

Designer capabilities:
- Search the global component library and add components to a dashboard.
- Select components and edit type-specific properties.
- Duplicate and remove components.
- Save/load dashboard JSON through the existing Spring Boot project API.
- Export a dashboard configuration as JSON.
- Load legacy Phase 1 configurations; missing component properties are populated with defaults.

## Existing API
- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`

Project configuration is stored as JSON in PostgreSQL. Phase 2 does not require a database schema migration.

## Security boundary
The `actionKey` property is an identifier only. Never execute arbitrary Java class names, method names, source code, or shell commands supplied by the browser. Java actions must be registered in a server-side allowlist. REST actions must use server-side endpoint allowlists, authentication, timeouts, and secret storage.

## Next milestones
1. Add a server-side Java action registry for approved service operations.
2. Add secure REST API action definitions and response mapping.
3. Generate React component/configuration files and Java controller/service/DTO templates.
4. Add authentication, project permissions, audit logs, and import/export validation.
