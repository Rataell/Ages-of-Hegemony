# Manual do Jogador — Ages of Hegemony (v0.1)

---

## 1. O que é Ages of Hegemony?
*Ages of Hegemony* é um jogo de estratégia histórica determinístico onde você assume o destino de uma civilização emergente. Seu papel não é ser um senhor da guerra que apenas movimenta tropas, mas o arquiteto do estado: gerenciando o abastecimento de víveres, organizando os papéis cívicos da população, expandindo as fronteiras rurais e mantendo a máquina pública dentro dos limites da capacidade administrativa.

---

## 2. O Ciclo da Rodada
O tempo avança em **Rodadas**, cada uma dividida em cinco fases estritas:

| Fase | Descrição |
| :--- | :--- |
| **Manutenção (MAINTENANCE)** | O motor autoritativo processa a economia do reino: consome alimentos para sustentar cada cidadão, calcula o crescimento populacional, aplica rendimentos rurais e urbanos, desconta custos e gera o **Relatório Estratégico**. |
| **Planejamento (PLANNING)** | A fase de ação soberana do jogador. É aqui que você aloca população, reivindica territórios, constrói melhorias rurais, desenvolve cidades, ergue distritos e adota governos. |
| **Resolução (RESOLUTION)** | Fase de arbitragem estratégica (na fatia atual, transição sem efeitos pendentes; receberá ordens secretas em versões futuras). |
| **Reação (REACTION)** | Fase de resposta a eventos inesperados e disputas territoriais (em desenvolvimento). |
| **Fim da Rodada (END_ROUND)** | Fechamento da rodada, limpeza da fila de comandos e preparação para a próxima manutenção. |

---

## 3. Os Cinco Recursos
A economia civilizacional é mantida por cinco recursos fundamentais:

1. 🌾 **Alimento (Food):**
   - **Consumo:** Cada habitante consome exatamente 1 de alimento por manutenção.
   - **Crescimento:** O alimento excedente acumula no medidor de crescimento da cidade. Ao atingir o limiar (base 10, reduzido para 8 com Celeiro), a cidade ganha +1 habitante.
   - **Escassez:** Se faltar comida, o reino sofre penalidade de estabilidade social (-5 pontos por escassez).
2. 🪵 **Materiais (Materials):**
   - A matéria física do reino (madeira, pedra e tijolos).
   - Usado para desenvolvimento urbano, melhorias rurais, distritos e fundação de cidades.
3. 🪙 **Riqueza (Wealth):**
   - O tesouro civilizacional e a moeda de troca.
   - Necessário para edifícios avançados, especializações comerciais e fundação de novos polos urbanos.
4. 📜 **Conhecimento (Knowledge):**
   - O acervo intelectual e técnico.
   - Produzido por Estudiosos, Academias e Bibliotecas. Será o combustível da futura árvore de inovações.
5. 👑 **Influência (Influence):**
   - O prestígio político, diplomático e a autoridade sobre novas fronteiras.
   - Custo para reivindicar territórios (1 de influência por hexágono) e adotar formas de governo.

---

## 4. População & Papéis Cívicos
A população urbana não é homogênea. Cada habitante deve ser alocado a uma função social:

- **Produtores (Producers):** A base agrária. Produzem rendimento basal e são os únicos cidadãos capazes de **trabalhar hexágonos externos**. Cada produtor pode trabalhar no máximo 1 território rural elegível.
- **Artesãos (Artisans):** Geram materiais (+1) e ativam a produção de oficinas industriais.
- **Mercadores (Merchants):** Geram riqueza (+1) e operam mercados e distritos comerciais.
- **Estudiosos (Scholars):** Geram conhecimento (+1) e operam bibliotecas e arquivos acadêmicos.
- **Soldados (Soldiers):** Fornecem força para a guarnição municipal da cidade.
- **Livres (Unassigned):** Cidadãos livres sem papel definido, disponíveis para realocação.

> **Regra de Ouro:** A soma de todos os papéis alocados deve ser exatamente igual à população total da cidade. Reduza territórios trabalhados antes de diminuir os produtores abaixo dessa quantidade!

---

## 5. Território: Soberania e Trabalho
O mapa é formado por coordenadas axiais hexagonais `(q, r)` com diferentes terrenos:
- **Planície (Plains):** Rendimento base de 2 alimentos. Terreno ideal para fazendas.
- **Floresta (Forest):** Rendimento base de 1 alimento e 1 material. Suporta serrarias.
- **Colinas (Hills):** Rendimento base de 2 materiais. Suporta pedreiras e minas.
- **Montanhas (Mountains):** Rendimento base de 2 materiais. Suporta minas e pedreiras profundas.
- **Costa (Coast):** Rendimento de 1 alimento e 1 riqueza. Suporta pesqueiros se houver peixes.
- **Mar (Sea):** Água profunda; não suporta cidades nem melhorias regulares.

### Estados de um Território:
- **Soberano (Owned):** Pertence à sua civilização (delimitado com a cor do seu reino).
- **Trabalhado (Worked):** Hexágono onde um Produtor ativo está colhendo recursos a cada manutenção (marcado com selo dourado no mapa).
- **Reivindicável (Claimable):** Hexágono livre adjacente às suas fronteiras atuais dentro do alcance da cidade.
- **Inelegível (Unavailable):** Hexágono fora de alcance, sem conexão territorial ou que exceda o número de produtores disponíveis.

