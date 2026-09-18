# Referência Técnica de Regras — Ages of Hegemony

*Especificação matemática autoritativa dos sistemas e invariantes da fatia v0.1.*

---

## 1. Fórmulas Econômicas & Manutenção

A fase de Manutenção (`MAINTENANCE`) é executada deterministicamente seguindo a ordem:

### I. Consumo e Balanço de Alimento
$$\text{FoodRequired} = \sum_{\text{cidades}} \text{city.population} \times \text{foodPerPopulation}$$
*(Com `foodPerPopulation = 1`).*

- Se $\text{EstoqueFood} + \text{ProduçãoFoodBruta} \ge \text{FoodRequired}$:
  - $\text{FoodPaid} = \text{FoodRequired}$.
  - O alimento excedente é acumulado no progresso demográfico das cidades:
    $$\text{city.growthProgress} \gets \min(\text{city.growthProgress} + \text{AlimentoExcedente}, \text{limiar})$$
  - Se $\text{city.growthProgress} \ge \text{limiar}$ e $\text{city.population} < \text{CapacidadeNível}$:
    - A cidade cresce em $+1$ habitante.
    - O limiar padrão é $10$ alimentos (reduzido para $8$ na presença de um **Celeiro**).
- Se $\text{EstoqueFood} + \text{ProduçãoFoodBruta} < \text{FoodRequired}$ (**Escassez**):
  - Todo o alimento disponível é consumido.
  - Ocorre o evento `FOOD_SHORTAGE` com déficit registrado.
  - Toda cidade sofre uma penalidade de $-5$ pontos de estabilidade social (`shortageStabilityPenalty = 5`).

### II. Fator de Multiplicação por Estabilidade Social
Toda a produção urbana e territorial sofre um multiplicador percentual determinado pela faixa de estabilidade da cidade:

| Faixa de Estabilidade | Pontuação | Eficiência Produtiva | Efeito Restritivo |
| :--- | :--- | :--- | :--- |
| **Próspera (PROSPEROUS)** | 80 a 100 | **110%** | Bônus de abundância econômica |
| **Estável (STABLE)** | 60 a 79 | **100%** | Produção nominal normal |
| **Tensa (TENSE)** | 40 a 59 | **100%** | Sem bônus, vulnerável a distúrbios |
| **Instável (UNSTABLE)** | 20 a 39 | **90%** | Redução de 10% na receita |
| **Crítica (CRITICAL)** | 0 a 19 | **75%** | Redução de 25% e **bloqueio de novos desenvolvimentos** |

---

## 2. Fórmulas Administrativas & Sobre-extensão

### Carga Administrativa (Administrative Load)
Para cada civilização:
$$\text{Load} = \text{Cidades} \times 1 + \left\lfloor \frac{\sum \text{Desenvolvimento}}{2} \right\rfloor + \left\lfloor \frac{\sum \text{População}}{5} \right\rfloor + \left\lfloor \frac{\text{HexesControlados}}{5} \right\rfloor$$

### Capacidade Administrativa (Administrative Capacity)
$$\text{Capacity} = \text{BaseCapacity (3)} + \text{ModificadoresGoverno} + \sum \text{DistritosAdministrativos (1)} + \sum \text{Arquivos (1)}$$

### Estado de Sobre-extensão (Overextended)
Se $\text{Load} > \text{Capacity}$:
- O status da civilização passa para `OVEREXTENDED`.
- **Penalidade Econômica:** Toda produção não-alimentar (materiais, riqueza, conhecimento, influência) sofre redução para **90%** (`overextensionEconomicPercent = 90`).
- **Penalidade Social:** Cada cidade da civilização perde **-3 pontos de estabilidade** a cada manutenção (`overextensionStabilityPenalty = 3`).

---

## 3. Catálogo de Terrenos, Rendimentos e Melhorias

