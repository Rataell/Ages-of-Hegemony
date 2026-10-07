# AOH CIVILIZATIONS & LEADERS: DEPTH PASS

Status: **proposta de conceito**. Nada aqui altera engine, IDs técnicos, saves, snapshots, Porto, Estradas ou civilizações em produção. Nenhum asset final foi gerado e nenhum teste do jogo foi rodado.
Mockups (artifact atualizado): `docs/product/aoh-material-culture-mockups-v1.html`.
Complementa `aoh-material-culture-and-civilizations-concept-v1.md`.

---

## 1. CORE 8, EXPANSION 4, EXPANSION 6

### 1.1 Critério
**8 civilizações memoráveis em vez de 18 superficiais.** Seis eixos, pontuados de 1 a 3 (julgamento de design, não medição): **geografia, arquitetura, cultura, mito, mecânica** (diversidade de afinidade do chassi) e **leitura na Mesa** (distinção de tom e silhueta a 42 px).

### 1.2 Os 8 do núcleo

| # | Civilização | Chassi (ID técnico) | Afinidade | Região |
|---|---|---|---|---|
| 1 | **Leontia** | `valgard` | Territorial (defesa, suprimento) | Mediterrâneo helênico |
| 2 | **Uruvane** | `meridia` | Econômica | Mesopotâmia |
| 3 | **Yuhan** | `kor` | Territorial (produção, cerco) | China antiga |
| 4 | **Bharani** | `orinth` | Científica | Índia antiga e clássica |
| 5 | **Sahelor** | `saren` | Política | África Ocidental (Mali) |
| 6 | **Moanara** | `thalos` | Marítima | Oceania polinésia |
| 7 | **Tawanta** | `aurelia` *(reatribuída)* | Agrária | Andes |
| 8 | **Eirelon** | `nymara` | Cultural | Atlântico celta |

**Cobertura:** 7 das 8 afinidades e 8 regiões do mundo. Falta **Militar**, que só existe no chassi `targan`, ainda em autoria (fica na Expansão 4).

### 1.3 Comparação com a sua hipótese

| Hipótese | Decisão | Por quê |
|---|---|---|
| Helênica | **mantida** | piloto pedido; Territorial de defesa |
| Mesopotâmica | **mantida** | única Econômica jogável; arquitetura maciça distinta |
| Chinesa | **mantida** | Territorial de produção e cerco, diferente da helênica |
| Indiana | **mantida** | Científica; a mais forte do eixo |
| Andina | **mantida, mas no chassi Agrário** | terraços e depósitos casam com o kit Agrário (Terraços Dourados, Celeiros, Reserva da Abundância) |
| Polinésia | **mantida** | única Marítima jogável |
| Persa | **cortada** (Expansão 4) | sobrepõe a Mesopotâmia em geografia e a Leontia em arquitetura (salas de colunas) |
| Maia | **cortada** (Expansão 4) | Américas já têm Tawanta; Científica já tem Bharani; é a primeira da fila |
| — | **Sahelor** adicionada | a hipótese não tinha **África** nem a afinidade **Política** |
| — | **Eirelon** adicionada | faltava a afinidade **Cultural**; arquitetura de madeira e terra distinta |

**Dúvida legítima: Eirelon × Parsar.** Os dois são Culturais. Eirelon ganha por geografia (Atlântico em vez de Irã), por arquitetura (casa redonda e forte de colina em vez de coluna) e por mito oral (ciclos, bardos). Parsar ganha em leitura histórica (Aquemênidas) e em Líderes documentados. Se preferir trocar, a mudança não afeta o resto do núcleo. **Decisão D-C1.**

### 1.4 Reatribuições de chassi em relação à V1

A V1 do Concept ligou cada cultura a um chassi com folga. Com o núcleo reduzido, dois casamentos melhoram:

| Cultura | V1 | Agora | Motivo |
|---|---|---|---|
| Tawanta | `dravik` | **`aurelia`** | andenes (Fazendas em Colina como em Planície), qollqas (Celeiros), Reserva da Abundância |
| Nokor (khmer) | `aurelia` | **`dravik`** | baray e estradas casam com logística, aquedutos e depósitos |

IDs técnicos **continuam como estão**. A reatribuição é só da camada de identidade; as marcas do chassi (emblema, selo, estandarte) acompanham o chassi. O emblema `espiga` em Tawanta é lido como espiga de milho.

### 1.5 Pontuação

| Cultura (chassi) | Geo | Arq. | Cult. | Mito | Mec. | Mesa | Σ | Destino | Nota |
|---|---|---|---|---|---|---|---|---|---|
| Leontia (valgard) | ●●○ | ●●● | ●●● | ●●● | ●●● | ●●● | 17 | **CORE** | Piloto obrigatório; defesa e suprimento. |
| Uruvane (meridia) | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | 18 | **CORE** | Única Econômica jogável; arquitetura maciça muito distinta. |
| Yuhan (kor) | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●● | 17 | **CORE** | Segundo Territorial, mecanicamente distinto (produção e cerco). |
| Bharani (orinth) | ●●● | ●●● | ●●● | ●●○ | ●●● | ●●○ | 16 | **CORE** | Científica; mito limitado pela exclusão de divindades vivas. |
| Sahelor (saren) | ●●● | ●●● | ●●● | ●●○ | ●●● | ●●● | 17 | **CORE** | **Única África e única Política no núcleo.** Substitui a Persa. |
| Moanara (thalos) | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | 17 | **CORE** | Marítima; leitura baixa na Mesa (casas e plataformas rasas). Exige consulta. |
| Tawanta (aurelia, reatribuída) | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | 18 | **CORE** | **Chassi Agrário reatribuído:** andenes e qollqas casam com o kit. |
| Eirelon (nymara) | ●●○ | ●●○ | ●●● | ●●● | ●●● | ●●○ | 15 | **CORE** | Cultural (única afinidade que faltava). Disputa o oitavo lugar com Parsar. |
| Yaxkin (elyra) | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●● | 17 | **EXP 4** | Segunda Américas e segunda Científica: força, mas redundante no núcleo. |
| Nokor (dravik, reatribuído) | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●● | 17 | **EXP 4** | Sudeste Asiático; baray e estradas casam com o chassi de logística. |
| Parsar (solenne) | ●●○ | ●●● | ●●● | ●●● | ●●○ | ●●○ | 15 | **EXP 4** | Irã aquemênida; sobrepõe Mesopotâmia (geografia) e Leontia (colunas). |
| Qaghar (targan) | ●●● | ●●○ | ●●● | ●●○ | ●●● | ●●○ | 15 | **EXP 4** | Único chassi **Militar**; ainda AUTHORING; resolver "Elefantes". |
| Khemara (iskara) | ●●○ | ●●● | ●●● | ●●● | ●●○ | ●●● | 16 | **EXP 6** | Muito icônica; chassi AUTHORING; candidata a promoção. |
| Sogdar (veyra) | ●●○ | ●●○ | ●●○ | ●○○ | ●●○ | ●●○ | 11 | **EXP 6** | Mito pouco documentado; Política duplicada por Sahelor. |
| Sabaar (kaedor) | ●●○ | ●●○ | ●●○ | ●●○ | ●●○ | ●●○ | 12 | **EXP 6** | Econômica duplicada por Uruvane. |
| Seorin (lumaris) | ●●● | ●●○ | ●●○ | ●●○ | ●●○ | ●●○ | 13 | **EXP 6** | Científica duplicada; pouca visibilidade na Mesa. |
| Kilwara (veloria) | ●●● | ●●○ | ●●○ | ●○○ | ●●○ | ●●○ | 12 | **EXP 6** | Fontes de mito sensíveis; Política duplicada. |
| Fjorvik (norvak) | ●●○ | ●●○ | ●●● | ●●● | ●●○ | ●●○ | 14 | **EXP 6** | Marítima duplicada por Moanara; Eddas/sagas fortes. |

### 1.6 Expansão

**EXPANSION 4 (totaliza 12):** Yaxkin (maia, `elyra`), Nokor (khmer, `dravik`), Parsar (persa, `solenne`), Qaghar (estepe, `targan`, ainda AUTHORING).
**EXPANSION 6:** Khemara (Egito, `iskara`), Sogdar (`veyra`), Sabaar (`kaedor`), Seorin (`lumaris`), Kilwara (`veloria`), Fjorvik (`norvak`).
Total 8 + 4 + 6 = **18**. A Expansão 4 prioriza chassis já jogáveis, com **uma exceção deliberada** (Qaghar) para fechar a afinidade Militar. Khemara é a candidata natural à promoção para a Expansão 4 se o Egito for essencial.

### 1.7 Justificativa dos cortes
- **Sogdar, Sabaar, Seorin, Kilwara, Fjorvik:** duplicam uma afinidade já coberta e têm mito ou leitura na Mesa mais fracos. Não são ruins; são **menos necessárias** num núcleo de 8.
- **Parsar, Yaxkin:** fortes, mas redundantes em afinidade ou geografia dentro do núcleo.
- **Nokor:** esbarra visualmente em Bharani e Yaxkin (templos escalonados). Entrar no núcleo reduziria a distinção de silhueta.

