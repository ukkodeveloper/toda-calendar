# AI Escalation Policy

Stop and realign with the user when a task crosses one of these guarded boundaries.

## Always Escalate

- authentication, authorization, or session model changes
- billing, payments, entitlements, or spending-related flows
- environment variables, secrets, or deploy-time credential handling
- breaking API contract or data-shape changes that affect multiple surfaces
- persistence model changes that alter durability, migration, or data safety assumptions
- Expo native config, permissions, build profiles, or platform-specific release settings
- root tooling changes that can break unrelated workspaces
- destructive git actions or history rewriting

## Merge And Conflict Rules

Automatic conflict resolution is allowed only for:

- lockfiles
- generated files
- import/order-only conflicts
- trivial renames with no semantic differences

Stop and ask before resolving conflicts involving:

- domain logic
- API contracts
- schema or storage format
- auth/session code
- environment handling
- native configuration

## Review Gates

Do not auto-land work when any of these are true:

- reviewer still has unresolved `P1` or `P2` findings
- required verification did not run or did not pass
- the task touched an escalated domain and the user has not confirmed the path
- the worktree contains unrelated unscoped changes

## Persistence And Deployment Warning

Call out deployment viability whenever a feature relies on local filesystem writes,
temporary storage, or any persistence mechanism that may not survive deployed/serverless
execution.
