# Build prompts for Antigravity (Phase 0 to 10)

Habit for every phase: paste the prompt -> read the changes -> run the check -> commit and push.
Commit BEFORE each prompt so you can undo with: git checkout -- path/to/file

Workflow summary
- 5 steps: SCRUTINY (revenue officer), FIELD_ENQUIRY (halka karamchari), NOTICE_OBJECTION
  (revenue officer), HEARING_RECOMMENDATION (revenue officer), FINAL_ORDER (circle officer)
- Decisions: FORWARD, RETURN (note 10+ chars), REJECT (only step 1 and 5, note 10+ chars),
  APPROVE (only step 5)

------------------------------------------------------------
## Phase 0. Create the app
------------------------------------------------------------
Create a new Next.js app in the current folder: App Router, TypeScript, Tailwind CSS,
src directory, ESLint. Do not create a nested folder.
Add dependencies: @supabase/supabase-js, @supabase/ssr, zod, server-only.
Add dev dependencies: vitest, tsx.
Add npm scripts: test = vitest run, seed = tsx scripts/seed.ts.
Load the Noto Sans Devanagari font with next/font (latin and devanagari subsets) and
set it as the main font. Set the html lang attribute to hi.
Create .env.example with these empty settings:
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
AI_PROVIDER, AI_API_KEY, AI_MODEL, SLA_DAYS.
Make sure .env.local is in .gitignore. Do not build any feature yet.

Check: npm run dev -> http://localhost:3000 shows the starter page.
Commit: chore: scaffold Next.js app with Hindi font and tooling

------------------------------------------------------------
## Phase 1. Database (no prompt, you do it)
------------------------------------------------------------
Run supabase/migrations/0001_schema.sql then 0002_transition.sql in the Supabase SQL Editor.
Commit: feat(db): schema, audit trigger, transition function

------------------------------------------------------------
## Phase 2. Workflow rules
------------------------------------------------------------
Create src/lib/workflow/types.ts with TypeScript types that match the database enums:
Role (halka_karamchari, revenue_officer, circle_officer), Step (SCRUTINY, FIELD_ENQUIRY,
NOTICE_OBJECTION, HEARING_RECOMMENDATION, FINAL_ORDER), Status (IN_PROGRESS, APPROVED,
REJECTED, RETURNED_TO_APPLICANT), Decision (FORWARD, RETURN, APPROVE, REJECT).
Export STEP_ORDER (array in order) and STEP_OWNER:
SCRUTINY -> revenue_officer, FIELD_ENQUIRY -> halka_karamchari,
NOTICE_OBJECTION -> revenue_officer, HEARING_RECOMMENDATION -> revenue_officer,
FINAL_ORDER -> circle_officer.
Also export the step data types:
ScrutinyData { documentsComplete: boolean; mismatchNotes: string; officerRemarks: string }
FieldEnquiryData { visitDate: string; possessionStatus: 'BUYER'|'SELLER'|'THIRD_PARTY'|'VACANT';
  coSharersPresent: boolean; boundaryDispute: boolean; roughNotes: string; reportText: string }
NoticeData { generalNoticeIssuedOn: string|null;
  specificNoticeParties: { name: string; relation: string }[]; objectionDeadline: string|null;
  objections: { by: string; text: string; receivedOn: string }[] }
HearingData { hearingDate: string|null; summaryText: string; recommendationText: string }
FinalOrderData { orderText: string }

Create src/lib/workflow/stateMachine.ts. Pure functions only: no database, no React,
no framework imports. Export:
- availableDecisions(app: {step, status}, role): Decision[]
- decide(app, role, decision, note?) returning either
  { ok: true, event, from, to, newStatus } or { ok: false, reason }
  where reason is one of NOT_OWNER, CASE_CLOSED, DECISION_NOT_ALLOWED, NOTE_REQUIRED.
Rules:
1. Only STEP_OWNER[step] can act. Others get NOT_OWNER.
2. Closed cases (status not IN_PROGRESS) accept nothing: CASE_CLOSED.
3. FORWARD moves to the next step. Allowed at steps 1 to 4 only.
4. RETURN at steps 2 to 5 moves to the previous step. At SCRUTINY it sets status
   RETURNED_TO_APPLICANT. RETURN always needs a note of at least 10 characters.
