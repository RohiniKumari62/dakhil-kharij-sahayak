# Dakhil-Kharij Sahayak (दाखिल-खारिज सहायक)

A Hindi-first workflow system for Bihar Anchal Office staff to process land mutation (दाखिल-खारिज) applications with speed, transparency, and a tamper-proof audit trail. AI suggests drafts and extracts facts. The human revenue officer decides.

## Live Demo & Video
- **Web Application**: [Vercel link]
- **Video Walkthrough**: [video link]
- **AI Mode**: The live deployment runs in `AI_PROVIDER=mock` mode (fully functional with canned realistic Hindi responses without requiring external AI keys).
- **Demo Accounts** (Password for all: `Demo@12345`):
  - **Halka Karamchari** (हल्का कर्मचारी): `karamchari@demo.test` — Responsible for Step 2 (स्थल जाँच).
  - **Revenue Officer** (राजस्व अधिकारी): `ro@demo.test` — Responsible for Steps 1, 3, and 4 (आवेदन जाँच, नोटिस एवं आपत्ति, सुनवाई एवं अनुशंसा).
  - **Circle Officer** (अंचलाधिकारी): `co@demo.test` — Responsible for Step 5 (अंतिम आदेश: Approve / Reject / Return).
- *Disclaimer: All case data, names, mauzas, plot numbers, and audit logs are 100% synthetic. No real citizen or government data is used or stored. This project is an independent workflow prototype and is not connected to the official Bihar Bhumi portal.*

---

## 1. The Problem and Who It Affects

Land mutation (*Dakhil-Kharij*) is the statutory administrative process of updating the government Jamabandi (land revenue register) when land ownership changes hands through purchase (*Kewala*), inheritance (*Warisana*), or gift (*Dan*).

### Who is Hurt by Delays:
- **Smallholder Farmers & Landowners**: Without updated Jamabandi and revenue receipts (*Lagan Rasid*), farmers cannot access institutional credit through Kisan Credit Cards (KCC), obtain disaster crop compensation, or sell land without legal disputes.
- **Heirs & Buyers**: Legitimate buyers face extortion and title challenges from fraudulent sellers who sell the same plot multiple times before the first buyer's mutation is recorded.
- **Anchal Office Staff**: Halka Karamcharis and Revenue Officers are buried under mountains of paper dockets with no clear view of impending statutory deadlines, leading to arbitrary rejections and systemic backlogs.

### Root Causes of Slow Processing:
1. **Manual Deed Reading**: Staff must manually transcribe and cross-check intricate Urdu and Hindi legal phrases across deeds, petitions, and khatian records.
2. **Discrepancies Discovered Late**: Mismatches between petition land area and deed area are often noticed only at the final order stage, months after application.
3. **Unrecorded Co-Sharer Objections**: Notice issuance (Form-XI and Form-XII) and interested party tracking are ad-hoc, resulting in ex-parte orders that get remanded on appeal.
4. **Lack of SLA Urgency**: No visual indication of cases breaching statutory deadlines (35 working days for uncontested, 75 days for contested cases).
5. **No Tamper-Proof History**: Paper notes can be misplaced or altered, leaving no accountable trace of who held the case file and when.

---

## 2. What the Application Does

Dakhil-Kharij Sahayak replaces paper registers with a clean, mobile-first, Hindi-first workflow application designed specifically for low-bandwidth 360px smartphones and office desktop screens.

- **Role-Based Urgent Queue**: Automatically sorts incoming applications into "मेरी कार्रवाई" (My Action) prioritizing overdue files first, followed by cases due soon, and finally on-track files.
- **Strict Role-Gated 5-Step Process**: Ensures cases advance strictly according to Bihar Land Mutation Rules 2012, preventing unauthorized approvals or skipped steps.
- **Dual Visual Encoding**: Urgency is never displayed by color alone — color badges are always accompanied by clear Hindi text (e.g., `2 दिन बाकी`, `3 दिन देर`).
- **Immutable Timeline**: An append-only audit trail records every forward, return, rejection, and AI suggestion usage with actor name, role, timestamp in Indian Standard Time (IST), and reason notes.

### The 5-Step Statutory Workflow

