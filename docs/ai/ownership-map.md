# AI Ownership Map

Use one primary owner for implementation, then add downstream verifiers and reviewers
based on the changed surface.

| Changed paths | Primary owner skill | Secondary checks | Notes |
| --- | --- | --- | --- |
| `apps/web/**` | `senior-frontend-toda` | `senior-frontend-reviewer` | Default owner for page UI, route composition, web interactions, and shared web UI consumption |
| `packages/ui/**` | `senior-frontend-toda` | `senior-frontend-reviewer`, web build | Treat as web-only shared UI |
| `apps/api/**` | `senior-backend-toda` | `senior-backend-reviewer` | Default owner for backend architecture, persistence, validation, and API behavior |
| `packages/contracts/**` | `senior-backend-toda` | backend review plus `web` and `mobile` verification | Backend owns contract shape unless the change is purely documentation |
| `packages/app-core/**` | `senior-backend-toda` by default | verify all consumers | Escalate when the change is consumer-specific and a frontend or RN owner should drive it |
| `apps/mobile/**` | `senior-rn-toda` | `senior-rn-reviewer` | Default owner for Expo Router, native UI, mobile services, and device-facing flows |
| Root config: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, TS/ESLint config | `toda-dev-pipeline` orchestrator | all impacted workspace verifiers | Treat as cross-cutting infrastructure work |
| `docs/product/**`, `docs/architecture/**`, `docs/backend/**` | `senior-project-owner` or matching domain owner | reviewer optional | Use the domain owner when the doc records an implementation decision |
| `docs/ai/**` | `toda-dev-pipeline` orchestrator | reviewer optional | Keep pipeline and context docs in sync with repo reality |

## Mixed-Surface Rules

- If a change starts in `packages/contracts`, `packages/app-core`, or root config, treat it as shared work first and widen verification outward.
- If a task changes both `apps/api` and `apps/web`, backend owns the contract and transport shape while frontend owns web presentation and consumer usage.
- If a task changes both `apps/mobile` and a shared package, mobile owns native UX while the shared-package owner guards reusable boundaries.
- Avoid split ownership inside one narrow diff unless there is a clear boundary and separate validation plan.
