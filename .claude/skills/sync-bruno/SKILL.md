---
name: sync-bruno
allowed-tools: Read(*), Glob(*), Grep(*), Write(*), Edit(*), Bash(mkdir *)
description: Sync Bruno API collection with actual API endpoints
disable-model-invocation: true
---

# Sync Bruno API Collection

## Purpose

Automatically synchronize the Bruno API collection (`Skills Marketplace/`) with the actual API endpoints defined in `packages/api/src/`. This skill reads the Hono route definitions and Zod validation schemas, compares them against the existing `.bru` files, and creates/updates/deletes Bruno files so the collection always matches the live API.

## Command Usage

```
/sync-bruno
```

No arguments needed. The skill discovers everything automatically.

## Execution Flow

### Phase 1: Discover API Endpoints

1. Read the main API entry point at `packages/api/src/index.ts` to find:
   - All route mounts (`.route('/api/...', router)`)
   - Standalone endpoints (e.g., health check)
   - The base URL pattern
2. Read each route file found in `packages/api/src/routes/` (e.g., `clients.ts`, `projects.ts`, `skills.ts`)
3. For each route file, extract every endpoint:
   - HTTP method (GET, POST, PUT, DELETE, PATCH)
   - Path (including path parameters like `:id`)
   - Full URL path (combining the mount prefix from index.ts with the route path)
   - Validation schemas used (query params, path params, JSON body)
4. Read `packages/shared/src/schemas.ts` and `packages/shared/src/constants.ts` to understand the shape of each validation schema:
   - For POST/PUT/PATCH bodies: extract all fields, types, and constraints
   - For query parameters: extract all filter/search params
   - For path parameters: extract parameter names and types
5. Build a complete **API Manifest** — a list of every endpoint with:
   - Method, full path, resource group (clients/projects/skills/root)
   - Query params (with which are optional, indicated by `~` prefix in Bruno)
   - Path params (with sample UUID values)
   - Request body shape (with realistic sample values)

### Phase 2: Discover Existing Bruno Files

1. Read `Skills Marketplace/bruno.json` to get the base URL
2. Glob for all `.bru` files under `Skills Marketplace/`
3. Read each `.bru` file and extract:
   - Name, HTTP method, URL, body, query params, path params
   - Which folder/resource group it belongs to
4. Build a **Bruno Manifest** — a list of every existing Bruno request

### Phase 3: Diff and Plan Changes

Compare the API Manifest against the Bruno Manifest:

1. **Missing endpoints**: API endpoints that have no corresponding Bruno file
2. **Stale endpoints**: Bruno files for endpoints that no longer exist in the API
3. **Outdated endpoints**: Bruno files where the method, URL, body fields, query params, or path params don't match the current API definition
4. **Correct endpoints**: Bruno files that already match — leave these untouched

Output a summary of planned changes before making them:

```
## Sync Plan

### New (will create)
- Skills/Update Skill.bru — PUT /api/skills/:id

### Stale (will delete)
- Skills/Old Endpoint.bru — endpoint no longer exists

### Updated (will modify)
- Projects/Create Project.bru — added new "status" field to body

### Unchanged
- Health Check.bru
- Clients/List Clients.bru
- ...
```

### Phase 4: Apply Changes

For each change in the plan:

#### Creating new `.bru` files

Use the exact Bruno file format. Follow these conventions derived from the existing collection:

**Base URL**: Use the URL from `bruno.json` presets (`https://skills-marketplace-api.vercel.app/api`)

**GET endpoint (no params)**:
```
meta {
  name: <Human-Readable Name>
  type: http
  seq: <next sequence number in folder>
}

get {
  url: <base-url>/<path>
  body: none
  auth: inherit
}

settings {
  encodeUrl: true
  timeout: 0
}
```

