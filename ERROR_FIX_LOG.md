# OffensiveGrid — Comprehensive Error & Bug Fix Log

> **PURPOSE:** This document is the permanent troubleshooting memory of OffensiveGrid.  
> **MANDATE:** Every developer/agent discovering an anomaly, failed test, or architectural bug MUST log it here before proceeding.  
> **RULE:** An issue is marked `FIXED` **ONLY** after root-cause resolution and explicit test verification.

---

## 1. Summary Statistics

| Status | Count |
| :--- | :--- |
| **Open Issues** | 0 |
| **In Progress / Investigation** | 0 |
| **Blocked Issues** | 0 |
| **Regression Issues** | 0 |
| **Resolved / Fixed Issues** | 3 |
| **Total Logged Issues** | 3 |

---

## 2. Active & Open Issues

*(No open issues currently reported. Clean baseline established.)*

---

## 3. Blocked & Investigating Issues

*(No blocked issues currently reported.)*

---

## 4. Regression Issues Tracker

*(No regressions detected across baseline architecture.)*

---

## 5. Resolved & Fixed Issues (Archive)

### Error ID: ERR-001
- **Date Discovered:** 2026-08-26
- **Discovered In Phase:** Phase 2 — Core Foundation & Backend Integration
- **Affected Module:** `apps.accounts.models.User.roles`
- **Severity:** High
- **Status:** FIXED

#### Problem Description
Django system check raised `(fields.E334)` during `makemigrations`:
`The model is used as an intermediate model by 'accounts.User.roles', but it has more than one foreign key from 'User', which is ambiguous.`

#### Root Cause Analysis
`UserRole` contains two `ForeignKey(User, ...)` references: `user` and `assigned_by`. Django could not determine which ForeignKey should link `User.roles` to `Role`.

#### Solution & Fix Applied
Added explicit `through_fields=('user', 'role')` to `User.roles = models.ManyToManyField(...)` in `backend/apps/accounts/models.py`.

#### Files Modified
- `backend/apps/accounts/models.py`

#### Testing & Verification Performed
Executed `python manage.py makemigrations` and `python manage.py migrate`. All migrations applied with 100% success.

---

### Error ID: ERR-002
- **Date Discovered:** 2026-08-26
- **Discovered In Phase:** Phase 3 — Frontend Foundation & Design System
- **Affected Module:** `frontend/vite.config.ts`
- **Severity:** Medium
- **Status:** FIXED

#### Problem Description
`npm run build` failed with `[vite:build-html] The "fileName" or "name" properties of emitted chunks and assets must be strings that are neither absolute nor relative paths, received "../../CS ZONE CTF Plateform/frontend/index.html"`.

#### Root Cause Analysis
The workspace root directory was traversed through a directory junction, causing Rollup to resolve the realpath and generate a relative path outside the expected bundle root.

#### Solution & Fix Applied
Configured `resolve: { preserveSymlinks: true }` in `frontend/vite.config.ts`.

#### Files Modified
- `frontend/vite.config.ts`

#### Testing & Verification Performed
Executed `npm run build`. TypeScript type-check and Vite production build succeeded in 2.32s with zero warnings/errors.

---

### Error ID: ERR-003
- **Date Discovered:** 2026-08-26
- **Discovered In Phase:** Phase 2 / Admin UI Operation
- **Affected Module:** `django.template.context.BaseContext.__copy__` / Admin Changelist Rendering
- **Severity:** High
- **Status:** FIXED

#### Problem Description
Opening `/admin/accounts/user/` or `/admin/scenarios/scenario/` threw `AttributeError: 'super' object has no attribute 'dicts' and no __dict__ for setting new attributes` at `django\template\context.py, line 41, in __copy__`.

#### Root Cause Analysis
The local runtime uses **Python 3.14.5**. In Python 3.14+, `copy(super())` returns a `super` proxy object on which setting custom attributes (`duplicate.dicts = ...`) is prohibited by the CPython runtime.

#### Solution & Fix Applied
Added an automated runtime compatibility patch in `backend/apps/core/apps.py` (`CoreConfig.ready`):
```python
def patch_django_template_context_for_python314():
    from django.template.context import BaseContext
    def base_context_copy(self):
        duplicate = object.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate
    BaseContext.__copy__ = base_context_copy
```

#### Files Modified
- `backend/apps/core/apps.py`
- `backend/config/settings/base.py`

#### Testing & Verification Performed
- Simulated Django test client requests to `/admin/accounts/user/`, `/admin/scenarios/scenario/`, `/admin/competitions/competition/`. All returned HTTP 200 OK.
- Executed `pytest` test suite: 11/11 tests PASSED.

---

## 6. Known Environment Quirks & Proactive Mitigations

| Quirk / Concern | Potential Impact | Proactive Mitigation Strategy |
| :--- | :--- | :--- |
| **Python 3.14 Super Object Copy** | `BaseContext.__copy__` attribute error | Monkeypatched `BaseContext.__copy__` in `apps.core.apps.CoreConfig.ready`. |
| **Windows Powershell Pathing** | Path separator inconsistencies (`\` vs `/`) | Use standard Python `pathlib.Path` and POSIX-compliant path resolutions across all scripts. |
| **WebSocket CORS in Localhost** | React (Port 5173) talking to Django ASGI (Port 8000) | Explicitly configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in Django settings for `http://localhost:5173` and `http://127.0.0.1:5173`. |
| **Junction Directory Paths** | Rollup build path mismatch | Set `preserveSymlinks: true` in `vite.config.ts`. |
| **Flag Brute-Force Attacks** | Submissions flooded to guess flags | Implement strict Redis/Memory throttling (DRF ScopedRateThrottle) on the flag submit endpoint. |