5. REJECT is allowed only at SCRUTINY and FINAL_ORDER and needs a note (10+ characters).
6. APPROVE is allowed only at FINAL_ORDER by circle_officer.
Never return Hindi text from this file. Return reason codes. The UI will translate them.

Create src/lib/workflow/stateMachine.test.ts with Vitest. Test every legal move and
every illegal move: wrong role, closed case, approve before final step, return without
a note, note shorter than 10 characters, return at SCRUTINY.

Create src/lib/workflow/validateStep.ts: validateStepComplete(step, data) returns a list
of missing field codes. FIELD_ENQUIRY needs visitDate, possessionStatus and reportText.
HEARING_RECOMMENDATION needs recommendationText. FINAL_ORDER needs orderText.
NOTICE_OBJECTION needs generalNoticeIssuedOn and objectionDeadline. SCRUTINY needs
documentsComplete to be set. Add tests.

Create src/lib/workflow/sla.ts:
- addWorkingDays(date, n): skips Saturday and Sunday, ignores public holidays
- dueDate(receivedOn, slaDays)
- urgency(dueOn, today): returns { level: OVERDUE | DUE_SOON | ON_TRACK, daysLeft }
  DUE_SOON means 5 or fewer working days left
- registrationDelayDays(deedDate, receivedOn) and isBeyondLimit(days) where the limit is 90
Add tests, including a weekend case and a leap-year case.

Check: npm test passes.
Commit: feat(workflow): state machine, step validation and SLA with tests

------------------------------------------------------------
## Phase 3. Supabase helpers and fake data
------------------------------------------------------------
Create three Supabase helpers:
- src/lib/supabase/server.ts: server client for the logged-in user, using @supabase/ssr and cookies
- src/lib/supabase/client.ts: a browser client
- src/lib/supabase/admin.ts: a service-role client. Start the file with import 'server-only'
  so it can never be bundled into browser code.

Create scripts/seed.ts, run with npm run seed. It must be safe to run many times:
1. Using the admin client, create 3 confirmed auth users and their profiles rows:
   karamchari@demo.test (halka_karamchari, name: राजेश कुमार),
   ro@demo.test (revenue_officer, name: सुनीता देवी),
   co@demo.test (circle_officer, name: अनिल प्रसाद). Password for all: Demo@12345.
   If a user already exists, reuse it.
2. Run: truncate applications cascade (wipes old demo data).
3. Insert 15 fake applications with Hindi names and fictional mauza names.
   Spread them: 4 at SCRUTINY, 3 at FIELD_ENQUIRY, 3 at NOTICE_OBJECTION, 2 at
   HEARING_RECOMMENDATION, 2 at FINAL_ORDER, plus 1 APPROVED and 1 REJECTED.
   Make received_on dates so that some are OVERDUE, some DUE_SOON and some ON_TRACK
   (use dueDate from sla.ts with SLA_DAYS from the environment).
   Include these tricky cases on purpose:
   a) deed date more than 90 days before received_on
   b) area in deed_text differs from area_decimal
   c) deed_text mentions two co-sharers
   d) inheritance case where deed_text mentions heirs, one of them abroad
   e) field notes mention a boundary dispute
   Write a realistic Hindi deed_text of 5 to 8 lines for each (seller, buyer, khata,
   khesra, area, deed number, date, a boundary description).
4. For applications past SCRUTINY, insert consistent step_records and audit_events
   (CREATED, then FORWARDED for each completed step, with believable timestamps and a
   few Hindi notes). Include one case that was RETURNED once and then forwarded again.
No real names, numbers or addresses. Print a summary of what was created.

Check: npm run seed -> 3 profiles and 15 applications in Table Editor.
Commit: feat: supabase clients and seed script with synthetic cases

------------------------------------------------------------
## Phase 4. Login, layout and Hindi text file
------------------------------------------------------------
Create src/lib/i18n/hi.ts: one exported object with all Hindi UI text, grouped as:
common, roles, steps, statuses, decisions, errors (one entry for every reason code from
the state machine plus AI_UNAVAILABLE and CASE_CHANGED), dashboard, caseDetail, ai.
Use simple, respectful Hindi that a field worker uses daily. Avoid heavy Sanskritised
or English-mixed words where a common word exists.

