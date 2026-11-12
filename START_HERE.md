# Dakhil-Kharij Sahayak - Starter Kit

What is inside:
- AGENTS.md                      rules for the AI coding agent (copy to repo root)
- .env.example, .gitignore       settings template and ignore list
- README.md                      README template to fill in at the end
- supabase/migrations/           0001_schema.sql and 0002_transition.sql
- docs/SUPABASE_SETUP.md         Supabase steps for beginners
- docs/BUILD_PROMPTS.md          Phase 0 to 10 prompts for Antigravity
- docs/AI_PROMPTS.md             exact AI prompts and answer shapes
- docs/DECISIONS.md              technical decisions table (for README)

IMPORTANT ORDER (so create-next-app does not complain about existing files):
1. Create an EMPTY project folder, open it in Antigravity.
2. Run Phase 0 from docs/BUILD_PROMPTS.md first (creates the Next.js app).
3. THEN copy everything from this kit into that folder (merge, keep AGENTS.md,
   .env.example, supabase/, docs/; for README.md keep the template until the end).
4. Follow docs/SUPABASE_SETUP.md, then Phase 1 onward.

The full beginner guide (problem analysis, folder tree, testing, deploy, impact
measurement, submission email, troubleshooting) is in the Claude document
"Dakhil-Kharij Sahayak: Complete Beginner Guide". Download it from there as Word or PDF.
