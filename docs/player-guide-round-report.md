# AGES OF HEGEMONY
## Relatório Operacional · Rodada B: Manual, Onboarding & Compêndio

**Branch:** `feature/aoh-player-guide-compendium`  
**Base commit:** `f58bb57` (`feat: refine playable map and strategy interface`)  
**Data:** 18 de Setembro de 2026  
**Status dos Gates:** PASS (lint, typecheck, vitest 297/297, e2e 2/2, db:validate, build)

---

### 1. Documentação Criada

Foram produzidos 6 documentos institucionais e instrucionais com tom de manual de jogo de estratégia de tabuleiro/PC (sem jargões de API ou marketing vago):

1. **[Conceito de Produto](file:///C:/Users/Rafael/Desktop/DEV/Ages%20of%20Hegemony/docs/product-concept.md)** (`docs/product-concept.md`):
   - Visão histórica, pilares temáticos, cartografia como tabuleiro vivo, autoridade e instituições.
2. **[Guia Rápido de Partida](file:///C:/Users/Rafael/Desktop/DEV/Ages%20of%20Hegemony/docs/quick-start.md)** (`docs/quick-start.md`):
   - Primeiros 5 passos práticos para jogadores novos (Manutenção inicial, seleção da capital, distribuição de habitantes, reivindicação e território trabalhado).
3. **[Manual do Jogador](file:///C:/Users/Rafael/Desktop/DEV/Ages%20of%20Hegemony/docs/player-guide.md)** (`docs/player-guide.md`):
   - Ciclo de 4 fases da rodada (Manutenção, Planejamento, Ação, Resolução), gestão de cidades, especialização urbana, expansão soberana e governança.
4. **[Referência de Regras](file:///C:/Users/Rafael/Desktop/DEV/Ages%20of%20Hegemony/docs/rules-reference.md)** (`docs/rules-reference.md`):
   - Fórmulas exatas de Carga Administrativa, Capacidade, Sobre-extensão (Overextension), Faixas de Estabilidade (Próspera a Crítica), Consumo alimentar, Crescimento e slots.
5. **[Glossário Canônico](file:///C:/Users/Rafael/Desktop/DEV/Ages%20of%20Hegemony/docs/glossary.md)** (`docs/glossary.md`):
   - Definição formal de termos canônicos (Hexágono, Soberania, Território Trabalhado, Capacidade Administrativa, Carga, Estabilidade, Papéis Sociais, Distritos, Edifícios).
6. **[Compêndio Geral](file:///C:/Users/Rafael/Desktop/DEV/Ages%20of%20Hegemony/docs/compendium.md)** (`docs/compendium.md`):
   - Catálogo estruturado de todas as cartas: 5 Governos, 7 Distritos, 7 Edifícios, 5 Melhorias de Terreno, 5 Papéis Sociais e 5 Recursos estratégicos.

---

### 2. Interface Desenvolvida (UI/UX)

1. **Compêndio Integrado (`CompendiumModal`)**:
   - Componente em `apps/web/app/play/compendium-modal.tsx`.
   - Acesso via botão de cabeçalho `📖 Compêndio`.
   - Navegação por abas de categorias: *Governos*, *Distritos*, *Edifícios*, *Melhorias*, *População*, *Recursos*, *Regras & Conceitos*.
   - Busca em tempo real com filtro textual instantâneo.
   - Apresentação em cartões compactos com ícones temáticos, custo, efeito mecânico, sinergias e trade-offs.
   - Modal em overlay não-obstrutivo, sem poluição da visualização cartográfica padrão.
2. **Onboarding Interativo Sequencial**:
   - Adicionado a `apps/web/app/play/game-shell.tsx`.
   - Exibição de apenas um passo contextual por vez calculado a partir do estado real da sessão (`getOnboardingStep`):
     - Passo 1: Concluir manutenção inicial.
     - Passo 2: Selecionar capital no atlas/conselho.
     - Passo 3: Alocar habitantes na cidade.
     - Passo 4: Reivindicar hexágono soberano.
     - Passo 5: Atribuir território trabalhado.
   - Controles de minimizar/expandir e dispensar (`×`).
   - Botão **✦ Reiniciar Tutorial** disponível dentro do compêndio para reativação a qualquer momento.
3. **Ajuda de Contexto (Tooltips/Explicações)**:
   - Tooltips concisos implementados nos indicadores de Administração (carga/capacidade/penalidades de sobre-extensão), Estabilidade, Níveis de Desenvolvimento e Território Trabalhado.

---

### 3. Validação Cruzada de Regras & Discrepâncias

- **Governos:** Validados os modificadores de Monarquia, República, Teocracia, Oligarquia e Confederação Tribal contra `packages/engine/src/rules/config.ts`.
- **Distritos & Edifícios:** Validados os 7 distritos (Agrário, Comercial, Acadêmico, Administrativo, Militar, Industrial, Cultural) e 7 edifícios (Celeiro, Mercado, Biblioteca, Arquivo, Quartel, Oficina, Centro Cultural).
- **Melhorias Rurais:** Validadas Fazenda (planície), Acampamento Madeireiro (floresta), Pedreira (colina/montanha), Mina (montanha/colina), Pescaria (costa).
- **Sistemas Futuros Registrados:** Pesquisa (planejado), Diplomacia (planejado), Militar/Unidades (futuro), Hegemonia (futuro), Multiplayer Online (futuro). Nenhuma mecânica inexistente foi afirmada como funcional.

---

### 4. Testes Automatizados & Evidências Visuais

1. **Vitest Regression Suite:**
   - Adicionado `tests/compendium-onboarding.test.ts` (5 testes unitários cobrindo governos, distritos, edifícios, melhorias e regras).
   - Total: **14 suítes, 297 testes passando** (0 falhas).
2. **Playwright E2E Suite:**
   - Adicionada verificação de abertura de compêndio, navegação entre abas de categorias, busca textual, dispensa de onboarding e reativação via botão "✦ Reiniciar Tutorial".
   - Total: **2/2 testes E2E passando**.
3. **Capturas de Tela (1440x900, 1280x800, 390x844):**
   - Evidências arquivadas em `docs/evidence/visual-closure-v1/`:
     - `1440-compendium.png`, `1280-compendium.png`, `390-compendium.png`.
     - `1440-world-map.png`, `1280-world-map.png`, `390-world-map.png`.
     - `1440-selected-city.png`, `1280-selected-city.png`, `390-selected-city.png`.
     - `1440-round-report.png`, `1280-round-report.png`, `390-round-report.png`.

---

### 5. Git Status & Commit Proposto

- **Branch:** `feature/aoh-player-guide-compendium`
- **Mensagem do commit:** `feat: add player onboarding and game compendium`
- **Arquivos modificados/adicionados:**
  - `docs/product-concept.md`
  - `docs/quick-start.md`
  - `docs/player-guide.md`
  - `docs/rules-reference.md`
  - `docs/glossary.md`
  - `docs/compendium.md`
  - `docs/player-guide-round-report.md`
  - `apps/web/app/play/compendium-modal.tsx`
  - `apps/web/app/play/game-shell.tsx`
  - `apps/web/app/style.css`
  - `tests/compendium-onboarding.test.ts`
  - `e2e/local-play.spec.ts`
  - Evidências PNG em `docs/evidence/`
