# Beacon Codebase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Beacon training codebase — a realistic Python/Flask task management API with intentional design inconsistencies and pre-planted bugs used across all six training modules.

**Architecture:** Flask app factory pattern with SQLAlchemy ORM, blueprints for route organization, and a thin services layer. SQLite in dev for zero setup friction. Intentional flaws are baked into specific files and documented in a hidden instructor manifest so exercises have predictable outcomes.

**Tech Stack:** Python 3.11+, Flask 3.x, SQLAlchemy 2.x, Flask-SQLAlchemy, pytest, SQLite

---

## File Structure

```
beacon/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── database.py          # SQLAlchemy instance + init helper
│   ├── models.py            # User, Project, Task models
│   ├── routes/
│   │   ├── __init__.py      # Blueprint registration
│   │   ├── tasks.py         # Task CRUD — intentionally inconsistent error handling
│   │   ├── users.py         # User endpoints — well-tested, clean
│   │   └── projects.py      # Project endpoints — minimal tests (intentional)
│   └── services/
│       ├── __init__.py
│       ├── task_service.py  # Task business logic — contains planted bugs
│       └── user_service.py  # User business logic — clean
├── tests/
│   ├── conftest.py          # App fixture, db fixture, seed data
│   ├── test_users.py        # Full coverage — model for "well-tested"
│   ├── test_tasks.py        # Partial coverage — missing PUT/DELETE tests (intentional)
│   └── test_projects.py     # Minimal — only happy path (intentional)
├── .instructor/
│   └── bugs.md              # Hidden manifest: what's planted, where, and why
├── CLAUDE.md                # AI context file for exercises
├── README.md
├── .env.example
├── requirements.txt
└── run.py
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `beacon/requirements.txt`
- Create: `beacon/run.py`
- Create: `beacon/.env.example`
- Create: `beacon/app/__init__.py`
- Create: `beacon/app/database.py`

- [ ] **Step 1: Create `requirements.txt`**

```
Flask==3.1.0
Flask-SQLAlchemy==3.1.1
SQLAlchemy==2.0.36
pytest==8.3.4
pytest-flask==1.3.0
python-dotenv==1.0.1
```

- [ ] **Step 2: Create `beacon/.env.example`**

```
FLASK_ENV=development
DATABASE_URL=sqlite:///beacon.db
SECRET_KEY=dev-secret-change-in-production
```

- [ ] **Step 3: Create `beacon/app/database.py`**

```python
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
```

- [ ] **Step 4: Create `beacon/app/__init__.py`**

```python
import os
from flask import Flask
from .database import db


def create_app(config=None):
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///beacon.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["TESTING"] = False

    if config:
        app.config.update(config)

    db.init_app(app)

    from .routes import register_blueprints
    register_blueprints(app)

    return app
```

- [ ] **Step 5: Create `beacon/run.py`**

```python
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.database import db

app = create_app()

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
```

- [ ] **Step 6: Install dependencies and verify Flask starts**

```bash
cd beacon
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Expected: Flask starts on http://127.0.0.1:5000 with no errors.

- [ ] **Step 7: Commit**

```bash
git add beacon/
git commit -m "feat: scaffold beacon flask app"
```

---

## Task 2: Models

**Files:**
- Create: `beacon/app/models.py`

- [ ] **Step 1: Write failing test for model creation**

Create `beacon/tests/conftest.py`:

```python
import pytest
from app import create_app
from app.database import db as _db


@pytest.fixture(scope="session")
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope="function")
def db(app):
    with app.app_context():
        yield _db
        _db.session.rollback()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()
```

Create `beacon/tests/test_models.py`:

