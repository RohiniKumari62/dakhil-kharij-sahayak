# Dakhil-Kharij Sahayak (दाखिल-खारिज सहायक)

A Hindi workflow tool that helps Anchal Office staff in Bihar process land mutation
(Dakhil-Kharij) applications faster and with a clear record. AI suggests. The officer decides.

## Live demo
- App: [Vercel link]
- Logins (all passwords: Demo@12345):
  - Halka Karamchari: karamchari@demo.test
  - Revenue Officer: ro@demo.test
  - Circle Officer: co@demo.test
- AI mode on the live link: [mock or real]
- Video walkthrough: [link, optional]
- All data is synthetic. No real citizen data. Not connected to any government system.

## 1. The problem and who it affects
[Explain land mutation in 3 lines. Who is hurt: buyers, heirs, farmers who cannot get loans
or sell land until the record changes, and the staff handling paper files. What slows cases:
reading deeds by hand, mismatches found late, co-sharer objections, no view of deadlines,
no clear history. List your sources.]

## 2. What the application does
[One paragraph, then the workflow table. Add 2 or 3 screenshots.]

| # | Step | Who | Allowed moves |
|---|---|---|---|
| 1 | आवेदन जाँच | Revenue Officer | Forward, Return to applicant, Reject |
| 2 | स्थल जाँच | Halka Karamchari | Forward, Return |
| 3 | नोटिस एवं आपत्ति | Revenue Officer | Forward, Return |
| 4 | सुनवाई एवं अनुशंसा | Revenue Officer | Forward, Return |
| 5 | अंतिम आदेश | Circle Officer | Approve, Reject, Return |

## 3. Where AI helps and why
[Table of AI task per step. Rules: AI only suggests, human decides, drafts tracked as
accepted/edited/discarded, rules and dates done by code, app works when AI fails. Explain
why notice text and deadlines are NOT done by AI.]

## 4. How impact would be measured
[Metrics: median days to decision, % within deadline, return rate, time per step, AI
acceptance rate per step, worker feedback. Pilot: 1-2 anchals, 6-8 weeks, compare with
earlier months. Why you think it will work. Honest limits and a stop signal.]

## 5. Main technical decisions
[See docs/DECISIONS.md. Keep each reason to one or two sentences.]

## 6. Project structure
[Paste a short folder tree.]

## 7. Run it locally
1. Install Node.js 20 or newer.
2. git clone [repo link] and cd into the folder.
3. npm install
4. Create a free Supabase project. Run supabase/migrations/0001_schema.sql and
   0002_transition.sql in the SQL Editor (see docs/SUPABASE_SETUP.md).
5. Copy .env.example to .env.local and fill in the Supabase URL, anon key and service role
   key. Set AI_PROVIDER=mock to run without an AI key.
6. npm run seed (creates the 3 demo users and 15 fake cases)
7. npm run dev and open http://localhost:3000
8. npm test runs the workflow tests.

## 8. What is not included (on purpose)
[Bihar Bhumi integration, applicant portal and re-submission, offline mode, SMS notices,
deed upload with OCR, public holidays in deadlines, multi-anchal admin. What you would build next.]

## 9. Sources
- Bihar Land Mutation Rules 2012: https://www.lbsnaa.gov.in/storage/uploads/pdf_data/1742472236_Bihar_Land_Mutation_Rules_2012.PDF
- https://future.indiankanoon.org/doc/168056979/
- https://1acre.in/guides/bihar/dakhil-kharij-mutation-bihar