---

## 2. Classificações

Usadas explicitamente em cada figura:

| Classe | Significado | Apresentação |
|---|---|---|
| **HISTÓRICO** | pessoa atestada em fontes | datas e atribuição; nota de fonte ampla |
| **SEMI-LENDÁRIO** | pessoa provável, biografia largamente legendária, ou epopeia sobre pessoa atestada | **sem** datas exatas; "tradição de…" |
| **LENDÁRIO** | figura de lenda ou epopeia, sem comprovação | **sem** datas; cita a obra ou tradição |
| **MITOLÓGICO** | semideus ou entidade de mito que age como herói | "figura de mito"; nunca como pessoa |
| **PATRONO MÍTICO** *(nova)* | divindade ou entidade que **não funciona** como governante humano | imagem de culto; **nunca é Líder**; sem mecânica |

**Mito nunca é tratado como fato.** O tipo é uma etiqueta visível na carta. Figuras ligadas a **religiões vivas** (hindu, budista, mandê, maori, havaiana, andina viva, cristã) **não** são Patronos nem Líderes com iconografia religiosa; ver §6.

---

## 3. Leontia como piloto

### 3.1 Agamenon, Perseu e Zeus: três funções diferentes

| Figura | Classe | Função | Veredito |
|---|---|---|---|
| **Agamenon** | LENDÁRIO | **Rei-Comandante** | **Líder.** Reúne uma coalizão de reinos: o lado "liga" do mundo helênico. |
| **Perseu** | LENDÁRIO | **Herói-Fundador** | **Líder.** Fundador de Micenas na tradição; viagem e fundação. |
| **Zeus** | PATRONO MÍTICO | **Patrono** | **Não é Líder.** É divindade; não governa gente; não tem "estilo estratégico". Exceção só se o jogo vier a ter "Líderes divinos" (não agora). |

Justificativa contra Zeus como Líder: (1) é uma divindade, não um chefe de povo; (2) apagaria a diferença entre mito e figura política que a convenção de classes quer manter; (3) ocuparia o lugar de um humano com uma forma de jogar própria; (4) Zeus rende **mais como Patrono** (Zeus *Horkios*, dos juramentos, liga com tratados; Zeus *Xenios*, da hospitalidade, liga com enviados).

### 3.2 Candidatos pesquisados (18)

| Candidato | Classe | Arquétipo | Encaixe no chassi (defesa e suprimento) | Riqueza visual | Risco | Veredito |
|---|---|---|---|---|---|---|
| Leônidas I | H | Comandante-Defensor | alto | alto | pop ("300"), militarismo, hilotas | **ROSTER ★** |
| Agamenon | L | Rei-Comandante | alto (coalizão) | alto (Micenas) | Máscara de Agamenon (anterior), Micenas ≠ Grécia clássica | **ROSTER** |
| Perseu | L | Herói-Fundador | médio-alto | alto | cinema e Medusa | **ROSTER** |
| Péricles | H | Governante-Construtor | médio | alto (Acrópole) | imperialismo ateniense | **ROSTER** |
| Arquimedes | H | Sábio-Construtor | alto (defesa por engenharia) | alto | lendas tardias (espelhos, "Eureka") | **ROSTER** |
| Aspásia de Mileto | H | Diplomata-Oradora | médio | médio | fontes escassas e hostis | **ROSTER** |
| Zeus | P | Patrono | — | alto | não é governante | **PATRONO** |
| Atena | P | Patrona | alto (pólis, defesa) | alto | — | **PATRONA** |
| Poseidon | P | Patrono | baixo (Leontia não é marítima) | alto | — | visual |
| Odisseu | L | Explorador-Diplomata | médio | alto | duplica funções de Perseu | **1º reserva** |
| Aquiles | L | Herói | baixo | alto | não governa | reserva |
| Héracles | M | Herói semidivino | médio | alto | cobre o mesmo herói que Perseu | reserva |
| Teseu | L | Fundador de Atenas | médio | médio | duplica Perseu | reserva |
| Alexandre III | H | Comandante-Explorador | baixo (imperial) | alto | imperialismo; macedônio × grego | reserva |
| Temístocles | H | Comandante naval | baixo | médio | chassi não é marítimo | reserva |
| Clístenes | H | Reformador | médio | baixo | pouca iconografia | reserva |
| Artemísia I | H | Comandante naval | baixo | alto | aliada da Pérsia | reserva |
| Pitágoras | S | Sábio | baixo | médio | escola quase religiosa | reserva |

### 3.3 Roster final de 6

| # | Figura | Classe | Arquétipo | Passiva | Poder |
|---|---|---|---|---|---|
| ★ | Leônidas I | H | Comandante-Defensor | Suprimento +1 | +2 Força |
| 2 | Agamenon | L | Rei-Comandante | Riqueza +6 | +1 comando |
| 3 | Perseu | L | Herói-Fundador | Pedra +6 | +1 movimento |
| 4 | Péricles | H | Governante-Construtor | Alimento +6 | +1 Ânimo (todas) |
| 5 | Arquimedes | H | Sábio-Construtor | Metal +4 | +15 coesão local |
| 6 | Aspásia de Mileto | H | Diplomata-Oradora | Integração +10 | tratados +2 rodadas |

Cobre **Governante, Comandante, Diplomata, Construtor, Sábio, Explorador (Perseu), Reformador (Péricles), Herói**. **Patrono** (Zeus, Atena) fica de fora do roster. Mulheres: apenas Aspásia; Artemísia I é a reserva mais forte para equilibrar.

---

## 4. Regra de design dos Líderes e mecânica existente

**A civilização é o chassi; o Líder altera o estilo.** Meta de design: **~80 % identidade da civilização, ~20 % do Líder.** É um princípio, não uma conta.

O formato atual é preservado: **uma Passiva e um Poder 1× por Era**. Não há árvore, nível nem subsistema.

### 4.1 O que o schema atual permite
- **Passivas** (3 tipos): `STORAGE` (um recurso: Alimento, Madeira, Pedra, Riqueza = +6; Metal = +4), `SUPPLY` (+1 hex), `INTEGRATION` (+10).
- **Poderes** (4 tipos): `ROUND_BONUS` (Força +2, Movimento +1, Comando +1), `MOOD_ALL` (+1), `COHESION_ALL` (+15), `TREATY_EXTEND` (+2 rodadas).

### 4.2 Como os 6 Líderes de cada civilização variam
1. O **Líder de referência (★)** mantém exatamente a Passiva e o Poder do chassi atual.
2. Os **outros cinco** usam **os cinco outros tipos de Poder**, de modo que **cada civilização cobre os seis poderes**, e passivas **distintas**. Assim cada Líder muda o estilo sem inventar efeito.
3. Todos os nomes de Passiva e Poder são **rótulos de sabor**; os efeitos são os do schema.

**Risco de balanceamento (não tratado):** as combinações não estão balanceadas. `COMMAND` (+1 ação principal) tende a ser o Poder mais forte; `TREATY_EXTEND` o mais situacional. Isto precisa de playtest **antes** de entrar em dados. Nada foi balanceado aqui.

---

## 5. Seleção do Líder

| Opção | A favor | Contra | Setup | Replay |
|---|---|---|---|---|
| A. Escolhe qualquer um dos 6 | simples | sobrecarga para iniciantes | médio | boa |
| B. Recebe 3 e escolhe 1 | reduz escolha, impõe variedade | sorteio sem controle; aleatório no servidor | médio | muito boa |
| C. Draft | interativo | lento com 2–4 jogadores; revela informação | alto | boa |
| **D. Líder padrão + variantes** | **1 clique para iniciante; todos os 6 para quem quer** | precisa de "padrão" por civilização e de um botão Trocar | **baixo** | **muito boa** |
| E. Padrão fixo (hoje) | zero mudança | sem replay por Líder | nulo | baixa |

**Recomendação: D.** O Líder de referência (★) vem pré-selecionado; "Trocar" abre os 6 numa tela só. **A escolha é revelada ao mesmo tempo** quando todos confirmam, para evitar contra-escolha. Serve para 2–4 jogadores, não aumenta o setup do iniciante e preserva a rejogabilidade.

**Dependência (engine, não agora):** hoje cada civilização recebe **exatamente um** Líder automaticamente (`leaderOfCivilization`, `leaderStateFor`). A seleção exigiria estado de lobby para a escolha e dados para 6 Líderes por civilização. Não alterado.

---

## 6. Patronos

**Não entram no engine.** A pergunta é onde cada figura fica melhor:

| Papel | O que é | Quando usar |
|---|---|---|
| **A. Líder** | figura jogável com Passiva e Poder | humano ou herói com "estilo" |
| **B. Patrono** | campo narrativo da carta de Civilização (1 linha e 1 ícone), sem mecânica | divindade de religião antiga e extinta |
| **C. Herança** | nome de uma Herança (sem novo efeito) | domínio da divindade, não a pessoa |
| **D. Narrativo/visual** | relevo, estátua, emblema, texto de sabor | religiões vivas ou incertas |