```python
from app.models import User, Project, Task


def test_user_creation(db):
    user = User(name="Alice", email="alice@beacon.dev")
    db.session.add(user)
    db.session.commit()
    assert user.id is not None
    assert user.name == "Alice"


def test_project_creation(db):
    project = Project(name="Infra", description="Infrastructure tasks")
    db.session.add(project)
    db.session.commit()
    assert project.id is not None


def test_task_creation(db):
    user = User(name="Bob", email="bob@beacon.dev")
    project = Project(name="Backend")
    db.session.add_all([user, project])
    db.session.flush()

    task = Task(
        title="Write tests",
        status="todo",
        assignee_id=user.id,
        project_id=project.id,
    )
    db.session.add(task)
    db.session.commit()
    assert task.id is not None
    assert task.status == "todo"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd beacon
pytest tests/test_models.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.models'`

- [ ] **Step 3: Create `beacon/app/models.py`**

```python
from datetime import datetime, timezone
from .database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    tasks = db.relationship("Task", backref="assignee", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    tasks = db.relationship("Task", backref="project", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
        }


class Task(db.Model):
    __tablename__ = "tasks"

    VALID_STATUSES = ("todo", "in_progress", "done", "archived")

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="todo")
    due_date = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    assignee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat(),
            "assignee_id": self.assignee_id,
            "project_id": self.project_id,
        }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_models.py -v
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/models.py tests/test_models.py tests/conftest.py
git commit -m "feat: add User, Project, Task models with tests"
```

---

## Task 3: User Routes (Clean, Well-Tested)

These routes are the "gold standard" in the codebase — full test coverage, consistent error handling.

**Files:**
- Create: `beacon/app/routes/__init__.py`
- Create: `beacon/app/routes/users.py`
- Create: `beacon/app/services/user_service.py`
- Create: `beacon/app/services/__init__.py`
- Create: `beacon/tests/test_users.py`

- [ ] **Step 1: Write failing tests for user routes**

Create `beacon/tests/test_users.py`:

```python
import json
import pytest
from app.models import User
from app.database import db


@pytest.fixture
def seed_users(db, app):
    with app.app_context():
        u1 = User(name="Alice", email="alice@beacon.dev")
        u2 = User(name="Bob", email="bob@beacon.dev")
        db.session.add_all([u1, u2])
        db.session.commit()
        return [u1.id, u2.id]


def test_get_users_empty(client, db):
    resp = client.get("/api/users")
    assert resp.status_code == 200
    assert resp.json == []


def test_create_user(client, db):
    resp = client.post(
        "/api/users",
        json={"name": "Carol", "email": "carol@beacon.dev"},
    )
    assert resp.status_code == 201
    data = resp.json
    assert data["name"] == "Carol"
    assert data["email"] == "carol@beacon.dev"
    assert "id" in data


def test_create_user_missing_email(client, db):
    resp = client.post("/api/users", json={"name": "Dana"})
    assert resp.status_code == 400
    assert "error" in resp.json


def test_create_user_duplicate_email(client, db):
    client.post("/api/users", json={"name": "Eve", "email": "eve@beacon.dev"})
    resp = client.post("/api/users", json={"name": "Eve2", "email": "eve@beacon.dev"})
    assert resp.status_code == 409
    assert "error" in resp.json


def test_get_user_by_id(client, db, seed_users, app):
    with app.app_context():
        user_id = seed_users[0]
    resp = client.get(f"/api/users/{user_id}")
    assert resp.status_code == 200
    assert resp.json["id"] == user_id


def test_get_user_not_found(client, db):
    resp = client.get("/api/users/9999")
    assert resp.status_code == 404
    assert "error" in resp.json


def test_delete_user(client, db, seed_users, app):
    with app.app_context():
        user_id = seed_users[0]
    resp = client.delete(f"/api/users/{user_id}")
    assert resp.status_code == 204
    resp2 = client.get(f"/api/users/{user_id}")
    assert resp2.status_code == 404
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest tests/test_users.py -v
```

Expected: FAIL — routes not registered yet

- [ ] **Step 3: Create `beacon/app/services/__init__.py`** (empty file)

```python
```

- [ ] **Step 4: Create `beacon/app/services/user_service.py`**

```python
from sqlalchemy.exc import IntegrityError
from ..database import db
from ..models import User


def get_all_users():
    return User.query.all()


def get_user_by_id(user_id):
    return db.session.get(User, user_id)


def create_user(name, email):
    user = User(name=name, email=email)
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ValueError(f"Email already in use: {email}")
    return user


def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return False
    db.session.delete(user)
    db.session.commit()
    return True
```

