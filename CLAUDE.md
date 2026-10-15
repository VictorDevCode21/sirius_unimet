# Sirius UNIMET — Inscripciones

Course-enrollment system for Universidad Metropolitana (FPTSP07 Ingeniería de Software). Pilot scope: Facultad de Ingeniería.

## Language rules

- All code, identifiers, file names and code comments are written in **English**.
- Only text rendered in the UI (labels, messages, toasts, validation errors shown to users) is written in **Spanish**.
- Comments describe what a piece of code does. Never write comments that narrate changes, history or updates ("added", "now", "fixed", "refactored", "new").

## Architecture

Layered (n-tier) modular monolith on Next.js App Router, following the team's architecture workshop (Taller 1). MVC mapping: views are React components, controllers are Server Actions / server functions, the model is the domain services plus Prisma.

Dependencies only point downward: `app` → `presentation` / `control` → `domain` → `data-access` → PostgreSQL.

| Layer | Folder | Responsibility |
| --- | --- | --- |
| Presentation | `app/`, `presentation/` | Routes per portal and React components (Server and Client). No business rules. |
| Control | `middleware.ts`, `control/` | Authentication + RBAC, controllers that verify role and inputs and orchestrate each use case, Zod schemas. |
| Domain | `domain/` | Business rules in plain TypeScript. Never imports Next.js or Prisma Client directly. |
| Data access | `data-access/` | Prisma Client, repositories, transactions. |
| Data | `prisma/` | Schema (12 tables), migrations, seed, curriculum CSVs. |

```
app/                          Routes. One folder per portal: estudiante/ (profesor/, jefe/, admin/ later)
presentation/
  components/{ui,brand,shared,auth,layout}
  portals/student/            Student portal components (flowchart, pre-enrollment)
  lib/                        UI helpers (cn, formatters)
control/
  auth/                       Auth.js config (edge-safe), Auth.js instance, RBAC (authorization.ts), session guard
  controllers/                *.controller.ts — one per controller of the class diagram
  validation/                 Zod schemas shared by client and server
domain/
  prerequisites/              Prerequisite engine (statuses, cycle detection) and prerequisite service
  enrollment/                 Enrollment validator (open term, capacity, clashes, max credits, one section per subject)
  billing/                    Amount calculator (credits × rate per credit)
  pensum/                     CSV importer (validates and imports a curriculum in one transaction)
  grades/                     Academic progress and grade rules
  shared/                     DomainError
data-access/
  prisma.ts                   Prisma Client singleton (driver adapter @prisma/adapter-pg)
  repositories/               *.repository.ts
  generated/prisma/           Generated client (git-ignored)
prisma/                       schema.prisma, migrations/, seed.ts, data/*.csv
middleware.ts                 Session + role check before every route; 403 rewrite to /acceso-denegado
```

Controllers map to the workshop class diagram: `authentication.controller.ts` (ControladorAutenticacion), `flowchart.controller.ts` (ControladorFlujograma), `enrollment.controller.ts` (ControladorInscripcion), `academic-record.controller.ts` (student history read model). Pending: Usuarios, Academico, Pensum, Oferta, Pago, Notas.

### Rules to keep

- Every controller re-checks the role on the server (`requireRole` / `getStudentContext`); hiding a button is never enough.
- Mutations are Server Actions (`'use server'`) that validate input with Zod and return `{ ok, message }`; domain rule violations throw `DomainError`, whose message is shown in the UI.
- Read controllers used by pages are `server-only` modules, not Server Actions.
- `control/auth/auth.config.ts` and `control/auth/authorization.ts` must stay edge-safe (no Prisma, no Node APIs) because the middleware imports them.
- Seat assignment runs inside a transaction with `SELECT … FOR UPDATE` on the section (RNF-03).
- Curriculum data enters the database only through `domain/pensum/csv-importer.ts`.

## Data model

12 persistent classes (Spanish name in the schema comments): User, Department, Career, Subject, Prerequisite, Term, Section, ScheduleBlock, Enrollment, EnrollmentDetail, SimulatedPayment, Grade. Roles: `ADMIN`, `DEPARTMENT_HEAD`, `PROFESSOR`, `STUDENT`.

- Subject: code unique per career, one subject per cell (term 1–12, branch 1–5), optional `minCredits`. `alternativeCredits` + `alternativeCreditBlock` model flowchart "ó" rules: N passed credits from subjects whose code starts with the block (e.g. 57 credits of `BP`) satisfy the subject regardless of its other requirements. In the pensum CSV this is the `alternativa` column (e.g. `57BP`).
- Prerequisite: subject → required subject; must come from an earlier term, no self-reference, no cycles.
- A subject is PASSED with a published passing grade (≥ 10 on 0–20), IN_PROGRESS when it is in a CONFIRMED enrollment of the current term without a published grade.
- The current term is the one whose date range contains today; the open term (`open = true`) receives pre-enrollments.
- Enrollment status: `PRE_ENROLLED` (saved selection, unpaid) → `PENDING` (payment attempted/rejected) → `CONFIRMED` (payment approved).

## Stack

Next.js 15.5 (App Router; 15.x because AWS Amplify supports up to 15), React 19, TypeScript, Tailwind CSS 4, Auth.js v5 (credentials, JWT sessions), Prisma 7 with `prisma.config.ts` and the `prisma-client` generator, PostgreSQL (local: `sirius_unimet`; production target: Amazon RDS).

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run db:migrate   # prisma migrate dev
npm run db:seed      # departments, careers, Systems Engineering pensum (CSV), terms, sections, sample student
npm run db:reset     # drop, migrate and seed
npm run db:studio    # Prisma Studio
```

Environment: copy `.env.example` to `.env` and set `DATABASE_URL` and `AUTH_SECRET`.

Sample student: `r.victor@correo.unimet.edu.ve` / `Test123**`.

## UI conventions

- Brand (UNIMET 2025 manual): blue `#003087`, complementary blue `#1859A9`, orange `#F68629`, secondary orange `#FF8200`. Typography: Roboto Flex (body) and Roboto Condensed (uppercase display headlines).
- Generous rounded corners (cards `1.75rem`, pills fully rounded), soft shadows, light and dark themes via CSS variables in `app/globals.css`.
- Custom component classes live in `@layer components` so Tailwind utilities can override them.
- Mobile-first: everything must work from 375 px wide.