**Regra geral:** Patrono é **imagem de culto** (estátua, relevo, emblema), nunca retrato. **Religiões vivas** recebem **D** no máximo, ou nada, e **consulta cultural**.

**Leontia**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Zeus (soberano; Horkios, dos juramentos; Xenios, da hospitalidade) | B | Patrono na carta da Civilização; **não** Líder: é divindade, não governa gente. Liga com tratados (Agamenon). |
| Atena (Políade, Promacos) | B | Patrona da pólis e da defesa, fala com o chassi. Pode nomear uma Herança ("Égide"). |
| Poseidon | D | Narrativo e visual (mar, Porto); Leontia não é marítima. |
| Apolo (oráculo, luz) | D | Santuário e profecia; elemento visual. |
| Héracles (semidivino) | A | Poderia ser Líder Mitológico; excluído do roster por cobrir o mesmo "herói" que Perseu. |

**Uruvane**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Enki/Ea (águas, ofícios, sabedoria) | B | Patrono com afinidade com canais e comércio. |
| Inanna/Ishtar (cidade, guerra) | D | Narrativo e visual; ligado ao Portão de Ishtar. |
| Shamash (justiça) | C | Pode nomear a Herança de crédito e contrato. |
| Marduk | D | Patrono de Babilônia; evitar o "rei dos deuses" para não duplicar Zeus. |

**Yuhan**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Huangdi / Shennong / Fuxi (heróis culturais) | A | Funcionam como ancestrais-inventores: melhor como Líder Lendário (Huangdi) ou como nome de Herança (Shennong). |
| Nüwa (criadora) | B | Patrona; sem culto vivo central. |
| Deuses populares taoístas | — | Evitar: religião viva. |

**Bharani**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Divindades hindus e budistas | — | **Evitar** como Patrono e Líder: religião viva. |
| Sábios (Panini, Vyasa-tradição) | A | Como Líderes humanos de tradição; Vyasa é figura religiosa, evitar. |
| Símbolos (lótus, roda) | — | Evitar sem consulta; usar jali, estepe de pedra e estrelas. |

**Sahelor**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Cosmologia mandê (Faro, Pemba, Nyama) | — | **Evitar**: tradição viva e sagrada. |
| Ancestrais e griôs | D | Tratar como elemento narrativo (voz do griô, canção de louvor). |
| Soumaoro Kanté (S) | A | Rival do Sundiata; poderia ser Líder alternativo, com cuidado. |

**Moanara**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Tangaroa/Kanaloa, Hina, Tāne, Rongo, Pele | D | Patronos como elemento visual ou narrativo **com consulta cultural**; evitar mecânica. |
| Māui | A | Já entra como Líder Mitológico (herói-demiurgo), não como Patrono. |

**Tawanta**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Inti (Sol), Viracocha (criador), Mama Quilla (Lua) | B | Patronos de estado inca (histórico); sensível, sem mecânica. |
| Pachamama | D | Tradição viva; só narrativa discreta. |
| Manco Cápac, Mama Ocllo | A | Já são Líderes Lendários. |

**Eirelon**

| Figura | Papel recomendado | Justificativa |
|---|---|---|
| Lugh (ofícios, habilidade) | B | Patrono de uma civilização de saberes. |
| Dagda, Morrígan, Brigid | D | Narrativo; Brigid é figura cristianizada (religião viva): evitar. |
| Cernunnos e deuses gauleses | D | Apenas visual. |


---

## 7. Retratos

Direção mantida: **pictórico histórico + gravura premium + luz suave**. Mas **cada figura tem personalidade**, variando em oito dimensões:

| Dimensão | Exemplos nos 6 de Leontia |
|---|---|
| Enquadramento | busto frontal justo (Leônidas); busto largo com cetro (Agamenon); cabeça pequena e cenário grande (Arquimedes) |
| Postura | frontal, perfil direito, perfil esquerdo, três-quartos |
| Cenário | portão de Micenas, mar, desfiladeiro, Acrópole, areia com diagrama, salão com janela |
| Objetos simbólicos | cetro, lâmina curva, escudo redondo, compasso, rolo de papiro, mão de orador |
| Vestimenta | manto micênico, manto com fíbula, couraça de bronze, himátion, véu |
| Idade | ~25 a ~60 anos, careca, barba grisalha, rosto liso |
| Luz | tocha, manhã, brasa e crepúsculo, luz de dia, lâmpada, janela |
| Gesto | frontal e firme, olhar ao horizonte, mão erguida, concentrado, lendo |

### Rosto por classe
- **Histórico:** coerência com as representações históricas disponíveis (esculturas, moedas, relevos), **sem fingir precisão fotográfica** quando não existe.
- **Semi-lendário e lendário:** **interpretação original** do AoH, baseada em cultura e tradição.
- **Mitológico e Patrono:** **interpretação própria**, sem copiar cinema, jogos ou ilustrações famosas. Patronos como imagem de culto.

Os retratos dos mockups são **composições e silhuetas**, não arte final.

---

## 8. Catálogo: Core 8 × 6 figuras

Cada civilização traz: nome de trabalho, nome alternativo, matriz, arquitetura N1–N7, Porto, Fortificação, padrão, emblema, materiais, paleta, Trait, Limitation, assinatura, 3 Heranças e o roster. **A cor do jogador continua separada da cultura.**

### 1. Leontia · alternativo *Aqueia* · chassi `valgard`
- **Matriz:** Mundo helênico: Micenas, póleis, Macedônia e Magna Grécia. **Período:** c. 1600–200 a.C. (da tradição micênica ao helenismo).
- **Afinidade:** Territorial (defesa e suprimento).
- **Arquitetura N1–N7:**
  - N1–N2: cabanas de pedra e barro, lareira central (mégaro), cerca baixa
  - N3–N4: casas de pátio, ágora, estoa de colunas, telhado baixo de terracota
  - N5: acrópole com templo, bouleutério, muralha de blocos
  - N6–N7: peristilos, teatro em arquibancada, acrópole monumental, longos muros
- **Porto:** Mole de pedra clara com pequenas colunas; trirreme ao lado.
- **Fortificação:** Muralha poligonal (ciclópica) com torres redondas e portão.
- **Padrão:** Friso de meandro. **Emblema:** passo (existente). **Materiais:** Mármore, calcário, terracota, bronze. **Paleta:** #e4ddc8 · #b9825e · #7f8a8f · #b8914d.
- **Trait (atual, mapeado):** +1 alcance de suprimento para peças em território próprio.
- **Limitation (atual, mapeada):** Enviados custam +1 Influência.
- **Assinatura (atual):** Guarda de Escudos → Falange de Escudos.
- **3 Heranças (atual → nome cultural):** Passos Guardados · Refúgios de Montanha → Acrópoles de Refúgio · Muralha Viva.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Leônidas I ★** · HISTÓRICO · *Comandante-Defensor*
- Período/tradição: Esparta, c. 540–480 a.C.; Termópilas.
- Motivo da escolha: Encarna o título atual do chassi, "Senhor das Passagens": a defesa de um desfiladeiro.
- Relação com a civilização: É o núcleo do chassi: suprimento e defesa. Líder de referência.
- Retrato: Frontal, elmo coríntio erguido sobre a testa, borda de escudo redondo; luz fria de crepúsculo com brasa quente; ~40 anos.
- Passiva possível: **Refúgios abastecidos** (Suprimento +1 hex).
- Poder 1× por Era possível: **Muralha Viva** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: Cultura pop ("300") e militarismo espartano; hilotas. Retrato sóbrio, sem capa vermelha exagerada.

**2. Agamenon** · LENDÁRIO · *Rei-Comandante*
- Período/tradição: Micenas, Idade do Bronze (c. 1600–1100 a.C.); Ilíada.
- Motivo da escolha: Rei que reúne uma coalizão de reinos: o lado "liga de póleis" do mundo helênico.
- Relação com a civilização: Corresponde ao suprimento e à coesão de aliados, não à defesa de passo.
- Retrato: Frontal imponente, barba grisalha, diadema e cetro, portão de Micenas ao fundo; luz de tocha; ~50 anos.
- Passiva possível: **Ouro de Micenas** (Limite de Riqueza +6).
- Poder 1× por Era possível: **Assembleia dos Reis** (+1 ponto de comando da rodada).
- Risco histórico/cultural: A "Máscara de Agamenon" é anterior à Guerra de Troia tradicional e não é dele. Usar figurino micênico, não hoplita.

