# infra folder readme
- Infrastructure layer for database connectivity and external services

# Files
- `infra/db.ts`: Centralized database connection manager. It implements a typed connection pool using pg (node-postgres) to manage and reuse database connections efficiently across the application. Runtime post rendering now depends on this connection through `src/utils/posts.ts`.

- `infra/test-db.ts`: Diagnostic utility for database connectivity. It executes a heartbeat query (SELECT NOW()) to verify the connection status, environment variables, and authentication credentials against the PostgreSQL instance.
- `infra/init-db.ts`: Initializes the database schema from SQL seed files.

# Guidelines
Maintain Decoupling: Keep infrastructure-related code (DB configurations, external API clients, etc.) isolated from the business logic (app/ or utils/).

# Post DB Runtime Notes
- `DATABASE_URL` must be available in environments that render the Next.js server components.
- App and component code should not call `pg` directly. Use `src/utils/posts.ts` for post retrieval so the DB schema remains isolated from rendering code.
