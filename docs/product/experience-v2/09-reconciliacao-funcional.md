# Experience V2.2 — Reconciliação funcional (regras × UI)

Data: 2026-10-03. Auditoria; nada implementado no produto.

**Ordem de autoridade usada:** (1) código do Alpha, (2) Canonical Spec V4 e decisões DEC aprovadas, (3) Bíblia v3.1, (4) OpenSpec (`openspec/changes/*`), (5) docs de regras. O **protótipo V2.1 (`prototype/index.html`) não é fonte de regra**: ele é referência de UI/UX e linguagem visual, com regras reduzidas.

## Classes

| Classe | Significado |
|---|---|
| **CANÔNICO** | definido pela V4 ou por decisão aprovada |
| **ALPHA** | implementado e jogável no código do Alpha |
| **CONCEITUAL** | existe só como desenho, texto ou protótipo |
| **DIVERGENTE** | Alpha, V4 e/ou Bíblia dizem coisas diferentes |
| **FUTURO** | classe C/D da V4 ou fora do Alpha por decisão |
| **DECISÃO** | não pode avançar sem decisão do PO |

Um sistema pode ter mais de uma classe.

## Matriz por sistema

| Sistema | Classes | Alpha (código) | Canônico / decisão | Bíblia | Protótipo V2.1 (só UI) |
|---|---|---|---|---|---|
| Economia | ALPHA · CANÔNICO · DIVERGENTE | 7 recursos; produção só por Produzir; Riqueza cobre até 50% de materiais; pool legado de 5 espelhado | 7 recursos, “Materiais” fora da UI (feito, P0-3) | 5 materiais + Conhecimento, Influência e Legado; Mercado/Banco | 7 recursos, produção simplificada |
| População | ALPHA · DECISÃO | 1 Alimento/habitante; crescimento pela sobra civilizacional do Produzir (regra única, P0-2); papéis; Soldado sem efeito | DEC-007 aberta (ritmo); P1-10 | 1 Comida a cada 2 habitantes; 6 atributos por papel | 1 habitante = 1 hex trabalhado; sem papéis |
| Cidades N1–7 | CANÔNICO · DIVERGENTE · DECISÃO | duas escadas: Desenvolvimento 1–5 (efeitos reais) e Nível 1–7 (só rótulo) | DEC-002 aprovada: só Nível 1–7, composto por população + infraestrutura + investimento; fórmula pendente | Posto … Metrópole Imperial, custos e avanço da Teia por nível | nível derivado da população (simplificação) |
| Produção | ALPHA · CANÔNICO | ação Produzir; efeitos de manutenção | manter Produzir como decisão central | Produzir coleta melhorias e habitantes | igual em espírito |
| Armazenamento | ALPHA · DECISÃO | teto por cidade × nº de cidades; descarte registrado; Armazém/Tesouro/Banco não construíveis | DEC-008 aberta | teto civilizacional com Σ níveis | sem teto |
| Melhorias | ALPHA · DIVERGENTE | FARM, LUMBER_CAMP, QUARRY, MINE, FISHERY; features RIVER/FERTILE/TIMBER/STONE/FISH nunca gerados | — | 2 camadas por hex (produtiva + infraestrutura); Estrada, Irrigação, Posto Fortificado, Entreposto | ausente |
| Distritos | ALPHA · DECISÃO | 7 tipos (especializações); vagas pelo Desenvolvimento | DEC-013 aberta | 8 distritos (com Marítimo) e cadeias de edifícios | 5 distritos simplificados |
| Edifícios | ALPHA · DECISÃO | GRANARY, MARKET, LIBRARY, ARCHIVE, BARRACKS, WORKSHOP, CULTURAL_CENTER | DEC-013 | cadeias por distrito, slots 1/3/5/7/10/13/16 | ausente |
| Fortificações | ALPHA · CANÔNICO | Paliçada → Cidadela (5 níveis) com Integridade; sem ação de reparo | manter | igual + reparo por Pedra | ausente → overlay proposto (V2.2) |
| Pesquisa / Teia | ALPHA · DECISÃO | 50 nós (5 eras × 5 domínios × 2); efeitos numéricos; 4 desbloqueios de pilha | DEC-012 aberta; Teia não redistribuída (DEC-023) | 40 + 10 convergências; desbloqueios qualitativos; escolhas OU | 12 nós simplificados |
| Exploração | ALPHA · DIVERGENTE | peça adjacente revela a região de 7 hexes (+1 Prestígio); giro da região | hex/região/território (DEC-010) | raio 1/2/3 com Cartografia/Navegação; fichas de descoberta | visão por raio |
| Povos independentes | ALPHA · DECISÃO | 3 povos, 6 ações; todos começam Neutros; Proteger sem efeito; conquistar sem guerra | P1-7, P1-8 adiados | atitudes iniciais variadas; Proteger = pacto de tributo | ausente |
| Bandos | ALPHA · DIVERGENTE | 2 bandos que avançam toda rodada; não atacáveis | decidir “sempre” × “quando disparados” | 4 tipos que só se movem quando disparados | ausente |
| Unidades | ALPHA · DIVERGENTE | 9 classes fixas (Infantaria, Guarda, Arqueiros, Cavalaria, Cerco, Frota, Explorador, Pioneiro, Emissário) | escalas e Modernização: C; assinaturas: D (DEC-014) | 6 famílias com escalas, Modernização e 5 unidades exclusivas; “Atiradores” | 6 classes |
| Movimento | ALPHA | caminho por terreno, custo por terreno, estradas | — | idem + supply | BFS simples |
| Pilhas | ALPHA · CANÔNICO | Exército 6 (7/8 por avanço), Civis 2, Frota 4 (5), guarnição 6 + extras (teto 10) | manter | campo 6 + 2 civis; cidade 8 de 10 | sem limite |
| Diplomacia | ALPHA · DECISÃO | 6 tratados de 3 rodadas; PNA não impede guerra; Embargo exige aceite | DEC-015 aberta | Confiança, Tensão, Reputação; PNA impede guerra | 2 tratados + guerra |
| Comércio | ALPHA · DECISÃO | 4 tipos de oferta; rotas com renda só por Sustentar comércio | DEC-019 aberta | mercado livre, contratos futuros, empréstimos | +1 Riqueza por acordo |
| Cultura | ALPHA · DECISÃO | presença por missão do Emissário; disputa só com 2 estrangeiras; Coesão sem efeito | DEC-016 aberta | 3 espaços, Legado 0–40, Âncora, Renovação/Repressão | ausente |
| Guerra | ALPHA · DECISÃO | exige declaração; paz só por PNA/Aliança | DEC-015 (PNA bloqueia?) | ataque declarado; paz por tratado | declaração + combate |
| Combate | ALPHA · DIVERGENTE | 1 choque; dado tático; posturas somam Força; perdas do mais fraco | manter núcleo | até 3 choques, 12 passos; postura relança VAZIO | 1 choque simplificado |
| Cerco | ALPHA · CANÔNICO | Cerco abre brechas na fortificação | manter | igual + reparo | ausente |
| Naval | FUTURO · DIVERGENTE · DECISÃO | 1 classe Frota; nenhuma capital costeira recruta | DEC-014: esconder ou caminho real; naval mínimo no C | 7 navios, missões, embarque, naufrágio | ausente → atlas visual (V2.2) |
| Cartas | ALPHA · DIVERGENTE | 108 + 24 Pulso; estratégia reembaralha (P1-6) | DEC-017 aberta | 222 em 7 famílias | 8 estratégias |
| Pulso / Eventos | ALPHA · DECISÃO | Pulso automático ±1–2; Evento mundial com escolha | DEC-017: nomes distintos (Pulso × Evento) | 60 Pulsos condicionais com severidade | Pulso + Evento |
| Grandes Projetos / Obras | ALPHA · DIVERGENTE | 12 Grandes Projetos únicos (+2 recurso, +4 Prestígio) | colisão de nome a resolver | 12 Obras de Legado com efeitos únicos | ausente |
| Governos | ALPHA · FUTURO | 5 governos, adoção livre e definitiva | DEC-021 (7 no Beta) | 7 governos na Era III, reforma | ausente |
| Eras | ALPHA · CANÔNICO · DIVERGENTE | 6 eras por critérios; IDs `ASCENSION`=V e `HEGEMONY`=VI | DEC-005/023: V Potências, VI Ascensão | Hegemonia como Era VI | 6 eras, critérios simplificados |
| Hegemonia | ALPHA · CANÔNICO · DECISÃO | 6 caminhos com metas fixas; declarar só na Era VI | DEC-006 aprovada (declaração); escala aberta | metas escaladas por mesa | tracker |
| Vitória | ALPHA · CANÔNICO | Hegemonia sustentada 2 rodadas ou Prestígio no limite | modo escolhido na criação: C | 3 modos | Prestígio no limite |
| Presença / Mesa viva | CONCEITUAL · DECISÃO | nada no servidor (sem presença, pausa, suspensão); prazo por fase confirma quem não confirmou | UXDEC-001…008 | — | simulada |

