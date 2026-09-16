# Governos e administração — v0.3

Cada civilização começa explicitamente em `PROTO_GOVERNANCE`, sem bônus de governo. `ADOPT_GOVERNMENT` permite escolher um dos cinco arquétipos em PLANNING. Não há custo ou requisito de era adicional nesta versão. Uma segunda adoção é rejeitada, inclusive para o mesmo governo. Reformas e revoluções continuam pendentes.

## Modificadores composáveis

`GovernmentModifiers` é um conjunto de dados em `GameRulesConfig.governmentModifiers`: capacidade fixa/por cidade, penalidade por instabilidade, deltas de estabilidade condicionados à capital/desenvolvimento/múltiplas cidades, eficiência de riqueza e delta de pontos de comando. O motor combina esses campos em funções centrais; não distribui testes de nomes de governos pelas regras.

| Governo | Efeitos ativos padrão | Trade-off / hooks |
| --- | --- | --- |
| MONARCHY | +2 capacidade; +3 estabilidade da capital por manutenção | Capital abaixo de 20 aplica −5 estabilidade a **todas** as cidades no ciclo, além do bônus normal da capital |
| REPUBLIC | +2 estabilidade em cidades com desenvolvimento ≥3 | −1 capacidade por cidade abaixo de 40; hooks de +10% conhecimento/influência futuros, não aplicados |
| OLIGARCHY | +10% riqueza; +15 pontos percentuais adicionais em cidade COMMERCIAL | Hook de penalidade de desigualdade = 2, não aplicado sem sistema de classes |
| THEOCRACY | +2 estabilidade em cada cidade por ciclo | Hooks de +10% influência e penalidade de flexibilidade = 1, ainda não aplicados |
| CONFEDERATION | +1 capacidade por cidade; +2 estabilidade por cidade quando há ao menos duas | −1 ponto de comando base, com piso zero |

O governo afeta capacidade e pontos de comando imediatamente ao ser adotado. Produção e estabilidade se alteram nas manutenções seguintes. Na oligarquia, os percentuais de riqueza se somam antes do arredondamento: uma cidade comercial recebe 125% da produção já especializada. Multiplicadores de estabilidade se aplicam depois, novamente com arredondamento para baixo.

Os hooks são campos tipados de configuração para os sistemas futuros; **não** representam mecânicas já implementadas. Todos os valores da tabela são provisórios.

## Administração

Fórmula padrão por civilização:

```text
load = soma por cidade de:
  1 + floor((development - 1) / 2) + floor(population / 5)

capacity = max(0,
  3
  + bônus fixo do governo
  + número de cidades × bônus de capacidade por cidade
  + bônus das especializações administrativas
  - cidades instáveis × penalidade do governo
)
```

O valor 3, o peso por cidade e os divisores são configuráveis em `administrativeRules`. O limiar de instabilidade pertence ao modificador do governo. `administrationStatus` é OVEREXTENDED somente quando load > capacity.

Durante a manutenção, a carga é calculada **após o crescimento**, para que o excesso recém-criado tenha consequências no mesmo ciclo. O padrão aplica −3 estabilidade por cidade e mantém apenas 90% da produção nova de materials/wealth/knowledge/influence (arredondada para baixo). Alimento e estoques antigos ficam fora dessa penalidade. Essa escolha evita uma segunda cobrança de alimento depois de resolver crescimento.

O evento `ADMINISTRATIVE_OVEREXTENSION` registra capacidade/carga usadas para a consequência daquele ciclo. Depois dos deltas de estabilidade, o motor recalcula os campos derivados finais. Se uma cidade atravessar o limiar de instabilidade da república nessa última etapa, a consequência da nova situação será aplicada na manutenção seguinte; não há recálculo recursivo de penalidades dentro do ciclo.

Desenvolvimento, especialização e adoção de governo também atualizam imediatamente os campos derivados, mas não aplicam uma manutenção adicional. Não há revoltas, destruição de cidades ou mudanças automáticas de governo.