- [ ] **Step 5: Create `beacon/app/routes/users.py`**

```python
from flask import Blueprint, request, jsonify
from ..services.user_service import (
    get_all_users,
    get_user_by_id,
    create_user,
    delete_user,
)

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("", methods=["GET"])
def list_users():
    users = get_all_users()
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.route("", methods=["POST"])
def create_user_route():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")

    if not name or not email:
        return jsonify({"error": "name and email are required"}), 400

    try:
        user = create_user(name=name, email=email)
    except ValueError as e:
        return jsonify({"error": str(e)}), 409

    return jsonify(user.to_dict()), 201


@users_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200


@users_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user_route(user_id):
    deleted = delete_user(user_id)
    if not deleted:
        return jsonify({"error": "User not found"}), 404
    return "", 204
```

- [ ] **Step 6: Create `beacon/app/routes/__init__.py`**

```python
from .users import users_bp
from .projects import projects_bp
from .tasks import tasks_bp


def register_blueprints(app):
    app.register_blueprint(users_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(tasks_bp)
```

Note: projects_bp and tasks_bp will be added in Tasks 4 and 5. Temporarily stub them if running tests now:

```python
# Temporary stub — remove after Tasks 4 and 5
from flask import Blueprint
projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")
tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")
```

- [ ] **Step 7: Run user tests**

```bash
pytest tests/test_users.py -v
```

Expected: 7 tests PASS

- [ ] **Step 8: Commit**

```bash
git add app/routes/ app/services/ tests/test_users.py
git commit -m "feat: add user routes and service with full test coverage"
```

---

## Task 4: Project Routes (Minimal Tests — Intentional)

Project routes are intentionally under-tested. Only the happy path is covered. This mirrors real codebases and is used in module 2 exercises.

**Files:**
- Create: `beacon/app/routes/projects.py`
- Create: `beacon/app/services/project_service.py`
- Create: `beacon/tests/test_projects.py`

- [ ] **Step 1: Write minimal (intentionally incomplete) tests**

Create `beacon/tests/test_projects.py`:

```python
# NOTE: Only happy-path tests — intentional for training purposes.
# Missing: 404 handling, duplicate names, invalid input.
import pytest
from app.models import Project
from app.database import db


def test_create_project(client, db):
    resp = client.post(
        "/api/projects",
        json={"name": "Backend", "description": "Core API work"},
    )
    assert resp.status_code == 201
    assert resp.json["name"] == "Backend"


def test_list_projects(client, db):
    client.post("/api/projects", json={"name": "Alpha"})
    client.post("/api/projects", json={"name": "Beta"})
    resp = client.get("/api/projects")
    assert resp.status_code == 200
    assert len(resp.json) == 2
```

- [ ] **Step 2: Create `beacon/app/services/project_service.py`**

```python
from ..database import db
from ..models import Project


def get_all_projects():
    return Project.query.all()


def get_project_by_id(project_id):
    return db.session.get(Project, project_id)


def create_project(name, description=""):
    project = Project(name=name, description=description)
    db.session.add(project)
    db.session.commit()
    return project
```

- [ ] **Step 3: Create `beacon/app/routes/projects.py`**

```python
from flask import Blueprint, request, jsonify
from ..services.project_service import (
    get_all_projects,
    get_project_by_id,
    create_project,
)

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


@projects_bp.route("", methods=["GET"])
def list_projects():
    projects = get_all_projects()
    return jsonify([p.to_dict() for p in projects]), 200


@projects_bp.route("", methods=["POST"])
def create_project_route():
    data = request.get_json() or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400
    project = create_project(name=name, description=data.get("description", ""))
    return jsonify(project.to_dict()), 201


@projects_bp.route("/<int:project_id>", methods=["GET"])
def get_project(project_id):
    project = get_project_by_id(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(project.to_dict()), 200
```

