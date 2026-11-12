# Technical decisions

| Decision | Reason |
|---|---|
| Next.js with strict TypeScript | One codebase for screens and server code. Types catch mistakes early. Easy deploy. |
| Supabase Postgres | Real relational database with login included. Case data needs strict states. |
| Workflow rules as pure code with tests | One place for all rules. Easy to review. Proven by tests. |
| Database function for every state change | Case update and history entry succeed or fail together. Row lock stops double actions. |
| Append-only audit table with trigger | History cannot be edited or deleted. |
| Writes only on server, browser read-only (RLS) | The browser can never change data directly. |
| AI behind a provider interface, with a mock | No vendor lock-in. App and tests work without an AI key. |
| AI answers checked with zod, documents treated as untrusted | Protects against malformed answers and hidden instructions in text. |
| Dates and legal rules by code, not AI | AI is unreliable at exact arithmetic and legal wording. |
| Notices from a fixed template | Legal wording must not be invented. |
| All Hindi text in one file | Easy to improve language in one place; another language can be added later. |
| Deadline is a setting (SLA_DAYS) | Public sources disagree on the number of days. |
| Synthetic data only | Protects privacy. Safe to share publicly. |
