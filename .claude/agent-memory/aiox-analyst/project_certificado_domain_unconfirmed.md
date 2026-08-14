---
name: certificado-domain-unconfirmed
description: The "certificado" project's product domain is an unconfirmed 70%-confidence assumption — treat as open question until the stakeholder answers
metadata:
  type: project
---

As of 2026-08-13, the `certificado` project has **no confirmed product definition**. The repo is an
empty AIOX greenfield (`src/` and `tests/` empty, placeholder npm scripts, 2 bootstrap commits). The
only semantic signal is the project name.

The project brief at `docs/prd/project-brief.md` assumes **certificate issuance/verification platform
for courses and events** (70% confidence), explicitly NOT ICP-Brasil digital certificates / PKI.

**Why:** The bootstrap provisioned Next.js + Supabase (a web-app stack, not PKI infra), and ICP-Brasil
issuance is a legally accredited activity requiring HSM, which a greenfield project cannot perform.

**How to apply:** Before doing any product, architecture, or data-modeling work on this project, check
whether the stakeholder has answered the 4 P0 questions in Section 10.2 of the brief. If the domain
answer turns out to be ICP-Brasil / digital signature, the brief and any derived PRD are invalid and
must be rewritten. Do not let this assumption harden into a requirement — Constitution Article IV
(No Invention) applies.

Two open architecture decisions block the data model: batch PDF generation under serverless execution
limits, and the anonymous-read RLS policy for the public verification route (which deliberately breaks
the per-tenant RLS pattern).

Related: [[certificado-stack-preset]]