- [ ] **Step 4: Update `beacon/app/routes/__init__.py`** — replace the stub with real import

```python
from .users import users_bp
from .projects import projects_bp
from .tasks import tasks_bp


def register_blueprints(app):
    app.register_blueprint(users_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(tasks_bp)
```

(tasks_bp still stubbed until Task 5)

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_projects.py tests/test_users.py -v
```

Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add app/routes/projects.py app/services/project_service.py tests/test_projects.py
git commit -m "feat: add project routes with intentionally minimal test coverage"
```

---

## Task 5: Task Routes + Planted Bugs

Task routes have partial test coverage (GET and POST tested; PUT and DELETE are not). The service layer contains three pre-planted bugs for module 4 exercises.

**Files:**
- Create: `beacon/app/services/task_service.py`
- Create: `beacon/app/routes/tasks.py`
- Create: `beacon/tests/test_tasks.py`

- [ ] **Step 1: Write partial tests (intentionally missing PUT/DELETE)**

Create `beacon/tests/test_tasks.py`:

```python
# NOTE: PUT and DELETE endpoints intentionally have no tests.
# This is a training artifact — module 5 has learners add them.
import pytest
from app.models import User, Project, Task
from app.database import db


@pytest.fixture
def seed_data(db, app):
    with app.app_context():
        user = User(name="Alice", email="alice@tasks.dev")
        project = Project(name="Core")
        db.session.add_all([user, project])
        db.session.flush()
        task = Task(title="Write docs", status="todo",
                    assignee_id=user.id, project_id=project.id)
        db.session.add(task)
        db.session.commit()
        return {"user_id": user.id, "project_id": project.id, "task_id": task.id}


def test_list_tasks_empty(client, db):
    resp = client.get("/api/tasks")
    assert resp.status_code == 200
    assert resp.json == []


def test_create_task(client, db, seed_data, app):
    with app.app_context():
        data = seed_data
    resp = client.post(
        "/api/tasks",
        json={
            "title": "New task",
            "project_id": data["project_id"],
            "assignee_id": data["user_id"],
        },
    )
    assert resp.status_code == 201
    assert resp.json["title"] == "New task"
    assert resp.json["status"] == "todo"


def test_create_task_missing_title(client, db):
    resp = client.post("/api/tasks", json={"project_id": 1})
    assert resp.status_code == 400
    assert "error" in resp.json


def test_get_task_by_id(client, db, seed_data, app):
    with app.app_context():
        task_id = seed_data["task_id"]
    resp = client.get(f"/api/tasks/{task_id}")
    assert resp.status_code == 200
    assert resp.json["id"] == task_id


def test_get_task_not_found(client, db):
    resp = client.get("/api/tasks/9999")
    # BUG: This route raises a 500 instead of returning 404.
    # Intentional — used in module 3 diff-review exercise.
    assert resp.status_code in (404, 500)
```

- [ ] **Step 2: Create `beacon/app/services/task_service.py` with planted bugs**

```python
from datetime import datetime, timezone
from ..database import db
from ..models import Task, Project


def get_all_tasks():
    return Task.query.all()


def get_task_by_id(task_id):
    return db.session.get(Task, task_id)


def create_task(title, project_id=None, assignee_id=None, description="", due_date=None):
    task = Task(
        title=title,
        description=description,
        project_id=project_id,
        assignee_id=assignee_id,
        due_date=due_date,
    )
    db.session.add(task)
    db.session.commit()
    return task


def update_task(task_id, **kwargs):
    task = db.session.get(Task, task_id)
    if not task:
        return None
    for key, value in kwargs.items():
        if hasattr(task, key):
            setattr(task, key, value)
    db.session.commit()
    return task


def delete_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return False
    db.session.delete(task)
    db.session.commit()
    return True


# BUG 1: Filters by Project.name instead of Task.project_id.
# Symptom: returns tasks from projects with matching names across all projects,
# silently ignores numeric project_id. AI hallucinated the ORM join incorrectly.
def get_tasks_by_project(project_id):
    return (
        Task.query.join(Project)
        .filter(Project.name == project_id)  # should be Task.project_id == project_id
        .all()
    )


# BUG 2: No status transition validation.
# Allows 'archived' -> 'in_progress', 'done' -> 'todo', etc.
# A real implementation would enforce valid transitions.
def update_task_status(task_id, new_status):
    task = db.session.get(Task, task_id)
    if not task:
        return None
    task.status = new_status  # missing: validate new_status in Task.VALID_STATUSES
    if new_status == "done":
        task.completed_at = datetime.now(timezone.utc)
    db.session.commit()
    return task


# BUG 3: is_overdue uses strict > instead of >= for same-day due dates.
# Tasks due today are reported as not overdue until tomorrow.
def is_overdue(task):
    if not task.due_date or task.status in ("done", "archived"):
        return False
    return datetime.now(timezone.utc) > task.due_date  # should be >=
```