| # | Step (चरण) | Statutory Owner (दायित्व) | Allowed Actions (अनुमत निर्णय) |
|---|---|---|---|
| 1 | **आवेदन जाँच** (*Scrutiny*) | राजस्व अधिकारी (Revenue Officer) | आगे भेजें (Forward), आवेदक को लौटाएँ (Return to applicant), अस्वीकृत करें (Reject) |
| 2 | **स्थल जाँच** (*Field Enquiry*) | हल्का कर्मचारी (Halka Karamchari) | आगे भेजें (Forward), वापस लौटाएँ (Return) |
| 3 | **नोटिस एवं आपत्ति** (*Notice & Objection*) | राजस्व अधिकारी (Revenue Officer) | आगे भेजें (Forward), वापस लौटाएँ (Return) |
| 4 | **सुनवाई एवं अनुशंसा** (*Hearing & Recommendation*) | राजस्व अधिकारी (Revenue Officer) | आगे भेजें (Forward), वापस लौटाएँ (Return) |
| 5 | **अंतिम आदेश** (*Final Order*) | अंचलाधिकारी (Circle Officer) | स्वीकृत करें (Approve), अस्वीकृत करें (Reject), वापस लौटाएँ (Return) |

---

## 3. Where AI Helps and Why

AI is integrated as an assistive drafting tool, strictly confined to `src/lib/ai/` and constrained by rigid guardrails:
- **AI Suggests, Human Decides**: AI never alters case status or advances workflow steps.
- **Rules and Dates in Code**: SLA deadlines, working day calculations, and state transitions are computed by pure, deterministic TypeScript code (`src/lib/workflow/`), never by language models.
- **Statutory Notice Templates in Code**: Notice wording for Form-XI (आम सूचना) and Form-XII (खास सूचना) is rendered from fixed statutory templates in code; AI is never allowed to fabricate legal notice wording.
- **Untrusted Input Isolation**: All deed text and officer notes are wrapped in `<data>` delimiters with strict system prompt instructions to treat them as untrusted data, preventing prompt injection.
- **Fail-Safe Architecture**: If the AI provider times out (25-second limit) or fails schema validation, the system falls back gracefully with a friendly Hindi message (`AI अभी उपलब्ध नहीं है। आप स्वयं जारी रख सकते हैं।`) without blocking the officer.

### AI Assistance Across Workflow Steps

| Step | AI Task Kind | Purpose & Input Data | Output & Guardrail |
|---|---|---|---|
| **1. आवेदन जाँच** | `SCRUTINY_EXTRACT` | Reads deed text and cross-references against petition values (applicant name, khata, khesra, area). | Extracts structured seller/buyer facts, highlights mismatches in red, and drafts verification summary notes. |
| **2. स्थल जाँच** | `FIELD_REPORT` | Converts Karamchari's informal rough field notes into formal Hindi administrative report. | Drafts report starting with *"स्थल निरीक्षण में पाया गया कि..."*, auto-detects possession status and boundary dispute flags. |
| **3. नोटिस एवं आपत्ति** | `NOTICE_PARTIES` | Identifies legal heirs, co-sharers, and boundary holders named across deeds and field reports. | Lists recommended Form-XII notice recipients with reasons; allows adding each party with one click. |
| **4. सुनवाई एवं अनुशंसा** | `HEARING_SUMMARY` | Analyzes previous step records and objections to produce a neutral case summary. | Drafts concise summary, highlights key legal risks with evidence, and provides two alternative closing recommendations (स्वीकृति / अस्वीकृति). |
| **5. अंतिम आदेश** | `ORDER_DRAFT` | Drafts formal final order (*Aadesh Patra*) based on Circle Officer's chosen intent. | CO selects **स्वीकृति हेतु** or **अस्वीकृति हेतु** *before* generating draft; warns if CO switches decision after drafting. |

### Tracking AI Adoption: `ACCEPTED`, `EDITED`, `DISCARDED`
When an officer saves a step form:
- If the AI draft was copied and saved without changes &rarr; logged as `ACCEPTED`.
- If the AI draft was modified by the officer before saving &rarr; logged as `EDITED`.
- If the officer dismissed the panel &rarr; logged as `DISCARDED`.
- Every accepted or edited suggestion logs an immutable `AI_SUGGESTION_USED` entry in `audit_events`.

