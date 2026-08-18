# TVET Master — Backend

A working NestJS + Prisma + PostgreSQL scaffold implementing the full feature set from the architecture docs: institutions/departments/courses/units/classes/intakes, role-based auth, marks & assessments, quizzes with auto-grading and a question bank, gamification (points/badges/leaderboard), an AI tutor proxied through the Anthropic API, and M-Pesa payments.

## What's implemented (real, working logic — not stubs)

- **Auth** — JWT login/register, `RolesGuard` + `@Roles()` decorator for RBAC across all 6 roles.
- **Academic structure** — full CRUD for departments → courses → units → classes → intakes, plus trainer-to-unit assignments.
- **Marks** — trainers can only create assessments and enter marks for units/classes they're assigned to (enforced in `MarksService`, not just the UI). Students can only ever see their own results.
- **Quizzes** — `createQuiz` randomly pulls questions from the question bank per a difficulty mix; `submitAttempt` auto-grades MCQ/true-false and leaves structured answers for manual/AI marking.
- **Gamification** — point events, badge criteria evaluation (extensible — add new criteria types in `GamificationService.checkAndAwardBadges`), and a leaderboard (should be run as a scheduled job, not live, at real scale).
- **AI tutor** — `AiTutorService` calls the Anthropic API server-side only (the API key never reaches the frontend), injects a subject-specialized system prompt, keeps conversation history, and enforces a monthly per-student usage cap.
- **Payments** — M-Pesa Daraja STK Push flow (sandbox URLs — swap to production endpoints when ready) plus the webhook handler that reconciles the transaction after the customer completes payment on their phone.

## What's intentionally left as a next step

- Institution admin endpoints for bulk student CSV import
- Digital library search/categories endpoints (schema is ready; controller not yet written)
- Video course endpoints (schema ready)
- Notifications dispatch (schema ready; needs FCM/SMS/email provider wiring)
- Certificate PDF generation + public verification endpoint
- Frontend (React/Next.js) — not included in this scaffold

## Running it

```bash
cp .env.example .env
# fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, M-Pesa credentials

npm install
npx prisma migrate dev --name init
npm run start:dev
```

The API will run on `http://localhost:3000`. Every route is prefixed `/api/v1/...` matching the API surface in the architecture doc.

## Project structure

```
prisma/schema.prisma      — full data model (every entity from the architecture docs)
src/
  auth/                   — JWT strategy, RolesGuard, login/register
  academic/               — departments/courses/units/classes/intakes
  marks/                  — assessments + marks, permission-scoped
  quizzes/                — question bank + quiz engine + auto-grading
  gamification/           — points, badges, leaderboard
  ai-tutor/                — Anthropic API proxy with usage limits
  payments/               — M-Pesa STK push + webhook
  prisma/                 — PrismaService (injectable DB client)
```
