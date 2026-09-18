# Relatório de Conclusão Visual & Interativa — Rodada A (v1)

**Data:** 18/09/2026  
**Branch:** `feature/aoh-visual-interaction-v1`  
**Base:** `3b8f8d3` (`feat: add local playable product slice`)  
**Commit de entrega:** `feat: refine playable map and strategy interface`

---

## 1. Baseline
- **Branch de origem:** `feature/aoh-playable-product-slice` (HEAD commit `3b8f8d3`).
- **Estado inicial:** 286 testes unitários/integração Vitest aprovados; 2 testes E2E Playwright aprovados.
- **Limitação conhecida prévia:** Erro runtime `Cannot read properties of null reading 'clientWidth'` no componente `hex-map.tsx` durante interações de arraste (pointer/pan).

---

## 2. Causa Raiz do Crash no Mapa (Priority 0)
- **Localização:** `apps/web/app/play/hex-map.tsx`, dentro do callback de evento `onPointerMove`.
- **Mecanismo de falha:** O código acessava `e.currentTarget.clientWidth` e `e.currentTarget.clientHeight` dentro do setter de estado funcional `setPan(p => ({ x: p.x + dx * width / e.currentTarget.clientWidth / zoom, ... }))`. Em React, callbacks de atualização de estado podem ser executados assincronamente ou após o descarte do evento sintético, momento no qual `e.currentTarget` já se tornou `null`. Além disso, se o ponteiro saísse dos limites do elemento SVG ou sofresse cancelamento, `e.currentTarget` ficava inacessível, gerando a exceção fatal no runtime.

---

## 3. Correção do Crash (Priority 0 Fix)
- **Implementação:**
  1. Criação de referência DOM estável `svgRef = useRef<SVGSVGElement | null>(null)` associada ao elemento `<svg>`.
  2. Amostragem síncrona das dimensões antes de invocar `setPan`, com fallbacks numéricos seguros (`clientW > 0 ? clientW : 800` e `clientH > 0 ? clientH : 600`) obtidos via `svgRef.current?.clientWidth || svgRef.current?.getBoundingClientRect().width`.
  3. Desacoplamento total do objeto de evento dentro dos setters de estado.
  4. Manipulação resiliente dos eventos `onPointerUp`, `onPointerLeave`, `onPointerCancel` e `onLostPointerCapture` para resetar o estado de arraste de forma segura.
  5. Testes de regressão cobrindo o cálculo de pan com dimensões nulas/zeradas em `tests/ui-presentation-regression.test.ts` e testes dinâmicos de pointer (arraste rápido, saída dos limites e cancelamento) no Playwright E2E.

---

## 4. Mudanças na Interface (UI Changes)
- **Estilo Cartográfico Histórico:** Substituída a aparência de planilha/dashboard técnico por uma identidade cartográfica sóbria e refinada, com tipografia nobre para títulos (`Cinzel`/Georgia), paleta natural inspirada em mapas antigos e superfícies escuras com acabamento bronze institucional.
- **Barra Superior Consolidada:** Apresentação clara da civilização, estoque tabular de recursos (alimento, materiais, riqueza, conhecimento, influência), medidor administrativo com indicação de sobre-extensão e identificação da era/rodada.
- **Barra Inferior & Feedback:** Micro-feedback dinâmico com indicador contextual de decisões aplicadas, aviso de fases e botão de avanço proeminente.
- **Onboarding Helper (Priority 7):** Banner de orientação inicial agora é tanto descartável (`×`) quanto minimizável (`Minimizar` / `Expandir`), sem ocupar permanentemente a visão do mapa.

---

## 5. Transformação do Mapa (Map Changes — Priority 1 & 3)
- **Diferenciação Visual dos Terrenos:** Texturas vetoriais SVG sutis (`#sea-waves` para costas/mares, `#forest-dots` para florestas, `#hills-hatching` para colinas, sombreados em picos de montanha).
- **Gramática de Estados Territoriais:**
  - `OWNED`: Borda contínua na cor da civilização soberana (3.5px) com suave preenchimento translúcido (16% opacidade).
  - `WORKED`: Emblema cívico com selo dourado no canto superior direito (`worked-seal`).
  - `SELECTED`: Borda dupla reforçada de alto contraste (`#ffffff`, 5px) com realce cartográfico.
  - `CLAIMABLE` (Elegível): Borda tracejada em estilo fronteira colonial (`stroke-dasharray: 6 4`).
  - `UNAVAILABLE`: Desaturação e opacidade reduzida (0.42) para territórios inelegíveis no modo de trabalho.
  - `IMPROVEMENTS`: Ícones específicos por tipo de melhoria rural (🌾 Fazenda, 🪵 Serraria, 🪨 Pedreira, ⛏ Mina, 🐟 Pesqueiro) em medalhão no canto superior esquerdo.

---