## O que falta ou diverge no Alpha (lista exata)

### Diverge do canônico já decidido (corrigir ou migrar)
1. **Duas escadas de cidade** (Desenvolvimento 1–5 com efeitos × Nível 1–7 só rótulo) — DEC-002 exige uma só; migração descrita na V4 §7.4.
2. **IDs de era** `ASCENSION`/`HEGEMONY` — os rótulos já dizem Potências/Ascensão; migração dos IDs é futura.
3. **Nome da peça diplomática**: Alpha “Emissário”, canônico **Enviado** (ver terminologia abaixo).
4. **Pulso × Evento mundial** com nomes próximos — DEC-017 pede separação clara.

### Falta (sistema canônico ou da Bíblia sem implementação)
5. Escala por Nível (vagas, produção, armazém, suprimento) — depende da fórmula do Nível.
6. Melhorias de infraestrutura (Estrada já existe; Irrigação, Posto Fortificado, Entreposto não).
7. Features de terreno geradas (Rio, Fértil, Madeira, Pedra, Pesca existem no catálogo e nunca aparecem).
8. Reparo de fortificação.
9. Naval além de uma Frota; nenhuma capital costeira.
10. Escalas de unidade e Modernização; unidades assinatura.
11. Governos 6 e 7 (Meritocracia, Autocracia) e reforma.
12. Encontros de Fronteira, Táticas, Obras com efeito único.
13. Presença, pausa, suspensão e remoção no servidor (Mesa viva).

