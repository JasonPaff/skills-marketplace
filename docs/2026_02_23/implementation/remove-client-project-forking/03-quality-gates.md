# Quality Gates

## ESLint
- **Result**: PASSED
- All 4 packages: 0 errors, 0 warnings

## TypeScript
- **Result**: PASSED (in-scope packages)
- @emergent/shared: PASSED
- @emergent/api: PASSED
- @emergent/web: PASSED
- @detergent/skills (CLI): 7 errors (expected, out of scope)

### Known CLI Errors
- `SkillScope` import missing (3 files)
- `SKILL_SCOPES` import missing (1 file)
- `projects` route not found on API type (2 locations)
- Implicit `any` on parameter (1 location)

## Stale Reference Check
- **Result**: PASSED
- No references to organizational `client`, `project`, `fork`, `parentSkillId`, `SKILL_SCOPES`, or `SkillScope` in packages/api/, packages/web/, or packages/shared/
- All `client` matches are false positives: `'use client'` React directives, Hono RPC client, QueryClientProvider

## GitHub Path Format
- **Result**: PASSED
- Skills: `skills/{name}` (was `skills/global/{name}`)
- Agents: `agents/{name}` (was `agents/global/{name}`)
- Rules: `rules/{name}` (was `rules/global/{name}`)