Build /login in Hindi: email and password, one big button, clear Hindi error message.
Use a server action with Supabase auth. Below the form show a box titled डेमो लॉगिन
with the 3 test accounts. Each is a button that fills the email and password fields.
Add src/middleware.ts: if not logged in, redirect to /login. If logged in and on /login,
redirect to /dashboard.
Build the (app) layout: top bar with app name, the user's name, role in Hindi, and a
logout button. The / page redirects to /dashboard.
Mobile first. Large touch targets. Visible focus outlines.

Check: log in with each demo account, log out, open /dashboard while logged out.
Commit: feat(auth): Hindi login, middleware, layout and i18n file

------------------------------------------------------------
## Phase 5. Dashboard
------------------------------------------------------------
Build /dashboard as a server component.
Top: 4 summary tiles with counts: कुल लंबित, मेरी कार्रवाई, समय सीमा पार, जल्द समय सीमा.
Then 3 sections:
1. मेरी कार्रवाई के लिए: applications where STEP_OWNER[current_step] equals my role,
   sorted by urgency (overdue first) and then by due date.
2. अन्य लंबित: all other in-progress applications, same sorting.
3. निपटाए गए: approved, rejected, returned (collapsed by default).
Add a filter by step.
Build ApplicationCard: case number, applicant name, mauza, khata and khesra, a chip with
the current step name in Hindi, and a deadline badge that shows both a colour and text
(for example: 3 दिन बाकी, 2 दिन देर). Tapping the card opens the case page.
Put database reads in src/lib/repo/applications.ts. Compute urgency with sla.ts.
Add Hindi empty states and a loading skeleton. One column on mobile, grid on desktop.

Check: Karamchari sees only step 2 cases in the top section; overdue first.
Commit: feat(dashboard): urgency-sorted queue with role-based my-work section

------------------------------------------------------------
## Phase 6. Case page, step forms, history
------------------------------------------------------------
Build /applications/[id]. Show:
1. A summary header: case number, applicant, mauza, khata, khesra, area, deed number and
   date, received date, due date and deadline badge.
2. StepProgress: the 5 steps, current highlighted, done ones ticked. Compact on mobile.
3. The form for the current step. Editable only if the logged-in role owns the step and
   the case is IN_PROGRESS. Otherwise read-only with a Hindi message saying who must act
   (for example: यह चरण राजस्व अधिकारी के पास है).
4. Earlier steps as read-only accordions showing what was recorded.
5. Timeline from audit_events, newest first: who (name and role in Hindi), what happened,
   from step to step, the note, and the time in Indian Standard Time.
Build one component per step in src/components/steps/ using the data types from types.ts.
Add server action saveStepData(applicationId, step, data) in actions.ts: validate with
zod, check STEP_OWNER with the logged-in user's role, upsert into step_records. Reject if
the case is not IN_PROGRESS or the step is not current.
The notice step should render the Form-XI and Form-XII notice text from a fixed Hindi
template in code, filled with case data. Do not generate notice wording with AI.

Check: open a case as owner and as someone else; save data; reload.
Commit: feat(case): detail page, step forms, timeline

------------------------------------------------------------
## Phase 7. Approve, reject, return
------------------------------------------------------------
Add server action submitDecision(applicationId, decision, note) in actions.ts:
1. Get the logged-in user and the profile role.
2. Load the application and its current step data.
3. Call decide() from the state machine. If not ok, return the reason code.
4. For FORWARD, call validateStepComplete. If fields are missing, return the list.
5. If ok, call the database function apply_transition with the admin client (rpc),
   passing the values from decide(). If the database says the application changed,
   return CASE_CHANGED.
6. Revalidate the dashboard and case pages.
Build DecisionBar: show only buttons returned by availableDecisions for this user.
FORWARD: normal button. RETURN, REJECT and APPROVE: open a confirmation dialog with a
note box. The note is required for RETURN and REJECT. The dialog states clearly what
will happen in Hindi (for example: यह आवेदन अंतिम रूप से स्वीकृत होगा).
After success show a short Hindi message and go back to the dashboard. Show Hindi error
messages from hi.ts for every reason code.

Check: full journey with the 3 logins; return one case, reject one, approve one; check the
timeline; try approving as the wrong role (must fail).
Commit: feat(decisions): forward, return, reject, approve with confirmation and audit