**3. Perseu** · LENDÁRIO · *Herói-Fundador*
- Período/tradição: Argos e Micenas; mito pré-clássico.
- Motivo da escolha: Na tradição (Pausânias) funda Micenas; encarna a viagem e a fundação.
- Relação com a civilização: Expansão e travessia: a faceta "abrir caminho" da civilização.
- Retrato: Três-quartos de rosto jovem, sem barba, manto com fíbula, escudo polido; horizonte do mar, luz de manhã.
- Passiva possível: **Muralhas Ciclópicas** (Limite de Pedra +6).
- Poder 1× por Era possível: **Sandálias Aladas** (+1 movimento da rodada).
- Risco histórico/cultural: Imagem de cinema (Fúria de Titãs) e de Medusa. Não mostrar a cabeça cortada; a jornada, não o troféu.

**4. Péricles** · HISTÓRICO · *Governante-Construtor*
- Período/tradição: Atenas, c. 495–429 a.C..
- Motivo da escolha: Estadista do programa do Partenon e das Festas; retrata a pólis como obra pública.
- Relação com a civilização: A faceta cívica: muros, festas e Ânimo.
- Retrato: Perfil, elmo de estratego sobre a testa, mão erguida de orador; colunas da Acrópole ao fundo; luz de dia; ~60 anos.
- Passiva possível: **Muros Longos** (Limite de Alimento +6).
- Poder 1× por Era possível: **Festas Panatenaicas** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Imperialismo ateniense; a democracia excluía mulheres e escravizados; peste de Atenas.

**5. Arquimedes** · HISTÓRICO · *Sábio-Construtor*
- Período/tradição: Siracusa, c. 287–212 a.C..
- Motivo da escolha: Engenheiro dos engenhos de defesa de uma cidade sitiada, casa com a defesa do chassi.
- Relação com a civilização: Defesa pela engenharia, não pela infantaria.
- Retrato: Perfil esquerdo, idoso, careca, compasso sobre diagrama na areia; luz de lâmpada a óleo; gesto concentrado.
- Passiva possível: **Oficina de Siracusa** (Limite de Metal +4).
- Poder 1× por Era possível: **Engenhos da Cidade Sitiada** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Espelhos ardentes e "Eureka" são tradição tardia; não mostrar como fato.

**6. Aspásia de Mileto** · HISTÓRICO · *Diplomata-Oradora*
- Período/tradição: Atenas, séc. V a.C..
- Motivo da escolha: Voz e persuasão numa pólis; dá à civilização um líder que joga com tratados.
- Relação com a civilização: Alianças e integração, o contrário do passo guardado.
- Retrato: Três-quartos, véu do himátion, rolo de papiro na mão; luz suave de janela; ~30 anos.
- Passiva possível: **Salão de Aspásia** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Palavra Persuasiva** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Fontes escassas e hostis (comédia, Plutarco); evitar a imagem de "cortesã"; destacar a retórica.

*Reservas pesquisadas:* Odisseu (L, Explorador-Diplomata); Aquiles (L, Herói); Héracles (M, semidivino); Teseu (L, Fundador de Atenas); Alexandre III (H, Comandante-Explorador); Temístocles (H, Comandante naval); Clístenes (H, Reformador); Artemísia I de Halicarnasso (H, Comandante naval); Pitágoras (S, Sábio).

### 2. Uruvane · alternativo *Akkadar* · chassi `meridia`
- **Matriz:** Mesopotâmia: Suméria, Acádia, Babilônia, Assíria. **Período:** c. 3500–500 a.C..
- **Afinidade:** Econômica.
- **Arquitetura N1–N7:**
  - N1–N2: casas de tijolo cru e telhado plano, cerca de junco
  - N3–N4: pátios internos, templo sobre plataforma, canais
  - N5: zigurate baixo e muralha de tijolo com contrafortes
  - N6–N7: zigurate monumental, portal de tijolo vidrado azul, avenidas processionais
- **Porto:** Cais de tijolo com canais e barcas redondas de junco (quffa).
- **Fortificação:** Muralha maciça de tijolo com contrafortes e ameias.
- **Padrão:** Friso de tijolo em relevo e cunhas. **Emblema:** ondas (existente). **Materiais:** Tijolo de barro, betume, cerâmica vidrada azul, cobre. **Paleta:** #b98f62 · #8a6a4a · #2f6f8f · #c9a54e.
- **Trait (atual, mapeado):** A primeira oferta comercial concluída em cada rodada rende +1 Riqueza.
- **Limitation (atual, mapeada):** Fortificação não passa de Muralha de Pedra até a Era IV.
- **Assinatura (atual):** Caravana → Karum (entreposto).
- **3 Heranças (atual → nome cultural):** Feira das Margens → Karum das Margens · Entrepostos Fluviais → Entrepostos de Rio · Casa das Margens → Casa de Crédito do Templo.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Hamurabi ★** · HISTÓRICO · *Governante-Legislador*
- Período/tradição: Babilônia, c. 1792–1750 a.C..
- Motivo da escolha: Rei do código de leis com regras de contrato e comércio.
- Relação com a civilização: Núcleo do chassi: contratos e Riqueza. Líder de referência.
- Retrato: Frontal ou três-quartos, barba trançada, relevo da estela de leis ao fundo; luz de lamparina; ~50 anos.
- Passiva possível: **Casas de câmbio** (Limite de Riqueza +6).
- Poder 1× por Era possível: **Rede de Correspondentes** (+1 ponto de comando da rodada).
- Risco histórico/cultural: O Código é anterior a conceitos modernos de justiça; severo em penas.

**2. Gilgamesh** · SEMI-LENDÁRIO · *Herói-Rei*
- Período/tradição: Uruk, c. 2700 a.C. (lista de reis); epopeia literária.
- Motivo da escolha: Rei atestado na tradição e herói da epopeia mais antiga; constrói as muralhas de Uruk.
- Relação com a civilização: O lado "construir e defender" da cidade-estado.
- Retrato: Corpo de três-quartos, torso largo, barba de cachos, touro-leão em relevo; luz de alvorada; ~35 anos.
- Passiva possível: **Muralhas de Uruk** (Limite de Pedra +6).
- Poder 1× por Era possível: **Força do Touro** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: A epopeia é literária; não apresentar como crônica. Evitar o clichê do "herói musculoso".

**3. Enheduanna** · HISTÓRICO · *Sacerdotisa-Poeta*
- Período/tradição: Ur, séc. XXIII a.C..
- Motivo da escolha: Primeira autora identificada; unifica o panteão sumério-acadiano em hinos.
- Relação com a civilização: Diplomacia cultural: integra povos.
- Retrato: Perfil, cabelo preso, tabuinha de argila nas mãos, disco com relevo (o "Disco de Enheduanna"); luz de lâmpada.
- Passiva possível: **Hinos que unem** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Selo do Templo** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Autoria debatida em detalhes; mulher em papel religioso, não militar.

**4. Sargão de Akkad** · HISTÓRICO · *Conquistador-Fundador*
- Período/tradição: Acádia, séc. XXIV–XXIII a.C..
- Motivo da escolha: Funda o primeiro império e liga rotas do Golfo ao Mediterrâneo.
- Relação com a civilização: Logística e alcance de uma economia de rotas.
- Retrato: Três-quartos, barba e diadema de cachos, estandarte de lança; luz de poeira dourada.
- Passiva possível: **Estradas do Império** (Suprimento +1 hex).
- Poder 1× por Era possível: **Marcha de Akkad** (+1 movimento da rodada).
- Risco histórico/cultural: A lenda da cesta no rio é tradição; guerras de conquista com violência real.

**5. Nabucodonosor II** · HISTÓRICO · *Construtor*
- Período/tradição: Babilônia, séc. VI a.C..
- Motivo da escolha: Reconstrói Babilônia: Portão de Ishtar, Via das Procissões, zigurate.
- Relação com a civilização: Obras públicas e cidade-modelo.
- Retrato: Perfil, tiara cônica, tijolo vidrado azul ao fundo; luz de tarde; ~55 anos.
- Passiva possível: **Canais e Jardins** (Limite de Alimento +6).
- Poder 1× por Era possível: **Via das Procissões** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Os "Jardins Suspensos" são tradição não confirmada; deportação do Cativeiro.

**6. Assurbanípal** · HISTÓRICO · *Colecionador-Sábio*
- Período/tradição: Assíria, séc. VII a.C..
- Motivo da escolha: Funda a biblioteca de Nínive, repositório de tabuinhas de todo o mundo mesopotâmico.
- Relação com a civilização: Memória comum e coesão pelo saber.
- Retrato: Frontal, leitura de tabuinha, estantes ao fundo; luz de lâmpada; ~40 anos.
- Passiva possível: **Cedros do Líbano** (Limite de Madeira +6).
- Poder 1× por Era possível: **Biblioteca de Nínive** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Imperialismo assírio brutal; evitar glorificar.

*Reservas pesquisadas:* Semíramis (S, Rainha-Construtora); Kubaba de Kish (S, Rainha); Utnapishtim (L, Sobrevivente do dilúvio); Puabi de Ur (H, Rainha).