### Implementado, mas sem efeito ou inalcançável (já registrado)
14. Coesão (P1-1), Ânimo que só sobe (P1-2), Frota (P1-3), disputa cultural em 2p (P1-4), Proteger (P1-7), atitudes Hostil/Desconfiado (P1-8), 2 Pulsos nulos (P1-9), Soldado (P1-10).

### Depende de decisão (não implementar antes)
15. DEC-003 durações · DEC-006 escala das metas · DEC-007 ritmo de comida · DEC-008 armazém · DEC-011 civilizações (12 × 18) · DEC-012 Teia · DEC-013 edifícios · DEC-014 naval/militar · DEC-015 diplomacia (PNA, Embargo) · DEC-016 cultura/Legado · DEC-017 eventos · DEC-019 rotas · DEC-021 governos · DEC-022 Ânimo/Estabilidade/Coesão.

## Terminologia das peças civis (fechada)

| Peça | Função canônica | Não faz | ID no código | Rótulo hoje (Alpha) | Ação |
|---|---|---|---|---|---|
| **Explorador** | revela o mapa; encontra recursos, ruínas, povos | não funda cidades | `EXPLORER` | Explorador | manter |
| **Pioneiro** | funda cidades/postos; coloniza e melhora território quando a regra permitir | não explora além da visão normal | `PIONEER` (o antigo `SETTLER` já migra para `PIONEER`, `alpha-migration.ts:102`) | Pioneiro | manter; remover `SETTLER` das listas de UI legadas |
| **Enviado** | diplomacia, integração, influência e projeção cultural | não luta | `ENVOY` | **Emissário** | trocar o rótulo para **Enviado** (UI, docs, catálogo); manter o ID `ENVOY` |

### Ocorrências de “Colono” e proposta de migração

| Onde | Texto | Tipo | Proposta |
|---|---|---|---|
| Bíblia, prancha 11 (lista de peças) | “Colono · Funda cidades e ocupa territórios livres” | **nome da peça** | → **Pioneiro** |
| Bíblia, prancha 08 (escada) | “Fundação por Colono” | nome da peça | → “Fundação por Pioneiro” |
| Bíblia, prancha 13 (embarque) | “soldado, explorador, colono, enviado…” | nome da peça | → pioneiro |
| Bíblia, prancha 01 (Era II) | “Colonos · distritos básicos” | nome da peça | → “Pioneiros · distritos básicos” |
| Bíblia, prancha 20 (Confederação) | “Colonos custam menos” | nome da peça | → “Pioneiros custam menos” |
| Bíblia, civ Dravik (dados) | “Colonos custam 1 Comida a menos” | nome da peça | → Pioneiros |
| Bíblia, peças exclusivas | “Sacerdote-Colono”, “Colono-Guerreiro”, “Colono de Estrada” | nome de variante da peça | → “Sacerdote-Pioneiro”, “Pioneiro-Guerreiro”, “Pioneiro de Estrada” (a revisar com o kit) |
| Bíblia, carta “Missão Colonial” · categoria “Colonização” | conceito (ato de colonizar) | **conceito** | **manter** |
| Bíblia, código (`mini('colono')`) | chave interna do desenho | interno | renomear para `pioneiro` quando o desenho for revisto |
| Alpha, `alpha-army.tsx:6`, `hex-map.tsx:306` | `'SETTLER'` em listas de civis | legado de ID | remover após confirmar que nenhum save ativo mantém `SETTLER` (a migração já converte) |
| Docs antigos (`auditoria-2026-09-18.md`: “unidade colonizadora”; `visual-closure-v1-report.md`: “fronteira colonial”) | conceito/estilo | conceito | manter |
