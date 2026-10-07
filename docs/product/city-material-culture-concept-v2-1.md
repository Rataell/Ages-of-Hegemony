# CITY & MATERIAL CULTURE CONCEPT V2.1

Status: **proposta de conceito**. Corrige a V2. Nada aqui altera código, motor, regras, `BUILD`, `IMPROVE_HEX`, banco, assets finais ou deploy.
Mockups: `docs/product/city-material-culture-mockups-v2-1.html` (também publicado como Artifact).
Mantém da V2: invariantes de nível, Hex Trabalhado, um hex uma cidade, Água Navegável, produção, GAPs. Este documento só lista o que **muda** e o que **substitui** a V2.

---

## 1. Correção de modelo: Edifício ≠ Melhoria de hex

A V2 misturou categorias ao chamar Porto, Estaleiro e Farol de "borda" e ao falar em "três famílias". Taxonomia canônica da V2.1:

| | **A. CIDADE** | **B. PORTO** | **C. TERRITÓRIO TRABALHADO** |
|---|---|---|---|
| O que é | o hex da cidade e tudo que o compõe | caso espacial especial **da cidade** | melhorias de **Hex Trabalhado** (`IMPROVE_HEX`) |
| Contém | 8 Distritos; 29 Edifícios; Fortificação; Obras de Legado; estruturas de civilização | o edifício `PORT` do Distrito Marítimo | Fazenda, Mina, Pedreira, Madeireira, Pesqueiro |
| Onde existe | **no hex da cidade** | no hex da cidade, **cruzando uma aresta** até um hex de Água Navegável adjacente | **fora** do hex da cidade, em hex Trabalhado |
| É Edifício? | sim | sim (do Distrito Marítimo) | **não** |
| Pode ser remoto? | nunca | nunca | só dentro do domínio conectado da cidade |

A expressão "três famílias: urbano / borda / territorial" **fica retirada**.

### 1.1 Cidade: tudo no hex da cidade

Todos os Distritos e seus Edifícios pertencem ao hex da cidade e o compõem fisicamente: Celeiro, Moinho, Mercado, Banco, Academia, Biblioteca, Quartel, Arsenal, Templo, Oficina, Fundição, **Estaleiro, Farol**, e os demais do catálogo. **Nenhum ocupa outro hex.** Ter requisito de terreno ou costa não dá hex próprio.

Também pertencem à cidade: **Fortificação** (modifica o contorno urbano, nunca é hex externo), **Obras de Legado** e **estruturas de civilização** (GAP-7: ainda sem vaga definida).

### 1.2 Porto: a exceção espacial

- O **Porto continua sendo Edifício do Distrito Marítimo.**
- A cidade fica no hex terrestre. A peça do Porto **atravessa uma aresta** do hex da cidade e se projeta para um hex de Água Navegável adjacente:

```
Cidade [terra] ── aresta ── píer ──▶ [água navegável]
```

- Pertence à cidade. **Não** é melhoria do hex de água, que não ganha construção própria. **Não existe remotamente.**
- Cidade interior não tem Porto.

### 1.3 Estaleiro e Farol: dentro da cidade

Não são projetados em outros hexes. Ficam na composição urbana. Como pertencem ao Distrito Marítimo, **sua construção depende da condição costeira do Distrito** (aresta de água). Papéis visuais:

| Peça | Papel |
|---|---|
| **Porto** | conexão física com a água: cais ao longo da aresta + píer que atravessa |
| **Estaleiro** | estrutura urbana junto da zona portuária |
| **Farol** | marco vertical da cidade costeira, no canto da frente d'água, dentro do hex |

Os três pertencem à mesma cidade.

### 1.4 Território trabalhado

Fazenda, Mina, Pedreira, Madeireira, Pesqueiro (e as demais melhorias `IMPROVE_HEX` reais) **não são Edifícios**. São melhorias de Hex Trabalhado. Requisitos (os da V2, §5):