### 3. Yuhan · alternativo *Huaxar* · chassi `kor`
- **Matriz:** China antiga: Xia, Shang, Zhou, Qin e Han. **Período:** tradição do séc. XXI a.C. ao séc. II a.C..
- **Afinidade:** Territorial (produção e cerco).
- **Arquitetura N1–N7:**
  - N1–N2: casas de taipa com telhado de colmo, cerca de estacas
  - N3–N4: pátios (siheyuan), salão de beirais curvos, torre de tambor
  - N5: muralha de taipa com portal de torre e telha cinza
  - N6–N7: pagode de vários andares, palácio em plataforma, fundição de bronze
- **Porto:** Píer de madeira laqueada com postes vermelhos e junco de velas ripadas.
- **Fortificação:** Muralha de taipa com ameias e torre de portão de telhado curvo.
- **Padrão:** Meandro de raios (leiwen). **Emblema:** bigorna (existente). **Materiais:** Taipa, madeira laqueada, telha cinza, bronze. **Paleta:** #6e5a48 · #8e4a3c · #3f4448 · #b8914d.
- **Trait (atual, mapeado):** Pedreiras trabalhadas em Colinas rendem +1 Pedra quando a cidade Produz.
- **Limitation (atual, mapeada):** Frotas têm −1 movimento.
- **Assinatura (atual):** Engenheiros de Cerco (nome mantido).
- **3 Heranças (atual → nome cultural):** Mutirão de Oficinas → Corveia das Oficinas · Forja Profunda → Fundição de Bronze · Têmpera de Kor → Têmpera de Yuhan.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Yu, o Grande ★** · SEMI-LENDÁRIO · *Construtor-Hidráulico*
- Período/tradição: Tradição Xia, c. séc. XXI a.C..
- Motivo da escolha: Doma as inundações com canais; é o mito fundador do trabalho coletivo.
- Relação com a civilização: Núcleo do chassi: obra pública, materiais, metal. Líder de referência.
- Retrato: Corpo inteiro de três-quartos, enxada ou pá, manto simples, rio e canais; luz de chuva clara; ~45 anos.
- Passiva possível: **Depósito de ferragens** (Limite de Metal +4).
- Poder 1× por Era possível: **Rotina de Manutenção** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Existência histórica não comprovada; não apresentar como fato.

**2. Fu Hao** · HISTÓRICO · *Comandante*
- Período/tradição: Shang, séc. XIII a.C..
- Motivo da escolha: Consorte real e general cujo túmulo intacto foi descoberto; comandou exércitos.
- Relação com a civilização: Mostra o chassi pelo lado militar e de suprimento.
- Retrato: Perfil, machado de bronze (yue), vaso ritual ao lado; luz de lareira; ~35 anos.
- Passiva possível: **Marcha da Rainha-Generala** (Suprimento +1 hex).
- Poder 1× por Era possível: **Machado de Bronze** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: Dados vêm de inscrições em ossos oraculares e do túmulo; evitar romantizar.

**3. Mozi** · HISTÓRICO · *Sábio-Engenheiro*
- Período/tradição: Estados Combatentes, séc. V a.C..
- Motivo da escolha: Filósofo e engenheiro de defesa, "amor universal" e fortificação.
- Relação com a civilização: Cerco e contracerco, mas com ética de paz.
- Retrato: Frontal, barba rala, manto simples, modelo de máquina defensiva ao fundo; luz de oficina.
- Passiva possível: **Engenhos de Defesa** (Limite de Madeira +6).
- Poder 1× por Era possível: **Amor Universal** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Escola extinta e pouco documentada; evitar atribuir invenções específicas sem fonte.

**4. Duque de Zhou** · HISTÓRICO · *Reformador-Regente*
- Período/tradição: Zhou Ocidental, séc. XI a.C..
- Motivo da escolha: Regente que consolidou a dinastia e a tradição de ritos e governo.
- Relação com a civilização: Estrutura de longo prazo; integração de territórios.
- Retrato: Três-quartos, vestes cerimoniais, tábua ritual; luz suave de sala de corte; ~50 anos.
- Passiva possível: **Ritos de Zhou** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Ritos e Música** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Muita memória é posterior e idealizada pela tradição confuciana.

**5. Zhang Qian** · HISTÓRICO · *Explorador-Diplomata*
- Período/tradição: Han, séc. II a.C..
- Motivo da escolha: Enviado que abriu a rota para o Ocidente, ancestral da Rota da Seda.
- Relação com a civilização: Expansão de rotas e Riqueza em um chassi de obras.
- Retrato: Perfil, manto de viagem, cajado de embaixada (jie), paisagem de deserto; luz de poeira; ~45 anos.
- Passiva possível: **Rota da Seda** (Limite de Riqueza +6).
- Poder 1× por Era possível: **Missão ao Ocidente** (+1 movimento da rodada).
- Risco histórico/cultural: Contexto imperial Han; evitar tom colonial.

**6. Huangdi (Imperador Amarelo)** · LENDÁRIO · *Ancestral-Fundador*
- Período/tradição: Tradição dos "Três Soberanos e Cinco Imperadores".
- Motivo da escolha: Antepassado cultural lendário, inventor de técnicas na tradição.
- Relação com a civilização: A "origem" do povo, não de um período histórico.
- Retrato: Frontal, barba longa, vestes de gala, carro com seta apontando ao sul (lenda); luz solene.
- Passiva possível: **Primeira Colheita** (Limite de Alimento +6).
- Poder 1× por Era possível: **Carro que Aponta ao Sul** (+1 ponto de comando da rodada).
- Risco histórico/cultural: Figura lendária; não apresentar como governante histórico. Tom de culto ancestral, não de religião viva.

*Reservas pesquisadas:* Qin Shi Huang (H, Unificador; risco: tirania); Li Bing (H, Construtor hidráulico); Lu Ban (S, Artífice); Hua Mulan (L, Heroína); Sunzi (S, Estrategista); Zhang Heng (H, Sábio); Cai Lun (H, Inventor do papel).

### 4. Bharani · alternativo *Magadhar* · chassi `orinth`
- **Matriz:** Índia antiga e clássica: Maurya, Gupta e Chola. **Período:** séc. IV a.C. – XI d.C..
- **Afinidade:** Científica.
- **Arquitetura N1–N7:**
  - N1–N2: casas de adobe com varanda, poço com degraus
  - N3–N4: mandapas de colunas de madeira, poços escalonados, torana (portal)
  - N5: templo de arenito com torre curva e muralha com portões
  - N6–N7: complexo de templo-torre, observatório de pedra, avenidas com portais
- **Porto:** Cais de arenito em degraus (ghat) com embarcações de vela quadrada.
- **Fortificação:** Muralha de arenito com bastiões arredondados e portal decorado.
- **Padrão:** Treliça geométrica (jali). **Emblema:** olho (existente). **Materiais:** Arenito rosado, madeira, estuque, cobre. **Paleta:** #c28a5a · #9a6a4a · #3d5f7a · #b8914d.
- **Trait (atual, mapeado):** O primeiro avanço de cada domínio custa 1 Conhecimento a menos.
- **Limitation (atual, mapeada):** Cavalaria custa +1 Alimento de manutenção.
- **Assinatura (atual):** Astrônomo-Pioneiro (nome mantido).
- **3 Heranças (atual → nome cultural):** Círculo de Estudos · Mirante das Medidas → Observatório de Pedra · Síntese de Orinth → Síntese de Bharani.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Aryabhata ★** · HISTÓRICO · *Sábio-Astrônomo*
- Período/tradição: Magadha/Gupta, c. 476–550 d.C..
- Motivo da escolha: Astrônomo e matemático, autor do Aryabhatiya.
- Relação com a civilização: Núcleo do chassi: métodos e conhecimento. Líder de referência.
- Retrato: Perfil, barba rala, esfera armilar e tabuinha de cálculo, torre de observação; luz de céu noturno; ~35 anos.
- Passiva possível: **Arquivo de medidas** (Limite de Pedra +6).
- Poder 1× por Era possível: **Padrão de Métodos** (+1 ponto de comando da rodada).
- Risco histórico/cultural: Biografia esparsa; não atribuir descobertas modernas.

**2. Ashoka** · HISTÓRICO · *Reformador-Governante*
- Período/tradição: Império Maurya, séc. III a.C..
- Motivo da escolha: Imperador que, depois de Kalinga, grava editos de governo e de paz.
- Relação com a civilização: Integração de territórios por política, não por força.
- Retrato: Frontal, coroa simples, pilar de edito ao fundo; luz de tarde; ~50 anos.
- Passiva possível: **Editos em Pilar** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Paz de Ashoka** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Figura ligada ao budismo vivo: evitar símbolos religiosos; mostrar o estadista.

**3. Chandragupta Maurya** · HISTÓRICO · *Comandante-Fundador*
- Período/tradição: Magadha, c. 321–297 a.C..
- Motivo da escolha: Funda o império Maurya e organiza um exército abastecido.
- Relação com a civilização: Defesa e suprimento de um estado grande.
- Retrato: Três-quartos, armadura leve, elefante de guerra ao fundo; luz de campanha; ~40 anos.
- Passiva possível: **Exércitos Abastecidos** (Suprimento +1 hex).
- Poder 1× por Era possível: **Falange Maurya** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: Fontes tardias e entrelaçadas com lendas.