- [ ] **Step 3: Create `beacon/app/routes/tasks.py`**

Note the intentionally inconsistent error handling compared to users.py — tasks raises a KeyError on unknown task (500) instead of returning 404. This is used in the module 3 diff-review exercise.

```python
from flask import Blueprint, request, jsonify
from ..services.task_service import (
    get_all_tasks,
    get_task_by_id,
    create_task,
    update_task,
    delete_task,
    update_task_status,
    get_tasks_by_project,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


@tasks_bp.route("", methods=["GET"])
def list_tasks():
    project_id = request.args.get("project_id", type=int)
    if project_id:
        tasks = get_tasks_by_project(project_id)
    else:
        tasks = get_all_tasks()
    return jsonify([t.to_dict() for t in tasks]), 200


@tasks_bp.route("", methods=["POST"])
def create_task_route():
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "title is required"}), 400

    task = create_task(
        title=title,
        project_id=data.get("project_id"),
        assignee_id=data.get("assignee_id"),
        description=data.get("description", ""),
    )
    return jsonify(task.to_dict()), 201


@tasks_bp.route("/<int:task_id>", methods=["GET"])
def get_task(task_id):
    # BUG (intentional): No None check — raises AttributeError (500) if not found
    # instead of returning 404 like the users blueprint does.
    task = get_task_by_id(task_id)
    return jsonify(task.to_dict()), 200


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
def update_task_route(task_id):
    data = request.get_json() or {}
    task = update_task(task_id, **data)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task.to_dict()), 200


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task_route(task_id):
    deleted = delete_task(task_id)
    if not deleted:
        return jsonify({"error": "Task not found"}), 404
    return "", 204


@tasks_bp.route("/<int:task_id>/status", methods=["PATCH"])
def update_status(task_id):
    data = request.get_json() or {}
    status = data.get("status")
    if not status:
        return jsonify({"error": "status is required"}), 400
    task = update_task_status(task_id, status)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task.to_dict()), 200
```

- [ ] **Step 4: Update `beacon/app/routes/__init__.py`** — remove the tasks stub, use real import

```python
from .users import users_bp
from .projects import projects_bp
from .tasks import tasks_bp


def register_blueprints(app):
    app.register_blueprint(users_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(tasks_bp)
```

- [ ] **Step 5: Run all tests**

```bash
pytest tests/ -v
```

Expected: All tests PASS (the `test_get_task_not_found` test accepts 404 or 500)

- [ ] **Step 6: Commit**

```bash
git add app/routes/tasks.py app/services/task_service.py tests/test_tasks.py app/routes/__init__.py
git commit -m "feat: add task routes and service with intentional bugs for module 4"
```

---

## Task 6: CLAUDE.md, README, and Instructor Manifest

**Files:**
- Create: `beacon/CLAUDE.md`
- Create: `beacon/README.md`
- Create: `beacon/.instructor/bugs.md`

- [ ] **Step 1: Create `beacon/CLAUDE.md`**