**GET endpoint (with query params)**:
```
meta {
  name: <Human-Readable Name>
  type: http
  seq: <next sequence number in folder>
}

get {
  url: <base-url>/<path>
  body: none
  auth: inherit
}

params:query {
  ~paramName1: <sample-value-or-empty>
  ~paramName2: <sample-value-or-empty>
}

settings {
  encodeUrl: true
  timeout: 0
}
```

Note: Query params prefixed with `~` are disabled by default in Bruno (optional params).

**GET endpoint (with path params)**:
```
meta {
  name: <Human-Readable Name>
  type: http
  seq: <next sequence number in folder>
}

get {
  url: <base-url>/<path-with-:param>
  body: none
  auth: inherit
}

params:path {
  paramName: <sample-uuid-or-value>
}

settings {
  encodeUrl: true
  timeout: 0
}
```

**POST/PUT/PATCH endpoint (with JSON body)**:
```
meta {
  name: <Human-Readable Name>
  type: http
  seq: <next sequence number in folder>
}

post {
  url: <base-url>/<path>
  body: json
  auth: inherit
}

body:json {
  {
    "field1": "sample value",
    "field2": 123
  }
}

settings {
  encodeUrl: true
  timeout: 0
}
```

**Folder metadata** (`folder.bru`):
```
meta {
  name: <Folder Name>
  seq: <sequence number>
}

auth {
  mode: inherit
}
```

#### Naming conventions

- **File names**: Use human-readable names matching the action (e.g., `List Clients.bru`, `Create Skill.bru`, `Get Project Skills.bru`, `Rate Skill.bru`, `Fork Skill.bru`)
- **Folder names**: Use the resource group name capitalized (e.g., `Clients`, `Projects`, `Skills`)
- **Meta names**: Match the file name without `.bru` extension

#### Sample values for request bodies

Generate realistic sample values based on the Zod schema:
- `z.string().min(1).max(200)` -> Use a descriptive placeholder like `"My Project"` or `"Acme Corp"`
- `z.uuid()` -> Use `"00000000-0000-0000-0000-000000000000"` for references, or a realistic UUID for path params
- `z.boolean()` -> Use `false`
- `z.number().int().min(1).max(5)` -> Use `5`
- `z.enum([...])` -> Use the first enum value or `"general"` for categories
- `z.string().email()` -> Use `"user@example.com"`
- `z.array(...)` -> Use `[]` or a single-element array with sample data
- Optional fields -> Include them in the body with sample values (they're useful for testing)

#### Sample values for path params

- UUID path params: Use a sample UUID like `"3d81af5c-e3da-4612-9acf-b23fc9464528"` for skills or `"224fb415-a835-4371-ab39-fbfefd220463"` for projects (matching existing conventions)

#### Updating existing `.bru` files

- Use the Edit tool to modify only the parts that changed
- Preserve existing path param sample values (the user may have set these to real IDs)
- Preserve sequence numbers unless a reorder is needed
- Update body fields, query params, and URLs to match the current API

#### Deleting stale `.bru` files

- Do NOT delete files automatically. Instead, list them in the summary as stale and let the user decide

### Phase 5: Summary

Output a final summary of all changes made:

```
## Sync Complete

### Created
- Skills/Update Skill.bru

### Updated
- Projects/Create Project.bru (added "status" field)

### Stale (manual review needed)
- Skills/Old Endpoint.bru — endpoint no longer exists in API

### Unchanged (X files)
```

## Important Rules

1. **Never modify API code** — this skill is read-only for the API; it only writes to the Bruno collection
2. **Never delete Bruno files** — only flag them as stale for user review
3. **Preserve user customizations** — keep existing sample UUIDs in path params that the user may have set to real IDs from their database
4. **Match existing style exactly** — use the same formatting, spacing, and conventions as the existing `.bru` files (no trailing newlines, consistent indentation)
5. **Create folders with `folder.bru`** — if a new resource group is needed, create the folder directory and its `folder.bru` metadata file
6. **Use the base URL from `bruno.json`** — don't hardcode URLs; read them from the collection config