---

## 6. Cidades: Centros de Civilização
- **Capital:** A cidade-mãe da civilização (marcada com `★`). Concede estabilidade reforçada em governos monárquicos.
- **Níveis de Desenvolvimento (I a V):**
  - Nível I: População máxima 3 · 1 slot de distrito.
  - Nível II: População máxima 5 · 2 slots de distrito (Custo: 5 materiais).
  - Nível III: População máxima 8 · 3 slots de distrito (Custo: 10 materiais).
  - Nível IV: População máxima 12 · 4 slots de distrito (Custo: 15 materiais).
  - Nível V: População máxima 16 · 5 slots de distrito (Custo: 20 materiais).
- **Fundação de Novas Cidades:**
  - Custo: 5 alimentos, 3 materiais e 2 riquezas.
  - Requisitos: Terreno compatível (Planície, Floresta, Colinas, Costa), sem proprietário estrangeiro e a pelo menos **2 hexágonos de distância** de qualquer cidade existente.

---

## 7. Administração Pública e Sobre-extensão (Overextension)
A estabilidade de um império depende do equilíbrio entre **Capacidade Administrativa** e **Carga**:

- **Carga Administrativa (Administrative Load):**
  - +1 por cidade fundada;
  - +1 a cada 2 níveis de desenvolvimento urbano;
  - +1 a cada 5 habitantes totais;
  - +1 a cada 5 hexágonos controlados no território.
- **Capacidade do Estado:**
  - Base inicial: 3;
  - Aumentada por formas de governo (Monarquia +2, Confederação +1 por cidade);
  - Aumentada por distritos administrativos (+1) e edifícios de arquivo (+1).

> **Alerta de Sobre-extensão:** Se a Carga superar a Capacidade, o estado entra em **Sobre-extensão** (*Overextended*). Consequências imediatas na manutenção: **penalidade de 10% em toda produção não-alimentar** (produz apenas 90%) e **-3 pontos de estabilidade social por rodada**!

---

## 8. Estabilidade Social
A estabilidade varia de 0 a 100 pontos e determina a eficiência de todo o reino:

- **Próspera (80–100):** +10% de bônus em toda a produção da cidade.
- **Estável (60–79):** 100% de produção normal.
- **Tensa (40–59):** 100% de produção, sob risco de instabilidade.
- **Instável (20–39):** Produção reduzida para 90%.
- **Crítica (0–19):** Produção severamente reduzida para 75% e **bloqueio total de novos desenvolvimentos urbanos**.

---

## 9. Formas de Governo
Toda civilização começa em *Proto-Governo* e pode adotar uma das 5 instituições soberanas:

1. **Monarquia:** +2 de capacidade administrativa direta e +3 de estabilidade na capital. Penalidade se a capital cair em crise profunda.
2. **República:** +2 de estabilidade em cidades desenvolvidas (nível 3+), bônus de 10% em conhecimento e influência, mas sofre penalidade se tiver cidades instáveis.
3. **Oligarquia:** Grande foco mercantil: +10% de riqueza geral e +15% de riqueza adicional em cidades com especialização comercial.
4. **Teocracia:** +2 de estabilidade global em todas as cidades e +10% de influência futura.
5. **Confederação:** +1 de capacidade administrativa para cada cidade e +2 de estabilidade em reinos com múltiplas cidades, ao custo de -1 ponto de comando.

---

## 10. Distritos & Edifícios
Cada nível de desenvolvimento urbano destrava slots para distritos especializados:

| Distrito | Custo | Rendimento | Edifício Associado | Efeito do Edifício |
| :--- | :--- | :--- | :--- | :--- |
| **Agrário** | 2 Mat | +1 Alimento (requer Produtor) | **Celeiro** (2 Mat) | Reduz limiar de crescimento em 2 |
| **Comercial** | 2 Mat, 1 Riq | +1 Riqueza (requer Mercador) | **Mercado** (2 Mat, 1 Riq) | +1 Riqueza (requer Mercador) |
| **Acadêmico** | 3 Mat, 1 Riq | +1 Conhecimento (requer Estudioso) | **Biblioteca** (3 Mat, 1 Riq) | +1 Conhecimento (requer Estudioso) |
| **Administrativo** | 3 Mat | +1 Capacidade Administrativa | **Arquivo** (2 Mat) | +1 Capacidade Administrativa |
| **Militar** | 3 Mat | +1 Guarnição defensiva | **Quartel** (3 Mat) | +2 Guarnição defensiva |
| **Industrial** | 3 Mat | +1 Material (requer Artesão) | **Oficina** (3 Mat) | +1 Material (requer Artesão) |
| **Cultural** | 2 Mat, 1 Riq | +1 Influência | **Centro Cultural** (2 Mat, 1 Riq) | +1 Influência |

---

## 11. O que Ainda Não Está Implementado
Para manter a honestidade arquitetural da fatia v0.1:
- Árvore de tecnologias (Pesquisa tecnológica) — planejado para v0.6.
- Tratados diplomáticos e rotas mercantis inter-civilizacionais — planejado para v0.7.
- Movimento de tropas no mapa e combate militar ativo — planejado para v0.8/v0.9.
- Multiplayer online via internet — planejado para v0.10.
- Vitória hegemônica e IA autônoma — planejado para v0.11.
