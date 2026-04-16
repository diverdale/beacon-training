# AI Training Program Design — Claude Code & Windsurf
*Date: 2026-04-16*

## Overview

A hands-on training program for engineers to use Claude Code and Windsurf effectively, with a primary goal of building **critical evaluators** — engineers who review AI output with appropriate skepticism, catch hallucinations, and don't ship blind.

**Audience:** Mixed skill levels — some dabbling inconsistently (C), some already using AI regularly but with bad habits (D).
**Delivery:** Format-flexible — works self-paced, facilitated, or as a cohort.
**Scope:** Internal to one team initially, designed to scale to other teams without modification.

---

## 1. Narrative & Structure

Training follows a fictional engineering team at **Beacon**, a small company building an internal task management API. Engineers "join the team" and help ship features across six modules. The narrative creates realistic stakes — bad AI output in module 4 is code that almost shipped.

### Module Arc

| # | Module | Focus |
|---|--------|-------|
| 1 | **Getting Your Bearings** | Tool setup, first prompts, understanding what Claude Code and Windsurf actually do |
| 2 | **Context is Everything** | Giving AI good context — project structure, CLAUDE.md, scoping requests |
| 3 | **Reading the Diff** | Reviewing AI output — understanding what changed and why, not just whether it works |
| 4 | **Catch the Bug** | AI-generated code with subtle, realistic flaws — hallucinated APIs, missing edge cases, race conditions |
| 5 | **Workflow Habits** | When to use AI, when not to, TDD with AI, sustainable daily patterns |
| 6 | **The Hard Stuff** | Complex multi-step tasks, refactoring unfamiliar code, debugging AI-written code |

Modules 1–2 orient. Modules 3–4 are the critical evaluation core. Modules 5–6 build durable habits.

---

## 2. The Beacon Training Codebase

A purpose-built repo that evolves alongside the narrative via git tags (`beacon-m1` through `beacon-m6`).

**Stack:**
- Backend: Python/Flask REST API, SQLAlchemy ORM, pytest
- Frontend: React + TypeScript (minimal — internal tool aesthetic)
- Database: SQLite (zero setup friction)
- Ships with: `README`, `.env.example`, existing tests, `CLAUDE.md`

**Domain:** Task management API — create tasks, assign users, update status, filter by project. Unremarkable domain; the complexity is in the code.

**Intentional design decisions:**
- Some endpoints well-tested; others have no tests (realistic AI prompting scenarios)
- Pre-planted bugs revealed in module 4 — these are the "AI-generated" ones the fictional previous dev added
- Inconsistent patterns across routes — mirrors real codebases, forces learners to provide better context in module 2
- ~15 files — small enough to hold in context, structured like a real project (blueprints, models, services layer)

---

## 3. Exercise Format

Each module follows a consistent structure:

1. **Framing** (2–3 min read) — Beacon narrative context for the module
2. **Concept brief** (5–10 min) — Minimal theory; "good vs. bad" comparison
3. **Guided exercise** — Explicit steps, builds confidence
4. **Independent exercise** — Same topic, no hand-holding
5. **Debrief** — Annotated solution, what most people miss, why the AI did what it did

### Exercise Types

| Type | Modules | Description |
|------|---------|-------------|
| **Prompt & evaluate** | M1–M2 | Write a prompt, examine AI output, assess quality |
| **Diff review** | M3 | Given an AI-generated diff, identify changes and flag concerns |
| **Bug hunt** | M4 | AI-generated code with 2–3 planted flaws; find them all |
| **Prompt repair** | M2, M5 | Given a bad prompt + bad output, rewrite the prompt |
| **Go / no-go** | M3, M6 | Accept, modify, or reject an AI suggestion — and justify it |

### Rubrics
Every independent exercise includes a rubric: what a passing response includes, what a strong response includes, and common mistakes. Enables facilitators who aren't AI experts to run sessions confidently.

**Estimated time per module:** 45–90 min depending on pace. Fits a single workshop session or a few async sittings.

---

## 4. Delivery App

A lightweight static web app whose job is to present content clearly and get out of the way.

**Features:**
- Module and exercise display with clean reading experience
- Progress tracking per learner (localStorage, no auth required for v1)
- Debriefs revealed only after exercise marked complete
- Printable/exportable views for offline workshops
- Facilitator guide embedded per module (hidden from learner view) — timing, talking points, common questions
- Module unlock toggle for cohort-paced delivery

**Tech stack:**
- Next.js (static export)
- Content in MDX files under `/content` — editable without code changes
- No database in v1 — localStorage for progress

**Out of scope for v1:**
- User accounts / auth
- Grading or scoring
- Video content
- AI integration in the app itself (AI tools are used in the exercises, not the app)

---

## Success Criteria

An engineer who completes this training should be able to:
- Review AI-generated code diffs and identify concerns before accepting
- Recognize common hallucination patterns (fabricated APIs, missing edge cases, subtle logic errors)
- Write prompts that give AI enough context to produce useful output
- Make confident go/no-go decisions on AI suggestions with clear justification
- Articulate *why* they accepted or rejected a given AI output

---

## What This Is Not

- A tool tutorial (setup instructions are one exercise, not the focus)
- A prompt engineering course (prompting is taught in service of critical evaluation)
- An LMS (v1 is static, no scoring, no certificates)
- Tool-agnostic (explicitly Claude Code and Windsurf — exercises reference specific features)
