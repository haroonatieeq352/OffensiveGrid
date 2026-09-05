# OffensiveGrid — Master Project Plan, Architecture & Workflow Specification

> **CONFIDENTIAL & PROPRIETARY — ENTERPRISE CYBERSECURITY TRAINING SYSTEM**  
> **Author:** Multi-Agent Architecture Board  
> **Platform Name:** OffensiveGrid  
> **Status:** Active / Master Architectural Blueprint  
> **Version:** 2.0.0 (Unified Architecture & Complete System Workflows)  
> **Last Updated:** August 2026  

---

## Table of Contents
1. [Executive Summary & Project Overview](#1-executive-summary--project-overview)
2. [Development Philosophy & Zero-Cost Constraint](#2-development-philosophy--zero-cost-constraint)
3. [High-Level System Architecture & Tiered Interaction](#3-high-level-system-architecture--tiered-interaction)
4. [Technology Stack Specifications & Layer Responsibilities](#4-technology-stack-specifications--layer-responsibilities)
5. [Backend Architecture & Application Modules](#5-backend-architecture--application-modules)
6. [Frontend Architecture & Feature-Driven Structure](#6-frontend-architecture--feature-driven-structure)
7. [Database Architecture & Data Relationships (Supabase PostgreSQL)](#7-database-architecture--data-relationships-supabase-postgresql)
8. [Storage & Document Management Architecture (Supabase Storage)](#8-storage--document-management-architecture-supabase-storage)
9. [Authentication & Role-Based Access Control (RBAC)](#9-authentication--role-based-access-control-rbac)
10. [CTF Scenario Creation & Management Workflow](#10-ctf-scenario-creation--management-workflow)
11. [Student Scenario Engagement & Execution Workflow](#11-student-scenario-engagement--execution-workflow)
12. [Flag Submission, Attempt Quota & Anti-Cheat Workflow](#12-flag-submission-attempt-quota--anti-cheat-workflow)
13. [Scoring Engine & Duplicate Score Protection](#13-scoring-engine--duplicate-score-protection)
14. [Competition Lifecycle & Server-Authoritative Timer Workflow](#14-competition-lifecycle--server-authoritative-timer-workflow)
15. [Competition End, Tie-Breaking & Final Rankings](#15-competition-end-tie-breaking--final-rankings)
16. [Live Real-Time Leaderboard & WebSocket Broadcast Workflow](#16-live-real-time-leaderboard--websocket-broadcast-workflow)
17. [Free vs. Paid Scenario Access System (Mock Layer)](#17-free-vs-paid-scenario-access-system-mock-layer)
18. [Admin & Student Dashboard Architecture & Screen Wireframes](#18-admin--student-dashboard-architecture--screen-wireframes)
19. [System Audit Logging & Event Tracking Workflow](#19-system-audit-logging--event-tracking-workflow)
20. [Security Separation & Target Isolation Policy](#20-security-separation--target-isolation-policy)
21. [Centralized Error Handling & Exception Workflow](#21-centralized-error-handling--exception-workflow)
22. [Complete End-to-End System Workflow Diagram](#22-complete-end-to-end-system-workflow-diagram)
23. [Three Project Memory Files & AI Handover Protocol](#23-three-project-memory-files--ai-handover-protocol)
24. [Development Phases, Execution Roadmap & Quality Standard](#24-development-phases-execution-roadmap--quality-standard)
25. [Architecture Decision Records (ADR Log)](#25-architecture-decision-records-adr-log)

---

## 1. Executive Summary & Project Overview

### 1.1 Mission Statement
The **OffensiveGrid** platform is a commercial-grade, enterprise-level cybersecurity training and competition platform engineered for cybersecurity institutes, corporate defense training, and university CTF tournaments. The system delivers a seamless, high-performance training experience where students access curated attack-defense scenarios, download mission intelligence dossiers, exploit isolated target environments, capture flags, and compete on a live real-time leaderboard.

### 1.2 Core Student Capabilities
* Register and log in.
* View available CTF scenarios and filter by categories/difficulty.
* Download scenario instructions, attachments, and dossiers.
* Access authorized CTF target websites in isolated environments.
* Find vulnerabilities and capture flags.
* Submit flags through the platform.
* Receive real-time scores for correct flags with duplicate solve prevention.
* Track personal progress, attempts, and solve history.
* Monitor live rank and compete on a live WebSocket-powered leaderboard.
* Observe synchronized server-authoritative competition countdown timers.
* View final frozen rankings and certificates when competitions conclude.

### 1.3 Core Admin & Instructor Capabilities
* Author and publish scenarios with rich markdown instructions and target URLs.
* Upload secure PDF, DOCX, TXT, and binary dossier files to Supabase Storage.
* Configure dynamic scoring, custom attempt quotas, and free/paid access flags.
* Schedule and manage competitions with synchronized countdown timers.
* Monitor live student submissions, solve metrics, and telemetry in real time.
* Access deep platform analytics, solve distributions, and audit trails.

---

## 2. Development Philosophy & Zero-Cost Constraint

### 2.1 Zero-Budget Local-First Mandate
The entire platform is built with **zero mandatory infrastructure expenditure** during the development and local testing phases:
* **Local Runtime:** Frontend and Backend executed locally via modern dev servers (Vite + Django ASGI / Daphne).
* **Free-Tier Database & Storage:** Supabase Free Tier (PostgreSQL + S3-compatible Object Storage) utilized for structured data and file storage.
* **Zero Paid Dependencies:** No commercial third-party APIs, paid email delivery services, paid hosting/VPS, or paid auth providers.
* **Local Mocks & Emulators:** Email verification, payment processing, and external services are built with interchangeable mock adapters for local testing that transition seamlessly to production providers later.

### 2.2 Production Transition Lifecycle
```text
[Local Development & Testing] 
          ↓ (Verified Zero-Cost)
[Client Staging Demonstration & Feedback]
          ↓ (Verified Approval)
[Production Provisioning (Cloud / VPS / Managed DB)]
```

---

## 3. High-Level System Architecture & Tiered Interaction

```text
                    ┌─────────────────────────┐
                    │      STUDENT USER       │
                    │      ADMIN USER         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   React + TypeScript    │
                    │      Frontend UI        │
                    └────────────┬────────────┘
                                 │
                         HTTPS / REST API
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Django + DRF Backend    │
                    │                         │
                    │ Business Logic          │
                    │ Authentication          │
                    │ Authorization            │
                    │ CTF Logic               │
                    │ Scoring                 │
                    │ Attempts                │
                    │ Competition             │
                    └──────┬──────────┬───────┘
                           │          │
                    REST/API          │ WebSocket
                           │          │
                           ▼          ▼
                  ┌─────────────┐  ┌──────────────┐
                  │  Supabase   │  │    Django    │
                  │ PostgreSQL  │  │   Channels   │
                  │             │  │  WebSockets  │
                  └──────┬──────┘  └──────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Supabase   │
                  │   Storage   │
                  │             │
                  │ PDF / DOCX  │
                  │ Documents   │
                  └─────────────┘
```

### 3.1 Network & Target Isolation Perimeter
```text
CTF Platform
     │
     ├─────────────── Student Platform (Hardened SaaS Perimeter)
     │
     └─────────────── CTF Target Websites (Detached Lab Perimeter)
                         │
                         ├── Scenario 1 (Web Exploitation Target)
                         ├── Scenario 2 (API Vulnerability Target)
                         ├── Scenario 3 (Auth Bypass Target)
                         └── Scenario N (Network Forensics Target)
```
* **Isolation Rule:** CTF target websites are intentionally vulnerable but strictly isolated. They have **no direct connectivity or credentials** to the Supabase database, Django backend, or storage buckets.

---

## 4. Technology Stack Specifications & Layer Responsibilities

| Layer | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18+ (Vite) + TypeScript | Display UI, manage state, route views, send API requests, handle user interactions, render responsive light SaaS interface |
| **Styling & Components** | Tailwind CSS + shadcn/ui | Professional, modern light/white theme, clean typography, accessible primitives, consistent spacing |
| **Charts & Data Viz** | Recharts + Lucide Icons | Responsive charts, solve distribution analytics, score-over-time graphs |
| **Real-Time Client** | Native WebSocket / Reconnecting WebSocket | Live leaderboard updates, synchronized competition countdown timer |
| **Backend Engine** | Python 3.11+ / Django 5.x | Core business logic, authentication, RBAC, scenario access, flag validation, attempts, scoring, competition rules |
| **API Layer** | Django REST Framework (DRF) | Standardized JSON serialization, pagination, throttling, permission classes |
| **Real-Time Engine** | Django Channels 4.x + Daphne ASGI | Real-time WebSocket consumer groups (`leaderboard_global`, `competition_{id}`) |
| **Database** | Supabase PostgreSQL 15+ | Relational data, foreign keys, unique constraints, atomic transactions, indexes |
| **Storage** | Supabase Storage (S3-compatible) | Secure bucket hosting for scenario files with time-limited presigned URLs |

---

## 5. Backend Architecture & Application Modules

The backend is organized into decoupled, single-responsibility Django apps:

```text
backend/
│
├── config/                     # Core Project Settings & ASGI/WSGI
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── apps/
│   ├── accounts/               # Users, Roles, UserRoles, JWT Auth, Permissions
│   ├── scenarios/              # Scenarios, Categories, ScenarioFiles, Flags
│   ├── submissions/            # Flag Verification, Attempt Limiting, Submission Logs
│   ├── scoring/                # Scoring Engine, Points Accrual, Duplicate Prevention
│   ├── competitions/           # Competition Scheduling, Server-Side Timers, Match State
│   ├── leaderboard/            # Leaderboard Cache, Tie-Breaking, WebSocket Consumers
│   ├── files/                  # Supabase Storage Integration, Presigned URL Generator
│   ├── payments/               # Free/Paid Access Mock Service (Production Ready Hook)
│   ├── notifications/          # In-app alerts, First Blood broadcasts
│   ├── analytics/              # Aggregated metrics, solve rates, difficulty metrics
│   └── audit/                  # Audit trail logger for sensitive admin/scoring events
│
├── tests/                      # Unit & Integration test suites
├── requirements/               # Python dependencies
└── manage.py
```

---

## 6. Frontend Architecture & Feature-Driven Structure

The frontend is structured by modular feature domains to ensure maintainability:

```text
frontend/
│
├── src/
│   ├── components/             # Global Reusable UI Elements (shadcn/ui)
│   │   ├── ui/                 # Buttons, Cards, Inputs, Tables, Dialogs, Badges, Tabs
│   │   └── common/             # Header, Sidebar, Footer, Breadcrumbs, ErrorBoundary
│   │
│   ├── layouts/                # Layout Wrappers (AuthLayout, StudentLayout, AdminLayout)
│   │
│   ├── pages/                  # Route-level Pages
│   │   ├── public/             # Landing, Login, Register, ForgotPassword
│   │   ├── student/            # Dashboard, ScenarioList, ScenarioDetail, Competition, Leaderboard, Profile
│   │   └── admin/              # Overview, ScenarioManager, StudentManager, CompetitionManager, Analytics, AuditLogs
│   │
│   ├── features/               # Domain-Specific Logic & Sub-Components
│   │   ├── auth/               # LoginForm, RegisterForm, AuthGuard, useAuth
│   │   ├── scenarios/          # ScenarioCard, ScenarioGrid, FileDownloadBtn, InstructionViewer
│   │   ├── submissions/        # FlagSubmitInput, AttemptCounter, SolveBanner
│   │   ├── leaderboard/        # LiveLeaderboardTable, FirstBloodBadge, RankCard
│   │   ├── competitions/       # CompetitionTimer, CompetitionRulesCard, ResultsModal
│   │   ├── profile/            # SolveHistoryTimeline, StatsRadarChart
│   │   └── admin/              # ScenarioEditorForm, StudentTable, ScoreAdjustmentModal
│   │
│   ├── hooks/                  # Custom React Hooks (useWebSocket, useTimer, useDebounce)
│   ├── services/               # Axios API Client & Endpoint Definitions
│   ├── api/                    # Centralized API Route constants
│   ├── types/                  # TypeScript Interfaces, Models, and Enums
│   ├── utils/                  # Date formatters, math, classnames (cn), token storage
│   ├── charts/                 # Recharts wrapper components
│   └── assets/                 # SVGs, brand logos, icons
│
├── public/
└── package.json
```

---

## 7. Database Architecture & Data Relationships (Supabase PostgreSQL)

### 7.1 Entity Relationship Diagram
```text
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    users     │◄──────┤  user_roles  ├──────►│      roles       │
└──────┬───────┘       └──────────────┘       └──────────────────┘
       │
       ├──────────────────────────────────────────────┐
       │ 1:M                                          │ 1:M
       ▼                                              ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│ submissions  │◄──────┤  scenarios   ├──────►│  scenario_files  │
└──────┬───────┘       └──────┬───────┘       └──────────────────┘
       │                      │ 1:M
       │                      ▼
       │               ┌──────────────┐
       │               │    flags     │
       │               └──────────────┘
       │                      ▲
       │ 1:M                  │
       ▼                      │ M:M
┌──────────────┐       ┌──────┴───────┐
│ user_scores  │◄──────┤ competitions │
└──────────────┘       └──────────────┘
```

### 7.2 Main Database Tables Specification
1. **`users`:** `id (UUID, PK)`, `email`, `username`, `password_hash`, `first_name`, `last_name`, `is_active`, `is_verified`, `created_at`, `updated_at`.
2. **`roles` & `user_roles`:** `id`, `name (SUPER_ADMIN, ADMIN, INSTRUCTOR, STUDENT)`. Junction table mapping `user_id` to `role_id`.
3. **`categories`:** `id (UUID, PK)`, `name`, `slug`, `description`, `icon`.
4. **`scenarios`:** `id (UUID, PK)`, `title`, `slug`, `description`, `instructions`, `category_id (FK)`, `difficulty (EASY, MEDIUM, HARD, INSANE)`, `points`, `target_url`, `max_attempts (0 = unlimited)`, `time_limit_minutes`, `is_paid`, `status (DRAFT, PUBLISHED, ARCHIVED)`, `created_by (FK)`, `created_at`, `updated_at`.
5. **`flags`:** `id (UUID, PK)`, `scenario_id (FK)`, `flag_value`, `is_case_sensitive`, `is_regex`, `created_at`.
6. **`scenario_files`:** `id (UUID, PK)`, `scenario_id (FK)`, `file_name`, `file_path (Storage Key)`, `file_size_bytes`, `file_type`, `is_public`, `uploaded_at`.
7. **`competitions`:** `id (UUID, PK)`, `title`, `slug`, `description`, `start_time`, `end_time`, `status (UPCOMING, ACTIVE, PAUSED, ENDED)`, `is_public`, `created_by (FK)`, `created_at`.
8. **`competition_scenarios`:** `competition_id (FK)`, `scenario_id (FK)`, `custom_points`, `order_index`.
9. **`submissions`:** `id (UUID, PK)`, `user_id (FK)`, `scenario_id (FK)`, `competition_id (FK, nullable)`, `submitted_flag`, `is_correct`, `awarded_points`, `attempt_number`, `submitted_at`, `ip_address`.
10. **`user_scores`:** `id (UUID, PK)`, `user_id (FK)`, `competition_id (FK, nullable)`, `total_score`, `solved_count`, `last_solve_time`, `updated_at` (Unique on `user_id, competition_id`).
11. **`audit_logs`:** `id (UUID, PK)`, `user_id (FK)`, `action`, `resource_type`, `resource_id`, `details (JSONB)`, `ip_address`, `timestamp`.

---

## 8. Storage & Document Management Architecture (Supabase Storage)

```text
Admin Upload Workflow:
Admin ──► Scenario Editor ──► Upload PDF/DOCX ──► File Type & Size Validation
                                                       │
                                                       ▼
                                            Store in Supabase Storage
                                                       │
                                                       ▼
                                            Save Metadata in scenario_files Table

Student Download Workflow:
Student ──► Open Scenario ──► Click Download ──► Backend Validates Auth & Access
                                                       │
                                                       ▼
                                            Generate Supabase Presigned URL (TTL: 60s)
                                                       │
                                                       ▼
                                            Deliver File Directly to Student
```

---

## 9. Authentication & Role-Based Access Control (RBAC)

```text
User Login Flow:
User ──► Login Page ──► Submit Email + Password
                             │
                             ▼
                      Django Backend
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
    Check Credentials                 Check Status & Role
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                  Authentication Successful
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   Student ──► Student Dashboard      Admin ──► Admin Dashboard
```

### 9.1 Role & Permission Matrix
| Role | Scenarios View & Docs | Flag Submit & Score | Create/Edit Scenarios | Create/Manage Competitions | View Analytics & Audits | Manage Users |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Student** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Instructor** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 10. CTF Scenario Creation & Management Workflow

```text
Admin Scenario Workflow:
Admin Dashboard ──► Scenario Management ──► Create Scenario
                                                 │
                                                 ▼
                                     Enter Scenario Information
                                     Set Difficulty & Category
                                     Set Points & Max Attempts
                                     Set Free / Paid Status
                                     Add Target URL
                                     Configure Flag & Regex
                                     Upload Instructions & PDF
                                                 │
                                                 ▼
                                            Save Draft
                                                 │
                                                 ▼
                                              Preview
                                                 │
                                                 ▼
                                              Publish
                                                 │
                                                 ▼
                                 Live to Authorized Students
```

---

## 11. Student Scenario Engagement & Execution Workflow

```text
Student Engagement Flow:
Student Login ──► Student Dashboard ──► Available Scenarios ──► Select Scenario
                                                                     │
                                                                     ▼
                                                             Scenario Details
                                                                     │
                                                                     ▼
                                                             Check User Access
                                                                     │
                                                                     ▼
                                                             Read Instructions
                                                                     │
                                                                     ▼
                                                             Download Document
                                                                     │
                                                                     ▼
                                                             Open CTF Target
                                                                     │
                                                                     ▼
                                                             Find Vulnerability
                                                                     │
                                                                     ▼
                                                             Find Secret Flag
                                                                     │
                                                                     ▼
                                                             Return to Platform
                                                                     │
                                                                     ▼
                                                             Submit Flag
```

---

## 12. Flag Submission, Attempt Quota & Anti-Cheat Workflow

```text
Student enters Flag ──► Frontend sends POST /api/v1/submissions/submit/
                               │
                               ▼
                        Django Backend
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     Check Auth & Token  Check Scenario    Check Competition
                         Access Rights     Status (Active?)
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                    Check Attempt Limit
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   Attempts Exceeded                       Attempts Available
            │                                     │
            ▼                                     ▼
   Block Submission                        Validate Flag Value
   Return 403 Forbidden                           │
                                       ┌──────────┴──────────┐
                                       ▼                     ▼
                                    CORRECT               INCORRECT
                                       │                     │
                                       ▼                     ▼
                              Record Solve in DB     Record Failed Attempt
                              Mark Scenario Solved   Increment Counter
                              Award Points           Return Remaining Tries
                              Update Leaderboard
                              WebSocket Broadcast
                              Return 200 Success
```

---

## 13. Scoring Engine & Duplicate Score Protection

### 13.1 Idempotent Scoring & Replay Prevention
```text
Student submits flag for already-solved scenario:
Student Submits Flag ──► Backend Checks `submissions` / `user_scores`
                                     │
                                     ▼
                             Already Solved = True
                                     │
                                     ▼
                      Do NOT Award Additional Points
                                     │
                                     ▼
                      Return 400 "Scenario Already Solved"
```

---

## 14. Competition Lifecycle & Server-Authoritative Timer Workflow

```text
Competition Management Lifecycle:
Admin ──► Create Competition ──► Set Title, Start Time, End Time, Scenarios, Rules
                                         │
                                         ▼
                            [Status: UPCOMING]
                                         │
                   (Server Time reaches Start Time)
                                         │
                                         ▼
                            [Status: ACTIVE]
                            - Students can play
                            - Server-Side Timer Running
                            - Flag Submissions Allowed
                            - Real-Time Leaderboard Live
                                         │
                   (Server Time reaches End Time)
                                         │
                                         ▼
                            [Status: ENDED]
                            - Block All Flag Submissions
                            - Freeze Scoring Engine
                            - Freeze Leaderboard
                            - Calculate Final Rankings
```

---

## 15. Competition End, Tie-Breaking & Final Rankings

### 15.1 Tie-Breaking Rules Hierarchy
1. **Primary:** Highest Total Accumulated Score (Descending).
2. **Secondary:** Earliest `last_solve_time` achieving the final score (Ascending).
3. **Tertiary:** Highest Number of Solved Challenges (Descending).

### 15.2 Final Leaderboard Output Example
```text
┌──────┬─────────────┬───────┬────────┬──────────────────────┐
│ Rank │ Student     │ Score │ Solved │ Final Solve Time     │
├──────┼─────────────┼───────┼────────┼──────────────────────┤
│  1   │ Student A   │ 2500  │   8    │ 2026-08-26 10:14:02  │
│  2   │ Student B   │ 2200  │   7    │ 2026-08-26 10:30:15  │
│  3   │ Student C   │ 1900  │   6    │ 2026-08-26 09:55:40  │
└──────┴─────────────┴───────┴────────┴──────────────────────┘
```

---

## 16. Live Real-Time Leaderboard & WebSocket Broadcast Workflow

```text
Student Solves Scenario ──► Score Updated in DB ──► Leaderboard Table Updated
                                                          │
                                                          ▼
                                                   Django Channels
                                                          │
                                                          ▼
                                             WebSocket Broadcast to Group
                                                 `leaderboard_global`
                                                          │
                                                          ▼
                                             All Connected Student Clients
                                                 Receive Live JSON Event
                                                          │
                                                          ▼
                                             React UI Animates Rank Shift
                                                 (Zero Page Refresh)
```

---

## 17. Free vs. Paid Scenario Access System (Mock Layer)

```text
Admin Creates Scenario ──► Select Access Type: [Free] OR [Paid]
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
               [FREE]                          [PAID]
                  │                               │
                  ▼                               ▼
       Student Opens Scenario          Student Opens Scenario
                  │                               │
                  ▼                               ▼
            Access Granted               Check Student Entitlement
                                                  │
                                          ┌───────┴───────┐
                                          ▼               ▼
                                       Has Access     No Access
                                          │               │
                                          ▼               ▼
                                    Access Granted  Show Mock Checkout Modal
                                                    (Local Free Unlock for Dev)
```

---

## 18. Admin & Student Dashboard Architecture & Screen Wireframes

### 18.1 Student Dashboard Layout Wireframe
```text
┌────────────────────────────────────────────────────────────────────────┐
│ CS ZONE CyberGrid    [Scenarios]  [Leaderboard]  [Competition]   [User] │
├────────────────────────────────────────────────────────────────────────┤
│ COMPETITION COUNTDOWN: 01:42:35  [Status: ACTIVE]                      │
├──────────────────────┬──────────────────────┬──────────────────────────┤
│ MY TOTAL SCORE       │ MY CURRENT RANK      │ CHALLENGES SOLVED        │
│ 1,250 PTS            │ #4 of 128            │ 5 / 10 Solved (50%)      │
├──────────────────────┴──────────────────────┴──────────────────────────┤
│ CATEGORY PERFORMANCE BREAKDOWN (Radar / Progress Bar Chart)            │
├────────────────────────────────────────────────────────────────────────┤
│ AVAILABLE SCENARIOS                                                    │
│ [Web: SQL Injection #1 (100 pts) - SOLVED]                             │
│ [Web: Auth Bypass #2 (250 pts) - 3/5 Attempts Used]                    │
│ [Forensics: Memory Dump (500 pts) - Unsolved]                          │
├────────────────────────────────────────────────────────────────────────┤
│ LIVE TOURNAMENT LEADERBOARD (Top 10 Live Stream)                       │
└────────────────────────────────────────────────────────────────────────┘
```

### 18.2 Admin Dashboard Navigation Structure
```text
Admin Dashboard
│
├── Overview (System metrics, total students, solve rates, active competitions)
├── Students (Directory, active status toggle, solve audit, password reset)
├── Scenarios (Catalog, visual editor, file uploader, flag manager, preview)
├── Documents (Supabase Storage file inspector, mime-type validators)
├── Competitions (Match creator, scheduler, timer control, scenario picker)
├── Scores & Submissions (Live submission stream, manual score adjuster)
├── Analytics (Recharts performance curves, difficulty indices, drop-off rates)
├── Audit Logs (Comprehensive tamper-evident security and administrative trail)
└── Settings (Platform branding, email mock toggles, rate limits)
```

---

## 19. System Audit Logging & Event Tracking Workflow

```text
Admin Modifies Scenario Score ──► Save in Database
                                         │
                                         ▼
                             Trigger Audit Logger
                                         │
                                         ▼
                             Create Record in `audit_logs`:
                             {
                               "user": "admin_sarah",
                               "action": "SCORE_MODIFIED",
                               "resource": "scenario_uuid_123",
                               "old_value": 300,
                               "new_value": 500,
                               "ip_address": "127.0.0.1",
                               "timestamp": "2026-08-26T10:45:00Z"
                             }
```

---

## 20. Security Separation & Target Isolation Policy

1. **Zero-Trust for Target Environments:** CTF targets are treated as untrusted, isolated sandboxes.
2. **No Shared Database Credentials:** Targets have no database drivers, connection strings, or internal tokens.
3. **Platform Hardening:** Django backend strictly utilizes parameterized ORM queries, CSRF validation, CORS origin whitelisting, DRF ScopedRateThrottle, and HTML-escaped outputs.

---

## 21. Centralized Error Handling & Exception Workflow

```text
Client Request ──► Validation ──► Business Logic ──► Success (200/201)
                                         │
                                  (Error Occurs)
                                         │
                                         ▼
                               Centralized Exception Handler
                                         │
                                         ▼
                         Log Detailed Traceback on Server
                                         │
                                         ▼
                         Return Safe Sanitized JSON Response:
                         {
                           "success": false,
                           "error": {
                             "code": "ATTEMPT_LIMIT_REACHED",
                             "message": "Maximum attempt limit reached for this scenario."
                           }
                         }
                                         │
                                         ▼
                         Update `ERROR_FIX_LOG.md` during development
```

---

## 22. Complete End-to-End System Workflow Diagram

```text
                    ADMIN
                      │
                      ▼
             Create Competition
                      │
                      ▼
              Create Scenarios
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Score       Attempts    Free/Paid
          │           │           │
          └───────────┼───────────┘
                      ▼
               Upload Documents
                      │
                      ▼
                Configure Flag
                      │
                      ▼
               Publish Scenario
                      │
                      ▼
              Start Competition
                      │
                      ▼
             ┌─────────────────┐
             │    STUDENTS     │
             └────────┬────────┘
                      │
                      ▼
                 Login
                      │
                      ▼
              Student Dashboard
                      │
                      ▼
              Select Scenario
                      │
                      ▼
             Download Instructions
                      │
                      ▼
              Open CTF Target
                      │
                      ▼
                Find Flag
                      │
                      ▼
               Submit Flag
                      │
                      ▼
               Django Backend
                      │
              ┌───────┴────────┐
              │                │
           Correct          Incorrect
              │                │
              ▼                ▼
         Award Score       Add Attempt
              │                │
              ▼                ▼
       Mark Scenario       Check Limit
          Solved               │
              │          ┌─────┴─────┐
              │          │           │
              │       Attempts    No Attempts
              │        Left          Left
              │          │             │
              │          ▼             ▼
              │       Continue       Block
              │
              ▼
        Update Leaderboard
              │
              ▼
       WebSocket Broadcast
              │
              ▼
        Live Student Updates
              │
              ▼
        Competition Continues
              │
              ▼
          Timer Ends
              │
              ▼
        Freeze Leaderboard
              │
              ▼
        Calculate Rankings
              │
              ▼
         Final Results
              │
              ▼
       1st / 2nd / 3rd Place
```

---

## 23. Three Project Memory Files & AI Handover Protocol

The platform enforces persistent project memory across all development sessions:

```text
PROJECT_MASTER_PLAN.md  ──► Architecture, Schemas, Workflows & ADR History
PROJECT_PROGRESS.md     ──► Live Milestone Checklist & Verified Completion %
ERROR_FIX_LOG.md        ──► Troubleshooting Registry & Incident Fix Archives
```

### 23.1 Handover Execution Protocol for New Agent Sessions
```text
1. Read `PROJECT_MASTER_PLAN.md` to absorb complete system specs and architecture.
2. Read `PROJECT_PROGRESS.md` to identify exact current phase and active task.
3. Read `ERROR_FIX_LOG.md` to review resolved bugs and active platform quirks.
4. Inspect existing codebase to ensure zero duplication of existing models/components.
5. Execute only the assigned task, verify with automated tests, and update memory files.
```

---

## 24. Development Phases, Execution Roadmap & Quality Standard

```text
Phase 1: Architecture, Database Design & Project Memory Initialization (Active)
Phase 2: Foundation — Django Backend, DRF, JWT Auth & Supabase PostgreSQL Setup
Phase 3: Frontend Foundation — React + TS + Tailwind + Light SaaS Design System
Phase 4: CTF Scenario Core — Models, Supabase Storage Files & Scenario UI
Phase 5: Flag Validation Engine — Attempt Metering, Anti-Cheat & Scoring
Phase 6: Competition Engine — Server Timers & Real-Time WebSocket Leaderboard
Phase 7: Dashboards & Analytics — Student/Admin Portals, Recharts & Audit Logs
Phase 8: Hardening & Testing — Unit, Integration, E2E Tests & Client Demo Prep
```

---

## 25. Architecture Decision Records (ADR Log)

| ADR ID | Decision Date | Topic | Decision & Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | August 2026 | Database Selection | **Supabase PostgreSQL** chosen for zero-cost managed relational SQL & built-in Storage. | **APPROVED** |
| **ADR-002** | August 2026 | UI Theme | **Light / White Enterprise SaaS Theme** strictly chosen over dark hacker aesthetics. | **APPROVED** |
| **ADR-003** | August 2026 | Real-Time Engine | **Django Channels + WebSockets** chosen for low-latency live scoreboards and timer sync. | **APPROVED** |
| **ADR-004** | August 2026 | Flag Security | **Server-Authoritative Validation** with rate limiting and database unique solve constraints. | **APPROVED** |
| **ADR-005** | August 2026 | Target Isolation | **Detached Lab Perimeter** — CTF targets have zero connectivity or credentials to the core platform DB. | **APPROVED** |