---

## 4. How Impact Would Be Measured

### Operational Metrics:
1. **Median Days to Mutation Order**: Target reduction from 45–60 days to under 25 working days.
2. **SLA Compliance Rate**: Proportion of uncontested applications resolved within 35 working days (target > 85%).
3. **Return Rate (त्रुटि सुधार वापसी)**: Reduction in applications bounced between RO and Karamchari due to missing field report details.
4. **Draft Adoption Rate**: % of field reports and final orders utilizing AI assistance with `ACCEPTED` or `EDITED` outcomes.

### Pilot Plan:
- **Scope**: 2 Circle Offices in Bihar (e.g., Patna Sadar and Danapur) covering approximately 500 applications over 8 weeks.
- **Baseline Comparison**: Compare disposal turnaround, remand rates on appeal, and backlogs against the preceding 6 months of historical paper data.

### Honest Limits & Stop Signals:
- **Connectivity**: Application requires internet connectivity to communicate with Supabase; in remote panchayats with intermittent 2G/3G, offline caching is required for field visits.
- **Kaithi Script**: Early deeds in Bihar written in handwritten Kaithi or Persianate Urdu require human archivist transcription; current OCR/AI models cannot reliably transcribe handwritten Kaithi script.
- **Stop Signal**: If officer override rate on AI mismatch detection exceeds 30%, or if erroneous mismatch flags cause citizen complaints, AI suggestions must be disabled immediately while maintaining manual workflow processing.

---

## 5. Main Technical Decisions

*(Derived from `docs/DECISIONS.md`)*

1. **Next.js App Router with TypeScript Strict Mode**: Ensures end-to-end type safety, zero `any`, and clean separation between server actions and client UI components.
2. **Supabase Postgres with Row Level Security (RLS)**: Enforces server-only write access; browser clients can only read authenticated records.
3. **Pure State Machine (`stateMachine.ts`)**: All workflow rules, transition guards, and permission checks live in one pure TypeScript module covered by 30+ Vitest tests.
4. **Atomic Database RPC Transition (`apply_transition`)**: Row-level locking (`FOR UPDATE`) in PostgreSQL guarantees that application step advancement and audit event logging succeed or fail together, preventing race conditions.
5. **Append-Only Audit Log**: A PostgreSQL trigger (`audit_no_update_delete`) strictly blocks `UPDATE` and `DELETE` on `audit_events`, ensuring tamper-proof administrative accountability.
6. **Provider-Agnostic AI Architecture**: AI sits behind the `AiProvider` interface with full support for Google Gemini REST, Anthropic Claude REST, and a local synthetic Mock Provider.
7. **Strict Zod Output Validation**: Every AI response is validated against strict Zod schemas with automatic retry on malformed JSON before presenting to the user.
8. **Single-Source Hindi Localization (`src/lib/i18n/hi.ts`)**: Zero hardcoded Devanagari in component files; all strings are centralized for clarity and auditability.
9. **Mobile-First Responsive Layout (360px Viewport)**: Touch targets exceed 44px with high-contrast text and visible focus rings.

---

## 6. Project Structure

