# DashboardForge — starter project

A configurable dashboard builder with a React/TypeScript frontend and Java/Spring Boot backend.

## Requirements
- Java 21+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+

## Run the backend
1. Create a PostgreSQL database:
   `CREATE DATABASE dashboardforge;`
2. Set environment variables (or edit `backend/src/main/resources/application.yml`):
   - `DB_URL=jdbc:postgresql://localhost:5432/dashboardforge`
   - `DB_USERNAME=postgres`
   - `DB_PASSWORD=your_password`
3. From `backend/` run: `mvn spring-boot:run`
4. API runs at `http://localhost:8080`.

## Run the frontend
1. From `frontend/` run: `npm install`
2. Run: `npm run dev`
3. Open `http://localhost:5173`.

## What works in this starter
- Create a project
- Add configurable UI components (button, text field, card, table)
- Select a component and edit its label and backend action key
- Save/load project configuration through the Java API
- Persist project configuration as JSON in PostgreSQL

## Important security design
The `actionKey` is an identifier, not executable Java code. Never accept arbitrary class names, method names, shell commands, or Java source from the browser. Backend actions should be registered explicitly in a server-side allowlist/registry. REST API actions should also use server-side endpoint allowlists, authentication, timeouts, and secret storage.

## Next milestones
1. Add component-specific property schemas and live preview rendering.
2. Add an action registry for approved Java service operations.
3. Add secure REST API action definitions.
4. Generate React component/configuration files and Java controller/service DTO templates.
5. Add user authentication, project permissions, audit logs, and export/import.