------------------------------------------------------------
## Phase 8. AI backend  (paste this, then paste docs/AI_PROMPTS.md below it)
------------------------------------------------------------
Build the AI layer in src/lib/ai:
- provider.ts: interface AiProvider { name: string; generateJson(args: { system: string;
  user: string; timeoutMs: number }): Promise<{ text: string; model: string; latencyMs: number }> }
- mockProvider.ts: realistic canned Hindi answers for each task kind. Where easy, build
  the answer from the real application data so the demo feels real. Must work with no API key.
- geminiProvider.ts and claudeProvider.ts: call the provider REST API with fetch (no SDK).
  Read AI_API_KEY and AI_MODEL from the environment. Do not hard-code model names.
- prompts.ts: the system prompts and a function that builds the user message for each task
  kind, using the exact texts pasted below.
- schemas.ts: zod schemas for every answer shape pasted below.
- service.ts: runAiTask(kind, application, stepData, userId):
  1. pick the provider from AI_PROVIDER (mock, gemini or claude)
  2. wrap deed text and notes inside clear delimiters, and tell the model they are data
  3. call with a 25 second timeout
  4. strip code fences, parse JSON, validate with zod
  5. if invalid, retry once with a reminder to return valid JSON only
  6. if it still fails, return { ok: false, code: 'AI_UNAVAILABLE' }
  7. on success, insert a row into ai_suggestions (outcome PENDING, with provider, model,
     latency) and return { ok: true, suggestionId, output }
Add Vitest tests that run every task kind through the mock provider and check the output
passes its schema. AI code must never touch application status or current step.

Commit: feat(ai): provider interface, mock, prompts, schemas, validated service

------------------------------------------------------------
## Phase 9. AI in the screens
------------------------------------------------------------
Add ai-actions.ts with server actions: requestSuggestion(applicationId, step, kind),
resolveSuggestion(suggestionId, action) where action is DISCARD.
Build AiSuggestionPanel and use it in each step form:
- A button AI से सुझाव लें, with a loading message in Hindi while waiting.
- Show the answer as readable labelled fields, never raw JSON.
- Always show above the answer: AI का सुझाव, केवल मसौदा। अंतिम निर्णय आपका है।
- Buttons: उपयोग करें (copies the text into the form field), हटाएँ (discard).
- When the step is saved, the server compares the saved text with the AI text and sets the
  suggestion outcome to ACCEPTED (same) or EDITED (changed), and stores final_text.
  Write an AI_SUGGESTION_USED event in audit_events when this happens.
- If the AI fails, show: AI अभी उपलब्ध नहीं है। आप स्वयं जारी रख सकते हैं।
Step rules:
- SCRUTINY (SCRUTINY_EXTRACT): extracted fields next to petition values, mismatches
  highlighted. The 90-day check comes from sla.ts (code, not AI).
- FIELD_ENQUIRY (FIELD_REPORT): worker types rough notes, AI creates the report text.
- NOTICE_OBJECTION (NOTICE_PARTIES): AI lists who needs a specific notice with a reason;
  the worker adds each to specificNoticeParties with one tap.
- HEARING_RECOMMENDATION (HEARING_SUMMARY): summary, risks and a draft recommendation.
- FINAL_ORDER (ORDER_DRAFT): the officer first chooses the intended decision (स्वीकृत or
  अस्वीकृत) with radio buttons. Only then can they ask AI for the order draft. If the final
  button they press does not match the choice, show a warning.

Check: with AI_PROVIDER=mock, use AI at every step; accept one, edit one, discard one.
SQL: select step, outcome, count(*) from ai_suggestions group by step, outcome order by step;
Commit: feat(ai): suggestion panels with accept, edit, discard tracking

------------------------------------------------------------
## Phase 10. Polish
------------------------------------------------------------
Review every screen and fix problems against this checklist:
1. All visible text comes from hi.ts. No English left except the app name and field codes.
2. Works at 360px width. No sideways scrolling. Buttons at least 44px tall.
3. Every input has a visible label. Focus outlines visible. Contrast readable.
4. Dates shown as DD/MM/YYYY in Indian time.
5. Every page has loading, empty and error states in Hindi.
6. Add a Hindi 404 page and a Hindi error page.
7. No console errors. npm run lint and npm run build pass with no warnings.
8. Remove unused code and files.
List what you changed.

Commit: chore: Hindi copy review, mobile and accessibility polish
