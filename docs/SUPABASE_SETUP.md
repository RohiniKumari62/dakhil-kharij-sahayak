# Supabase setup for beginners

1. Go to supabase.com, click Start your project, sign in with GitHub.
2. Click New project. Name: dakhil-kharij. Set a strong database password and SAVE it.
   Region: closest to India (for example Mumbai if shown). Plan: Free. Click Create.
   Wait 2 to 3 minutes.
3. Copy your keys: Project Settings -> API (or API Keys).
   - Project URL
   - anon / publishable key
   - service_role / secret key  (powerful: never in browser code, never on GitHub)
4. Create tables: SQL Editor -> New query -> paste supabase/migrations/0001_schema.sql
   -> Run. Success message expected.
5. New query again -> paste 0002_transition.sql -> Run.
6. Table Editor: check profiles, applications, step_records, audit_events, ai_suggestions.
7. Authentication -> Providers: Email must be enabled. For this demo turn OFF
   forced email confirmation.
8. Put keys in .env.local (copy .env.example):
   NEXT_PUBLIC_SUPABASE_URL=<Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
9. Run: npm run seed   (creates 3 demo users and 15 fake cases)
10. Before submitting: open the dashboard and make sure the project is active
    (free projects can pause after a period of no use).

Demo logins (password Demo@12345): karamchari@demo.test, ro@demo.test, co@demo.test