**4. Chanakya (Kautilya)** · SEMI-LENDÁRIO · *Estrategista-Diplomata*
- Período/tradição: Magadha, atribuição do Arthashastra.
- Motivo da escolha: Conselheiro tradicional e autor atribuído do tratado de política.
- Relação com a civilização: Alianças e tratados no chassi científico.
- Retrato: Frontal, magro, rolo de folhas de palmeira, ábaco; luz de lamparina.
- Passiva possível: **Tesouro do Arthashastra** (Limite de Riqueza +6).
- Poder 1× por Era possível: **Teoria do Mandala** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Autoria e identidade debatidas; biografia lendária. Apresentar como tradição.

**5. Raja Raja I Chola** · HISTÓRICO · *Construtor-Explorador marítimo*
- Período/tradição: Chola, 985–1014 d.C..
- Motivo da escolha: Constrói o templo de Thanjavur e lança frotas no Oceano Índico (Sri Lanka e Maldivas).
- Relação com a civilização: Obra pública e alcance marítimo.
- Retrato: Perfil, joias discretas, torre de templo ao fundo; luz de entardecer; ~45 anos.
- Passiva possível: **Frotas do Oceano Índico** (Limite de Madeira +6).
- Poder 1× por Era possível: **Expedição Marítima** (+1 movimento da rodada).
- Risco histórico/cultural: Fora do núcleo clássico; imperialismo naval.

**6. Prabhavatigupta** · HISTÓRICO · *Governante-Regente*
- Período/tradição: Vakataka, séc. IV–V d.C..
- Motivo da escolha: Rainha-regente de um estado vizinho aos Gupta, documentada em inscrições.
- Relação com a civilização: Estabilidade e continuidade.
- Retrato: Três-quartos, sári simples, selo real; luz de janela; ~35 anos.
- Passiva possível: **Celeiros da Regência** (Limite de Alimento +6).
- Poder 1× por Era possível: **Regência Estável** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Pouco conhecida; manter fidelidade a inscrições.

*Reservas pesquisadas:* Sushruta (S, Sábio-médico); Brahmagupta (H, Matemático); Panini (H, Gramático); Vikramaditya (L, Rei ideal); Porus (H, Comandante).

### 5. Sahelor · alternativo *Mandaren* · chassi `saren`
- **Matriz:** África Ocidental sudanesa: Mali e o mundo mandê. **Período:** séc. XIII–XIV d.C..
- **Afinidade:** Política.
- **Arquitetura N1–N7:**
  - N1–N2: casas de terra crua com teto plano, muro baixo
  - N3–N4: pátios de adobe, praça de assembleia sob árvore, vigas salientes (toron)
  - N5: grande salão de adobe com contrafortes e muralha de terra
  - N6–N7: grande complexo de adobe com torres em contraforte, mercado, palácio de audiências
- **Porto:** Cais de adobe e madeira com pirogas; (cultura de rio, adaptação costeira).
- **Fortificação:** Muralha de adobe com contrafortes pontudos.
- **Padrão:** Faixas de lama tingida (bogolan). **Emblema:** tresvozes (existente). **Materiais:** Adobe, vigas de madeira, estuque de terra, ouro. **Paleta:** #b5835a · #6f4a32 · #d4b98a · #2f5a4a.
- **Trait (atual, mapeado):** Tratados de Saren duram +1 rodada.
- **Limitation (atual, mapeada):** Cavalaria custa +1 Alimento de manutenção.
- **Assinatura (atual):** Enviado Senatorial → Griô-Enviado.
- **3 Heranças (atual → nome cultural):** Convocação dos Vales → Assembleia dos Vales · Enviados Senatoriais → Griôs-Enviados · Concílio Permanente → Carta dos Vales.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Sundiata Keita ★** · SEMI-LENDÁRIO · *Governante-Fundador*
- Período/tradição: Manden, séc. XIII; epopeia dos griôs.
- Motivo da escolha: Funda o Mali; a epopeia une história e lenda e organiza o Concílio.
- Relação com a civilização: Núcleo do chassi: tratados e integração. Líder de referência.
- Retrato: Frontal, vestes de algodão tingido, arco, griô tocando ao fundo; luz de fogueira; ~35 anos.
- Passiva possível: **Acordos de vizinhança** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Selo do Concílio** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Epopeia oral; não apresentar como crônica. Respeitar a autoridade dos griôs.

**2. Mansa Musa** · HISTÓRICO · *Governante-Mecenas*
- Período/tradição: Mali, c. 1312–1337.
- Motivo da escolha: Rei da peregrinação que ficou famosa pela riqueza; patrocina cidades e saber.
- Relação com a civilização: Riqueza e prestígio dentro de um chassi político.
- Retrato: Três-quartos, turbante e manto, ouro em bandeja; luz de tarde saariana; ~45 anos.
- Passiva possível: **Ouro do Sahel** (Limite de Riqueza +6).
- Poder 1× por Era possível: **Peregrinação** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Cuidado com a fama exagerada em fontes tardias; ligação com islã (sem iconografia religiosa).

**3. Sogolon Kolonkan** · LENDÁRIO · *Matriarca-Heroína*
- Período/tradição: Epopeia de Sundiata.
- Motivo da escolha: Mãe de Sundiata na epopeia, ligada à sua força e à origem do reino.
- Relação com a civilização: Coesão de um povo em torno da memória.
- Retrato: Perfil, cabelo trançado, pilão ou cabaça, luz de manhã; ~50 anos.
- Passiva possível: **Colheitas do Vale** (Limite de Alimento +6).
- Poder 1× por Era possível: **Mãe do Mali** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Figura da epopeia; respeitar a tradição oral.

**4. Balla Fasseké** · SEMI-LENDÁRIO · *Diplomata-Griô*
- Período/tradição: Epopeia de Sundiata; linhagem de griôs.
- Motivo da escolha: Conselheiro e griô de Sundiata, guardião da memória.
- Relação com a civilização: Rede de embaixadas e informação.
- Retrato: Frontal ou três-quartos, instrumento de cordas (kora/balafon), voz erguida; luz de fogueira.
- Passiva possível: **Rede de Griôs** (Suprimento +1 hex).
- Poder 1× por Era possível: **Conselho ao Rei** (+1 ponto de comando da rodada).
- Risco histórico/cultural: Linhagem viva dos griôs (Kouyaté): consultar.

**5. Abubakari II** · SEMI-LENDÁRIO · *Explorador*
- Período/tradição: Mali, início do séc. XIV.
- Motivo da escolha: Rei que, segundo tradição, organizou uma expedição atlântica.
- Relação com a civilização: Alcance e exploração para um chassi político.
- Retrato: Perfil, piroga ao fundo, manto de viagem; luz de aurora; ~40 anos.
- Passiva possível: **Frota de Pirogas** (Limite de Madeira +6).
- Poder 1× por Era possível: **Expedição ao Oceano** (+1 movimento da rodada).
- Risco histórico/cultural: A viagem é disputada pelos historiadores; apresentar como tradição.

**6. Fakoli Koroma** · SEMI-LENDÁRIO · *Comandante-Ferreiro*
- Período/tradição: Epopeia de Sundiata; ferreiro-general.
- Motivo da escolha: General e ferreiro, ponte entre guerra e ofício.
- Relação com a civilização: Chassi político com braço militar.
- Retrato: Frontal, avental de ferreiro, martelo; luz de forja; ~40 anos.
- Passiva possível: **Forja de Fakoli** (Limite de Metal +4).
- Poder 1× por Era possível: **Martelo do Ferreiro** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: Na tradição o ferreiro é figura de poder ritual; cuidado com sacralidade.

*Reservas pesquisadas:* Sakura (H, Mansa); Soumaoro Kanté (S, Rei-ferreiro de Sosso); Tiramakhan Traoré (L, General); Abu Ishaq al-Sahili (H, Arquiteto); Kankou Musa (H).

### 6. Moanara · alternativo *Havaikara* · chassi `thalos`
- **Matriz:** Oceania polinésia: Samoa, Taiti, Havaí, Aotearoa, Rapa Nui. **Período:** expansão polinésia, séc. I – XVIII d.C..
- **Afinidade:** Marítima.
- **Arquitetura N1–N7:**
  - N1–N2: cabana de madeira e palha, praia de canoas
  - N3–N4: casas longas, plataforma cerimonial de coral
  - N5: grande plataforma de pedra (marae/ahu), casa de canoas
  - N6–N7: complexo de plataformas, casas de assembleia, doca de canoas duplas
