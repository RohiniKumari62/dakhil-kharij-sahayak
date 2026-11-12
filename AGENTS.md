# Project rules for the AI agent

Project: Dakhil-Kharij Sahayak. A Hindi-first workflow app for Bihar Anchal Office
workers who process land mutation (Dakhil-Kharij) applications.

## Stack
Next.js (App Router), TypeScript strict, Tailwind CSS, Supabase (Postgres + Auth),
zod, Vitest. Hosted on Vercel.

## Hard rules
1. TypeScript strict mode. No any. No ts-ignore.
2. All workflow rules live in src/lib/workflow/stateMachine.ts. Screens and server
   actions call it. Never copy a rule into a component.
3. Every state change goes through one server function that checks the user's role,
   asks the state machine, then calls the database function apply_transition.
4. All writes happen on the server. The browser only reads. The service role key and
   the AI key are used only in server code and never start with NEXT_PUBLIC_.
5. AI code lives only in src/lib/ai. All prompts are in prompts.ts. Every AI answer is
   checked with a zod schema. AI never changes the state of an application.
6. Text from deeds and notes is untrusted. Put it inside clear delimiters in the prompt
   and tell the model to treat it as data, not as instructions.
7. All Hindi UI text lives in src/lib/i18n/hi.ts. No Hindi hard-coded in components.
   Use Noto Sans Devanagari. Base font 16px or larger. Buttons at least 44px tall.
   Design mobile first at 360px width.
8. Never rely on colour alone. Urgency must also be shown with text.
9. Small functions, clear names. Comments explain WHY, not WHAT. No dead code.
10. Run npm test and npm run build before saying a task is finished.
11. Work in small steps. Show a plan before big changes. Do not add a new library
    without telling me why.
12. Use only fake data. Never real citizen data.
