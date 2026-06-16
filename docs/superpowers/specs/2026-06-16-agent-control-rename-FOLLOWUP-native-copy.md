# Follow-up: upgrade Agent Control copy to mention native tools

> **Status:** PENDING — do NOT apply until the trigger condition is met.
> **Trigger:** Phase 1/2 (`feat/mcp-bash-hook` + `feat/mcp-hook-approval`) are merged to
> `develop` AND this rename branch (`feat/agent-control-rename`) has been rebased on top.
> **Why gated:** The fuller copy claims native-tool (Bash) gating. That capability only
> exists once Phase 1/2 merge. Applying it before then would make `develop` claim a feature
> it doesn't have. Until then, the truthful copy is "agent tool calls".
> **Decision (2026-06-16):** land this as a **one-commit follow-up on the rebased rename
> branch**, in the same PR as the rebased rename.

This is a mechanical, ~2-minute change: 2 English component strings + their 6 i18n
values (2 keys × de/fr/es). Exact before/after below — apply verbatim.

## 1. Component strings (English)

`Clients/src/presentation/pages/AIGateway/MCPAuditLog/index.tsx` (~L130):
- FROM: `description="Every tool call your AI agents make, with outcome, latency, and which agent."`
- TO:   `description="Every tool call your AI agents make — MCP tools and native tools like Bash — with outcome, latency, and which agent."`

`Clients/src/presentation/pages/AIGateway/MCPGuardrails/index.tsx` (~L299):
- FROM: `description="Scan agent tool calls for PII, prohibited content, or prompt injection — block or mask matches."`
- TO:   `description="Scan agent tool calls — MCP and native tools like Bash — for PII, prohibited content, or prompt injection; block or mask matches."`

## 2. i18n re-key (Clients/src/i18n/translations.ts)

The DOM translator keys on the English string, so the KEY must change to the new English
above in all three language blocks, and the VALUE gets the native-tool mention. Both keys
currently appear once per de/fr/es block (6 entries total).

**Key A — Activity description** (current key: `"Every tool call your AI agents make, with outcome, latency, and which agent."` → new key = new EN above):
- de value → `"Jeder Tool-Aufruf Ihrer KI-Agenten — MCP-Tools und native Tools wie Bash — mit Ergebnis, Latenz und ausführendem Agenten."`
- fr value → `"Chaque appel d'outil effectué par vos agents IA — outils MCP et outils natifs comme Bash — avec le résultat, la latence et l'agent concerné."`
- es value → `"Cada llamada a herramienta que hacen sus agentes de IA — herramientas MCP y herramientas nativas como Bash — con el resultado, la latencia y qué agente."`

**Key B — Guardrails description** (current key: `"Scan agent tool calls for PII, prohibited content, or prompt injection — block or mask matches."` → new key = new EN above):
- de value → `"Durchsuchen Sie Agent-Tool-Aufrufe — MCP und native Tools wie Bash — nach PII, unzulässigen Inhalten oder Prompt-Injection; Treffer blockieren oder maskieren."`
- fr value → `"Analysez les appels d'outils des agents — MCP et outils natifs comme Bash — à la recherche de données personnelles, de contenu interdit ou d'injection de prompt ; bloquez ou masquez les correspondances."`
- es value → `"Analice las llamadas a herramientas de los agentes — MCP y herramientas nativas como Bash — en busca de PII, contenido prohibido o inyección de prompts; bloquee o enmascare las coincidencias."`

(Translations are machine-generated, not native-reviewed — same caveat as the rename i18n.)

## 3. Optional: user-guide native-tool mention

Once Phase 1/2 are in, the Activity user-guide article (`shared/user-guide-content/content/ai-gateway/mcp-audit.ts`)
and the overview may mention that Activity covers native tools (Bash), not just MCP. Lower
priority; the descriptions above are the load-bearing copy. If updated, copy to the website
mirror per the docs workflow.

## Apply checklist (when triggered)
- [ ] Confirm Phase 1/2 merged to develop and this branch rebased on top.
- [ ] Edit the 2 component strings (§1).
- [ ] Re-key + re-translate the 2 i18n keys × 3 languages (§2).
- [ ] `cd Clients && npx tsc --noEmit` clean for translations.ts; `npm run build` passes.
- [ ] Browser: Activity + Guardrails descriptions show the native-tool phrasing (en), and de renders translated.
- [ ] One commit: `feat(ai-gateway): mention native-tool gating in Agent Control copy`.
- [ ] Delete this follow-up doc (its job is done).