```
dakhil-kharij-starter-kit/
├── docs/
│   ├── AI_PROMPTS.md              # Prompts and response shapes
│   ├── BUILD_PROMPTS.md           # Implementation phase specifications
│   ├── DECISIONS.md               # Technical architectural decisions
│   └── SUPABASE_SETUP.md          # Database migration instructions
├── scripts/
│   ├── check-setup.ts             # Pre-flight database, RLS, and RPC test script
│   ├── check-i18n.ts              # Automated linter verifying zero hardcoded Hindi
│   └── seed.ts                    # Idempotent database seeder (3 users, 15 applications)
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── applications/[id]/ # Case detail view, server actions, AI actions
│   │   │   ├── dashboard/         # Urgency-sorted queue, filters, metric summary
│   │   │   └── layout.tsx         # Authenticated header with Hindi role and logout
│   │   ├── login/                 # Fast demo role login and password authentication
│   │   ├── error.tsx              # Hindi error boundary
│   │   ├── not-found.tsx          # Hindi 404 page
│   │   ├── globals.css            # Tailwind styling and font declarations
│   │   └── layout.tsx             # Root layout with Noto Sans Devanagari font
│   ├── components/
│   │   ├── steps/                 # 5 step forms (Scrutiny, Field, Notice, Hearing, Order)
│   │   ├── AiSuggestionPanel.tsx  # Interactive AI drafting & feedback panel
│   │   ├── ApplicationCard.tsx    # Urgency-badged application card
│   │   ├── DecisionBar.tsx        # Forward, Return, Reject, Approve with modals
│   │   ├── StepProgress.tsx       # 5-step progress bar
│   │   └── Timeline.tsx           # IST-formatted event history
│   ├── lib/
│   │   ├── ai/                    # Providers (Gemini, Claude, Mock), prompts, schemas, service
│   │   ├── i18n/hi.ts             # Central Hindi dictionary for all UI text
│   │   ├── repo/                  # Database repository readers (applications, audit)
│   │   ├── supabase/              # Server, client, and admin (server-only) Supabase clients
│   │   └── workflow/              # State machine, step validation, SLA computations
│   └── middleware.ts              # Route protection and session authentication
├── supabase/
│   └── migrations/
│       ├── 0001_schema.sql        # Database tables, enums, RLS policies, audit trigger
│       ├── 0002_transition.sql    # Atomic apply_transition RPC function
│       └── 0003_demo_reset.sql     # Idempotent demo data reset function
└── vitest.config.mts              # Test configuration with server-only test stub
```

---

## 7. How to Run Locally

### Prerequisites
- Node.js 20 or newer (tested on Node v24.15.0)
- npm 10 or newer

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/RohiniKumari62/dakhil-kharij-sahayak.git
   cd dakhil-kharij-sahayak
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   AI_PROVIDER=mock
   AI_API_KEY=
   AI_MODEL=
   ```
4. Run migrations in your Supabase SQL Editor:
   - Run `supabase/migrations/0001_schema.sql`
   - Run `supabase/migrations/0002_transition.sql`
   - Run `supabase/migrations/0003_demo_reset.sql`
5. Seed the database:
   ```bash
   npm run seed
   ```
6. Run the automated pre-flight setup check:
   ```bash
   npm run check-setup
   ```
   *(All checks `a` through `g` should PASS with 3 profiles and 15 applications).*
7. Run the test suite:
   ```bash
   npm test
   ```
8. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and click any demo account button to log in.

---

## 8. What is Not Included (On Purpose)

To keep this prototype clean, focused, and secure, the following are deliberately omitted:
1. **Direct Integration with Bihar Bhumi**: The production government portal has no public REST API.
2. **Citizen Self-Service Filing Portal**: This application focuses strictly on the Anchal internal processing bottleneck.
3. **Offline Progressive Web App (PWA) Sync**: Field workers in zero-reception areas would need background SQLite sync; currently requires live internet.
4. **Automated SMS Gateway**: Citizen SMS alerts on status changes require telecom DLT registration in India.
5. **Handwritten Kaithi OCR**: Automatic scanning of colonial or early post-independence Kaithi deeds is beyond current OCR models; deeds must be entered as text.
6. **Gazetted Holiday Calendar API**: SLA calculator currently computes standard 5-day working weeks (skipping Saturdays and Sundays); district-specific festival holidays are not dynamic.
7. **Multi-Anchal Tenancy**: The current database model supports a single demonstration circle (*डेमो अंचल*).

---

## 9. Sources

- **Bihar Land Mutation Rules 2012**: [LBSNAA Document Repository](https://www.lbsnaa.gov.in/storage/uploads/pdf_data/1742472236_Bihar_Land_Mutation_Rules_2012.PDF)
- **Bihar Land Mutation Act 2011**: [Indian Kanoon - Act No. 23 of 2011](https://future.indiankanoon.org/doc/168056979/)
- **Bihar Dakhil-Kharij Process Guide**: [1acre Land Guides](https://1acre.in/guides/bihar/dakhil-kharij-mutation-bihar)
