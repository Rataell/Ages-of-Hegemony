# Hegemonia na alpha

Estado de implementação: regras autoritativas e testes disponíveis; apresentação na interface ainda em integração.

Na sexta era, Hegemonia, cada civilização pode declarar um único caminho. A declaração é pública e permanente. Os requisitos estão em `AlphaRules.hegemonyRequirements`; a projeção retorna os valores atuais somente para seu próprio jogador. Adversários recebem caminho, rodada de declaração e início da consolidação, sem saldos privados.

| Caminho | Requisitos padrão |
| --- | --- |
| Militar | Força-base total 12, duas vitórias, duas peças militares em território estrangeiro |
| Econômico | 30 Riqueza, duas rotas internacionais válidas, ao menos um parceiro comercial |
| Científico | Dois avanços da Ascensão, dois distritos Acadêmicos, um projeto científico |
| Cultural | 25 Influência, dois distritos Culturais, influência estabelecida em três cidades estrangeiras |
| Político | Um parceiro com tratado ativo, influência em três cidades estrangeiras, um projeto político |
| Territorial | 10/14/18 hexes no preset Rápido/Padrão/Épico, duas/três/três cidades de desenvolvimento III, administração dentro da capacidade |

O requisito de uma contraparte diplomática permite partidas com dois jogadores. Tipos distintos de tratado com a mesma civilização não multiplicam parceiros. Embargo não conta como cooperação. Rotas são revalidadas antes de contar, mesmo que o indicador de suspensão ainda pertença à manutenção anterior. Cidades ocupadas não contam como infraestrutura consolidada.

Atender os requisitos inicia a consolidação. A rodada em que isso acontece não conta como rodada completa. Uma declaração qualificada na rodada 4 pode vencer ao terminar a rodada 6. Perder um requisito após qualquer decisão autoritativa reinicia a contagem. O fim da rodada verifica novamente os requisitos; se houver vários vencedores, vence o primeiro na iniciativa pública vigente. Hegemonia tem prioridade sobre a pontuação quando ambos os encerramentos ocorrem na mesma rodada.

Sem Hegemonia, o limite de rodadas decide por Prestígio, quantidade de pesquisas, população total, Riqueza e iniciativa, nesta ordem. Os números são parâmetros de balanceamento alpha, ainda sem validação de duração ou equilíbrio em partidas humanas.
