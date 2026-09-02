---
name: vibe-coding-workflow
description: Guides AI coding agents through a complete structured engineering lifecycle from idea to release. Use when the user wants disciplined vibe coding, full feature development, or when jumping straight from idea to code would skip important quality gates. Enforces Spec → Plan → Build → Test → Review → Clean → Release with human checkpoints.
---

# Vibe Coding Workflow

## Overview

This skill turns unstructured "vibe coding" into a disciplined engineering process. It mirrors the production-grade Agent Skills approach popularized by Addy Osmani: never jump directly from idea to code. Instead, force clarity at every phase so the final result is reliable, reviewable, and ready to ship.

The workflow is deliberately sequential. Skipping a phase is treated as a defect.

## When to Use

- User says "vibe coding", "buat feature dari idea", "build this properly", or similar
- Starting a new feature, project, or non-trivial change
- The request is underspecified and jumping to code would be risky
- User wants the full disciplined path (Spec → Plan → Build → Test → Review → Clean → Release)

**Do not use** for pure bug fixes that already have clear reproduction steps, one-line changes, or pure research questions.

## Core Operating Rules (Non-negotiable)

1. **Surface assumptions early.** Before any non-trivial work, list assumptions explicitly and ask for confirmation.
2. **Never invent requirements.** If something is ambiguous, stop and clarify.
3. **Human remains in the loop.** This skill produces artifacts and proposals. Final decisions, merges, and releases require human approval.
4. **Evidence over vibes.** Every phase ends with concrete proof (written spec, task list, passing tests, review notes, checklist).
5. **One phase at a time.** Finish the current phase and get explicit go-ahead before moving to the next.

## Full Lifecycle Workflow

Follow these phases in order. Do not skip.

### Phase 1 — Clarify the Idea (Define)

Goal: Turn a vague idea into a clear problem statement.

Steps:
1. Restate the user's idea in one or two sentences.
2. Ask clarifying questions one at a time (or in a short focused batch) until confidence is high (~90%+).
3. Identify primary user, success criteria, and non-goals.
4. Output a short **Problem Statement**.

Exit criteria:
- [ ] Problem statement written and confirmed by user
- [ ] Success criteria listed
- [ ] Explicit non-goals recorded

### Phase 2 — Spec (Spec-Driven)

Goal: Produce a lightweight Product Requirements Document (PRD) before any code.

Steps:
1. Write objectives, functional requirements, and acceptance criteria.
2. Define boundaries (what is in / out of scope).
3. Note constraints (tech stack, performance, security, existing code).
4. Identify risks and open questions.
5. Present the Spec to the user for approval.

Recommended structure:
```
# Spec: [Feature Name]

## Objective
## User Stories / Requirements
## Acceptance Criteria
## Out of Scope
## Constraints & Assumptions
## Risks & Open Questions
```

Exit criteria:
- [ ] Spec written
- [ ] User has explicitly approved the Spec (or requested changes that were applied)

### Phase 3 — Plan (Task Breakdown)

Goal: Decompose the approved Spec into small, verifiable, ordered tasks.

Steps:
1. Break the Spec into thin vertical slices or atomic tasks.
2. Each task must have clear acceptance criteria and be independently verifiable.
3. Order tasks by dependency and risk (highest risk / foundational first).
4. Estimate relative size if useful (S/M/L).
5. Present the task list for user approval.

Exit criteria:
- [ ] Ordered task list exists
- [ ] Each task has acceptance criteria
- [ ] User approved the plan

### Phase 4 — Build (Incremental Implementation)

Goal: Implement one thin slice at a time.

Rules:
- Work on **one task only**.
- Prefer vertical slices that deliver end-to-end value.
- Keep changes small and reviewable.
- Do not expand scope mid-task.
- After each task, show the diff and ask for review/go-ahead before the next.

Use supporting skills when relevant (context packing, source verification, etc.).

Exit criteria for each task:
- [ ] Code written for the current task only
- [ ] Basic verification performed (manual or automated)
- [ ] User reviewed and approved moving forward

### Phase 5 — Test

Goal: Prove the implementation works.

Steps:
1. Write or extend tests that match the acceptance criteria from the Spec and tasks.
2. Prefer Red-Green-Refactor where practical.
3. Run the full relevant test suite.
4. Fix failures before proceeding.
5. Report coverage of the new behavior.

Exit criteria:
- [ ] Tests exist for the new behavior
- [ ] All relevant tests pass
- [ ] No obvious regressions introduced

### Phase 6 — Review & Clean

Goal: Improve code health and catch issues before release.

Steps:
1. Self-review the changes against the original Spec.
2. Check for over-engineering, unnecessary complexity, missing error handling, security issues, and naming clarity.
3. Simplify where possible while preserving behavior.
4. Update or add documentation if needed.
5. Produce a short review summary for the human.

Exit criteria:
- [ ] Code review notes written
- [ ] Unnecessary complexity removed or justified
- [ ] Human has reviewed the final code

### Phase 7 — Release Preparation

Goal: Make the change safe to ship.

Steps:
1. Run the pre-launch checklist (tests, review, docs, monitoring considerations, rollback plan).
2. Confirm all previous phases are complete.
3. Prepare release notes or commit message.
4. Hand off to the human for the actual deploy / merge decision.

Exit criteria:
- [ ] Pre-launch checklist completed
- [ ] Human explicitly approves release

## Common Rationalizations (Do Not Accept These)

| Rationalization | Reality |
|---|---|
| "The idea is clear enough, let's just code" | Most defects come from unstated assumptions. Spec first is cheaper. |
| "I'll write the tests later" | Later rarely comes. Tests prove the work is done. |
| "This is a small change, skip the plan" | Small changes still benefit from explicit acceptance criteria. |
| "The user wants speed, not process" | Speed without quality creates rework. Structured process is faster overall. |
| "I already know what they want" | Surface the assumptions anyway. Confirmation takes seconds and prevents days of waste. |
| "Review can happen after merge" | Review after merge is damage control. Review before is prevention. |

## Red Flags

- Jumping to code before a Spec exists
- Implementing multiple tasks without intermediate human check-in
- Claiming "done" without passing tests or acceptance criteria evidence
- Expanding scope without updating the Spec
- Treating human review as optional
- Producing large un-reviewed diffs

## Verification (Definition of Done for the whole feature)

Before declaring the feature complete:

- [ ] Spec exists and was approved
- [ ] Plan/task list exists and was followed
- [ ] Implementation matches the Spec
- [ ] Tests cover the acceptance criteria and pass
- [ ] Code has been reviewed (self + human)
- [ ] Unnecessary complexity cleaned
- [ ] Pre-release checklist completed
- [ ] Human has given final go-ahead

## How to Start

When this skill activates:

1. Confirm with the user: "We will follow the structured vibe-coding workflow (Spec → Plan → Build → Test → Review → Clean → Release). Ready to begin with clarifying the idea?"
2. Begin Phase 1.
3. At the end of each phase, summarize what was produced and ask for explicit permission to proceed to the next phase.

This skill is a process, not a suggestion. Follow the steps.