1. `ownerId` do jogador;
2. `controllerCityId` = a cidade;
3. **Trabalhado** pela cidade (`workedHexIds`);
4. alcance válido;
5. conexão territorial (cadeia de hexes do mesmo `controllerCityId` até o hex da cidade; hoje o motor só mede distância reta, GAP-12);
6. terreno compatível: Fazenda → Planície (ou feature Fértil); Mina → Colinas/Montanhas (metal só com METAL); Madeireira → Floresta; Pedreira → Colinas/Montanhas; Pesqueiro → Costa com feature Peixe.

---

## 2. Referência Clash of Cultures: só o princípio espacial

O manual **não está no repositório e eu não o li**. O que segue vem do conhecimento das regras públicas e fica marcado **[confirmar]**.

Usado **apenas** como princípio espacial:

- os Buildings compõem a cidade **no mesmo espaço** [confirmar] → no AoH, Distritos e Edifícios vivem no hex da cidade;
- o Port é a exceção: a cidade precisa tocar o mar e a peça se estende para ele [confirmar] → no AoH, o cais atravessa uma aresta do hex da cidade.

**Não copiado:** peças, tamanho de cidade, custos, edifícios, efeitos, composição, iconografia. O AoH segue mecanicamente próprio. Em particular, mantêm-se os invariantes da V2: o nível N1–N7 vem só de população, Era, Teia e Elevar; construir não muda nível, capacidade nem raio.

---

## 3. Direção visual: board game premium, não ilustração casual

**Retirado da V2:** casinhas coloridas, telhados vivos, fumaça exagerada, dezenas de miniconstruções, bandeirinhas e enfeites, aparência de city-builder casual.

**Direção V2.1: miniatura escultórica, calma e estratégica.**

| Elemento | Tratamento |
|---|---|
| Materiais | **pedra, madeira, bronze**. Paleta de pedra quente, madeira escura, bronze nos topos (cúpulas, coroas) |
| Cidade | **base de pedra elevada** (plinto) com borda em relevo, volumes iluminados do alto à esquerda |
| Cor do jogador | **só acento**: aro fino do plinto, um estandarte, contorno tracejado do hex trabalhado |
| Fumaça | mínima: duas esferas translúcidas só em Oficina/Fundição |
| Bandeiras | **uma**: o estandarte do jogador no coração da cidade |
| Terreno | tons apagados; texturas esparsas |
| Território trabalhado | peça **rasa e embutida** no hex, sem plinto, com contorno interno tracejado na cor do jogador |

### Regra de leitura (o critério do pedido)

> **Base de pedra elevada com aro na cor do jogador = faz parte da cidade.**
> **Peça rasa embutida no hex com contorno tracejado = melhoria do território da cidade.**
> **Píer de madeira que sai da pedra para o azul, com dois cabeços de bronze na aresta = a cidade toca o mar aqui.**

---

## 4. Três níveis de detalhe

| Escala | Hex | Mostra | **Não** tenta mostrar |
|---|---|---|---|
| **A. MESA** | ≈ 42 px | nível/tamanho (massa, contorno), densidade, **posse** (aro), **Fortificação** (3 leituras), **Porto** (píer), **Obra** (pino alto), **característica dominante** (um marco: Farol, chaminé ou cúpula) | os 29 edifícios |
| **B. FOCAR** | ≈ 100 px | configuração dos distritos (pátios), alguns edifícios: Academia, Quartel, Estaleiro, Farol, Fundição, Celeiro; quarteirões | detalhe de cada edifício |
| **C. DETALHE** | painel/carta | **todos** os edifícios individualmente, com nome, arte, **distrito e efeito** | — |

O Detalhe aparece nos mockups como o painel "Detalhe · edifícios da cidade", com o efeito vindo do catálogo real (`DISTRICT_CATALOG`). Efeito por edifício não é mostrado porque o catálogo traz efeito por distrito.

---

## 5. Base N1–N7 por massa, densidade, altura e contorno

