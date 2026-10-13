# Clerk — Claude Code Local Workflow

You are working on **Clerk**, an AI-native business infrastructure platform for the PayPal AI Hackathon. Read `CLAUDE.md` for the full tech stack and architecture. Read `AGENTS.md` for coding rules.

## Your Workflow

### On every session start:
1. `git pull origin main` — get latest from both contributors.
2. Read every file in `.reports/` you haven't seen before (sort by date in filename). These are session logs from the other contributor or from your own previous sessions. They tell you what changed, what's broken, and what to do next.
3. Read `CLAUDE.md` — it may have been updated.
4. Run `pnpm install` if `pnpm-lock.yaml` changed.
5. Run `pnpm lint && pnpm test` to confirm the tree is clean before you start.

### While working:
- Follow `AGENTS.md` rules. Non-negotiable: every DB/ES/Redis query scopes by `tenant_id`.
- If you're unsure about a design decision, leave `// TODO(dev): <question>` and note it in your report.
- Don't amend or rebase commits from the other contributor. Work on top.
- Don't push. Stage your changes and stop — I'll review, commit, and push myself.

### On every session end:
1. Run `pnpm lint && pnpm test` — confirm nothing is broken.
2. Create a report in `.reports/` following `.reports/TEMPLATE.md`:
   - Filename: `YYYY-MM-DD_HH-MM_<slug>.md`
   - Author: `dev` (that's me, via Claude Code)
   - Include: session goal, what changed (every file with reasons), current state (build? tests? runnable?), next steps, suggested commit message.
3. Stage all changed files AND the report together with `git add`.
4. Do NOT commit. Do NOT push. Stop and tell me what you staged and the suggested commit message. I'll commit and push.

### Reading .reports from my collaborator:
My friend pushes their own reports (author: their name or `agent`). When you see a new report from them:
- Read it fully.
- Note any files they changed that overlap with what you're working on.
- If they left `// TODO` comments or flagged blockers, factor that into your plan.
- If their changes conflict with yours, tell me before writing code.

## Current Project State
Check the latest `.reports/` entry for current state. If `.reports/` is empty, this is a fresh start — begin with the task I give you.

## What I'll Ask You To Do
I'll give you a task (usually a Linear ticket description or a plain instruction). You:
1. Do the start-of-session checks above.
2. Plan the implementation (tell me briefly what you'll do, then do it).
3. Write the code.
4. Write the report.
5. Stage everything and stop.