```markdown
# Beacon — AI Context

## What is this?
Beacon is a task management REST API for an internal engineering team.

## Stack
- Python 3.11+ / Flask 3.x
- SQLAlchemy 2.x with SQLite (dev)
- pytest for testing

## Project structure
- `app/` — Flask application
  - `models.py` — SQLAlchemy models: User, Project, Task
  - `routes/` — Flask blueprints, one per resource
  - `services/` — Business logic layer (called by routes)
  - `database.py` — SQLAlchemy setup
- `tests/` — pytest tests
- `run.py` — development entrypoint

## Running locally
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

## Running tests
```bash
pytest tests/ -v
```

## API base URL
All routes are prefixed with `/api/`. Resources: `/api/users`, `/api/projects`, `/api/tasks`.

## Conventions
- Routes return JSON. Errors always include an `"error"` key.
- Task statuses: `todo`, `in_progress`, `done`, `archived`
- Use `to_dict()` on models to serialize for responses.
```

- [ ] **Step 2: Create `beacon/README.md`**

```markdown
# Beacon

Internal task management API for the Beacon engineering team.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

## Running tests

```bash
pytest tests/ -v
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| POST | /api/users | Create a user |
| GET | /api/users/:id | Get a user |
| DELETE | /api/users/:id | Delete a user |
| GET | /api/projects | List all projects |
| POST | /api/projects | Create a project |
| GET | /api/tasks | List tasks (optional: ?project_id=) |
| POST | /api/tasks | Create a task |
| GET | /api/tasks/:id | Get a task |
| PUT | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |
| PATCH | /api/tasks/:id/status | Update task status |
```

- [ ] **Step 3: Create `beacon/.instructor/bugs.md`**

```markdown
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
transition is legal (e.g., archived → in_progress should be rejected)

**What happens:** `PATCH /api/tasks/1/status` with `{"status": "banana"}` succeeds.
An archived task can be moved back to in_progress.

**Why it's realistic:** AI frequently omits guard clauses, especially for enum-like
values, when the model schema doesn't enforce them at the DB level.

**Used in:** Module 4, Bug Hunt exercise, Bug #2

---

## Bug 3: Off-by-one in is_overdue (strict > vs >=)

**File:** `app/services/task_service.py`, `is_overdue()`
**Line:** `return datetime.now(timezone.utc) > task.due_date`
**Should be:** `return datetime.now(timezone.utc) >= task.due_date`

**What happens:** Tasks due exactly at the current timestamp are reported as not overdue.
In practice, tasks due "today" will appear on-time until the microsecond has passed.

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
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md .instructor/
git commit -m "docs: add CLAUDE.md, README, and instructor bug manifest"
```

---

## Task 7: Git Tags for Module Checkpoints

Each module starts from a specific git state. Tags mark the codebase at the point where each module's exercises begin.

- [ ] **Step 1: Tag the current state as the module 1 starting point**

```bash
git tag beacon-m1
```

Expected: No output. `git tag` should list `beacon-m1`.

- [ ] **Step 2: Verify tag exists**

```bash
git tag
```

Expected: `beacon-m1`

- [ ] **Step 3: Note on remaining tags**

Tags `beacon-m2` through `beacon-m6` will be added as content for each module is written and the codebase is evolved to match. The current state (beacon-m1) represents: basic codebase with all routes working, bugs planted, partial test coverage in place.

---

## Self-Review

**Spec coverage:**
- [x] Python/Flask backend — Tasks 1–5
- [x] SQLAlchemy ORM + SQLite — Task 1–2
- [x] pytest — Tasks 2–5
- [x] Some endpoints well-tested, some not — Task 3 (full), Task 4 (minimal), Task 5 (partial)
- [x] Pre-planted bugs for module 4 — Task 5, three bugs documented
- [x] Inconsistent patterns across routes — tasks GET /:id returns 500, users returns 404
- [x] ~15 files, structured like a real project — file map above
- [x] CLAUDE.md ships with the repo — Task 6
- [x] Git tags per module — Task 7

**No placeholders found.**

**Type consistency:** `to_dict()` defined on all models in Task 2, called consistently in all routes (Tasks 3–5). Service functions return model instances or None consistently. Routes handle None with 404 responses (except the intentional bug in tasks.py).