| Terreno | Alimento | Materiais | Riqueza | Melhorias Válidas | Características Suportadas |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Planície (PLAINS)** | 2 | 0 | 0 | Fazenda (+1 Alimento) | Rio (+1 Ali), Fértil (+1 Ali) |
| **Floresta (FOREST)** | 1 | 1 | 0 | Serraria (+1 Mat) | Rio (+1 Ali), Fértil (+1 Ali), Madeira (+1 Mat) |
| **Colinas (HILLS)** | 0 | 2 | 0 | Pedreira (+1 Mat), Mina (+2 Mat) | Rio (+1 Ali), Fértil (+1 Ali), Pedra (+1 Mat), Metal (+1 Mat) |
| **Montanhas (MOUNTAINS)** | 0 | 2 | 0 | Pedreira (+1 Mat), Mina (+2 Mat) | Pedra (+1 Mat), Metal (+1 Mat) |
| **Costa (COAST)** | 1 | 0 | 1 | Pesqueiro (+1 Ali, requer Peixe) | Rio (+1 Ali), Peixe (+1 Ali) |
| **Mar (SEA)** | 1 | 0 | 0 | *Nenhuma* | Peixe (+1 Ali) |
| **Desconhecido (UNKNOWN)** | 0 | 0 | 0 | *Nenhuma* | *Nenhuma* |

---

## 4. Custos e Restrições de Expansão Territorial

- **Reivindicação de Território (`CLAIM_HEX`):**
  - Custo: **1 Influência**.
  - Requisitos: Adjacência contínua com território da cidade; alcance máximo do centro urbano conforme desenvolvimento (Nível I: 1 hex; Nível II: 1 hex; Nível III: 2 hexes; Nível IV: 2 hexes; Nível V: 3 hexes).
- **Fundação de Nova Cidade (`FOUND_CITY`):**
  - Custo: **5 Alimentos, 3 Materiais e 2 Riquezas**.
  - Requisitos: Terreno compatível (Planície, Floresta, Colinas ou Costa); sem cidade prévia; sem trabalhadores rurais alocados; distância de no mínimo **2 hexágonos** de qualquer cidade existente.
  - Estado inicial da fundação: População 1, Desenvolvimento I, Estabilidade 60, Alocação inicial em 1 Produtor.

---

## 5. Matriz de Especializações Municipais

| Especialização | Bônus Direto por Turno | Sinergia com Distritos & Edifícios |
| :--- | :--- | :--- |
| **Agrária (AGRARIAN)** | Produtores rendem +1 Alimento extra | Celeiro reduz limiar de crescimento |
| **Comercial (COMMERCIAL)** | Mercadores rendem +1 Riqueza extra | Mercado e Oligarquia geram bônus multiplicador |
| **Acadêmica (ACADEMIC)** | Estudiosos rendem +1 Conhecimento extra | Biblioteca opera com máxima eficiência |
| **Administrativa (ADMINISTRATIVE)** | Concede **+2 de Capacidade Administrativa** | Arquivo adiciona capacidade extra |
| **Militar (MILITARY)** | Preparação defensiva municipal | Quartel concede +2 de guarnição |
| **Industrial (INDUSTRIAL)** | Artesãos rendem +1 Material extra | Oficina atinge rendimento otimizado |
| **Cultural (CULTURAL)** | Produz bônus de prestígio e influência | Centro cultural acelera geração de autoridade |

---

## 6. Modificadores das Formas de Governo

- **MONARCHY:**
  - Capacidade Administrativa: $+2$
  - Estabilidade da Capital: $+3$ por manutenção
  - Penalidade de Crise na Capital: $-5$ de estabilidade em todas as cidades se a capital cair abaixo de 20 pontos.
- **REPUBLIC:**
  - Estabilidade de Cidades Desenvolvidas (nível 3+): $+2$
  - Penalidade de Instabilidade: $-1$ de capacidade administrativa por cidade abaixo de 40 de estabilidade.
  - Bônus Futuros: $+10\%$ Conhecimento e $+10\%$ Influência.
- **OLIGARCHY:**
  - Bônus de Riqueza Geral: $+10\%$
  - Bônus de Riqueza Comercial (com especialização): $+15\%$ adicional.
  - Penalidade de Desigualdade Social Futura: $-2$ de estabilidade.
- **THEOCRACY:**
  - Estabilidade Global de Todas as Cidades: $+2$
  - Bônus Futuro de Influência: $+10\%$
- **CONFEDERATION:**
  - Capacidade Administrativa: $+1$ para cada cidade existente no reino.
  - Estabilidade Multi-Cidades: $+2$ se possuir 2 ou mais centros urbanos.
  - Trade-off: $-1$ ponto de comando por rodada.
