# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Dependencies |
|------|-------|-----------|--------------|
| 1 | Add Query Schemas and Response Types to Shared Package | general-purpose | None |
| 2 | Expand Agent and Rule Query Layers | general-purpose | None |
| 3 | Create Agent Service | general-purpose | Steps 1, 2 |
| 4 | Create Rule Service | general-purpose | Steps 1, 2 |
| 5 | Update Service Barrel Exports | general-purpose | Steps 3, 4 |
| 6 | Create Agent Routes | general-purpose | Steps 3, 5 |
| 7 | Create Rule Routes | general-purpose | Steps 4, 5 |
| 8 | Update DI Layer (env.ts and index.ts) | general-purpose | Steps 5, 6, 7 |
| 9 | Refactor Upload Service to Delegate | general-purpose | Steps 3, 4, 5, 8 |
| 10 | Quality Gates | orchestrator | Step 9 |

## Execution Strategy

- Steps 1 & 2: Run in parallel (no dependencies)
- Steps 3 & 4: Run in parallel after 1 & 2 complete
- Step 5: After 3 & 4
- Steps 6 & 7: Run in parallel after 5
- Step 8: After 6 & 7
- Step 9: After 8
- Step 10: After 9
