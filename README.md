# Royal Journey CRM

Real-estate CRM for **Royal Journey** (Dubai), built from your *CRM Workflow – Real Estate Business in Dubai* document.
Stack: **Next.js 14 (App Router) + Tailwind + Supabase (Postgres + Auth)** → hosted on **Vercel**, code on **GitHub**.

## What's inside (workflow → feature)

| Workflow step | Where in the CRM |
|---|---|
| 1. Lead generation (Property Finder, Bayut, Dubizzle, website, social, referrals) | **Leads → New lead** (source, budget, area, type). Optional website capture: `supabase/optional_public_lead_capture.sql` |
| 2. Qualification (5–10 min contact, buyer/seller/tenant/landlord, Hot/Warm/Cold) | Lead form + **first-response timer** (Call / WhatsApp / Email buttons stamp the first contact) |
| 3. Assignment by area & specialisation, follow-up deadlines | **Auto-assign** (area + type + workload), Team page, follow-up deadline on every lead |
| 4. Property matching, share details/photos/videos | **Properties** inventory + "Matching properties" on each lead → *Share via WhatsApp* |
| 5. Viewings (scheduled / completed / cancelled, reminders, feedback) | **Viewings** page, WhatsApp reminder button, feedback + next action |
| 6. Negotiation (offers / counter-offers) | **Offers** on the lead → accept → starts documentation |
| 7. Deal closing (Form A/B/F, deposit, NOC, mortgage, transfer) | **Deals** page: 8-item checklist, price, commission |
| 8. Post-sale (30/90/180-day follow-ups, reviews, referrals) | Auto-created tasks the moment a deal is *Closed Won* |
| 9. Lost-lead management | Reason + re-engage date + consent flag; **Lost Leads** page, consent-only CSV export |
| 10. Dashboard & KPIs | New leads, first response time, conversion %, viewings, offers, deals closed, commission (AED), agent performance |
| Pipeline (9 stages) | **Pipeline** Kanban (drag & drop) |
| Dubai compliance | Permit-number field + warning on every listing, marketing-consent tracking |

Roles: **Admin** (everything), **Manager** (everything except editing users), **Agent** (only their own leads).

## 1) Try it right now (no setup)
```bash
npm install
npm run dev        # http://localhost:3000
```
With no environment variables the app runs in **Demo mode** (sample data, saved in your browser only).

## 2) Go live: Supabase (database + login) – 5 minutes
1. https://supabase.com → **New project** (choose a region close to you, e.g. Frankfurt / Mumbai).
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**.
3. **Authentication → Users → Add user** → your email + password (tick *Auto confirm*). **The first user becomes Admin.**
4. **Project Settings → API** → copy the **Project URL** and the **anon public key**.
5. Locally: copy `.env.example` to `.env.local` and paste both values. Run `npm run dev` and sign in.
6. Add your agents the same way (step 3); then open **Team** in the CRM to set role, areas and property types.

## 3) Push to GitHub
```bash
git init
git add .
git commit -m "Royal Journey CRM"
git branch -M main
git remote add origin https://github.com/<your-username>/royal-journey-crm.git
git push -u origin main
```

## 4) Deploy on Vercel
1. https://vercel.com → **Add New → Project** → import the GitHub repo (framework auto-detected: Next.js).
2. **Environment Variables** → add
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy.** Every `git push` to `main` redeploys automatically.
4. In Supabase → **Authentication → URL Configuration**, set *Site URL* to your Vercel URL.
5. (Optional) Add your own domain in Vercel → Settings → Domains.

> The anon key is safe to expose; data is protected by the Row Level Security policies in `schema.sql`.
> Never put the `service_role` key in this project.

## Project structure
```
src/app/(app)/…     pages: dashboard, leads, pipeline, properties, viewings, deals, followups, lost, team
src/app/login       sign-in
src/lib/actions.ts  workflow rules (stage changes, auto-assign, matching, post-sale tasks)
src/lib/backend.ts  Supabase ⇄ demo-mode storage switch
src/lib/constants.ts  stages, sources, Form A/B/F checklist, lost reasons – edit to customise
supabase/schema.sql database + security policies
public/logo.png     your logo
```

## Customising
- Pipeline stages, sources, areas, lost reasons, checklist → `src/lib/constants.ts`
- Brand colours → `tailwind.config.ts` (`brand` = gold, `ink` = dark maroon)
- Default commission % → `DEFAULT_COMMISSION_PCT` in `constants.ts`

## Notes
- Demo data and "Reset demo data" apply to Demo mode only.
- WhatsApp buttons open WhatsApp Web/app with a pre-filled message (no paid API needed). Automatic sending would need the WhatsApp Business API – can be added later.
- Check current DLD/RERA rules (Forms A/B/F, advertising permits) and UAE data-protection rules with your compliance officer; the CRM records them but does not replace legal review.
