# Table View Marketplace - Orchestration Index

**Generated**: 2026-02-11
**Feature**: Replace card-based marketplace homepage with TanStack Table view

## Workflow Steps

| Step | File | Status | Duration |
|------|------|--------|----------|
| 0a | [00a-clarification.md](./00a-clarification.md) | Skipped (5/5 clarity) | ~42s |
| 1 | [01-feature-refinement.md](./01-feature-refinement.md) | Complete | ~44s |
| 2 | [02-file-discovery.md](./02-file-discovery.md) | Complete | ~149s |
| 3 | [03-implementation-planning.md](./03-implementation-planning.md) | Complete | ~176s |

## Summary

- **Files Discovered**: 26+ across 4 priority levels
- **Implementation Steps**: 9
- **Estimated Duration**: 6-8 hours
- **Complexity**: Medium
- **Risk Level**: Medium

## Output

- Implementation Plan: [`docs/2026_02_11/plans/table-view-marketplace-implementation-plan.md`](../plans/table-view-marketplace-implementation-plan.md)

## Key Decisions

1. **category-colors.ts retained** — skill-header.tsx on detail page still imports it
2. **formatDownloads added to existing format.ts** — no new utility file
3. **Pre-filtering for rating/downloads** — applied before DataTable, not as column filters
4. **Custom globalFilterFn** — searches name + description specifically
5. **CSS grid-template-rows transition** — for smooth row expansion
6. **nuqs parseAsInteger** — null when absent, treated as no filter