- **Porto:** Praia-doca de coral com canoas duplas e plataforma de pedra.
- **Fortificação:** Paliçada de madeira com plataforma em terraço (pā).
- **Padrão:** Geometria de tecido de casca (kapa). **Emblema:** farol (existente). **Materiais:** Madeira, fibra, coral, basalto, concha. **Paleta:** #2f6f7f · #c9b389 · #6b4e3a · #e0d6bd.
- **Trait (atual, mapeado):** Revelar uma região costeira rende +1 Conhecimento.
- **Limitation (atual, mapeada):** Exércitos terrestres têm −1 de suprimento longe de rotas.
- **Assinatura (atual):** Infantaria Naval → Guerreiros de Canoa.
- **3 Heranças (atual → nome cultural):** Cartas das Marés · Infantaria Naval → Guerreiros de Canoa · Rede de Faróis → Fogos de Baliza.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Kupe ★** · SEMI-LENDÁRIO · *Explorador-Navegador*
- Período/tradição: Tradição māori; descoberta de Aotearoa.
- Motivo da escolha: Navegador da tradição que cruza o oceano e nomeia a terra.
- Relação com a civilização: Núcleo do chassi: costas, suprimento, movimento. Líder de referência.
- Retrato: Perfil, mão no remo da canoa dupla, olhar ao horizonte, céu de estrelas; luz de estrelas e brasa; ~40 anos.
- Passiva possível: **Cartas de abastecimento** (Suprimento +1 hex).
- Poder 1× por Era possível: **Carta Nova** (+1 movimento da rodada).
- Risco histórico/cultural: Tradição viva māori; consultar. Evitar tatuagens rituais sem consulta.

**2. Māui** · MITOLÓGICO · *Herói-Demiurgo*
- Período/tradição: Mito pan-polinésio.
- Motivo da escolha: Pesca as ilhas e laça o sol; figura central dos mitos de origem.
- Relação com a civilização: Origem e engenho: o lado "inventar" do povo.
- Retrato: Corpo de três-quartos, anzol de osso, laço de corda, mar e sol; luz dourada; sem rosto exagerado.
- Passiva possível: **Pescaria das Ilhas** (Limite de Alimento +6).
- Poder 1× por Era possível: **Laço do Sol** (+1 ponto de comando da rodada).
- Risco histórico/cultural: Tradição viva em várias culturas; versões diferentes. Não padronizar; consultar.

**3. Rata** · LENDÁRIO · *Construtor-Canoeiro*
- Período/tradição: Tradição das Ilhas da Sociedade e Aotearoa.
- Motivo da escolha: Constrói a canoa de viagem; é herói do trabalho coletivo.
- Relação com a civilização: Obra e esforço coletivo em torno da navegação.
- Retrato: Frontal ou três-quartos, machado de pedra, tronco de árvore; luz de floresta; ~35 anos.
- Passiva possível: **Árvore da Canoa** (Limite de Madeira +6).
- Poder 1× por Era possível: **Mutirão da Canoa** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Variantes regionais; evitar misturar.

**4. Hotu Matuʻa** · SEMI-LENDÁRIO · *Fundador-Colonizador*
- Período/tradição: Rapa Nui, tradição de fundação.
- Motivo da escolha: Rei que chega a Rapa Nui, segundo a tradição.
- Relação com a civilização: Fundação e povoamento de ilhas distantes.
- Retrato: Perfil, manto de tapa, mar aberto, plataforma de pedra; luz de entardecer; ~45 anos.
- Passiva possível: **Plataformas de Pedra** (Limite de Pedra +6).
- Poder 1× por Era possível: **Chegada à Ilha** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Tradição de povo vivo; moai são ícone sensível.

**5. Tupaia** · HISTÓRICO · *Cartógrafo-Mediador*
- Período/tradição: Raiatea e Taiti, c. 1725–1770.
- Motivo da escolha: Navegador-sacerdote que mapeou ilhas e mediou com europeus.
- Relação com a civilização: Conhecimento e mediação.
- Retrato: Perfil, mapa desenhado, canoa ao fundo; luz de dia; ~45 anos.
- Passiva possível: **Língua Comum** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Intérprete e Mediador** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Figura da era do contato; evitar tom colonial.

**6. Kamehameha I** · HISTÓRICO · *Governante-Comandante*
- Período/tradição: Havaí, c. 1758–1819.
- Motivo da escolha: Unifica as ilhas; encarna coesão e força.
- Relação com a civilização: O lado militar de um chassi marítimo.
- Retrato: Três-quartos, manto de penas simples, lança; luz de vulcão; ~45 anos.
- Passiva possível: **Armas de Contato** (Limite de Metal +4).
- Poder 1× por Era possível: **Unificação das Ilhas** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: Figura pós-contato; sensível; evitar penas sagradas do manto real sem consulta.

*Reservas pesquisadas:* Hina (M, Patrona da lua); Pele (M, Patrona do fogo; sensível); Tangaroa/Kanaloa (M, Patronos do mar); Ui-te-Rangiora (L, Navegador); Kaʻahumanu (H, Regente-Reformadora); Tāne (M, Patrono das florestas).

### 7. Tawanta · alternativo *Pachakar* · chassi `aurelia`
- **Matriz:** Andes: Tawantinsuyu e antecessores. **Período:** séc. XV–XVI d.C. (raízes anteriores).
- **Afinidade:** Agrária.
- **Arquitetura N1–N7:**
  - N1–N2: casas de pedra e palha, terraço pequeno, depósito
  - N3–N4: andenes (terraços), portas trapezoidais, depósitos (qollqa)
  - N5: plataforma escalonada, praça central, muralha encaixada
  - N6–N7: citadela de terraços, muralha em zigue-zague, estradas
- **Porto:** Embarcadouro de pedra encaixada com barcos de junco (caballito de totora).
- **Fortificação:** Muralha em zigue-zague de pedra poligonal encaixada.
- **Padrão:** Tocapu (quadros xadrez). **Emblema:** espiga (existente), lida como espiga de milho. **Materiais:** Granito e andesito, palha ichu, adobe. **Paleta:** #a9a493 · #7d7967 · #b79c62 · #a54a3a.
- **Trait (atual, mapeado):** Fazendas trabalhadas rendem +1 Alimento quando a cidade Produz.
- **Limitation (atual, mapeada):** Manutenção militar +1 Alimento a cada 4 peças.
- **Assinatura (atual):** Celeiro Comum → Qollqa (depósito comum).
- **3 Heranças (atual → nome cultural):** Celeiros Comuns → Qollqas Comuns · Terraços Dourados → Andenes Dourados · Reserva da Abundância.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Mama Ocllo ★** · LENDÁRIO · *Matriarca-Fundadora*
- Período/tradição: Lenda de origem inca.
- Motivo da escolha: Parceira de Manco Cápac na lenda de fundação; na tradição ensina o tecer.
- Relação com a civilização: Núcleo do chassi: alimento e Ânimo. Líder de referência.
- Retrato: Frontal, tecelagem no colo, espiga de milho, terraços ao fundo; luz de manhã; ~35 anos.
- Passiva possível: **Celeiros de cortesia** (Limite de Alimento +6).
- Poder 1× por Era possível: **Festa da Colheita** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Lenda; não apresentar como fato. Cosmologia andina viva.

**2. Pachacútec** · HISTÓRICO · *Construtor-Reformador*
- Período/tradição: Cuzco, c. 1438–1471.
- Motivo da escolha: Reorganiza o estado e remodela Cuzco; atribuída a Machu Picchu.
- Relação com a civilização: Obras e logística sobre a agricultura.
- Retrato: Perfil, fita (llautu) e orelheiras, tecido de tocapu; luz de pedra; ~50 anos.
- Passiva possível: **Cantaria encaixada** (Limite de Pedra +6).
- Poder 1× por Era possível: **Mit’a** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Mit’a foi trabalho obrigatório; o retrato evita glorificar.

**3. Manco Cápac** · LENDÁRIO · *Fundador*
- Período/tradição: Lenda de origem inca.
- Motivo da escolha: Fundador lendário de Cuzco.
- Relação com a civilização: Aliança de ayllus; unir comunidades.
- Retrato: Frontal, bastão de ouro, montanhas ao fundo; luz de alvorada; sem idade definida.
- Passiva possível: **Cuzco, umbigo do mundo** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Aliança de Ayllus** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Lenda dinástica; não apresentar como história.

**4. Túpac Inca Yupanqui** · HISTÓRICO · *Comandante-Explorador*
- Período/tradição: Tawantinsuyu, c. 1471–1493.
- Motivo da escolha: Expande o império; ligado às redes de caminhos.
- Relação com a civilização: Mobilidade sobre uma economia de depósitos.
- Retrato: Três-quartos, escudo, caminho de pedra ao fundo; luz de estrada; ~40 anos.
- Passiva possível: **Qhapaq Ñan** (Suprimento +1 hex).
- Poder 1× por Era possível: **Chasquis** (+1 movimento da rodada).
- Risco histórico/cultural: Narrativas de expedição marítima são tradição; não afirmar.

