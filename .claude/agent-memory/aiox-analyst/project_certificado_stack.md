---
name: certificado-stack-preset
description: Supabase + Next.js was chosen for "certificado" by the AIOX bootstrap, not by a documented architecture decision
metadata:
  type: project
---

The `certificado` project's stack direction was set by the AIOX bootstrap, not by an architecture
review: `.aiox-core/data/technical-preferences.md` has active preset `nextjs-react`, and
`.env.example` already ships `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
slots.

**Why:** This matters because the stack looks "decided" but has no ADR or rationale behind it. It is a
default, not a commitment.

**How to apply:** When @architect formalizes the stack, treat Supabase/Next.js as a strong default to
be confirmed, not as a settled constraint. Question 12 of the brief's discovery questionnaire asks the
stakeholder to confirm it explicitly.

Related: [[certificado-domain-unconfirmed]]
