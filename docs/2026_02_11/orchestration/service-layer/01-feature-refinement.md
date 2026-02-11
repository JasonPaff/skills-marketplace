# Step 1: Feature Request Refinement

**Status:** Completed
**Start:** 2026-02-11T00:01:00Z
**Duration:** ~14s
**Agent:** general-purpose (sonnet)

---

## Original Request

Introduce a service layer to the API package (packages/api). This is Issue 1 from the api-architecture-review. Currently, all route handlers contain inline business logic — database queries, data transformations, multi-step orchestration, and computed values. The goal is to create service modules (SkillService, ProjectService, ClientService) that encapsulate all business logic and database queries, making route handlers thin orchestrators that validate input, call a service, and return a response. Services should be injected via Hono context using c.set()/c.get(). The architecture review provides specific examples of business logic that belongs in services including: GitHub path derivation, skill creation with conditional project_skills linkage, rating average calculation, fork orchestration, and project skills merging with dedup.

## Project Context Provided

- Monorepo: @emergent/api (Hono v4), @emergent/shared, @emergent/web, @emergent/cli
- Dependencies: Hono v4.7, Drizzle ORM 0.45, Zod v4, @hono/zod-validator, Octokit, @neondatabase/serverless
- 12 endpoints across 3 route files
- Typed Hono Env, cached DB connections, HTTPException pattern

## Refined Feature Request

Introduce a service layer to the API package (packages/api) as outlined in Issue 1 of the api-architecture-review to address the current architecture where all route handlers in clients.ts, projects.ts, and skills.ts contain inline business logic including database queries via Drizzle ORM, data transformations, multi-step orchestration, and computed values. The goal is to create dedicated service modules (SkillService, ProjectService, ClientService) that encapsulate all business logic and database queries, transforming the existing 12 route handlers across the 3 route files into thin orchestrators that validate input using @hono/zod-validator with Zod schemas, call the appropriate service method, and return responses using the consistent c.json({ data: T }) envelope pattern. Services should be injected into the Hono context using the typed Variables pattern (c.set()/c.get()) within the existing Hono Env type structure that already defines Bindings for environment variables and Variables for request-scoped context, ensuring type safety across the application. The architecture review identifies specific examples of business logic that currently exists inline within route handlers but should be extracted into services: GitHub path derivation logic that constructs repository paths from client and project data, skill creation workflows that conditionally create project_skills linkage records when a projectId is provided, rating average calculation that aggregates skill_ratings to compute averages, fork orchestration that coordinates multi-step operations using Octokit to fork repositories and create database records, and project skills merging with deduplication logic that combines existing and new skill associations. Each service should receive the Drizzle database connection (currently managed via a Map-based caching pattern) and any other dependencies like Octokit through constructor injection or factory functions, making them independently testable. Services should throw HTTPException instances for known error cases (following the existing pattern) to maintain consistent error handling, while route handlers remain responsible only for extracting validated request data via c.req.valid('json'), invoking service methods, handling HTTPException errors, and formatting responses. This refactoring will improve code organization, testability, and maintainability across the @emergent/api package while preserving the existing Hono v4 patterns, @hono/zod-validator integration, Drizzle ORM usage with @neondatabase/serverless, and the typed context system that supports the monorepo architecture shared with @emergent/shared types and schemas.

## Length Analysis

- Original: ~120 words
- Refined: ~350 words
- Ratio: ~2.9x (within 2-4x target)

## Validation

- Format: Single paragraph - PASS
- Length: 350 words (200-500 range) - PASS
- Scope: Core intent preserved - PASS
- Quality: Essential technical context added - PASS