**5. Mama Huaco** · LENDÁRIO · *Heroína-Guerreira*
- Período/tradição: Lenda de origem inca.
- Motivo da escolha: Irmã guerreira de Manco Cápac na lenda; arremessa bolas de pedra.
- Relação com a civilização: Defesa e força de comunidade.
- Retrato: Perfil, funda e bolas, colar de ouro; luz de crepúsculo.
- Passiva possível: **Fibra e Funda** (Limite de Madeira +6).
- Poder 1× por Era possível: **Arremesso de Mama Huaco** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: Episódios violentos da lenda; apresentar com contexto.

**6. Huayna Cápac** · HISTÓRICO · *Governante-Consolidador*
- Período/tradição: Tawantinsuyu, c. 1493–1527.
- Motivo da escolha: Consolida o império no apogeu, antes da conquista europeia.
- Relação com a civilização: Riqueza de tributo e comando.
- Retrato: Frontal, tecido de ouro e plumas, trono baixo de pedra; luz de pátio; ~50 anos.
- Passiva possível: **Tributo do Sol** (Limite de Riqueza +6).
- Poder 1× por Era possível: **Governo dos Quatro Suyus** (+1 ponto de comando da rodada).
- Risco histórico/cultural: Fim trágico do império; evitar glorificação.

*Reservas pesquisadas:* Atahualpa (H, Último sapa inca); Chañan Cori Coca (L, Heroína); Viracocha (P, Criador); Inti (P, Sol); Pachamama (P, Terra; tradição viva); Senhor de Sipán (H, Governante moche).

### 8. Eirelon · alternativo *Gaelar* · chassi `nymara`
- **Matriz:** Mundo celta atlântico: Irlanda, Gália e Bretanha. **Período:** séc. VI a.C. – V d.C. (com ciclos medievais).
- **Afinidade:** Cultural.
- **Arquitetura N1–N7:**
  - N1–N2: casa redonda de madeira e palha, cerca de turfa
  - N3–N4: casas redondas, salão longo, círculo de pedras
  - N5: forte de colina com valas e paliçada, salão de reunião
  - N6–N7: oppidum com muralha de madeira e pedra (murus gallicus), casa de assembleia
- **Porto:** Cais de madeira com currachs (barcos de couro).
- **Fortificação:** Muralha de terra, vala e paliçada de madeira (forte de colina).
- **Padrão:** Entrelaçado e espirais (La Tène). **Emblema:** folha (existente). **Materiais:** Carvalho, palha, turfa, pedra, bronze. **Paleta:** #5f7a4f · #7a5a3a · #9a9a8a · #b8914d.
- **Trait (atual, mapeado):** A Ação cívica rende +1 Influência.
- **Limitation (atual, mapeada):** Modernizações custam +1 Metal.
- **Assinatura (atual):** Bardo-Enviado (nome mantido).
- **3 Heranças (atual → nome cultural):** Partilha de Sementes · Bosque da Memória → Nemeton da Memória · Raízes Compartilhadas.

**Roster de 6 figuras** (★ = Líder de referência, mantém Passiva e Poder atuais do chassi):

**1. Amergin ★** · LENDÁRIO · *Bardo-Sábio*
- Período/tradição: Ciclos míticos irlandeses (Lebor Gabála).
- Motivo da escolha: Poeta que canta a terra ao desembarcar; fundador da tradição poética.
- Relação com a civilização: Núcleo do chassi: memória e cultura. Líder de referência.
- Retrato: Perfil, harpa, mãos erguidas ao mar, costa rochosa; luz de ventania ao amanhecer; ~45 anos.
- Passiva possível: **Bosques de memória** (Limite de Madeira +6).
- Poder 1× por Era possível: **Ritual das Sementes** (+1 Ânimo em todas as cidades).
- Risco histórico/cultural: Lenda medieval escrita; evitar neopaganismo moderno.

**2. Cú Chulainn** · LENDÁRIO · *Herói*
- Período/tradição: Ciclo do Ulster.
- Motivo da escolha: Herói que defende um vau sozinho no Táin Bó Cúailnge.
- Relação com a civilização: Defesa de passagem e a ideia do herói solitário.
- Retrato: Corpo de três-quartos, lança, vau e névoa; luz fria; ~25 anos.
- Passiva possível: **Vau Guardado** (Suprimento +1 hex).
- Poder 1× por Era possível: **Fúria do Herói** (+2 Força nos conflitos da rodada).
- Risco histórico/cultural: Imagens de videogame; evitar "fúria" caricata e distorção do rosto.

**3. Medb** · LENDÁRIO · *Rainha-Governante*
- Período/tradição: Ciclo do Ulster.
- Motivo da escolha: Rainha de Connacht que provoca o Táin por riqueza e igualdade de bens.
- Relação com a civilização: Riqueza de rebanhos e comando.
- Retrato: Frontal, coroa e manto, cavalo ao fundo; luz de manhã; ~40 anos.
- Passiva possível: **Rebanhos de Connacht** (Limite de Riqueza +6).
- Poder 1× por Era possível: **Chamado de Medb** (+1 ponto de comando da rodada).
- Risco histórico/cultural: Retrato histórico muito misógino em fontes tardias; evitar o tropo da rainha ambiciosa.

**4. Boudica** · HISTÓRICO · *Comandante-Rebelde*
- Período/tradição: Ícenos, 60–61 d.C..
- Motivo da escolha: Rainha que lidera revolta contra Roma, documentada por fontes romanas.
- Relação com a civilização: Mobilidade de uma rebelião.
- Retrato: Perfil, cabelos soltos, carro de guerra, campo aberto; luz de tempestade; ~35 anos.
- Passiva possível: **Torques e Lâminas** (Limite de Metal +4).
- Poder 1× por Era possível: **Revolta Veloz** (+1 movimento da rodada).
- Risco histórico/cultural: Fontes romanas hostis; a imagem vitoriana a distorceu.

**5. Diviciaco** · HISTÓRICO · *Sábio-Diplomata (druida)*
- Período/tradição: Éduos, séc. I a.C..
- Motivo da escolha: Druida e chefe éduo que atuou como aliado de Roma.
- Relação com a civilização: Alianças e integração por palavra.
- Retrato: Frontal, vestes de lã, foice (símbolo) e bastão, bosque; luz filtrada de árvores; ~55 anos.
- Passiva possível: **Palavra do Druida** (Ação cívica integra +10 em cidades ocupadas).
- Poder 1× por Era possível: **Aliança dos Éduos** (tratados ativos duram +2 rodadas).
- Risco histórico/cultural: Fonte de César é interessada; druidismo não está bem documentado.

**6. Cartimandua** · HISTÓRICO · *Rainha-Diplomata*
- Período/tradição: Brigantes, séc. I d.C..
- Motivo da escolha: Rainha dos brigantes que equilibrou alianças com Roma.
- Relação com a civilização: Paz por política.
- Retrato: Três-quartos, torque de ouro, forte de colina; luz suave; ~40 anos.
- Passiva possível: **Pastagens dos Brigantes** (Limite de Alimento +6).
- Poder 1× por Era possível: **Paz com Roma** (+15 coesão local em todas as cidades).
- Risco histórico/cultural: Fontes romanas; o "colaboracionismo" é visão posterior.

*Reservas pesquisadas:* Vercingetorix (H, Comandante gaulês); Brian Boru (H, Alto rei medieval); Fionn mac Cumhaill (L, Herói-Sábio); Taliesin (S, Bardo); Lugh (P, Patrono dos ofícios); Dagda (P); Morrígan (P); Brigid (P, sensível).

---

## 9. Mockups (artifact atualizado)

Na seção "Passada de profundidade": CORE 8 (pontuação e cards), **A.** roster visual dos 6 de Leontia, **B.** carta de Agamenon, **C.** carta de Perseu, **D.** Zeus como Patrono, **E.** tela de seleção com 6 opções, **F.** três Líderes de Leontia (80/20), **G.** matriz Core 8 × 6.

## 10. O que **não** foi feito
Alterar civilizações em produção; trocar nomes no Alpha; alterar IDs; mudar saves; criar mecânica de Patrono; balancear os 48; gerar imagens finais; mudar Porto ou Estradas; tocar o engine.

## 11. Decisões a aprovar
1. **CORE 8** (§1.2) e a troca de Persa/Maia por Sahelor/Eirelon. **D-C1:** Eirelon ou Parsar como oitavo.
2. **Reatribuições** Tawanta→`aurelia` e Nokor→`dravik`.
3. **Expansion 4 e 6** (§1.6), incluindo Qaghar com chassi em autoria.
4. **Classificações** e o papel de **Patrono Mítico**.
5. **Leontia:** roster de 6 (Leônidas ★, Agamenon, Perseu, Péricles, Arquimedes, Aspásia). **Zeus como Patrono**, não Líder.
6. **Regra 80/20** e uso exclusivo dos tipos de Passiva e Poder existentes; cada civilização cobre os 6 Poderes.
7. **Seleção D:** Líder padrão + variantes.
8. **Papel dos Patronos** (§6) e a restrição a religiões vivas.
9. **Linguagem de retrato** com personalidade por figura (§7).
