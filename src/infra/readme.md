# infra folder readme
- Infrastructure layer for database connectivity and external services

# Files
- `infra/db.ts`: Centralized database connection manager. It implements a connection pool using pg (node-postgres) to manage and reuse database connections efficiently across the application.

- `infra/test-db.ts`: Diagnostic utility for database connectivity. It executes a heartbeat query (SELECT NOW()) to verify the connection status, environment variables, and authentication credentials against the PostgreSQL instance.

# Guidelines
Maintain Decoupling: Keep infrastructure-related code (DB configurations, external API clients, etc.) isolated from the business logic (app/ or utils/).