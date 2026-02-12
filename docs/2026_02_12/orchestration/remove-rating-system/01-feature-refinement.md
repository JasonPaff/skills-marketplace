# Step 1: Feature Request Refinement

**Start**: 2026-02-12T00:00:22Z
**End**: 2026-02-12T00:00:35Z
**Duration**: ~13s
**Status**: Completed

## Original Request

Remove the rating system entirely from the skills-marketplace application. No backwards compatibility is needed — this is a pre-production app with no users. [Full request with specific files, lines, and changes across database, API, shared, and web layers.]

## Agent Prompt

Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections). Using project context (pnpm monorepo with Turbo, Hono v4 + Drizzle ORM, shared Zod schemas, Next.js + TanStack Query frontend). Output ONLY the refined paragraph (200-500 words).

## Refined Feature Request

Remove the rating system entirely from the skills-marketplace application, a pre-production pnpm monorepo with no existing users, meaning no backwards compatibility, data migration, or deprecation strategy is required. In the database layer, edit packages/api/src/db/schema.ts to remove the averageRating (real), ratingCount (integer), and totalRating (integer) column definitions from the skills table, and edit the existing initial migration file packages/api/drizzle/0000_secret_puppet_master.sql in-place to remove the total_rating, rating_count, and average_rating column definitions from the CREATE TABLE statement rather than creating a new migration. In packages/api/src/db/seed.ts, remove all rating-related field values (averageRating, ratingCount, totalRating) from every seed record. In the API layer, remove the POST /api/skills/:id/rate route handler from packages/api/src/routes/skills.ts along with any associated Zod validator middleware referencing the rate skill schema, remove the rateSkill() method from packages/api/src/services/skill.service.ts (approximately lines 133-151), remove the updateSkillRating() query function from packages/api/src/queries/skill.queries.ts (approximately lines 59-73), and remove the averageRating, ratingCount, and totalRating fields from the select clause in selectProjectSkillsByProjectId() within packages/api/src/queries/project.queries.ts. In the shared layer, remove rateSkillSchema from packages/shared/src/schemas.ts and strip the averageRating, ratingCount, and totalRating fields from skillSchema, remove the RateSkill type export from packages/shared/src/types.ts, and remove the RATING_MIN and RATING_MAX constants from packages/shared/src/constants.ts. In the web layer, delete four files entirely: packages/web/src/components/skills/star-rating.tsx, packages/web/src/components/forms/interactive-star-rating.tsx, packages/web/src/components/forms/rating-form.tsx, and packages/web/src/lib/query/use-rate-skill.ts. Then modify the following web files: in packages/web/src/components/skills/skills-table.tsx, remove the averageRating column definition, the StarRating component import and usage, and the "Min Rating" dropdown filter; in packages/web/src/components/skills/skill-stats.tsx, remove the rating stat display and adjust the grid layout from three columns to two columns while retaining the Downloads and Source stats; in packages/web/src/components/skills/skill-detail-content.tsx, remove the RatingForm import and its rendered usage; in packages/web/src/lib/api.ts, remove the rateSkill() function; in packages/web/src/lib/utils/format.ts, remove the formatRating() utility function; and in packages/web/src/lib/search-params.ts, remove the rating query parameter and any associated parsing or serialization logic. For test artifacts, delete the Bruno request file at Skills Marketplace/Skills/Rate Skill.bru. After completing all changes, verify the build compiles cleanly by running pnpm run build, pnpm run typecheck, and pnpm run lint:fix, and confirm via a codebase-wide search that no residual references to rating, rateSkill, StarRating, RateSkill, RATING_MIN, RATING_MAX, formatRating, or related identifiers remain in any source files.

## Validation

- **Length**: ~450 words (within 200-500 range)
- **Format**: Single paragraph, no headers or sections
- **Scope**: Preserves original intent without feature creep
- **Enhancement**: Added technical context about migration strategy, Zod validators, Hono RPC chain
