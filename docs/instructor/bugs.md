# Instructor Bug Manifest

This file is NOT for learners. It documents all intentional flaws in the Beacon codebase,
where they are, what they look like when triggered, and which module exercises use them.

---

## Bug 1: Wrong ORM filter in get_tasks_by_project

**File:** `app/services/task_service.py`, `get_tasks_by_project()`
**Line:** `filter(Project.name == project_id)`
**Should be:** `filter(Task.project_id == project_id)`

**What happens:** Filtering tasks by `?project_id=1` returns nothing (or wrong results)
because it compares the project name to an integer. No exception is raised — it silently
returns an empty list.

**Why it's realistic:** AI-generated ORM joins frequently use the wrong field when
inferring from table/column names without reading the schema carefully.

**Used in:** Module 4, Bug Hunt exercise, Bug #1

---

## Bug 2: No status transition validation

**File:** `app/services/task_service.py`, `update_task_status()`
**Missing:** Validation that `new_status` is in `Task.VALID_STATUSES`, and that the
transition is legal (e.g., archived -> in_progress should be rejected)

**What happens:** `PATCH /api/tasks/1/status` with `{"status": "banana"}` succeeds.
An archived task can be moved back to in_progress.

**Why it's realistic:** AI frequently omits guard clauses, especially for enum-like
values, when the model schema doesn't enforce them at the DB level.

**Note:** `Task.VALID_STATUSES` exists on the model but is intentionally not enforced
there — the comment in models.py explains why.

**Used in:** Module 4, Bug Hunt exercise, Bug #2

---

## Bug 3: Off-by-one in is_overdue (strict > vs >=)

**File:** `app/services/task_service.py`, `is_overdue()`
**Line:** `return datetime.now(timezone.utc) > task.due_date`
**Should be:** `return datetime.now(timezone.utc) >= task.due_date`

**What happens:** A task whose due_date equals the exact current timestamp is reported
as not yet overdue. The fix is to use >= so the boundary instant counts as overdue.

**Why it's realistic:** Boundary condition bugs from AI are extremely common. AI tends
to use strict comparisons by default without considering the equal case.

**Used in:** Module 4, Bug Hunt exercise, Bug #3

---

## Intentional inconsistency: tasks.py GET /:id returns 500 not 404

**File:** `app/routes/tasks.py`, `get_task()`
**What happens:** Calling `GET /api/tasks/9999` raises `AttributeError: 'NoneType' object
has no attribute 'to_dict'` — a 500 — instead of the 404 returned by users.py.

**Why it's there:** Illustrates inconsistent defensive programming across routes.
Used in module 3 to practice reading diffs and spotting missing null checks.

**Used in:** Module 3, Diff Review exercise

---

## Note: update_task field allowlist

**File:** `app/services/task_service.py`, `update_task()`

`update_task` uses an explicit `_UPDATABLE_FIELDS` allowlist to prevent overwriting
protected fields like `id` and `created_at`. This is intentionally clean code —
it is NOT a planted bug. Do not use it as a training exercise for finding problems.