N1–N7 continua derivando de população, Era, Teia e Elevar. Edifício não aumenta nível. A base **não cresce multiplicando casinhas**:

| Nível | Massa | Densidade | Altura | Contorno |
|---|---|---|---|---|
| N1 Posto | pequena mancha | poucos volumes | baixo | irregular, solto |
| N2 Aldeia | pequena | poucos | baixo | irregular |
| N3 Vila | média | médio | baixo, praça | regular |
| N4 Cidade | média-larga | médio | perfil começa a subir | definido |
| N5 Grande Cidade | larga | alto | volumes centrais mais altos | definido |
| N6 Metrópole | larga | alto | centro alto, avenida | cheio |
| N7 Metrópole Imperial | enche o hex | muito alto | skyline contínuo, palácio ao fundo | cheio |

Implementação conceitual: a **altura dos volumes** cresce com o nível e é maior perto do centro; o **contorno** do plinto engorda. Ver "N1 → N7" nos mockups, em dois tamanhos.

---

## 6. Distritos: distinção discreta

Sem quarteirões saturados. Cada distrito = **textura de pátio neutra + volume característico + um pequeno acento** de cor desaturada.

| Distrito | Pátio / textura | Volume característico |
|---|---|---|
| Agrário | pátio verde-acinzentado com sulcos | celeiro, moinho |
| Comercial | praça clara, toldos | mercado |
| Acadêmico | praça pavimentada, estrutura vertical | cúpula, torre |
| Administrativo | praça cívica | edifício cívico |
| Militar | pátio murado escuro | quartel com torres |
| Industrial | laje pesada escura | chaminé discreta |
| Cultural | espaço cívico com anel | templo, teatro |
| Marítimo | tablado de madeira | estruturas junto ao cais |

A cor do distrito existe só como ponto de ~2 px no canto do pátio.

---

## 7. Fortificação

Pertence integralmente à cidade e modifica o contorno urbano (a muralha segue o contorno da base, nunca o hexágono).

**Na Mesa, três leituras principais:** paliçada → muralha → muralha + torres. **Os cinco níveis exatos** (Paliçada, Muralha de Pedra, Fortaleza, Bastião, Cidadela) aparecem no Focar e no selo da placa.

Honestidade: a 42 px a paliçada é um aro fino marrom, a muralha um aro claro e as torres só "dentes". As três leituras existem, mas são sutis. Onde há Porto, a muralha **abre na frente d'água**.

---

## 8. Obra de Legado

Continua sendo peça física especial **da cidade**, mesmo sistema (12 Obras, 3 passos, +4 Prestígio, única no mundo).

| Escala | O que aparece |
|---|---|
| **Mesa** | silhueta alta distinta (pino com topo de bronze) |
| **Focar** | a identidade da Obra começa a aparecer (a forma escalonada) |
| **Cartão** | ilustração completa, mesma forma em escala grande, passos 1/3 andaime, 2/3 estrutura, 3/3 coroada |

Não se tenta desenhar detalhe arquitetônico a 42 px.

---

## 9. Mockups corretivos

`docs/product/city-material-culture-mockups-v2-1.html`. Quatro cenas, cada uma em **Mesa 1:1 (≈ 42 px)**, **Focar (≈ 100 px)** e **close-up**, mais Detalhe.

| Cena | Mostra | Leitura na Mesa |
|---|---|---|
| **A. N3 interior** | Celeiro e Academia na cidade; Fazenda em hex Trabalhado | massa com aro azul × hex listrado com contorno tracejado: cidade × território se lê sem texto |
| **B. N4 costeira** | Distrito Marítimo: Porto cruza a aresta; Estaleiro e Farol dentro | o **píer** é a leitura mais forte; o Farol é a vertical; o Estaleiro some na massa (é Focar) |
| **C. N5 industrial** | Fundição na cidade; Mina em hex externo | chaminé de pedra na cidade; boca escura da Mina, **segurada pelo contorno tracejado** (compete com a textura de colina) |
| **D. N7** | Fortificação, Porto, Obra, 6 distritos; Fazenda externa | anel de pedra com torres, abertura no mar com píer, pino de bronze |

