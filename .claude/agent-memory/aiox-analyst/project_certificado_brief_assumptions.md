---
name: certificado-brief-assumptions
description: Certificado is a JEWELRY authenticity certification platform (confirmed 2026-08-13) — the v0.1 brief assumed course certificates and was fully discarded
metadata:
  type: project
---

**Domínio confirmado (2026-08-13, pelo stakeholder):** `certificado` é uma plataforma de **certificação de autenticidade e qualidade de JOIAS** — emissor é joalheiro/grife/certificador; dados são composição (ouro 750/585, prata 925, platina), pesos, gemas (natural/sintética/tratada), **fotos** e marcações; verificação é uma página pública anônima com QR ("esta joia é autêntica").

**A v0.1 do brief (certificados de conclusão de curso) foi 100% descartada.** Fonte válida: `docs/prd/project-brief-JOIAS.md` (v1.0.1). Registro do descarte: `docs/archive/README-DEPRECATED-v0.1.md`.

**O projeto é BROWNFIELD, não greenfield** (descoberto 2026-08-13) — apesar de `core-config.yaml` ainda declarar `greenfield` e o preset `nextjs-react`. Existe protótipo funcional: **React 19 + Vite 6 + Express + Bun + Tailwind 4**, com `src/App.tsx` (~55 KB), 23 componentes, `server.ts` (~28 KB), persistência em localStorage + `data_store.json`. O modelo de domínio já existe em `src/types.ts` (`JewelryCertificate`, `StoneDetail`, `Customer`, `MaintenanceRecord`) e é o melhor insumo para o schema. Supabase está provisionado no `.env` mas **não é usado pelo código**.

**Why:** O stakeholder corrigiu explicitamente a hipótese de domínio. Qualquer resíduo de "cursos/alunos/turmas/Open Badges/LMS/e-learning/Certifier/Even3" em contexto ou memória pertence à v0.1 e é lixo.

**How to apply:** Antes de qualquer artefato downstream (PRD, épicos, arquitetura), respeitar os 3 riscos CRÍTICOS e as 6 perguntas P0 do brief v1.0 — que ainda são inferências não confirmadas:
- **Q1 (tipo de certificado):** garantia/autenticidade auto-declarada pelo joalheiro vs. laudo gemológico pericial vs. avaliação de valor. Define a responsabilidade jurídica do produto inteiro.
- **Q5 (peça 1:N certificados):** decisão de schema irreversível — modelar N desde o dia 1.
- **R1:** o QR **não** prova autenticidade da peça física. Nenhum requisito ou texto de UI pode afirmar que prova.
- **R2:** a plataforma registra e publica declarações do emissor; **não certifica**. Requer parecer jurídico.
- **R3:** stripping de EXIF/GPS das fotos é requisito de segurança bloqueante (risco físico ao titular).
- Números de mercado divergem entre fontes em uma ordem de grandeza — confiança BAIXA, não propagar como fato (Artigo IV).

**Defeitos críticos confirmados no código (verificar se ainda existem antes de recomendar):** `authenticityHash` gerado com `Math.random()` (`src/App.tsx`, `server.ts`) e exibido como selo criptográfico; senhas em texto puro com default `123456` e credenciais hardcoded em `server.ts`. Ambos são afirmações/falhas de segurança visíveis ao consumidor final, não dívida técnica comum.

Related: [[user-language-and-context]], [[domain-inference-from-project-name]]