## 6. Cidades como Âncoras do Mapa (City Presence — Priority 2)
- **Monumento Urbano:** Cidades agora possuem base fortificada de alvenaria (`city-plate`) e silhueta arquitetônica distinta.
- **Distinção da Capital:** Capital civilizacional identificada com muralha imperial, torre de menagem, jóia na coroa e laurel dourado `★`, placa com nome em ouro envelhecido.
- **Painel de Informações Legível:** Nome da cidade em faixa contrastante, acompanhado de pílula demográfica indicando população e nível de desenvolvimento (`hab · DEV I-V`), perfeitamente legíveis mesmo com zoom reduzido ou pan acelerado.

---

## 7. Redesenho do Painel Lateral (Inspector — Priority 4, 5 & 6)
- **Hierarquia Estruturada com Divulgação Progressiva:**
  1. `OVERVIEW`: Identificação da cidade/capital, indicadores vitais, medidor de estabilidade social e progresso de crescimento populacional.
  2. `ECONOMY`: Matriz tabular de produção por manutenção, fontes de receita e aporte de capacidade administrativa da infraestrutura.
  3. `POPULATION`: Gestão de alocação de habitantes com validação visual de alocação, contadores e botão "Aplicar distribuição".
  4. `TERRITORY`: Painel de territórios trabalhados por produtores com gatilho contextual para o modo de atribuição no mapa.
  5. `DEVELOPMENT`: Nível urbano, limites demográficos e ação principal "Desenvolver cidade".
  6. `DISTRICTS & BUILDINGS`: Slots de distritos, edifícios construídos e atalhos para expansão urbana.
- **Hierarquia de Ações:** Distinção entre ações principais (`button.primary`) e secundárias (`button.action-secondary`).
- **Justificativas de Ações Desabilitadas:** Ações bloqueadas exibem crachá informativo com a razão exata derivada da validação autoritativa do domínio (`ruleMessage`).

---

## 8. Relatório Estratégico da Rodada (Priority 8)
- Modal de fechamento de rodada reestruturado como briefing de conselho de estado:
  - Balanço de produção creditada e consumo de alimentos (`2 / 2 alimentados`).
  - Variação líquida dos estoques.
  - Ajuste e status de capacidade administrativa (com alerta de sobre-extensão).
  - Boletim cronológico dos eventos estratégicos da perspectiva do jogador.

---

## 9. Acessibilidade
- Semântica de botões preservada e aprimorada.
- Rótulos acessíveis `aria-label` e `role="button"` nos territórios e controles.
- Contraste visual aprimorado em conformidade com WCAG AA.
- Suporte para navegação via teclado (`Enter` e `Espaço` selecionam territórios).
- Suporte a `prefers-reduced-motion`.

---

## 10. Testes Automatizados
- **Suíte Unitária / Integração (Vitest):**
  - Total: **292 testes aprovados** em 13 arquivos (286 baseline + 6 novos testes de regressão de UI e cálculo de pan).
  - Arquivo adicionado: `tests/ui-presentation-regression.test.ts`.
- **Suíte E2E (Playwright):**
  - Total: **2 testes aprovados** em `e2e/local-play.spec.ts`.
  - Inclui teste de regressão do ponteiro com arraste agressivo e saída de limites.
  - Validação de que nenhum erro de browser (`pageerror`) ocorre.

---

## 11. Evidências Visuais Capturadas
Armazenadas sob o diretório [`docs/evidence/visual-closure-v1/`](file:///C:/Users/Rafael/Desktop/DEV/Ages%20of%20Hegemony/docs/evidence/visual-closure-v1):
- **Cenas obrigatórias capturadas em 3 resoluções (1440x900, 1280x800 e 390x844):**
  1. `world-map`: Visão geral do mapa cartográfico e territórios revelados.
  2. `selected-city`: Capital Aurélia selecionada com painel demográfico e vitais.
  3. `selected-territory`: Território selecionado com soberania, rendimentos e ações.
  4. `district-decision`: Catálogo de construção de distritos e edifícios em modal.
  5. `round-report`: Briefing estratégico da rodada com balanço econômico e eventos.
  6. `government-panel`: Conselho civilizacional e adoção de governos.

---

## 12. Fragilidades de UX Remanescentes & Débito Técnico
- **Modo de atribuição de territórios:** A seleção de múltiplos hexes rurais no mapa exige alternância de modo manual ("Atribuir território" / "Aplicar territórios"). No futuro, uma pré-visualização em tempo real de rendimento por clique tornará a experiência ainda mais fluida.
- **Fog of War:** Nesta fatia, o mapa é totalmente revelado para testes locais da engine; mecânicas de exploração e névoa de guerra são sistemas previstos para rodadas posteriores.

---

## 13. Verificações dos Gates
- `npm run lint`: **PASS** (0 warnings, 0 erros)
- `npm run typecheck`: **PASS** (0 erros de tipagem)
- `npm test`: **PASS** (292/292 testes verdes)
- `npm run build`: **PASS** (compilação Next.js estática e dinâmica concluída)
- `npm run db:validate`: **PASS** (schema Prisma validado)
- `git diff --check`: **PASS**

---

## 14. Status do Git & Commit
- **Branch:** `feature/aoh-visual-interaction-v1`
- **Mensagem do commit:** `feat: refine playable map and strategy interface`