Também nos mockups: N1–N7 por massa; folha de distritos; fortificação (3 leituras + 5 níveis); Obra em 3 escalas e carta.

### O que **não** se lê a 42 px
- edifício individual (vira massa; só um marco dominante sobrevive);
- *qual* Obra (lê-se "há uma Obra");
- níveis 3–5 da Fortificação entre si;
- mobile **não medido**.

---

## 10. O que muda em relação à V2

| V2 | V2.1 |
|---|---|
| "Três famílias" urbano/borda/territorial | **Cidade / Porto / Território trabalhado** |
| Porto, Estaleiro, Farol como "borda" | Só o **Porto** é especial; Estaleiro e Farol **dentro da cidade** |
| **Cais derivado** sempre visível em qualquer cidade com aresta de água | **Retirado.** O dock aparece com o **Porto** (edifício). Ver GAP-10/14 |
| Quarteirões em cor de distrito, telhados vivos, casinhas | Pátios neutros, pedra/madeira/bronze, cor só como acento |
| Todos os edifícios visíveis em Focar e Mesa | **Mesa**: só massa + 1 marco; **Focar**: alguns; **Detalhe**: todos |
| Fumaça, bandeiras | Mínimas; uma bandeira do jogador |

Permanece: invariantes INV-1..3, Hex Trabalhado (§5 da V2), um hex uma cidade, Água Navegável = COAST ∪ SEA com aresta de água, produção sem mudar fórmulas.

---

## 11. GAPs e decisões

| ID | Tema | Estado |
|---|---|---|
| GAP-9 | `coastal: true` do Distrito Marítimo não é imposto | decisão D-C: impor (mudança de regra) |
| **GAP-10 (revisto)** | Hoje uma cidade costeira **lança frota sem ter o `PORT` construído** (`isPort` derivado). Pela V2.1 o dock só aparece com o Porto. Resultado: cidade costeira que lança frota sem píer desenhado | duas saídas: **(a)** aceitar, mostrando só a praia (sem regra nova); **(b)** exigir o `PORT` para lançar frota (mudança de regra, **não proposta**) |
| **GAP-14 (novo)** | O catálogo diz do Marítimo "**Porto incluído**" e também lista `PORT` entre os edifícios. Ambíguo: construir o Distrito Marítimo já cria o Porto, ou o `PORT` é construído à parte? | decidir. Proposta: **o Distrito Marítimo inclui o Porto** (leitura literal do texto); Estaleiro e Farol são edifícios opcionais |
| GAP-7 | Vaga das estruturas de civilização | em aberto |
| GAP-12 | Conectividade do domínio (cadeia, não distância reta) | proposta |
| GAP-2 | Raio e vagas indexam `development` 1–5 | opção mínima da V2 (N1–N2→1, N3–N4→2, N5–N7→3) |

### Decisões a aprovar
1. **Taxonomia** Cidade / Porto / Território trabalhado, retirando "três famílias".
2. **Estaleiro e Farol dentro da cidade**; **Porto** como única exceção espacial (cruza a aresta).
3. **Regra de leitura visual**: base elevada com aro = cidade; peça rasa com contorno tracejado = território; píer com cabeços = toca o mar.
4. **Direção escultórica** (pedra/madeira/bronze, cor do jogador como acento) em vez da ilustração casual.
5. **Três níveis de detalhe** (Mesa: sem 29 edifícios).
6. **GAP-14** (Distrito Marítimo inclui o Porto?) e **GAP-10** (saída a ou b).
7. Seguem pendentes da V2: D-A (atribuir o hex antes de melhorar), D-B (melhoria ociosa), D-C (impor `coastal`), GAP-2.

**Não implementar antes da aprovação.**
