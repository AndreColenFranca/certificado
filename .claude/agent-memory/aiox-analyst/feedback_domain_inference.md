---
name: domain-inference-from-project-name
description: Never infer a project's business domain from its name or tech stack — ask before drafting; this already cost a full brief rewrite on this project
metadata:
  type: feedback
---

Não inferir o domínio de negócio a partir do **nome do projeto** ou do **stack pré-provisionado**. Se o domínio não estiver confirmado pelo stakeholder, a pergunta "o que é isso, exatamente?" precede o documento — não vira uma `[AUTO-DECISION]` dentro dele.

**Why:** Em 2026-08-13 o brief v0.1 de `certificado` foi escrito inteiro assumindo "certificados de conclusão de curso", inferido do nome + stack Next.js/Supabase. O domínio real era **certificação de autenticidade de joias**. Rewrite total: mercado, personas, modelo de dados, riscos e escopo — tudo descartado. O próprio brief havia registrado isso como risco R1 CRÍTICO com 70% de confiança declarada, e o risco materializou-se. Uma auto-decisão com 70% de confiança na *fundação* do documento não é uma decisão desbloqueante — é uma aposta que custa o documento inteiro.

**How to apply:** Ao executar tarefas de brief/pesquisa em modo autônomo (YOLO), classificar as auto-decisões por **profundidade na pilha de premissas**, não só por confiança:
- Decisões **fundacionais** (o que é o produto, quem é o usuário, qual o domínio) → **nunca** auto-decidir. Parar e perguntar, mesmo em modo autônomo. O custo de esperar é sempre menor que o de reescrever.
- Decisões **de escopo** (quais features no MVP, quais métricas) → auto-decidir é aceitável, marcar e seguir.

Sinal de alerta: se você estiver escrevendo um risco do tipo "se esta premissa estiver errada, N% do documento é descartável", **pare de escrever o documento e faça a pergunta.**

Related: [[certificado-brief-assumptions]]
