# Project Brief: Certificado — Plataforma de Certificação de Autenticidade e Qualidade de Joias

| Campo | Valor |
|---|---|
| **Projeto** | `certificado` |
| **Repositório** | https://github.com/AndreColenFranca/certificado |
| **Status** | Greenfield — bootstrap AIOX concluído, zero código de aplicação |
| **Versão do Brief** | **v1.0 — DOMÍNIO CORRIGIDO (JOIAS)** |
| **Substitui** | `docs/brief.md` v0.1 e `docs/prd/project-brief.md` v0.1 — **ambos em domínio incorreto, arquivados** |
| **Autor** | Atlas (@analyst) |
| **Data** | 2026-08-13 |
| **Confiança geral** | 🟢 ALTA no domínio (confirmado pelo stakeholder) · 🟡 MÉDIA no escopo de produto · 🔴 BAIXA nos números de mercado |

---

## ⚠️ AVISO DE VERSÃO — LEIA ANTES DE QUALQUER COISA

> **A v0.1 deste brief estava em domínio 100% incorreto.**
>
> A hipótese anterior (`[AUTO-DECISION 1]`, confiança declarada de 70%) era de que "certificado" significava
> **certificado de conclusão de curso/evento**. O stakeholder confirmou em 2026-08-13 que o domínio real é
> **certificação de autenticidade e qualidade de joias**.
>
> **Consequência:** todo o conteúdo de mercado, personas, modelo de dados, riscos e escopo da v0.1 é
> descartável. Este documento é a **única fonte válida**. Os arquivos v0.1 foram movidos para
> `docs/archive/` com sufixo `DEPRECATED`.
>
> **Lição registrada:** o risco **R1 da v0.1 ("premissa de domínio errada — CRÍTICO")** materializou-se.
> A inferência de domínio a partir do nome do projeto + stack não é evidência suficiente.
> Nenhum requisito deve ser derivado de inferência de nomenclatura daqui em diante.

**Gate constitucional (Artigo IV — No Invention):** nada marcado `[HIPÓTESE]` neste documento pode virar
FR/NFR no PRD sem confirmação explícita do stakeholder. As perguntas P0 da Seção 10 são bloqueantes.

---

## ⚠️ SEGUNDA CORREÇÃO — O PROJETO NÃO É GREENFIELD

> **Descoberto durante a redação deste brief (2026-08-13, ~02:04).** O código da aplicação apareceu no
> diretório de trabalho *após* o início desta análise. **Existe um protótipo funcional e substancial.**

`core-config.yaml` ainda declara `project.type: greenfield`. **Isso está incorreto.** O projeto é
**BROWNFIELD** e a stack real **diverge do preset AIOX** (`nextjs-react`):

| Aspecto | Declarado no AIOX | **Realidade no código** |
|---|---|---|
| Framework | Next.js 16+ (App Router) | **React 19 + Vite 6** (SPA, sem SSR) |
| Backend | Route Handlers / Server Actions | **Express 4** (`server.ts`, ~28 KB) + `api/index.ts` |
| Persistência | Supabase (PostgreSQL) | **localStorage + `data_store.json`** (efêmero) |
| Runtime/PM | npm | **Bun** (`bun.lock`) |
| PDF | a definir | **jsPDF + html2pdf + html2canvas** (client-side) |
| Extra não previsto | — | **`@google/genai`** (assistente gemólogo IA) |

**O protótipo já implementa mais do que o MVP proposto na Seção 6.1:**

`JewelerDashboard` · `CertificatePublicView` · `CustomerPortalView` (com login) · `LoginView` ·
`QRScannerModal` · `3DInspector` · `HighResPhotoInspector` · `AIGemologistAssistant` ·
`OwnershipTransferModal` · `MaintenanceModal` · `CustomerManagementView` · `PrintCertificateModal` ·
`UserManagementModal` · papéis `root/admin/operator/customer`

> **Consequência para @pm e @architect:** este projeto **não precisa de um PRD de MVP greenfield**. Precisa
> de (a) correção dos defeitos críticos abaixo, (b) migração de persistência para Supabase, e
> (c) decisão consciente sobre o que do protótipo é produto e o que é demo.
> **O workflow correto é Brownfield Discovery, não Story Development Cycle a partir do zero.**

### 🔴 Defeitos críticos confirmados no código

| # | Defeito | Evidência | Severidade |
|---|---|---|---|
| **D1** | **`authenticityHash` é `Math.random()`** — não é hash, não é criptográfico, não deriva dos dados do certificado, e `Math.random()` não é CSPRNG. O campo é documentado em `types.ts` como *"Cryptographic seal string"* | `src/App.tsx:907`, `server.ts:658-659` | 🔴 **CRÍTICO** |
| **D2** | **Senhas em texto puro**, com default hardcoded `'123456'` para todo cliente novo, e credenciais fixas no fonte | `server.ts:25-67`, `server.ts:478`, `server.ts:548` | 🔴 **CRÍTICO** |
| **D3** | **`metalPurity`, `metalColor`, `finish`, `StoneType` são `string` livre** — sem enum, sem constraint. Não há como garantir que "18k", "18K", "750" e "Ouro 18 quilates" sejam o mesmo valor | `src/types.ts:12-18` | 🟠 **ALTO** |
| **D4** | **CPF do cliente trafega e é armazenado sem proteção** e aparece em `MaintenanceRecord` (histórico) | `src/types.ts:9,38,54,77`, `src/utils/cpfUtils.ts` | 🟠 **ALTO** |
| **D5** | **Persistência efêmera** — `data_store.json` + localStorage. Um certificado é documento permanente; hoje ele pode simplesmente sumir | `server.ts`, arquitetura atual | 🟠 **ALTO** |

> **D1 é a confirmação exata do risco R1/R2 deste brief.** O produto hoje exibe um "selo criptográfico"
> que é um número aleatório. Isso não é apenas uma falha técnica — é uma **afirmação falsa de segurança
> exibida ao consumidor final**, com o exato perfil de exposição descrito em R2. **Prioridade máxima:**
> ou implementar assinatura real (HMAC/Ed25519 sobre o payload do certificado), ou **remover o rótulo
> "criptográfico" da UI e do código**. Manter como está é indefensável.

---

## 1. Executive Summary

### 1.1 Conceito do Produto

`certificado` é uma **plataforma de emissão, gestão e verificação pública de certificados de
autenticidade e qualidade de joias**.

O fluxo central é:

```
Joalheiro / grife / certificador
   └── cadastra a PEÇA (metal, teor, peso, gemas, medidas, marcações)
         └── anexa FOTOS da peça (evidência visual — parte da prova)
               └── emite o CERTIFICADO (código único, imutável, versionado)
                     └── entrega ao comprador (QR code impresso/gravado + link)
                           └── QUALQUER PESSOA verifica publicamente, sem login
                                 (comprador, seguradora, marketplace, comprador de 2ª mão, perito)
```

O artefato canônico **não é o cartãozinho impresso na caixa** — é o **registro digital verificável**.
O papel vira uma projeção descartável de um registro que é permanente, rastreável e auditável.

### 1.2 Problema Primário

Hoje, o certificado de uma joia é um **cartão impresso dentro da caixa**. Ele:

- **se perde** (e com ele, boa parte do valor de revenda da peça);
- **não é verificável** — não há como conferir se aquele papel corresponde àquela peça;
- **é trivialmente falsificável** — um scanner e uma impressora resolvem;
- **não deixa registro no emissor** — o joalheiro frequentemente não sabe o que certificou há 3 anos;
- **não acompanha a peça na revenda** — o mercado de segunda mão opera no escuro.

Isso produz um mercado com **assimetria de informação estrutural**: o comprador não consegue distinguir
ouro 18k de folheado premium, diamante natural de sintético/moissanita, esmeralda natural de tratada —
e depende inteiramente da reputação do vendedor.

### 1.3 Distinção Crítica de Domínio — Quatro Documentos Diferentes 🔴

> **Esta é a decisão de produto mais importante do projeto e precede todo o resto.**

O mercado brasileiro usa "certificado" para quatro artefatos com naturezas jurídicas e
responsabilidades **radicalmente distintas**:

| # | Documento | Quem emite | Natureza | Responsabilidade | Fonte |
|---|---|---|---|---|---|
| **A** | **Certificado de garantia** | O próprio vendedor/joalheiro | Declaração comercial | Do fornecedor, sob o **CDC** — entregar preenchido é obrigação legal (art. 50, § único, e art. 74) | [Jusbrasil/CDC](https://www.jusbrasil.com.br/artigos/a-garantia-legal-contratual-e-estendida-no-cdc-prescricao-e-decadencia/1150266504) |
| **B** | **Certificado de autenticidade** | Joalheiro, fabricante ou grife | Descritivo técnico auto-declarado | Do emissor (reputacional + CDC) | [Lindyse Joias](https://lindysejoias.com/blog/certificado-autenticidade-joia-ouro/) |
| **C** | **Laudo técnico gemológico** | Gemólogo habilitado / laboratório | **Perícia técnica imparcial** | Do profissional habilitado, com responsabilidade técnica | [Jusbrasil](https://www.jusbrasil.com.br/noticias/certificacao-e-laudo-tecnico-pericial-voce-sabe-qual-e-a-diferenca-dos-dois-na-venda-e-compra-de-joias-e-metais-preciosos/1150018145) |
| **D** | **Avaliação (valor monetário)** | Avaliador/perito | Estimativa de valor com validade temporal | Do avaliador — usada em seguro, inventário, partilha, penhor | [Revista Kdea 360](https://revistakdea360.com.br/noticia/46295/avaliacao-de-joias-e-partilhas) |

**Fato relevante do mercado:** existem "laudos gemológicos" emitidos por pessoas **sem qualificação ou
habilitação**, com finalidade de transação fraudulenta — problema documentado e reconhecido no setor
([Jusbrasil](https://www.jusbrasil.com.br/noticias/certificacao-e-laudo-tecnico-pericial-voce-sabe-qual-e-a-diferenca-dos-dois-na-venda-e-compra-de-joias-e-metais-preciosos/1150018145)).

> 🔴 **P0 bloqueante:** o MVP atende **qual desses**? A recomendação do analista está na Seção 6.0.
> Escolher errado significa ou (i) construir compliance desnecessário, ou (ii) expor a plataforma a
> responsabilidade por perícia que ela não tem competência para respaldar.

### 1.4 Mercado-Alvo

| Métrica | Valor | Fonte | Confiança |
|---|---|---|---|
| Mercado brasileiro de joias | **US$ 3,59 bi (2024)** → US$ 5,34 bi (2029) | Mordor Intelligence via [Munra](https://munra.com.br/blog-detalhes/mercado-brasileiro-de-joias-e-semijoias-deve-dobrar-faturamento-ate-2030) | 🟡 Média |
| Setor ampliado (joias + semijoias + acessórios) | **~R$ 74 bi (2022)**, expectativa de dobrar até 2030; +18% em 5 anos | Bain & Company via [Radar Digital Brasília](https://radardigitalbrasilia.com.br/noticias-corporativas-dino/319847-mercado-de-joias-no-brasil-deve-dobrar-faturamento-ate-2030/) | 🟡 Média |
| Posição do Brasil | Entre os **15 maiores produtores mundiais**; ~22 t de peças em ouro comercializadas | IBGM via [Nuvemshop](https://www.nuvemshop.com.br/blog/mercado-de-joias/) | 🟢 Alta |
| E-commerce de joias/semijoias (Nuvemshop) | **R$ 308 mi em 2025, +48% YoY** | [Nuvemshop](https://www.nuvemshop.com.br/blog/mercado-de-joias/) | 🟢 Alta |

> ⚠️ **Divergência não resolvida:** o stakeholder estimou "~R$ 50 bi/ano". As fontes encontradas divergem
> em uma ordem de grandeza entre si (US$ 3,59 bi ≈ R$ 19 bi vs. R$ 74 bi) porque **escopos diferentes**
> (joias finas vs. joias+semijoias+bijuterias+acessórios) e **metodologias diferentes**. Nenhum desses
> números deve ser propagado ao PRD como fato. O TAM relevante para este produto não é o mercado de
> joias — é a **camada de certificação** sobre as peças que exigem certificado, que é um subconjunto
> pequeno e não dimensionado publicamente.

### 1.5 Proposta de Valor

> **"O certificado da joia deixa de ser um papel que se perde e vira um registro que a peça carrega
> para sempre — verificável por qualquer pessoa, em 3 segundos, com o celular."**

Três eixos:

1. **Para o joalheiro/grife:** emitir certificados profissionais em minutos, manter registro permanente
   e pesquisável do que certificou, e transformar o certificado em **ativo de marca** em vez de custo
   operacional.
2. **Para o comprador:** prova durável que sobrevive à perda da caixa, protege o **valor de revenda**
   e sustenta sinistro de seguro.
3. **Para o verificador** (comprador de 2ª mão, seguradora, marketplace, casa de penhor): confirmar
   autenticidade sem depender da palavra do vendedor.

---

## 2. Problem Statement

### 2.1 Estado Atual e Dores por Ator

| Ator | Dor atual | Custo/impacto |
|---|---|---|
| **Joalheiro/fabricante** | Certificado feito manualmente (Word/Canva/talão pré-impresso), preenchido à mão | Tempo por peça; erro de digitação em teor/peso; inconsistência visual da marca |
| **Joalheiro/fabricante** | **Nenhum registro estruturado** do que foi certificado | Não consegue reemitir 2ª via; não responde a "essa peça saiu daqui?"; sem defesa em disputa |
| **Joalheiro/fabricante** | Não tem como provar ao cliente que o certificado dele vale mais que o do concorrente | Certificado vira commodity; não sustenta prêmio de preço |
| **Comprador final** | Perde o cartão/caixa | Perda direta de **valor de revenda** — peça sem certificado vale menos |
| **Comprador final** | Não sabe se o certificado é real | Aceita no escuro; risco de comprar folheado como 18k |
| **Comprador de 2ª mão** | Recebe uma peça + papel, sem forma de conferir | Mercado secundário travado por desconfiança |
| **Seguradora / penhor** | Precisa de laudo/avaliação com rastreabilidade | Reavaliação cara e repetida a cada sinistro/contrato |
| **Marketplace de joias** | Não consegue verificar claims de vendedores | Risco de plataforma; disputas; chargeback |

### 2.2 O Problema Central Não é Emissão — é Vínculo

> 🔴 **Insight que define a arquitetura do produto.**

Emitir um PDF bonito com um QR code **não combate falsificação**. O ataque é trivial:

```
Falsificador → fotografa o QR de um certificado legítimo
             → imprime esse QR na caixa de uma peça falsa
             → a página de verificação abre, mostra dados reais, e VALIDA a peça falsa
```

O QR code prova que **existe um certificado**. Ele **não** prova que **aquela peça na sua mão** é a peça
do certificado. Sem um **vínculo físico verificável entre a peça e o registro**, o produto entrega
**teatro de segurança**.

As soluções conhecidas para esse vínculo, ordenadas por custo/robustez:

| Vínculo | Robustez | Custo | Viável no MVP? |
|---|---|---|---|
| Fotos de alta resolução da peça no certificado (verificador compara visualmente) | Baixa-média | ~Zero | ✅ Sim — **é o mínimo indispensável** |
| Número de série gravado a laser na peça, conferível contra o registro | Média-alta | Baixo (equipamento) | 🟡 Depende do emissor |
| Marcações/punção do fabricante + teor (750) documentados e fotografados | Média | Zero | ✅ Sim |
| Fingerprint óptico da peça (padrão único de inclusões/cravação) | Alta | Alto | ❌ Fase 3+ |
| Tag NFC embutida na peça ou na embalagem lacrada | Alta | Médio | ❌ Fase 2 |
| Ancoragem em blockchain (ex.: modelo De Beers **Tracr**) | Alta para proveniência, **irrelevante para vínculo físico** | Alto | ❌ Fora de escopo |

**Referências técnicas:** a integração blockchain+NFC para anti-falsificação é a arquitetura de
referência atual em bens de luxo ([Nature Sci. Reports](https://www.nature.com/articles/s41598-025-88245-4),
[NFCwork](https://nfcwork.com/how-to-integrate-blockchain-with-nfc-digital-product-passports-to-protect-data/)).
Projeta-se que **1,8 bi de tags NFC passivas/ano até 2026**, com **12–15% em autenticação de luxo e
colecionáveis**, e NFC apresenta **~2,6× mais retenção de engajamento que QR**
([DTB NFC](https://www.dtbnfc.com/blogs/nfc-in-cultural-collectibles-and-jewelry-systems)).

> **Implicação para o MVP:** aceitar conscientemente que o MVP entrega **vínculo fraco** (fotos +
> marcações + série opcional) e **comunicar isso honestamente na UI**, em vez de vender o QR como
> anti-falsificação. Prometer mais do que se entrega, neste domínio, é risco jurídico — não só de marca.

### 2.3 Por Que as Soluções Existentes Não Bastam

**Certificadores/laboratórios instalados no Brasil** (todos verificados):

| Entidade | Papel | Observação |
|---|---|---|
| **IBGM** — Instituto Brasileiro de Gemas e Metais Preciosos | Laboratório gemológico de referência; laudos reconhecidos nacional e internacionalmente | [ibgm.com.br](https://ibgm.com.br/servico/laboratorio-gemologico/) · [tarifas públicas](https://www.gemologiaibgm.com.br/laboratorio/servicos-gemologicos/tarifas/) |
| **AMAGOLD** (Assoc. Bras. dos Fabricantes de Joias de Ouro Certificado) | "O Inmetro do ouro 18k" — audita teor de fabricantes, XRF com margem ±0,1% | Fundada em 2001 · [amagold.com.br](https://amagold.com.br/about/) · [Wikipédia](https://pt.wikipedia.org/wiki/Amagold) |
| **GEMLAB** | Gemologia e engenharia mineral, certificação de gemas e diamantes | [gemlab.com.br](https://www.gemlab.com.br/pages/index.php?secao=9) |
| **Laboratório Gemológico da AJORIO** | Laudos para o mercado do Rio de Janeiro | [sistemaajorio.com.br](https://www.sistemaajorio.com.br/web/index.php/servicos/laborat-gemolo-mainmenu-60) |
| **AS Gemologia**, **Gemas Lab**, **Centro Gemológico de Análises** | Laboratórios independentes com certificados bilíngues | [AS Gemologia](http://asgemologia.com.br/certificados.html) · [Gemas Lab](https://gemaslab.com.br/) · [Centro Gemológico](https://www.centrogemologico.com.br/) |
| **IPT/USP**, **LAPEGE/CETEM** | Laboratórios institucionais/acreditados | [CETEM](https://www.cetem.gov.br/antigo/images/congressos/2012/CAC00420012.pdf) |
| **GIA** (internacional) | Padrão-ouro global para diamantes | [Reisman](https://blog.reisman.com.br/certificado-de-diamante-gia/) |

> ⚠️ **Os certificadores citados no briefing do stakeholder — "Aguillera", "Plurigold", "GGAC" — NÃO foram
> localizados em busca web (múltiplas consultas, ago/2026).** Podem ser (a) empresas de baixa presença
> digital, (b) nomes regionais/informais, (c) grafias alternativas, ou (d) conhecimento privado do
> stakeholder. **Requer confirmação — ver Q13.** Não os trato como fato neste brief.

**Lacuna competitiva no software** — este é o achado mais acionável:

Existe um mercado maduro de **ERPs para joalherias no Brasil** — eGestor, Soften, Alfa Networks,
Eccosys, Gestão Joias, Mikon, ONCLICK, ERP Suite, GestãoClick. Eles cobrem estoque por peça, consignação,
maletas, crediário, NF-e, rastreabilidade de metais e integrações com marketplace.

> **Nenhum dos ERPs pesquisados anuncia emissão de certificado de autenticidade com verificação pública
> como funcionalidade.** A rastreabilidade que eles oferecem é **interna** (do recebimento à venda) —
> não é uma **credencial verificável por terceiros**.

Isso significa duas coisas simultaneamente:

- ✅ **Oportunidade real:** há um espaço não ocupado entre "ERP de joalheria" e "laboratório gemológico".
- 🔴 **Risco de canal:** os ERPs já **possuem o dado da peça e o relacionamento com o joalheiro**.
  Se a certificação virar um diferencial disputado, é uma feature que eles podem adicionar. A defesa não
  é a emissão — é a **rede de verificação** (Seção 7.2).

### 2.4 Por Que Agora

1. **E-commerce de joias explodindo** — +48% YoY só no ecossistema Nuvemshop (2025). Comprar joia online
   significa **não poder tocar a peça**: o certificado passa de acessório a **proxy de confiança
   primário**. Este é o gatilho mais forte e mais bem documentado.
2. **Mercado de segunda mão / revenda** crescendo — a peça sem certificado sofre desconto material.
3. **Tecnologia barata e madura** — QR é gratuito; NFC passivo caiu de preço; câmeras de celular fazem
   macrofotografia aceitável.
4. **Direção regulatória internacional** — o **Digital Product Passport (DPP)** da UE, sob a **ESPR**,
   obriga a partir de **2027** um portador de dados legível por máquina (QR) ligando o produto a dados
   padronizados. As primeiras categorias são baterias, têxteis, eletrônicos, móveis e **metais**
   ([Intertek](https://www.intertek.com/blog/2025/05-28-eu-ecodesign-digital-product-passport/),
   [Veribl](https://www.veribl.com/blog/espr-2027-compliance-guide)).
   ⚠️ **Joias NÃO estão explicitamente listadas como categoria prioritária.** Isto é um **item de
   observação**, não um requisito. Não deve gerar FR no MVP.

**Confiança:** 🟢 ALTA para (1) e (3); 🟡 MÉDIA para (2); 🟡 MÉDIA-BAIXA para (4).

---

## 3. Proposed Solution

### 3.1 Conceito Central

```
Organização emissora (joalheria / grife / laboratório)
  └── Peça  (metal, teor, peso, dimensões, marcações, nº de série)
        ├── Gemas [0..n]  (tipo, natural/sintético/tratado, lapidação, quilate, cor, claridade, cravação)
        ├── Fotos [1..n]  (frente, verso, marcação/punção, detalhe da gema, escala)
        └── Certificado [1..n]  (versão, tipo, emissor, responsável técnico, data, status)
              └── Verificação pública  →  /v/{codigo}   (sem login, mobile-first, cacheável)
```

### 3.2 Diferenciais Pretendidos

- **A verificação pública é o produto**, não um add-on. Gratuita e sempre gratuita (ver 7.2).
- **Fotos são cidadãs de primeira classe** — não anexos. A evidência visual é o que sustenta o vínculo
  peça↔certificado no MVP.
- **Imutabilidade + versionamento**, nunca edição silenciosa. Um certificado é documento probatório;
  corrigir sem trilha destrói a confiança que o produto vende.
- **Autoria explícita e honesta** — a página pública diz claramente *quem* certificou e *sob qual
  responsabilidade*. A plataforma nunca aparece como quem atesta.
- **Certificado segue a peça, não a pessoa** — projetado para transferência de titularidade na revenda.

### 3.3 Visão de Alto Nível

Fase 1 é uma **ferramenta de emissão**. A visão de longo prazo é ser o **registro de referência de
autenticidade de joias no Brasil** — onde o efeito de rede vem da **verificação**, não da emissão:
quanto mais compradores, seguradoras e marketplaces verificarem aqui, mais valioso é emitir aqui.

---

## 4. Target Users

### 4.1 Segmento Primário: Joalheria / Fabricante / Grife Emissora `[HIPÓTESE — confiança 80%]`

| Atributo | Descrição |
|---|---|
| **Perfil** | Joalheria de rua ou shopping, fabricante de joias em ouro 18k, designer autoral, marca DTC de joias finas |
| **Porte** | 1–30 pessoas; de dezenas a alguns milhares de peças certificadas/ano |
| **Comportamento atual** | Talão pré-impresso ou template Word; preenchimento manual; foto no celular apenas para o e-commerce; nenhum registro estruturado |
| **Dor central** | Processo manual + zero rastreabilidade + certificado que não sustenta prêmio de marca |
| **Objetivo** | Passar credibilidade, proteger a marca contra falsificação, e não virar operação |
| **Sofisticação técnica** | **Baixa.** Precisa funcionar no celular, na bancada, sem treinamento |
| **Disposição a pagar** | 🔴 **Desconhecida.** Q9 |

### 4.2 Segmento Secundário: Laboratório Gemológico / Gemólogo Independente `[HIPÓTESE — confiança 40%]`

Emite **laudos técnicos (tipo C)**, não certificados comerciais. Tem responsabilidade técnica pessoal,
registro profissional, e equipamento (refratômetro, espectrômetro, XRF). Já emite laudos em papel
timbrado com fotografia.

> **Este segmento tem necessidades materialmente diferentes** (campos técnicos densos, terminologia
> normativa, identificação de tratamentos, responsável técnico com registro). Atendê-lo no MVP
> **dobra o escopo do modelo de dados**. Recomendação: **fora do MVP** — ver Seção 6.0.

### 4.3 Segmento Terciário: Comprador / Portador da Joia

| Atributo | Descrição |
|---|---|
| **Perfil** | Pessoa física que comprou ou recebeu a peça |
| **Comportamento atual** | Guarda a caixinha; perde o papel; fotografa "por garantia" |
| **Dor central** | Perda de comprovação → perda de valor de revenda e dificuldade em sinistro de seguro |
| **Objetivo** | Ter a prova sempre acessível; comprovar valor; transferir na revenda |
| **Restrição de design** | 🔴 **No MVP não deve exigir conta.** Acesso por link/QR. Ver Q3 e Seção 6.0 |

### 4.4 Segmento Quaternário (não-usuário, mas define o design): Verificador

| Quem | Motivação | Restrição |
|---|---|---|
| Comprador de segunda mão | "Isso é ouro mesmo? Esse diamante é natural?" | **Nunca criará conta.** Anônimo, mobile, na loja/no encontro |
| Seguradora | Validar valor declarado em apólice/sinistro | Precisa de dado estruturado e exportável |
| Casa de penhor (inclui Caixa) | Avaliar garantia | Precisa de teor e peso confiáveis |
| Marketplace de joias | Validar claim do vendedor | Precisaria de API — **Fase 2** |
| Perito judicial / inventário / partilha | Instruir processo | Precisa de trilha de auditoria e imutabilidade |

> **A página pública de verificação é a superfície de produto mais importante** e é usada por quem
> **nunca paga e nunca loga**. Ela deve ser: mobile-first, < 1,5s de LCP, legível sem contexto prévio,
> e honesta sobre o que prova e o que não prova.

---

## 5. Goals & Success Metrics

> `[HIPÓTESE]` — todos os alvos numéricos são âncoras de negociação, não compromissos. Não há baseline.

### 5.1 Objetivos de Negócio

- Validar demanda com **10 joalherias emitindo certificados reais em produção** em 90 dias pós-MVP.
- Atingir **1.000 peças certificadas** acumuladas em 6 meses.
- Atingir **razão de verificação ≥ 0,5 verificação pública por certificado emitido** em 6 meses —
  *este é o KPI que prova a tese do produto*; sem verificação, o produto é um gerador de PDF.
- Manter **custo de infraestrutura por certificado < R$ 0,20/ano** (dominado por storage de imagem — ver 8.4).

### 5.2 Métricas de Sucesso do Usuário

- **Time-to-first-certificate < 15 min** — do cadastro ao primeiro certificado real emitido.
- **Tempo por peça < 3 min** — incluindo upload de fotos, na segunda peça em diante.
- **Taxa de conclusão do fluxo de emissão ≥ 85%** — quem começa a cadastrar uma peça, termina.
- **Zero certificados irrecuperáveis** — 100% recuperável a qualquer momento.

### 5.3 KPIs

| KPI | Definição | Alvo inicial |
|---|---|---|
| Certificados emitidos/mês | Registros com status `issued` | Crescimento MoM > 20% |
| **Razão de verificação** | Verificações públicas únicas ÷ certificados emitidos | **≥ 0,5** (tese do produto) |
| Verificações por terceiros | Verificações de IP/sessão distinta do emissor | ≥ 60% do total |
| Organizações ativas | Org com ≥ 1 emissão em 30 dias | 10 no trimestre de validação |
| Latência p95 da verificação | Tempo até LCP da página pública | **< 1,5 s** (mobile 4G) |
| Fotos por certificado (mediana) | Evidência visual anexada | **≥ 3** (frente, verso, marcação) |
| Custo de storage por certificado | GB armazenado ÷ certificados | **< 3 MB** pós-otimização |
| Taxa de falha na emissão | Emissões com erro ÷ tentadas | < 1% |

---

## 6. MVP Scope

### 6.0 🔴 Recomendação do Analista sobre o Tipo de Certificado (P0 #0)

> **Recomendo que o MVP atenda EXCLUSIVAMENTE os tipos A + B** — *certificado de garantia* e
> *certificado de autenticidade*, **emitidos pelo próprio joalheiro, sob responsabilidade dele**.
>
> **Razões:**
> 1. **Responsabilidade.** No tipo A/B, a plataforma é **infraestrutura de publicação** — quem atesta
>    é o joalheiro, com CNPJ e nome visíveis. No tipo C (laudo pericial), o documento carrega
>    responsabilidade técnica de profissional habilitado; permitir que qualquer usuário emita "laudo
>    gemológico" na plataforma facilita exatamente a fraude que o setor já denuncia.
> 2. **Volume.** Tipo A/B é emitido em **toda venda**. Tipo C é emitido em fração pequena de peças
>    de alto valor. O volume — e portanto o efeito de rede da verificação — está em A/B.
> 3. **Escopo.** Tipo C exige campos técnicos normativos, identificação de tratamentos e vínculo com
>    registro profissional. Dobra o modelo de dados.
> 4. **Tipo D (avaliação de valor) deve ficar explicitamente FORA** — valor monetário tem validade
>    temporal, uso em seguro/inventário/partilha, e é o vetor de responsabilidade civil mais direto.
>
> **Consequência de design não-negociável:** a plataforma **nunca** pode se apresentar como quem
> certifica. A página pública deve dizer, de forma proeminente:
> *"Certificado emitido por **{Joalheria X}** (CNPJ ...), sob responsabilidade do emissor.
> `certificado` é a plataforma que registra e publica — não atesta a autenticidade da peça."*

### 6.1 Core Features (Must Have)

- **Autenticação e organização multi-tenant** — cadastro/login via Supabase Auth; isolamento por RLS.
  *Racional: sem tenant não há isolamento de dados; RLS é o mecanismo primário e é aplicado no Postgres,
  não no código da aplicação.*

- **Cadastro de PEÇA com modelo específico de joias** — o coração do produto:
  - **Metal:** tipo (ouro / prata / platina), **teor** (18k=750, 14k=585, 10k=417, prata 925, platina 950),
    cor (amarelo/branco/rosé)
  - **Pesos:** peso bruto (g, 2 casas decimais), peso líquido do metal
  - **Identificação:** tipo de peça (anel, aliança, colar, brinco, pulseira, pingente…), tamanho/aro,
    dimensões relevantes
  - **Marcações/punção:** teor gravado (ex.: `750`), marca do fabricante, número de série
  - *Racional: esta modelagem é o que diferencia o produto de um gerador genérico de PDF.*

- **Cadastro de GEMAS [0..n] por peça** — tipo (diamante, esmeralda, rubi, safira, zircônia, moissanita,
  pérola, outra), **natural / sintética / tratada** 🔴, lapidação, quantidade, peso em quilates (total e
  unitário), cor, claridade, tipo de cravação.
  *Racional: a distinção **natural vs. sintético vs. tratado** é a fraude nº 1 do setor. Um certificado
  de joia que não força essa declaração é inútil.*

- **Upload de FOTOS obrigatórias [1..n]** com **conjunto mínimo guiado**: (1) frente, (2) verso,
  (3) marcação/punção em macro. Opcional: detalhe da gema, peça com escala/régua.
  *Racional: no MVP a foto **é** o vínculo peça↔certificado. Sem foto, o certificado não prova nada.*
  - **Pipeline obrigatório na ingestão:** **remoção de EXIF** (🔴 crítico — ver R3), geração de
    derivadas (thumb / médio / full), conversão para WebP/AVIF, compressão.

- **Emissão do certificado** — código único **não-sequencial e não-adivinhável**, timestamp, snapshot
  imutável dos dados, emissor identificado (razão social + CNPJ), responsável pela emissão.

- **QR code + PDF imprimível** — QR apontando para a URL pública; PDF em formato de cartão para
  imprimir/inserir na caixa. *Racional: o joalheiro precisa entregar algo físico junto com a peça.*

- **Página pública de verificação (sem login)** — mobile-first, exibindo: status, emissor, dados da peça,
  gemas, **fotos**, data de emissão, e o **disclaimer de responsabilidade** da Seção 6.0.
  *Racional: é o produto.*

- **Painel de gestão** — listagem, busca (por código, nº de série, tipo, gema, cliente), filtros,
  reemissão do PDF/QR, exportação.

- **Revogação e versionamento** — certificado **nunca é editado no lugar**. Corrigir gera **nova versão**;
  a anterior fica marcada como substituída, com trilha visível. Revogação muda o status público.
  *Racional: imutabilidade é o que separa registro probatório de banco de dados editável.*
  ⚠️ *Nota: a v0.1 do brief colocava revogação fora do MVP. **Neste domínio isso é inaceitável** — uma
  joia certificada erroneamente e não revogável é um passivo permanente.*

### 6.2 Fora do Escopo do MVP

- **Laudo gemológico pericial (tipo C)** e **avaliação de valor monetário (tipo D)** — ver 6.0
- Blockchain / ancoragem criptográfica / NFT de proveniência
- **Tags NFC** e integração com gravação a laser
- Transferência de titularidade / histórico de propriedade (revenda) — **forte candidato a Fase 2**
- Conta e portfólio do comprador ("minhas joias")
- Editor visual de template do certificado (MVP: 1–2 layouts com logo e cores da marca)
- API pública e integração com ERPs de joalheria
- Integração com marketplaces (Mercado Livre, Shopee, e-commerce próprio)
- Billing, planos e cobrança
- Registro de conformidade Inmetro (Cd/Pb — Portaria 123/2021) como campo estruturado
- Multi-idioma (MVP: pt-BR)
- App mobile nativo (MVP: web responsiva / PWA)
- Envio transacional de e-mail em massa
- Fingerprint óptico / visão computacional para matching peça↔foto

### 6.3 Critério de Sucesso do MVP

> Uma joalheria real, sem suporte do time, cadastra-se, certifica **10 peças reais** (com fotos e gemas
> declaradas), imprime os QR codes, entrega a clientes — e pelo menos **5 verificações públicas por
> terceiros externos** são registradas em 30 dias. Tempo mediano por peça (da 2ª em diante) **< 3 min**.

Falha em qualquer um desses indicadores exige revisão de escopo antes de Fase 2.

---

## 7. Post-MVP Vision

### 7.1 Fase 2 — priorizada por valor

1. **Transferência de titularidade / cadeia de custódia** — o certificado acompanha a peça na revenda.
   *É o que destrava o mercado de segunda mão e cria o efeito de rede real.*
2. **Conta do portador** — portfólio "minhas joias", multi-emissor.
3. **API pública + webhooks + integração com ERPs de joalheria** — é onde está o volume.
4. **Tag NFC** na peça ou embalagem lacrada — vínculo físico forte (R1).
5. **Modo laboratório gemológico (tipo C)** com responsável técnico registrado.
6. **Avaliação de valor (tipo D)** com validade temporal e trilha — abre o canal de **seguradoras**.
7. Editor visual de template · Billing com Pix · Multi-usuário e papéis.

### 7.2 Visão de 1–2 Anos e a Defesa Competitiva

Tornar-se o **registro de autenticidade de joias de referência no Brasil** — onde a seguradora, o
marketplace e o comprador de 2ª mão checam por padrão.

> **A defesa não é a emissão — é a verificação.** Emissão é replicável por qualquer ERP de joalheria
> (Seção 2.3). A rede de verificação não é: ela depende de volume acumulado de peças e de reconhecimento
> pelo lado que **não paga**. Isso implica uma regra estratégica: **a verificação pública nunca pode ser
> paga, limitada ou colocada atrás de login.** Monetizar a verificação mata o produto.

### 7.3 Oportunidades de Expansão

- **Seguradoras** — canal B2B de alto valor; laudo/avaliação estruturado reduz custo de subscrição e sinistro.
- **Casas de penhor** (incl. Caixa) — teor e peso confiáveis reduzem risco de garantia.
- **Marketplaces e e-commerce de joias** — selo de verificação embarcável (widget/iframe).
- **Certificação de conformidade Inmetro** (Cd/Pb, Portaria 123/2021) como campo auditável.
- **Parceria com AMAGOLD / IBGM** 🔴 — eles são os **âncoras de confiança já instalados**. A plataforma
  não cria confiança do zero; ela distribui confiança existente. Uma integração ("esta peça é de
  fabricante certificado AMAGOLD") vale mais que qualquer feature.
- **Semijoias e folheados** — mercado muito maior em volume, mas certificado tem outra natureza
  (garantia de banho/espessura, não de teor). Segmento adjacente relevante.
- **Exportação / mercado internacional** — Brasil está entre os 15 maiores produtores mundiais.

---

## 8. Technical Considerations

### 8.1 Estado Atual do Repositório `[FATO — verificado no código, 2026-08-13]`

⚠️ **BROWNFIELD.** Ver a seção "SEGUNDA CORREÇÃO" no topo deste documento.

| Item | Estado real |
|---|---|
| `src/App.tsx` | **~55 KB** — monolito de UI e estado |
| `src/components/` | **23 componentes** (dashboard, portal, view pública, 3D, IA, QR, transferência…) |
| `server.ts` | **~28 KB** — API Express com auth, CRUD de certificados/clientes/usuários |
| `src/types.ts` | Modelo de domínio já definido — `JewelryCertificate`, `StoneDetail`, `Customer`, `MaintenanceRecord`, `CareGuideItem` |
| Persistência | **localStorage + `data_store.json`** — efêmera (D5) |
| Stack real | React 19, Vite 6, Express 4, Tailwind 4, Bun, TypeScript 5.8 |
| Libs relevantes | `@google/genai`, `qrcode`, `jspdf`, `html2pdf.js`, `html2canvas`, `motion`, `lucide-react` |
| Testes | `tests/` **vazio** — zero cobertura |
| `core-config.yaml` | `project.type: greenfield` ❌ **desatualizado** · preset `nextjs-react` ❌ **não corresponde** |
| Credenciais provisionadas | `SUPABASE_*`, `VERCEL_TOKEN`, `SENTRY_DSN` — **provisionadas mas NÃO usadas pelo código** |

**Modelo de dados já existente** (`src/types.ts`) — é o insumo mais valioso para @data-engineer:

```ts
JewelryCertificate {
  id, serialNumber, title, collection, model, manufacturer, manufacturingDate, issueDate
  isRoot?, parentCertId?                       // hierarquia Joia Pai (catálogo) → Joia Filha (cliente)
  currentOwnerName?, ownerCpf?, ownerEmail?, ownerId?
  metalPurity, metalColor, grossWeightGrams, widthCm?, finish
  hasStones, stones: StoneDetail[]             // type, quantity, caratWeight, cut, color, clarity, setting
  images[], frames360[], video360Url?          // ⚠️ ver 8.4 — frames360 muda a conta de storage
  warrantyMonths, warrantyTerms, warrantyStatus, authenticityHash   // ⚠️ D1
  estimatedValueBRL?                           // ⚠️ certificado JÁ carrega valor monetário (tipo D)
  careGuide[], maintenanceHistory[]
}
```

> **Decisão de stack em aberto e agora não-trivial:** migrar React+Vite+Express → Next.js (alinhar ao
> preset AIOX, ganhar SSR para a página pública) **ou** manter Vite+Express e adotar só o Supabase?
> A migração para Next.js tem benefício real e específico: a página pública de verificação precisa de
> **LCP < 1,5s com imagens em 4G**, e uma SPA Vite é estruturalmente pior nisso que SSR/ISR.
> **Decisão de @architect.** Ver Q18.

### 8.2 Requisitos de Plataforma

- **Alvo:** web responsiva. Duas superfícies com perfis opostos:
  - **Painel de emissão** — usado na bancada/balcão; **mobile é relevante** (a foto da peça é tirada
    com o celular). Tratar como **mobile-capable**, não desktop-only.
  - **Página de verificação** — **mobile-first absoluto** (QR é escaneado com celular, muitas vezes em
    4G dentro de uma loja).
- **Navegadores:** evergreen; a página de verificação precisa degradar bem em navegadores antigos.
- **Performance:** verificação p95 **LCP < 1,5 s em 4G** — com imagens. Este é o requisito não-funcional
  mais difícil do produto.
- **Acessibilidade:** WCAG 2.1 AA na página pública (documento de comprovação).

### 8.3 Preferências de Tecnologia

| Camada | Preferência | Racional |
|---|---|---|
| Frontend | **Next.js 16+ (App Router) + React + TypeScript** | Preset ativo; SSR/ISR é decisivo para a página pública |
| Estilo | Tailwind CSS + shadcn/ui | Preset ativo |
| Backend | Route Handlers / Server Actions | Sem servidor separado no MVP |
| Banco | **Supabase (PostgreSQL)** | Relacional; unicidade do código como *constraint de banco* |
| Auth | Supabase Auth | Integrado ao RLS via `auth.uid()` |
| **Imagens** | **Supabase Storage + Smart CDN + `next/image`** | **Ver 8.4 — é a decisão de maior impacto de custo** |
| Processamento de imagem | `sharp` (redimensionar, converter, **remover EXIF**) | Server-side, na ingestão |
| PDF do cartão/QR | A DEFINIR — `@react-pdf/renderer` ou Satori+resvg | Muito mais simples que na v0.1: **1 página, layout fixo, sem lote** |
| QR code | Biblioteca local (`qrcode`) | Sem dependência externa |
| Hospedagem | Vercel | Token já previsto |

### 8.4 🔴 Storage e CDN de Fotos — Resposta à Pergunta P0

> **Pergunta do stakeholder: "Supabase Storage é suficiente ou precisa CDN?"**
> **Resposta: Supabase Storage é suficiente para o MVP — MAS somente com um pipeline de otimização
> obrigatório. Sem ele, o produto fica economicamente inviável em poucos milhares de certificados.**

**A matemática que muda tudo em relação à v0.1:**

| Cenário | Payload por certificado | 1 GB comporta | 100 GB comportam |
|---|---|---|---|
| PDF de certificado de curso (domínio v0.1) | ~200 KB | ~5.000 | ~500.000 |
| **Joia — 5 fotos originais de celular (sem tratamento)** | **~20 MB** | **~50** | **~5.000** |
| **Joia — 5 fotos otimizadas (WebP, derivadas)** | **~2 MB** | **~500** | **~50.000** |
| 🔴 **Joia — 5 fotos + `frames360[]` (24–72 quadros) + `video360Url`** | **~60–200 MB bruto · ~8–25 MB otimizado** | **~5–40** | **~500–4.000** |

> 🔴 **O campo `frames360[]` já existe em `src/types.ts` e mais que decuplica o problema.** Um viewer 360°
> típico usa 24 a 72 quadros por peça. Isso é **uma ordem de grandeza acima** da estimativa de 5 fotos.
> Se o 360° for requisito real (**Q19**), a estratégia de storage deixa de ser "otimizar e caber no
> Supabase" e vira **decisão arquitetural de primeira ordem** — provavelmente exigindo objeto storage
> com egress zero (Cloudflare R2) e sprite sheets / vídeo codificado em vez de N imagens soltas.

**Fotos são ~100× mais pesadas que PDFs de texto.** A arquitetura de storage deixa de ser detalhe e
vira **decisão de viabilidade econômica**. E o custo é **monotônico e permanente** — certificados de
joia não expiram; o storage só cresce.

**Recomendação (para validação por @architect + @data-engineer):**

1. ✅ **Manter Supabase Storage** — evita mais um fornecedor no MVP e mantém as políticas de acesso
   coerentes com o RLS do banco.
2. 🔴 **Pipeline de ingestão obrigatório**, não opcional:
   - Limitar upload no cliente (ex.: 10 MB/foto, máx. 8 fotos)
   - **Remover EXIF/GPS** (ver R3 — não é otimização, é segurança física)
   - Gerar derivadas: `thumb` (~200px), `card` (~800px), `full` (~1600px), todas WebP/AVIF
   - Arquivar o original em bucket separado, **nunca servido publicamente**
3. 🔴 **A página pública serve apenas derivadas**, via `next/image`, com `loading="lazy"` abaixo da dobra
   e cache agressivo (o conteúdo é imutável — `Cache-Control: immutable` é apropriado).
4. 🔴 **Rate limiting na rota pública** — endpoint anônimo, com imagens, exposto à internet. É o vetor
   óbvio de abuso de egress e de scraping em massa do catálogo.
5. 🟡 **Gatilho de migração definido antecipadamente:** se o **egress** (não o armazenamento) virar o
   driver de custo, migrar as derivadas públicas para **Cloudflare R2** (egress zero) ou colocar
   **Cloudflare na frente**. Definir o número que aciona essa migração **antes** de precisar dele.

> **Conclusão:** "Supabase Storage vs. CDN" é uma falsa dicotomia — o Supabase Storage **já tem CDN**.
> O problema real não é entrega, é **volume de bytes gerado na origem**. Resolve-se no pipeline de
> ingestão, não na camada de distribuição.

### 8.5 Considerações de Arquitetura

- **Repositório:** monorepo simples (app único) é suficiente.
- **Serviços:** monolito Next.js + Supabase. Processamento de imagem assíncrono (upload → job → derivadas).
  Diferente da v0.1, **não há geração em lote** — o gargalo mudou de CPU (renderizar 200 PDFs) para
  **I/O e storage** (processar e guardar imagens). Isso **simplifica** a arquitetura.
- **Rota pública quebra o padrão de RLS** — precisa ler certificados de *qualquer* organização, sem
  sessão. Exige **política de leitura anônima deliberada e restrita** (ou view pública dedicada)
  expondo **apenas** os campos de verificação. **Decisão de @architect + @data-engineer antes da
  primeira story de dados.**
- **`SUPABASE_SERVICE_ROLE_KEY` ignora RLS.** Server-only. Vazar no bundle compromete todos os tenants.
- **Imutabilidade em nível de banco** — certificado emitido não sofre `UPDATE` nos campos probatórios.
  Correção = nova linha/versão. Considerar trigger de proteção, não só disciplina de aplicação.

### 8.6 Segurança e LGPD — Reavaliado para o Domínio de Joias

| Tema | Análise |
|---|---|
| **Dados pessoais do comprador** | 🔴 **Recomendação: NÃO exibir dados do comprador na página pública.** O certificado atesta a **peça**, não o dono. Nome + foto de joia cara + acesso público = risco físico ao titular. Se o nome do comprador for necessário (Q7), deve ficar em área privada. |
| **CPF** | Expor CPF em URL pública seria falha grave. Se necessário para garantia, armazenar sem exibir. |
| **EXIF/GPS nas fotos** | 🔴 **Vetor de risco físico subestimado.** Uma foto de joia tirada em casa carrega coordenadas GPS no EXIF. Publicar isso é publicar o endereço de onde a joia está. **Stripping de metadados é requisito de segurança bloqueante, não otimização.** |
| **Papel LGPD** | Organização = controladora; `certificado` = operadora. Requer contrato de operador, base legal, política de retenção. |
| **Retenção vs. permanência** | ⚠️ **Tensão real:** o valor do produto exige que o certificado seja **permanente**, mas o titular tem direito à eliminação. Resolução provável: os dados da **peça** não são dados pessoais e permanecem; os dados do **comprador** são eliminados/anonimizados sob solicitação, sem invalidar o certificado. **Precisa de posição jurídica.** |
| **Enumeração** | Código de verificação **não-sequencial, não-adivinhável**. Sem isso, um script varre o catálogo inteiro de peças de luxo do país. |

---

## 9. Constraints & Assumptions

### 9.1 Restrições

- **Orçamento:** não documentado. Assumido próximo de zero → free/low tiers. **Mas ver 8.4** — no domínio
  de joias, o free tier de storage (1 GB) comporta apenas ~500 certificados otimizados. **A restrição
  orçamentária colide com o domínio muito antes do que colidiria no domínio anterior.**
- **Prazo:** não documentado. Nenhum marco externo identificado.
- **Recursos:** assumido 1 desenvolvedor + agentes AIOX.
- **Técnicas:** stack já direcionado; sem PKI/HSM; sem equipamento de análise (XRF, refratômetro) —
  **a plataforma registra declarações, não mede nada**.

### 9.2 Premissas-Chave

1. 🟢 **`certificado` = certificação de autenticidade/qualidade de joias.** **Confirmado pelo stakeholder.**
2. 🟡 O produto é **multi-tenant** (várias joalherias), não interno de uma única marca. `[HIPÓTESE]` — Q2
3. 🟢 **Verificação pública anônima é requisito**, não opcional. (Confirmado como pilar do conceito.)
4. 🟡 **O emissor é o joalheiro**, não um laboratório independente — o produto atesta **declarações do
   emissor**, não medições da plataforma. `[HIPÓTESE de alto impacto]` — Q1
5. 🟡 **A plataforma não assume responsabilidade técnica** pelo conteúdo do certificado. `[HIPÓTESE
   jurídica — requer validação profissional]` — R2
6. 🟡 **Fotos são obrigatórias** e são o vínculo peça↔certificado no MVP. `[HIPÓTESE]` — Q14
7. 🟡 O certificado **não carrega valor monetário** no MVP (sem avaliação). `[HIPÓTESE]` — Q10
8. 🟡 pt-BR é o único idioma do MVP. *Nota: joias são exportadas — pode não se sustentar. Q11*
9. 🟡 Não há dados legados a migrar.

---

## 10. Risks & Open Questions

### 10.1 Riscos Principais — Reavaliados para o Domínio de Joias

| ID | Risco | Descrição e impacto | Severidade | Mitigação |
|---|---|---|---|---|
| **R1** | **Vínculo peça↔certificado inexistente** | QR clonado valida peça falsa (Seção 2.2). O produto entrega teatro de segurança e pode ser **usado por falsificadores** para legitimar peças falsas | 🔴 **CRÍTICO** | Fotos obrigatórias + nº de série + marcações; **comunicar honestamente o que o certificado prova e o que não prova**; roadmap para NFC |
| **R2** | **Responsabilidade legal por certificado falso** | Se a plataforma for percebida como quem certifica, pode ser arrastada em ação civil/consumerista. Um joalheiro mal-intencionado emitindo peças falsas usa a plataforma como fachada de credibilidade | 🔴 **CRÍTICO** | Enquadrar como **infraestrutura de publicação**; autoria explícita e proeminente na UI; Termos de Uso com responsabilidade do emissor; **KYC do emissor (CNPJ validado) no onboarding**; canal de denúncia; **validação por advogado antes do lançamento** |
| **R3** | **Fotos como vetor de risco físico** | Fotos de alta resolução de joias valiosas, públicas, com **EXIF/GPS** e possivelmente nome do dono = catálogo para furto direcionado. Também facilita **cópia de design** por falsificadores | 🔴 **CRÍTICO** | **Stripping de EXIF obrigatório**; sem dados do comprador na página pública; resolução limitada no público; marca d'água; rate limiting anti-scraping |
| **R4** | **Custo de storage monotônico** | Imagens ~100× mais pesadas que PDFs; certificados permanentes; storage só cresce. Free tier comporta ~500 certificados | 🟠 **ALTO** | Pipeline de otimização obrigatório (8.4); gatilho de migração definido a priori; modelo de negócio que cubra custo marginal |
| **R5** | **Certificado mutável destrói a confiança** | Se o emissor pode editar silenciosamente os dados, a verificação não prova nada — e vira ferramenta de fraude retroativa | 🟠 **ALTO** | Imutabilidade em nível de banco; versionamento com trilha pública; revogação **no MVP** |
| **R6** | **RLS mal configurada na rota pública** | Vazamento cross-tenant ou exposição de dados privados de outra joalheria | 🟠 **ALTO** | View pública dedicada com colunas explícitas; testes automatizados de isolamento como critério de aceite bloqueante |
| **R7** | **`SERVICE_ROLE_KEY` exposta no cliente** | Bypassa toda a RLS | 🟠 **ALTO** | Server-only; lint/CI check; scan de bundle |
| **R8** | **Confusão de tipo de certificado** | Usuário emite algo que parece laudo gemológico sem habilitação → misrepresentação e risco jurídico | 🟠 **ALTO** | Escopo A/B apenas (6.0); vocabulário da UI rigorosamente não-pericial; nunca usar a palavra "laudo" |
| **R9** | **ERPs de joalheria adicionam a feature** | Já têm o dado da peça e o relacionamento. A emissão é replicável | 🟡 **MÉDIO** | Defesa é a **rede de verificação**, não a emissão (7.2); considerar ser **camada de verificação dos ERPs** em vez de concorrente |
| **R10** | **Qualidade fotográfica heterogênea** | Foto ruim de celular na bancada destrói a credibilidade do certificado | 🟡 **MÉDIO** | Guia de captura na UI; conjunto mínimo obrigatório; validação de resolução/foco mínimos |
| **R11** | **Certificado atrelado à pessoa quebra na revenda** | Se o certificado carrega o comprador original, a revenda o invalida na prática | 🟡 **MÉDIO** | Modelar o certificado como atributo **da peça**; titularidade como camada separada (Fase 2) |
| **R12** | **Confiança não é criada por software** | AMAGOLD e IBGM são os âncoras instalados. Uma plataforma nova não tem autoridade | 🟡 **MÉDIO** | Parceria/integração > competição; exibir credenciais externas do emissor |
| **R13** | **Adoção — joalheiro é low-tech** | Fluxo com fotos e campos técnicos pode ser abandonado no meio | 🟡 **MÉDIO** | Fluxo mobile de 3 min; defaults por tipo de peça; duplicar peça anterior |
| **R14** | **Semijoias/folheados entram no funil** | Público muito maior, mas a natureza do certificado é outra (banho, não teor) | 🟡 **MÉDIO** | Decidir escopo explicitamente (Q4); não misturar modelos de dados |
| **R15** 🆕 | **Selo de autenticidade falso já em produção** | `authenticityHash` é `Math.random()` mas é exibido como selo criptográfico (D1). É uma **afirmação falsa de segurança ao consumidor** | 🔴 **CRÍTICO** | Assinatura real (HMAC/Ed25519 sobre o payload) **ou** remover o rótulo "criptográfico". Não há terceira opção defensável |
| **R16** 🆕 | **Senhas em texto puro + default `123456`** | Todo cliente novo nasce com a mesma senha; credenciais hardcoded no fonte (D2). Portal do cliente expõe CPF e patrimônio em joias | 🔴 **CRÍTICO** | Migrar auth para Supabase Auth; nunca armazenar senha própria; forçar troca no primeiro acesso |
| **R17** 🆕 | **Transferência de posse muta o certificado** | `OwnershipTransferModal` altera `currentOwnerName`/`ownerCpf` no registro existente. Um documento probatório que muda destrói a própria prova (R5) | 🟠 **ALTO** | Titularidade como **entidade separada e versionada**, não campo mutável do certificado |
| **R18** 🆕 | **Ausência total de testes** | `tests/` vazio; zero cobertura sobre lógica de certificação, hierarquia e CPF | 🟠 **ALTO** | Cobertura mínima obrigatória em: geração de código, imutabilidade, isolamento de acesso, validação de CPF |
| **R19** 🆕 | **Dados sem constraint** | `metalPurity`/`StoneType` como `string` livre (D3) tornam o dado não-agregável e não-confiável — e um certificado com teor inconsistente é um certificado inútil | 🟠 **ALTO** | Enums + constraints no Postgres na migração; normalização dos dados existentes |

### 10.2 Discovery Questionnaire — Perguntas que Fecham o Brief

> **As perguntas P0 são bloqueantes para o PRD.**
>
> ✅ **Atualização pós-descoberta do código:** várias P0 foram **respondidas empiricamente pelo protótipo**.
> Onde o código responde, a pergunta muda de *"o que queremos?"* para *"confirmamos o que já foi construído?"*

#### 🔴 P0 — Bloqueantes

| # | Pergunta | Resposta empírica no código | Status |
|---|---|---|---|
| **Q1** | **Que tipo de certificado?** (A) garantia · (B) autenticidade · (C) laudo pericial · (D) avaliação de valor | 🔴 **O protótipo faz A + B + D simultaneamente:** `warrantyMonths`/`warrantyStatus`/`warrantyTerms` (A), dados técnicos da peça (B), **`estimatedValueBRL` (D)**. É exatamente a **conflação** alertada na Seção 1.3 | ⚠️ **AINDA BLOQUEANTE** — a Seção 6.0 recomendava excluir D. O código o inclui. **Decisão consciente necessária:** manter valor monetário significa assumir o vetor de responsabilidade civil mais direto |
| **Q2** | **Quem é o emissor?** Multi-tenant ou grife única? | Papéis `root/admin/operator/customer`; `manufacturer` + `manufacturerLogoUrl` são **campos do certificado**, não de uma entidade `Organização`. **Não há tenant de verdade** — é single-tenant com marca configurável | ⚠️ **BLOQUEANTE** — se o alvo é SaaS multi-tenant, exige refatoração de modelo + RLS |
| **Q3** | **O verificador precisa criar conta?** *(pergunta do stakeholder)* | ✅ **Ambos existem:** `public-passport` e `public-certificate` são **anônimos**; `customer-portal` tem login (`LoginView`, `Customer.password`). Arquitetura correta | ✅ **RESPONDIDA** — manter verificação anônima; confirmar apenas que nenhum dado sensível vaza no modo público |
| **Q4** | **Escopo de materiais** *(pergunta do stakeholder)* | 🔴 **Nenhuma restrição existe.** `metalPurity`, `metalColor`, `finish`, `StoneType` são `string` livre (D3) | ⚠️ **BLOQUEANTE** — não é "quais materiais suportar", é **"precisa haver enum/constraint"**. Hoje não há |
| **Q5** | **Uma peça pode ter múltiplos certificados?** *(pergunta do stakeholder)* | ⚠️ **Existe hierarquia, mas com outra semântica:** `isRoot` + `parentCertId` = **Joia Pai (modelo de catálogo) → Joia Filha (instância do cliente)**. Isso é *1 modelo : N peças*, **não** *1 peça : N certificados ao longo do tempo*. `OwnershipTransferModal` + `MaintenanceRecord.type: 'Transferência de Posse'` tratam revenda **mutando o mesmo certificado** | ⚠️ **BLOQUEANTE** — mutar o certificado na transferência **viola a imutabilidade** (R5). Reavaliação por outro certificador não é representável hoje |
| **Q6** | **Existe cliente/joalheria concreta?** | Dados de exemplo usam "Maison Lumière Joias" (fictício) | ⚠️ **ABERTA** |
| **Q19** 🆕 | **O protótipo é produto ou demo?** Quais dos 23 componentes (3D, IA gemóloga, 360°, care guide) são requisito real vs. vitrine? | — | 🔴 **NOVA P0** — define completamente o escopo do trabalho |
| **Q20** 🆕 | **Migrar para Next.js ou manter Vite+Express?** | Stack real diverge do preset AIOX | 🔴 **NOVA P0** — impacta LCP da página pública (8.2) |

#### 🟠 P1 — Alta prioridade

| # | Pergunta |
|---|---|
| **Q7** | **Quais dados do comprador entram no certificado?** Nenhum, nome, ou nome+CPF? E quais aparecem **publicamente**? (R3, LGPD) |
| **Q8** | **Volume esperado:** peças certificadas/mês e nº de fotos por peça? (dimensiona storage — 8.4) |
| **Q9** | **Monetização:** por certificado, assinatura, freemium? Entra no MVP? (o custo marginal de storage é real e permanente) |
| **Q10** | **O certificado carrega valor monetário de avaliação?** (abre canal de seguradoras, mas é o maior vetor de responsabilidade civil) |
| **Q11** | **As peças são exportadas?** Certificado bilíngue é necessário? |
| **Q12** | **O joalheiro já usa ERP?** Qual? Integração é requisito ou pode ser standalone? (R9) |

#### 🟡 P2 — Média prioridade

| # | Pergunta |
|---|---|
| **Q13** | **Quem são "Aguillera", "Plurigold" e "GGAC"?** Não foram localizados em busca web. São certificadoras, concorrentes, ou parceiros potenciais? (Seção 2.3) |
| **Q14** | **Fotos são obrigatórias ou opcionais?** (Recomendação: obrigatórias — são o vínculo. Ver R1) |
| **Q15** | **Nº de série gravado na peça** é prática do emissor-alvo, ou as peças não são individualmente marcadas? |
| **Q16** | **Customização visual:** template fixo com logo/cores basta, ou o joalheiro precisa de layout próprio? |
| **Q17** | **Há interesse em NFC/gravação a laser** no roadmap, ou o QR é a aposta definitiva? |
| **Q18** | **Confirma Next.js + Supabase + Vercel**, considerando a análise de storage da Seção 8.4? |

### 10.3 Áreas que Precisam de Pesquisa Adicional

1. 🔴 **Parecer jurídico sobre responsabilidade da plataforma** (R2) — enquadramento como operadora de
   publicação vs. corresponsabilidade por certificado falso. **Maior redutor de risco por unidade de
   esforço. Não é pesquisa web — exige advogado.**
2. 🔴 **Entrevistas com 5-8 joalheiros** — validar o processo atual, se fotos são aceitáveis, se há
   nº de série, e disposição a pagar. Nenhuma persona deste brief foi validada com pessoa real.
3. 🟠 **Análise competitiva formal** — ERPs de joalheria (o que realmente oferecem de certificação) +
   soluções internacionais de certificado digital de joia.
4. 🟠 **Contato com AMAGOLD e IBGM** — parceria vs. competição (R12, 7.3).
5. 🟠 **Modelagem de custo real de storage** com fotos reais de joalherias, não estimativas.
6. 🟡 **Confirmar Aguillera / Plurigold / GGAC** (Q13).
7. 🟡 **Requisitos legais mínimos de conteúdo** do certificado de garantia sob o CDC para joias.
8. 🟡 **Acompanhar o EU DPP/ESPR** — se joias entrarem numa categoria delegada, vira requisito de exportação.

---

## 11. Auto-Decisions Registradas

Decisões tomadas autonomamente para desbloquear este brief. **Todas requerem confirmação.**

**[AUTO-DECISION 1]** *Tipo de certificado do MVP* → **Tipos A+B (garantia + autenticidade auto-declarada
pelo joalheiro)**, excluindo laudo pericial (C) e avaliação de valor (D).
**Razão:** minimiza exposição jurídica, maximiza volume, mantém o escopo do modelo de dados tratável.
**Confiança: 65%.** **Impacto se errada: alto** — se o alvo real forem laboratórios gemológicos, o modelo
de dados e o vocabulário mudam substancialmente. → **Q1**

**[AUTO-DECISION 2]** *Verificador não cria conta* → **acesso 100% anônimo.**
**Razão:** o verificador nunca é o pagante e é o lado que gera o efeito de rede. Exigir login elimina
o principal mecanismo de crescimento. Consistente com o conceito declarado pelo stakeholder.
**Confiança: 90%.** → **Q3**

**[AUTO-DECISION 3]** *Relação peça↔certificado* → **1 peça : N certificados, modelado desde o dia 1.**
**Razão:** a pergunta do stakeholder já indica que o caso existe (revenda, reavaliação, múltiplos
certificadores). Colapsar em 1:1 e reverter depois é migração destrutiva com dados em produção. O custo
de modelar N desde o início é baixo; o custo de reverter é alto.
**Confiança: 85%.** → **Q5**

**[AUTO-DECISION 4]** *Escopo de materiais* → **ouro (18k/14k/10k), prata 925 e platina 950;
semijoias/folheados FORA.**
**Razão:** todos os metais nobres compartilham o mesmo modelo (tipo + teor), então restringir a 18k+925
não reduz complexidade — só reduz mercado. Semijoia é outro produto: certifica banho e espessura, não teor.
**Confiança: 75%.** → **Q4**

**[AUTO-DECISION 5]** *Storage de fotos* → **Supabase Storage + Smart CDN + pipeline de otimização
obrigatório na ingestão.**
**Razão:** o Supabase Storage já tem CDN; o problema real é volume de bytes na origem, resolvido no
pipeline. Adicionar um segundo fornecedor no MVP não se justifica; migrar depois é barato se as
derivadas forem servidas por uma camada abstraída. **Confiança: 80%.** → **Q18** e validação de @architect

**[AUTO-DECISION 6]** *Revogação e versionamento entram no MVP* (estavam fora na v0.1).
**Razão:** certificado de joia é documento probatório permanente. Um certificado errado e irrevogável
é passivo permanente e destrói a credibilidade da verificação. **Confiança: 90%.**

**[AUTO-DECISION 7]** *Fotos obrigatórias com conjunto mínimo guiado* (frente, verso, marcação).
**Razão:** sem foto, o certificado não estabelece nenhum vínculo com a peça física (R1) e o produto é
apenas um gerador de PDF. **Confiança: 80%.** → **Q14**

**[AUTO-DECISION 8]** *Dados do comprador não aparecem na página pública.*
**Razão:** o certificado atesta a peça, não o dono. Nome + joia de valor + acesso público = risco físico
ao titular, além de quebrar na revenda (R3, R11). **Confiança: 85%.** → **Q7**

---

## 12. Next Steps

### 12.1 Ações Imediatas — REORDENADAS após a descoberta do código

1. 🔴 **Corrigir `core-config.yaml`:** `project.type: greenfield` → `brownfield`. Reavaliar o preset
   `nextjs-react` contra a stack real (React+Vite+Express+Bun).
2. 🔴 **Tratar D1 e D2 como incidentes, não como backlog.** O selo de autenticidade falso (R15) e as
   senhas em texto puro com default `123456` (R16) não devem sobreviver a nenhuma demonstração pública.
3. 🔴 **Responder Q19 (protótipo é produto ou demo?)** — nenhum planejamento de escopo é possível antes.
   Q1, Q2, Q4, Q5 e Q20 seguem bloqueantes.
4. 🔴 **Obter parecer jurídico** (R2) — agora mais urgente, porque o produto **já exibe** `estimatedValueBRL`
   (avaliação de valor, tipo D) **e** um selo de autenticidade falso ao consumidor final.
5. 🟠 **Rodar Brownfield Discovery**, não Story Development Cycle a partir do zero:
   - `@architect` → `analyze-brownfield` · arquitetura atual, decisão Next.js vs. Vite (Q20), storage 360° (8.4)
   - `@data-engineer` → schema Supabase a partir de `src/types.ts`, RLS, imutabilidade, enums (D3/R19)
   - `@qa` → cobertura de testes a partir do zero (R18)
6. 🟠 **Entrevistar 5-8 joalheiros** — nenhuma persona deste brief foi validada com pessoa real.
7. 🟡 **@analyst `*competitor-analysis`** — ERPs de joalheria + soluções internacionais de certificação digital.
8. 🟡 **@pm** — o artefato correto é provavelmente um **Brownfield PRD**, não um PRD de MVP greenfield.

### 12.2 Sequência Recomendada de Agentes

```
[Corrigir core-config: greenfield → brownfield]
        ↓
[Stakeholder responde Q19 (produto vs. demo), Q1, Q2, Q4, Q5, Q20]  +  [Parecer jurídico R2]
        ↓
@architect  → analyze-brownfield: arquitetura atual, stack decision, storage 360°
        ↓
@analyst    → atualizar este brief para v1.1 (sem [HIPÓTESE] bloqueantes)
        ↓
@pm         → Brownfield PRD + épicos  (épico 0 = D1/D2, correções críticas)
        ↓
@data-engineer → schema Supabase + RLS + migrations (a partir de src/types.ts)
        ↓
@sm *draft  →  @po *validate  →  @dev *develop  →  @qa *qa-gate  →  @devops *push
```

### 12.3 PM Handoff

Este Project Brief fornece o contexto disponível para **`certificado` — Plataforma de Certificação de
Joias**.

> ⚠️ **@pm — atenção crítica no handoff:**
>
> 1. **A v0.1 do brief estava em domínio 100% incorreto** (certificados de curso). **Esta versão (JOIAS)
>    é a verdadeira.** Se você tiver qualquer contexto residual de "cursos", "alunos", "turmas",
>    "emissão em lote" ou "Open Badges" — **descarte integralmente**. Os arquivos v0.1 estão em
>    `docs/archive/` com sufixo `DEPRECATED` e não devem ser lidos.
>
> 2. **Não inicie o PRD antes das respostas Q1–Q6.** Q1 (tipo de certificado) define a responsabilidade
>    jurídica do produto inteiro. Q5 (1:N peça↔certificado) é uma decisão de schema irreversível.
>
> 3. **R1, R2 e R3 são CRÍTICOS e não são riscos técnicos** — são riscos de produto e jurídicos:
>    - **R1:** o QR **não** prova autenticidade da peça física. Nenhum requisito, texto de UI ou material
>      de marketing pode afirmar que prova. Prometer isso é risco jurídico.
>    - **R2:** a plataforma **não certifica** — ela registra e publica declarações do emissor. Isso deve
>      estar embutido em requisitos de UI, não só nos Termos de Uso.
>    - **R3:** stripping de EXIF é **requisito de segurança bloqueante**, não otimização.
>
> 4. **Revogação e versionamento estão DENTRO do MVP** (mudança em relação à v0.1). Neste domínio,
>    um certificado imutável e irrevogável é passivo permanente.
>
> 5. **Os números de mercado deste brief têm confiança BAIXA** e divergem entre fontes em uma ordem de
>    grandeza. **Não os propague ao PRD como fato** (Artigo IV — No Invention).
>
> 6. **"Aguillera", "Plurigold" e "GGAC" não foram verificados** — não os cite como concorrentes ou
>    referências sem confirmação (Q13).

---

## Apêndice A — Referências

### Domínio: certificação, laudos e regulamentação de joias no Brasil

- [Certificação e laudo técnico pericial: qual é a diferença? — Jusbrasil](https://www.jusbrasil.com.br/noticias/certificacao-e-laudo-tecnico-pericial-voce-sabe-qual-e-a-diferenca-dos-dois-na-venda-e-compra-de-joias-e-metais-preciosos/1150018145)
- [Certificado de Autenticidade de Joias — Lindyse Joias](https://lindysejoias.com/blog/certificado-autenticidade-joia-ouro/)
- [Garantia de joias: é importante emitir certificado? — Bautz](https://www.bautz.com.br/blog/garantia-de-joias-e-importante)
- [Avaliação de Joias e Partilhas — Revista Kdea 360](https://revistakdea360.com.br/noticia/46295/avaliacao-de-joias-e-partilhas)
- [Laudo Gemológico — The Best Deal Joias](https://thebestdealjoias.com.br/servicos/laudo/)
- [O que é Certificado de diamante (GIA) — Reisman](https://blog.reisman.com.br/certificado-de-diamante-gia/)

### Regulamentação (Inmetro, CDC)

- [Inmetro — Regulamentação para comercialização de bijuterias e joias](https://www.gov.br/inmetro/pt-br/acesso-a-informacao/perguntas-frequentes/avaliacao-da-conformidade/bijuterias-e-joias/qual-a-regulamentacao-para-a-comercializacao-de-bijuterias-e-joias)
- [Inmetro — Produtos abrangidos pela medida regulatória](https://www.gov.br/inmetro/pt-br/acesso-a-informacao/perguntas-frequentes/avaliacao-da-conformidade/bijuterias-e-joias/quais-os-produtos-abrangidos-pela-atual-medida-regulatoria-para-bijuterias-e-joias)
- [Portaria Inmetro nº 123/2021 — limites de cádmio e chumbo](https://legislacao.contabil.business/14184) · [Inmetro (notícia)](https://www.gov.br/inmetro/pt-br/centrais-de-conteudo/noticias/inmetro-estabelece-limites-para-cadmio-e-chumbo-em-bijuterias-e-joias)
- [Acreditação laboratorial no Brasil (Cgcre/Inmetro) — LAPEGE/CETEM](https://www.cetem.gov.br/antigo/images/congressos/2012/CAC00420012.pdf)
- [Garantia legal, contratual e estendida no CDC — Jusbrasil](https://www.jusbrasil.com.br/artigos/a-garantia-legal-contratual-e-estendida-no-cdc-prescricao-e-decadencia/1150266504)
- [Garantia de loja ou fabricante — IDEC](https://idec.org.br/dicas-e-direitos/garantia-de-loja-ou-fabricante)
- [Projeto de lei sobre o setor — Câmara dos Deputados](https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?codteor=2197600)

### Certificadores e laboratórios brasileiros

- [IBGM — Laboratório Gemológico](https://ibgm.com.br/servico/laboratorio-gemologico/) · [Serviços](https://www.gemologiaibgm.com.br/laboratorio/servicos-gemologicos/) · [Tarifas](https://www.gemologiaibgm.com.br/laboratorio/servicos-gemologicos/tarifas/)
- [AMAGOLD — sobre](https://amagold.com.br/about/) · [informações](https://amagold.com.br/informacoes/) · [Wikipédia](https://pt.wikipedia.org/wiki/Amagold)
- [GEMLAB — Gemologia e Engenharia Mineral](https://www.gemlab.com.br/pages/index.php?secao=9)
- [Laboratório Gemológico da AJORIO](https://www.sistemaajorio.com.br/web/index.php/servicos/laborat-gemolo-mainmenu-60)
- [AS Gemologia — Certificados](http://asgemologia.com.br/certificados.html) · [Gemas Lab](https://gemaslab.com.br/) · [Centro Gemológico de Análises](https://www.centrogemologico.com.br/)
- [Avaliação ou Certificação? — GemsConsult](http://www.gemsconsult.com.br/2019/05/07/avaliacao-certificacao/)

### Mercado

- [Mercado de joias no Brasil: previsões 2026 — Nuvemshop](https://www.nuvemshop.com.br/blog/mercado-de-joias/)
- [Mercado brasileiro de joias e semijoias deve dobrar até 2030 — Munra](https://munra.com.br/blog-detalhes/mercado-brasileiro-de-joias-e-semijoias-deve-dobrar-faturamento-ate-2030) · [Radar Digital Brasília](https://radardigitalbrasilia.com.br/noticias-corporativas-dino/319847-mercado-de-joias-no-brasil-deve-dobrar-faturamento-ate-2030/)
- [IBGM — institucional](https://ibgm.com.br/)

### Anti-falsificação e rastreabilidade

- [Blockchain enabled traceability in the jewel supply chain — Nature Scientific Reports](https://www.nature.com/articles/s41598-025-88245-4) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11782479/)
- [How Blockchain Authentication Is Fighting Jewelry Counterfeiting — Tashvi AI](https://tashvi.ai/blog/blockchain-authentication-jewelry-counterfeiting)
- [ArtProtect: Blockchain and NFC-based anti-counterfeit system — IET Blockchain/Wiley](https://ietresearch.onlinelibrary.wiley.com/doi/full/10.1049/blc2.12069)
- [Blockchain & NFC DPP Integration — NFCwork](https://nfcwork.com/how-to-integrate-blockchain-with-nfc-digital-product-passports-to-protect-data/)
- [NFC in Cultural Collectibles and Jewelry Systems — DTB NFC](https://www.dtbnfc.com/blogs/nfc-in-cultural-collectibles-and-jewelry-systems)
- [Anti-counterfeit QR codes with blockchain — iCheckQR](https://icheckqr.com/blog/knowledge/create-anti-counterfeit-qr-code-with-blockchain)

### Digital Product Passport (item de observação, não requisito)

- [EU Ecodesign & Digital Product Passport — Intertek](https://www.intertek.com/blog/2025/05-28-eu-ecodesign-digital-product-passport/)
- [EU DPP Requirements: 2027 ESPR Compliance Guide — Veribl](https://www.veribl.com/blog/espr-2027-compliance-guide)
- [Digital Product Passports in the EU under ESPR — Hogan Lovells](https://www.hoganlovells.com/en/publications/digital-product-passports-in-the-eu-comprehensive-expansion)

### Concorrência indireta — ERPs de joalheria

- [Alfa Networks — ERP para Joias e Semi Joias](https://www.alfanetworks.com.br/produtos/sistema-gestao-erp/sistema-erp-para-joias-e-semi-joias)
- [ONCLICK — ERP joalheria/semijoias, peça serial](https://onclick.com.br/erp-gestao-joalheria-semijoias-consignacao-serial-2026/)
- [Gestão Joias](https://gestaojoias.com.br/) · [Soften](https://www.softensistemas.com.br/sistema-para-loja-semijoias) · [Eccosys](https://eccosys.com.br/erp-para-joias-e-semijoias) · [Mikon](https://mikon.com.br/erp-semijoias) · [ERP Suite](https://erpsuite.com.br/sistema-para-joalherias) · [eGestor](https://egestor.com.br/segmentos/loja-de-joias.php)

### Internas do projeto

- `.aiox-core/core-config.yaml` — configuração greenfield
- `.aiox-core/data/technical-preferences.md` — preset ativo `nextjs-react`
- `.env.example` — slots Supabase/Vercel/Sentry pré-provisionados
- `.aiox-core/constitution.md` — Artigo IV (No Invention)
- `docs/archive/` — briefs v0.1 **DEPRECATED** (domínio incorreto)

---

## Change Log

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-08-13 | v0.1 | Draft inicial a partir de evidência de repositório. **Domínio inferido incorretamente (certificados de curso). DESCARTADO.** | Atlas (@analyst) |
| 2026-08-13 | **v1.0** | **Rewrite completo — domínio JOIAS confirmado pelo stakeholder.** Nova pesquisa de mercado, certificadores brasileiros, regulamentação Inmetro/CDC, tecnologias anti-falsificação. 8 auto-decisions, 14 riscos (3 críticos), 18 perguntas de discovery (6 P0). Análise de storage de imagens como decisão de viabilidade econômica. | Atlas (@analyst) |
| 2026-08-13 | **v1.0.1** | **Descoberta do código-fonte durante a redação — projeto é BROWNFIELD, não greenfield.** Stack real (React+Vite+Express+Bun) diverge do preset. 5 defeitos confirmados no código (D1–D5), incluindo `authenticityHash` = `Math.random()` e senhas em texto puro. Q3 respondida empiricamente; Q1/Q2/Q4/Q5 reformuladas; Q19/Q20 adicionadas. +5 riscos (R15–R19, 2 críticos). Storage recalculado incluindo `frames360[]`. Sequência de agentes trocada para Brownfield Discovery. | Atlas (@analyst) |
