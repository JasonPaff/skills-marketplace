# Fix Project-Scope Skill Installation - Orchestration Index

**Generated**: 2026-02-12
**Feature**: Fix project-scope skill installation in CLI package

## Workflow Overview

| Step | Description | Status |
|------|-------------|--------|
| 0a | Clarification | Skipped (5/5) |
| 1 | Feature Request Refinement | Completed |
| 2 | File Discovery | Completed (16 files, 4 critical) |
| 3 | Implementation Planning | Completed (6 steps) |

## Navigation

- [00a - Clarification](./00a-clarification.md)
- [01 - Feature Refinement](./01-feature-refinement.md)
- [02 - File Discovery](./02-file-discovery.md)
- [03 - Implementation Planning](./03-implementation-planning.md)

## Original Request

Fix project-scope skill installation in the CLI package (packages/cli/) by adding project root resolution and extending the ProviderAdapter interface. Currently both adapters blindly use process.cwd() for local scope, causing skills to install in wrong locations when run from subdirectories or from inside .claude//.copilot/ directories.
