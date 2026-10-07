# AOH HISTORICAL CIVILIZATIONS: CORE 10 / FIGURES V1

Status: **proposta de conceito**. Nada aqui altera engine, IDs técnicos, saves, balanceamento, Porto, Estradas, produção, `workedHexIds` ou deploy. Nenhum asset final foi gerado e nenhum teste do jogo foi rodado.
Mockups (artifact): `docs/product/aoh-core10-mockups-v1.html`.

**Substitui** como direção principal o Core 8 híbrido/fictício e as 18 culturas dos documentos anteriores (`aoh-civilizations-leaders-depth-pass.md`, `aoh-material-culture-and-civilizations-concept-v1.md`). Esses ficam como histórico. O que **permanece** desses documentos: direção visual escultórica de pedra, madeira e bronze; cor do jogador = posse; Porto como única mudança espacial; classe A/B/C de segurança; Estradas e território **fora de escopo**.

---

## 1. Direção

**Reconhecimento, história, lendas icônicas, identidade visual, replayability.** Nomes históricos reconhecíveis; os nomes fictícios (Leontia, Uruvane, Yuhan, Bharani…) **saem da tela**. Os IDs técnicos antigos (`valgard`, `kor`…) ficam **escondidos** por compatibilidade. Não implementar; não alterar IDs, saves ou engine.

## 2. CORE 10

| # | Civilização (nome visível) | Chassi oculto (ID técnico) | Afinidade do chassi |
|---|---|---|---|
| 1 | **Helênicos** | `valgard` | Territorial (defesa, suprimento) |
| 2 | **Egípcios** | `iskara` *(em autoria)* | Cultural (legado) |
| 3 | **Mesopotâmicos** | `meridia` | Econômica |
| 4 | **Persas** | `dravik` | Territorial (obras, logística) |
| 5 | **Israel e Judá** | `solenne` | Cultural (identidade) |
| 6 | **Romanos** | `kor` | Territorial (engenharia, cerco) |
| 7 | **Nórdicos** | `thalos` | Marítima |
| 8 | **Chineses** | `orinth` | Científica |
| 9 | **Índia Antiga** | `saren` | Política |
| 10 | **Incas (Tawantinsuyu)** | `aurelia` | Agrária |

Mecânica **não é forçada**: a figura histórica vem primeiro; o chassi é o que melhor casa com o que a civilização é conhecida por fazer. Cobre 7 das 8 afinidades (falta Militar).

### 2.1 Auditoria dos recortes

| Civilização | Recorte | Período | Auditoria |
|---|---|---|---|
| **Helênicos** | Mundo helênico: tradição micênica, Grécia clássica e helenismo | c. 1200 – 30 a.C. (Odisseu é tradição da Idade do Bronze) | Coerente como "mundo helênico". Atenção: Odisseu é figura épica da Idade do Bronze, Leônidas é do séc. V e Alexandre é macedônio e helenístico. Aceitável se o rótulo for "Helênicos", não "Grécia clássica". |
| **Egípcios** | Egito faraônico: do Reino Antigo ao Novo | c. 2700 – 1070 a.C. | Coerente, mas longo: Imhotep (séc. XXVII a.C.) a Ramsés II (séc. XIII a.C.) são ~1400 anos de continuidade visual. Aceitável. Cleópatra VII (ptolomaica) é reserva e exigiria nota de recorte helenístico. |
| **Mesopotâmicos** | Mesopotâmia da Idade do Bronze: Suméria, Acádia e Babilônia antiga | c. 2700 – 1600 a.C. | Coerente se restrito à Idade do Bronze. Nabucodonosor II e Assurbanípal (reservas) são do Ferro e pedem nota de recorte (Neo-Assírio e Neo-Babilônio). |
| **Persas** | Pérsia aquemênida | c. 550 – 330 a.C. | Coerente e estreito: os três reis estão em 550–465 a.C. O rótulo "Persas" cobre depois Partos e Sassânidas, que ficam fora: usar "Persas aquemênidas" em texto de apoio. |
| **Israel e Judá** | Israel antigo e Judá (Idade do Ferro) | c. 1200 – 586 a.C. | Coerente: Sansão (era dos Juízes, c. séc. XII–XI), Davi (c. séc. X) e Elias (séc. IX). A fonte principal é a Bíblia hebraica, texto sagrado de religiões vivas; a arqueologia confirma contextos (Merneptá, Tel Dan, Monólito de Salmanasar III), não as pessoas. |
| **Romanos** | Roma: República tardia e Principado | c. 100 a.C. – 117 d.C. | Coerente como "Roma da República tardia ao Alto Império". Evitar misturar Roma monárquica (Rômulo) ou Roma tardia (Constantino, reserva) sem nota. |
| **Nórdicos** | Mundo nórdico da Era Viking | c. 793 – 1066 d.C. | Coerente na Era Viking. As fontes são em grande parte sagas do séc. XIII (escritas séculos depois). Ragnar é figura composta. Evitar o recorte "mitológico" (Odin e Thor ficam como Patronos). |
| **Chineses** | China antiga e imperial inicial | c. 500 a.C. – 705 d.C. | Atenção: os três vão de Sun Tzu (c. 500 a.C.) a Wu Zetian (séc. VII d.C.): ~1200 anos, da Primavera e Outono à Tang. Aceitável como "China" se a arquitetura usar um vocabulário comum Han–Tang. É o recorte mais largo do Core 10. |
| **Índia Antiga** | Índia antiga: Maurya e Gupta | c. 321 a.C. – 550 d.C. | Coerente como Maurya–Gupta (~870 anos). Separar tradições religiosas vivas (budismo, jainismo, hinduísmo) para revisão cultural antes de arte. Evitar o emblema moderno (leão de Sarnath e Ashoka Chakra). |
| **Incas (Tawantinsuyu)** | Tawantinsuyu e a tradição de origem inca | c. 1438 – 1533 d.C. (origem em tradição) | Coerente. O Estado inca é tardio e documentado por cronistas coloniais. Manco Cápac e Mama Ocllo são tradição de origem, não história; precisam da etiqueta correta. |

**Pontos de maior atenção:** *Chineses* (1200 anos entre Sun Tzu e Wu Zetian), *Helênicos* (Odisseu é tradição da Idade do Bronze; Alexandre é helenístico), *Egípcios* (1400 anos), *Israel e Judá* (fonte principal sagrada, contexto confirmado só em parte).

### 2.2 Casamento com os chassis atuais

O chassi define Trait, Limitation, Assinatura e 3 Heranças; **as regras não mudam**, só o nome de exibição.

| Civilização | Chassi | Alternativa | Trait (atual) | Limitation (atual) | Assinatura | Heranças (atual → nome histórico) |
|---|---|---|---|---|---|---|
| **Helênicos** | `valgard` (Territorial (defesa e suprimento)) | — | +1 alcance de suprimento para peças em território próprio. | Enviados custam +1 Influência. | Guarda de Escudos → Falange de Escudos | Passos Guardados; Refúgios de Montanha → Acrópoles de Refúgio; Muralha Viva |
| **Egípcios** | `iskara` (Cultural (legado e prestígio)) | aurelia (Agrária, jogável) | Cada Obra de Legado concluída rende +2 Prestígio. | Perde 1 Legado ao abandonar uma cidade cultural. | Guardião dos Ancestrais → Guardião da Necrópole | Fogo Sagrado → Ritos Diários do Templo; Guardiões do Templo; Chama Perene → Casa da Eternidade |
| **Mesopotâmicos** | `meridia` (Econômica) | — | A primeira oferta comercial concluída em cada rodada rende +1 Riqueza. | Fortificação não passa de Muralha de Pedra até a Era IV. | Caravana → Karum (entreposto) | Feira das Margens → Karum das Margens; Entrepostos Fluviais → Entrepostos do Eufrates; Casa das Margens → Crédito do Templo |
| **Persas** | `dravik` (Territorial (obras e logística)) | solenne (Cultural) | Estradas e melhorias custam 1 Madeira/Pedra a menos. | Rotas comerciais rendem −1 Riqueza. | Aqueduto → Qanat | Jornada de Construção → Estrada Real; Aquedutos → Qanats; Redes de Abastecimento → Satrapias e Depósitos |
| **Israel e Judá** | `solenne` (Cultural (identidade e resistência)) | nymara (Cultural) | Disputas culturais ganham +1 na defesa. | Avanços de Conhecimento da Era I custam +1. | Santuário Solar → Casa do Templo | Assembleia de Vozes → Anciãos do Portão; Instituições Abertas → Aliança e Lei; Ágora das Nações → Tribos Reunidas |
| **Romanos** | `kor` (Territorial (engenharia e cerco)) | — | Pedreiras trabalhadas em Colinas rendem +1 Pedra quando a cidade Produz. | Frotas têm −1 movimento. | Engenheiros de Cerco → Legionários-Engenheiros | Mutirão de Oficinas → Fábricas das Legiões; Forja Profunda → Forjas Legionárias; Têmpera de Kor → Balistas e Escorpiões |
| **Nórdicos** | `thalos` (Marítima (incursão e exploração)) | norvak (Marítima, em autoria) | Revelar uma região costeira rende +1 Conhecimento. | Exércitos terrestres têm −1 de suprimento longe de rotas. | Infantaria Naval → Incursores de Drakkar | Cartas das Marés → Rotas do Mar do Norte; Infantaria Naval → Incursores; Rede de Faróis → Fogos de Sinal |
| **Chineses** | `orinth` (Científica (método e administração)) | saren (Política) | O primeiro avanço de cada domínio custa 1 Conhecimento a menos. | Cavalaria custa +1 Alimento de manutenção. | Astrônomo-Pioneiro → Astrônomo Imperial | Círculo de Estudos → Academia de Jixia; Mirante das Medidas → Observatório Imperial; Síntese de Orinth → Síntese das Cem Escolas |
| **Índia Antiga** | `saren` (Política (estado e diplomacia)) | orinth (Científica) | Tratados de Saren duram +1 rodada. | Cavalaria custa +1 Alimento de manutenção. | Enviado Senatorial → Dūta Imperial | Convocação dos Vales → Pilares de Edito; Enviados Senatoriais → Dūtas; Concílio Permanente → Teoria do Mandala |
| **Incas (Tawantinsuyu)** | `aurelia` (Agrária (alimento e obra)) | dravik (Territorial) | Fazendas trabalhadas rendem +1 Alimento quando a cidade Produz. | Manutenção militar +1 Alimento a cada 4 peças. | Celeiro Comum → Qollqa Comum | Celeiros Comuns → Qollqas Comuns; Terraços Dourados → Andenes; Reserva da Abundância → Reserva do Inca |

**Ponto de atenção: Egípcios.** O chassi `iskara` (+2 Prestígio por Obra de Legado) é o que melhor expressa o Egito monumental, mas é **AUTHORING**: sem capital, sem cartas de civilização. É trabalho de autoria futuro (a Figura substitui o Líder). **Plano B totalmente jogável:** Egípcios em `aurelia`, Incas em `dravik`, Persas em `solenne`, Israel em `nymara`. Ele funciona, mas casa pior (Persas perdem Estrada Real; Israel perde Casa do Templo).

**Chassis que ficam sem uso (escondidos):** `veyra`, `elyra`, `nymara`, `kaedor`, `lumaris`, `targan`, `veloria`, `norvak` não entram no Core 10.

---

## 3. "Figura" como conceito editorial

Nem toda personagem foi chefe de Estado. **Figura** = Governante, General, Herói, Explorador, Profeta, Sábio, Estrategista ou Fundador.

**Recomendação de UI:** o rótulo da carta e da tela de seleção passa a **"Figura"**, com o arquétipo como subtítulo ("Governante-Legislador", "Profeta"). "Líder" fica só nos nomes técnicos internos (`leaderId` etc.), que **não mudam**. Evita distorção histórica (Elias não "lidera"), custa só texto de exibição.

## 4. Classificações

| Classe | Critério | Apresentação |
|---|---|---|
| **HISTÓRICO** | pessoa atestada em fontes | datas e fonte ampla |
| **SEMI-LENDÁRIO** | pessoa provavelmente real, biografia dominada por lenda | sem datas exatas; "tradição de…" |
| **LENDÁRIO** | figura de epopeia ou lenda sem atestação independente | cita a obra; sem datas |
| **MITOLÓGICO** | semideus ou entidade que age como herói | "figura de mito" |
| **TRADICIONAL / ÉPICO** *(nova nesta rodada)* | figura de texto sagrado ou tradição fundadora/épica viva; historicidade debatida | **"segundo a tradição"**; a fonte aparece na carta |
| **PATRONO MÍTICO** | divindade que não funciona como governante humano | imagem de culto; nunca é Figura |

**Nunca se apresenta tradição como fato histórico comprovado.** TRADICIONAL / ÉPICO é a classe usada para Davi, Elias e Sansão, Ragnar, Manco Cápac e Mama Ocllo: não os chamo de "históricos" nem de "mitologia".

## 5. Sistema de Figuras

Formato atual preservado: **uma Passiva e um Poder 1× por Era**. Sem árvore, nível ou subsistema.

| A **civilização** define | A **Figura** define |
|---|---|
| Trait, Limitation, Assinatura | Passiva |
| 3 Heranças | Poder 1× por Era |
| arquitetura, estandarte, emblema, identidade | retrato |
| | um pequeno direcionamento estratégico |

**Não se força cobertura de tipos.** Cada Figura recebe os efeitos que casam com sua história, entre os **tipos que já existem** (Passivas: Suprimento +1, limite de recurso, Integração +10; Poderes: Força, Movimento, Comando, Ânimo, Coesão, Tratados). A mesma Passiva ou Poder pode repetir numa civilização.

**Risco de balanceamento (não tratado):** nada foi balanceado. As 30 combinações precisam de playtest antes de entrar em dados.

## 6. Seleção

No setup: a civilização mostra **três Figuras**; uma vem marcada como **recomendada para iniciantes** (★); o jogador escolhe uma; em multiplayer as escolhas são **reveladas ao mesmo tempo**. Simples, 2–4 jogadores, replay imediato. Ver mockup C.

**Dependência (engine, não agora):** hoje cada civilização recebe exatamente um Líder automaticamente; a seleção exige estado de lobby e dados para 3 Figuras por civilização.

## 7. Catálogo: 10 civilizações × 3 Figuras

### 1. Helênicos
- **Recorte:** Mundo helênico: tradição micênica, Grécia clássica e helenismo. **Período:** c. 1200 – 30 a.C. (Odisseu é tradição da Idade do Bronze).
- **Arquitetura N1–N7:**
  - N1–N2: cabanas de pedra e barro, lareira central
  - N3–N4: casas de pátio, ágora, estoa de colunas, telhado baixo de terracota
  - N5: acrópole com templo e muralha de blocos
  - N6–N7: peristilos, teatro, acrópole monumental
- **Porto:** Mole de pedra clara com trirreme.
- **Fortificação:** Muralha poligonal com torres redondas e portão.
- **Materiais:** Mármore, calcário, terracota, bronze. **Padrão:** Friso de meandro. **Paleta:** #e4ddc8 · #b9825e · #7f8a8f · #b8914d.
- **Estandarte:** *Aspis*. Escudo redondo de bronze com cercadura de meandro. (enum oculto: SHIELD (oculto)).
- **Emblema:** *Aspis de bronze*. Escudo redondo com anel de meandro.
- **Representação de cidade:** Acrópole, estoa e muralha de blocos claros.
- **Patronos (fora das Figuras):** Zeus, Atena, Poseidon.
- **Reservas futuras:** Agamenon (L); Perseu (L); Héracles (M); Aquiles (L); Péricles (H); Artemísia I (H); Temístocles (H); Arquimedes (H).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Odisseu** | LENDÁRIO | Explorador-Estrategista | Naus de Ítaca (Limite de Madeira +6) | Rota do Retorno (+1 movimento da rodada) | Mobilidade, exploração, retirada, navegação. |
| **Alexandre III da Macedônia** | HISTÓRICO | Conquistador-Comandante | Cidades de Alexandre (Ação cívica integra +10 em cidades ocupadas) | Campanha Relâmpago (+1 ponto de comando da rodada) | Ofensiva, comando, expansão. |
| **Leônidas I** ★ | HISTÓRICO | Comandante-Defensor | Refúgios abastecidos (Suprimento +1 hex) | Muralha Viva (+2 Força nos conflitos da rodada) | Defesa, território, resistência. |

**Retratos (direção):**
- Odisseu: Perfil, barba curta, pilos (gorro cônico), remo na mão, mar à noite; luz de estrelas e lamparina; ~45 anos.
- Alexandre III da Macedônia: Três-quartos, cabelo em anástole (franja erguida), diadema, couraça; plano largo de campo de batalha; luz de aurora.
- Leônidas I: Frontal justo, elmo coríntio erguido, borda de escudo; desfiladeiro ao crepúsculo; luz fria e brasa; ~40 anos.

### 2. Egípcios
- **Recorte:** Egito faraônico: do Reino Antigo ao Novo. **Período:** c. 2700 – 1070 a.C..
- **Arquitetura N1–N7:**
  - N1–N2: casas de tijolo cru e telhado plano, cerca de junco
  - N3–N4: pátios, capela, colunata papiriforme
  - N5: pilone com obelisco, templo de arenito
  - N6–N7: complexo de pilones, avenida de esfinges, pirâmide
- **Porto:** Cais de pedra com cabeços em obelisco e barco de papiro.
- **Fortificação:** Muralha de tijolo cru com ameias e portão de pilone.
- **Materiais:** Calcário, arenito, tijolo cru, ouro, azul-egípcio. **Padrão:** Friso de papiro e lótus. **Paleta:** #e0d5b8 · #3f8f9a · #c9a54e · #7a4a3a.
- **Estandarte:** *Insígnia de Nomo*. Haste com disco e flâmula, à maneira dos padrões de divisão do exército. (enum oculto: POLE (oculto)).
- **Emblema:** *Sema-tauy*. Lótus e papiro atados: união das Duas Terras.
- **Representação de cidade:** Pilone, obelisco, colunata papiriforme e tijolo cru.
- **Patronos (fora das Figuras):** Ptah, Tot, Ísis (estudo separado).
- **Reservas futuras:** Tutemés III (H); Akhenaton (H); Cleópatra VII (H); Khufu (H); Amenhotep III (H).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Ramsés II** ★ | HISTÓRICO | Governante-Comandante | Estradas de Canaã (Suprimento +1 hex) | Carros de Kadesh (+2 Força nos conflitos da rodada) | Governo e comando: obra e campanha. |
| **Hatshepsut** | HISTÓRICO | Governante-Construtora | Mirra de Punt (Limite de Riqueza +6) | Festa do Vale (+1 Ânimo em todas as cidades) | Obra pública e comércio. |
| **Imhotep** | HISTÓRICO | Sábio-Arquiteto | Pedra Lavrada (Limite de Pedra +6) | Ordem da Obra (+15 coesão local em todas as cidades) | Obra monumental e ordem. |

**Retratos (direção):**
- Ramsés II: Frontal, coroa azul (khepresh) com uraeus, colar largo; pilone de Abu Simbel; luz dourada; ~40 anos.
- Hatshepsut: Perfil, nemes listrado, barba postiça, colar; terraços de Deir el-Bahari; luz suave de tarde; ~35 anos.
- Imhotep: Três-quartos, cabeça raspada, cabelo curto, rolo de papiro e régua; pirâmide em degraus; luz de lâmpada; ~50 anos.

### 3. Mesopotâmicos
- **Recorte:** Mesopotâmia da Idade do Bronze: Suméria, Acádia e Babilônia antiga. **Período:** c. 2700 – 1600 a.C..
- **Arquitetura N1–N7:**
  - N1–N2: casas de tijolo cru e telhado plano, cerca de junco
  - N3–N4: pátios internos, templo sobre plataforma, canais
  - N5: zigurate baixo e muralha de tijolo com contrafortes
  - N6–N7: zigurate monumental, portal de tijolo vidrado azul
- **Porto:** Cais de tijolo com canais e barcas redondas de junco.
- **Fortificação:** Muralha maciça de tijolo com contrafortes e ameias.
- **Materiais:** Tijolo de barro, betume, cerâmica vidrada azul, cobre. **Padrão:** Friso de tijolo em relevo e cunhas. **Paleta:** #b98f62 · #8a6a4a · #2f6f8f · #c9a54e.
- **Estandarte:** *Estandarte de Ur*. Painel retangular com faixas de mosaico, sobre haste. (enum oculto: PANEL (oculto)).
- **Emblema:** *Estrela de oito pontas*. Rosácea de oito pontas sobre cunha.
- **Representação de cidade:** Zigurate, tijolo cru e muralha com contrafortes.
- **Patronos (fora das Figuras):** Enki, Inanna, Shamash.
- **Reservas futuras:** Enheduanna (H); Nabucodonosor II (H); Assurbanípal (H); Gudea (H); Semíramis / Shammuramat (S).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Hamurabi** ★ | HISTÓRICO | Governante-Legislador | Casas de câmbio (Limite de Riqueza +6) | Rede de Correspondentes (+1 ponto de comando da rodada) | Leis, contratos e Riqueza. |
| **Sargão de Akkad** | HISTÓRICO | Conquistador-Fundador | Estradas do Império (Suprimento +1 hex) | Marcha de Akkad (+1 movimento da rodada) | Expansão e rotas. |
| **Gilgamesh** | SEMI-LENDÁRIO | Herói-Rei | Muralhas de Uruk (Limite de Pedra +6) | Força do Touro (+2 Força nos conflitos da rodada) | Muralha, força, resistência. |

**Retratos (direção):**
- Hamurabi: Perfil, barba longa em cachos, gorro redondo com aba, estela ao fundo; luz de lamparina; ~50 anos.
- Sargão de Akkad: Três-quartos, barba trançada e coque, estandarte de lança; poeira dourada; ~45 anos.
- Gilgamesh: Corpo de três-quartos, torso largo, cachos e barba, leão sob o braço; alvorada; ~35 anos.

### 4. Persas
- **Recorte:** Pérsia aquemênida. **Período:** c. 550 – 330 a.C..
- **Arquitetura N1–N7:**
  - N1–N2: casas de tijolo cru, pátio, torre de vigia
  - N3–N4: salão de colunas de madeira, jardim fechado (pairidaeza)
  - N5: terraço palacial de pedra, portão com touros
  - N6–N7: salas hipostilas de capitéis de touro, relevos de delegações
- **Porto:** Mole de calcário cinza com galera.
- **Fortificação:** Muralha de tijolo e pedra com torres de portão.
- **Materiais:** Calcário cinza, tijolo vidrado azul, cedro, ouro. **Padrão:** Friso de rosetas e procissão de povos. **Paleta:** #b7ad98 · #2f5f8f · #c9a54e · #8a5a4a.
- **Estandarte:** *Águia Real*. Águia dourada de asas abertas sobre escudo, em haste. (enum oculto: EAGLE (oculto)).
- **Emblema:** *Águia dourada*. Águia de asas abertas sobre escudo.
- **Representação de cidade:** Terraço palacial, salas de colunas e portão de nações.
- **Patronos (fora das Figuras):** Luz abstrata (sem Ahura Mazda).
- **Reservas futuras:** Cambises II (H); Artaxerxes I (H); Ciro, o Jovem (H); Artemísia I (H, aliada persa).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Ciro, o Grande** | HISTÓRICO | Governante-Integrador | Povos do Império (Ação cívica integra +10 em cidades ocupadas) | Selo de Ciro (tratados ativos duram +2 rodadas) | Integração e governo. |
| **Dario I** ★ | HISTÓRICO | Administrador-Construtor | Estrada Real (Suprimento +1 hex) | Satrapias (+1 ponto de comando da rodada) | Administração, estradas e economia. |
| **Xerxes I** | HISTÓRICO | Comandante-Mobilizador | Magazines do Exército (Limite de Alimento +6) | Exército das Nações (+2 Força nos conflitos da rodada) | Mobilização e comando. |

**Retratos (direção):**
- Ciro, o Grande: Perfil, tiara e barba encaracolada, cilindro de argila nas mãos; Pasárgada; luz suave; ~55 anos.
- Dario I: Frontal, cidaris alta, barba em camadas, mapa de rotas e moeda; Persépolis; luz de tarde; ~45 anos.
- Xerxes I: Perfil, cidaris, barba trançada, guarda-sol real; ponte de barcos; luz de tempestade; ~35 anos.

### 5. Israel e Judá
- **Recorte:** Israel antigo e Judá (Idade do Ferro). **Período:** c. 1200 – 586 a.C..
- **Arquitetura N1–N7:**
  - N1–N2: casas de quatro cômodos, cerca de pedra
  - N3–N4: cidade murada em colina, portão de seis câmaras
  - N5: muralha casamata, palácio de pedra lavrada, cisterna
  - N6–N7: cidade-capital em colina, templo de cedro e pedra, palácio
- **Porto:** Cais de pedra com barcos de madeira (porto fenício aliado).
- **Fortificação:** Muralha casamata (parede dupla) com portão de câmaras.
- **Materiais:** Calcário de Jerusalém, cedro, bronze, tijolo cru, tendas. **Padrão:** Romãs e palmeiras. **Paleta:** #d8cba8 · #7a6a4a · #a8603f · #5f7f8a.
- **Estandarte:** *Degel*. Estandarte tribal: pano retangular em haste, com o leão. (enum oculto: DEGEL (oculto)).
- **Emblema:** *Leão de Judá*. Leão de pé (tradição); alternativa arqueológica: selo lmlk de escaravelho alado.
- **Representação de cidade:** Cidade murada em colina com portão de câmaras.
- **Patronos (fora das Figuras):** Nenhum (Deus de Israel não é representado).
- **Reservas futuras:** Salomão (T); Débora (T); Ezequias (H); Josias (H); Gideão (T); Samuel (T).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Davi** ★ | TRADICIONAL / ÉPICO | Rei-Guerreiro | Tributo de Jerusalém (Limite de Riqueza +6) | Campeões do Rei (+1 ponto de comando da rodada) | Governo, tributo e comando. |
| **Elias** | TRADICIONAL / ÉPICO | Profeta | Voz do Profeta (Ação cívica integra +10 em cidades ocupadas) | Renovação do Povo (+1 Ânimo em todas as cidades) | Coesão, influência e Ânimo em crise. |
| **Sansão** | TRADICIONAL / ÉPICO | Herói-Campeão | Pilares do Templo (Limite de Pedra +6) | Força de Sansão (+2 Força nos conflitos da rodada) | Força e resistência. |

**Retratos (direção):**
- Davi: Três-quartos, cabelo cacheado, harpa (kinnor), muros de colina; luz de manhã; ~35 anos.
- Elias: Perfil magro, barba longa, manto de pelo e cinto de couro, cajado, vale seco; luz de fim de tarde; ~55 anos.
- Sansão: Perfil, sete tranças, barba curta, torso forte, pilares enormes; luz de fogueira; ~30 anos.

### 6. Romanos
- **Recorte:** Roma: República tardia e Principado. **Período:** c. 100 a.C. – 117 d.C..
- **Arquitetura N1–N7:**
  - N1–N2: casas de tijolo e telha, cerca de estacas (castrum)
  - N3–N4: fórum, basílica, aqueduto, telha vermelha
  - N5: termas, arco, muralha de tijolo e concreto
  - N6–N7: anfiteatro, templos de mármore, avenidas
- **Porto:** Mole de pedra com arcada e liburna.
- **Fortificação:** Muralha de tijolo e concreto com torres quadradas.
- **Materiais:** Tijolo, concreto, mármore, telha, bronze. **Padrão:** Ovolo e louros. **Paleta:** #bdb29a · #a65f40 · #8f8a82 · #b8914d.
- **Estandarte:** *Vexillum*. Pano retangular pendurado de um travessão, com franja. (enum oculto: VEXILLUM (oculto)).
- **Emblema:** *Aquila*. Águia de legião com asas abertas.
- **Representação de cidade:** Fórum, aqueduto, termas e muralha de tijolo.
- **Patronos (fora das Figuras):** Júpiter, Marte, Vesta.
- **Reservas futuras:** Cipião Africano (H); Marco Aurélio (H); Constantino (H); Agripina, a Jovem (H); Adriano (H).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Júlio César** ★ | HISTÓRICO | Comandante de Campanha | Campanhas Abastecidas (Suprimento +1 hex) | Veni, Vidi, Vici (+1 ponto de comando da rodada) | Campanha e comando. |
| **Augusto** | HISTÓRICO | Governante-Administrador | Pax Augusta (Ação cívica integra +10 em cidades ocupadas) | Jogos Seculares (+1 Ânimo em todas as cidades) | Governo e administração. |
| **Trajano** | HISTÓRICO | Imperador-Construtor | Obras Públicas (Limite de Pedra +6) | Via Trajana (+1 movimento da rodada) | Expansão e infraestrutura. |

**Retratos (direção):**
- Júlio César: Perfil, rosto magro, coroa de louros, toga; fortificação de Alésia; luz de campanha; ~55 anos.
- Augusto: Frontal idealizado (tipo Prima Porta), couraça lavrada; fórum de mármore; luz limpa; jovem ideal.
- Trajano: Perfil, corte de cabelo reto, paludamento; Coluna de Trajano em espiral; luz de meio-dia; ~50 anos.

### 7. Nórdicos
- **Recorte:** Mundo nórdico da Era Viking. **Período:** c. 793 – 1066 d.C..
- **Arquitetura N1–N7:**
  - N1–N2: casa longa de madeira e turfa, cerca de estacas
  - N3–N4: salão longo, estaleiro de drakkar, círculo de pedras
  - N5: fortaleza circular de madeira e terra, cais
  - N6–N7: salão real, mercado costeiro (tipo Birka e Hedeby), pedra rúnica
- **Porto:** Cais de madeira com drakkar de vela listrada.
- **Fortificação:** Palissada e muralha circular de terra.
- **Materiais:** Carvalho e pinho escuro, turfa, ferro, pedra rúnica. **Padrão:** Entrelaçado de animais. **Paleta:** #4a3a2c · #7a8a8f · #c9d2d4 · #8a3f3a.
- **Estandarte:** *Estandarte do Corvo*. Pano triangular com corvo, em haste. (enum oculto: RAVEN (oculto)).
- **Emblema:** *Corvo*. Corvo de asas abertas sobre entrelaçado.
- **Representação de cidade:** Salão longo, cais de drakkar e palissada circular.
- **Patronos (fora das Figuras):** Odin, Thor, Freyja.
- **Reservas futuras:** Lagertha (T); Harald Hardrada (H); Erik, o Vermelho (S); Freydís Eiríksdóttir (S).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Harald Cabelo Belo** | SEMI-LENDÁRIO | Rei-Unificador | Reino Unido (Ação cívica integra +10 em cidades ocupadas) | Juramento de Hafrsfjord (+15 coesão local em todas as cidades) | Unificação e governo. |
| **Leif Erikson** ★ | HISTÓRICO | Explorador | Rotas de Vinland (Suprimento +1 hex) | Travessia (+1 movimento da rodada) | Exploração. |
| **Ragnar Lodbrok** | TRADICIONAL / ÉPICO | Guerreiro-Incursor | Tributo de Incursão (Limite de Riqueza +6) | Fúria da Incursão (+2 Força nos conflitos da rodada) | Guerra e incursão. |

**Retratos (direção):**
- Harald Cabelo Belo: Perfil, cabelo longo louro e barba, anel de braço, fiorde; luz clara de inverno; ~45 anos.
- Leif Erikson: Três-quartos, capuz, barba curta, proa de navio, costa desconhecida; luz de aurora; ~30 anos.
- Ragnar Lodbrok: Perfil, tranças e barba, elmo cônico de nasal, escudo, vela listrada; luz de tocha; ~45 anos.

### 8. Chineses
- **Recorte:** China antiga e imperial inicial. **Período:** c. 500 a.C. – 705 d.C..
- **Arquitetura N1–N7:**
  - N1–N2: casas de taipa, colmo, cerca de estacas
  - N3–N4: pátios, salão de beirais curvos, torre de tambor
  - N5: muralha de taipa com portão de torre
  - N6–N7: pagode, palácio em plataforma
- **Porto:** Píer de madeira laqueada com junco de velas ripadas.
- **Fortificação:** Muralha de taipa com torre de portão de telhado curvo.
- **Materiais:** Taipa, madeira laqueada, telha cinza, bronze, seda. **Padrão:** Meandro de raios (leiwen). **Paleta:** #6e5a48 · #8e4a3c · #3f4448 · #b8914d.
- **Estandarte:** *Estandarte de Caldeirão*. Faixa vertical com caudas, ornada com o caldeirão. (enum oculto: STREAMER (oculto)).
- **Emblema:** *Caldeirão ding*. Tripé de bronze ritual: autoridade.
- **Representação de cidade:** Muralha de taipa, torre de portão e telhado curvo.
- **Patronos (fora das Figuras):** Heróis culturais (sem religião popular viva).
- **Reservas futuras:** Fu Hao (H); Han Wudi (H); Zhang Qian (H); Yu, o Grande (S); Confúcio (H); Mulan (L).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Qin Shi Huang** | HISTÓRICO | Imperador-Centralizador | Muralhas Unidas (Limite de Pedra +6) | Padronização (+15 coesão local em todas as cidades) | Centralização e obra. |
| **Wu Zetian** | HISTÓRICO | Imperatriz-Administradora | Exames Imperiais (Ação cívica integra +10 em cidades ocupadas) | Reinado de Zhou (+1 Ânimo em todas as cidades) | Governo e administração. |
| **Sun Tzu** ★ | SEMI-LENDÁRIO | Estrategista | Estrada do General (Suprimento +1 hex) | Cálculo Prévio (+1 ponto de comando da rodada) | Estratégia e logística. |

**Retratos (direção):**
- Qin Shi Huang: Frontal, coroa mian com contas, bigode e cavanhaque, robe negro; exército de terracota; luz fria; ~45 anos.
- Wu Zetian: Três-quartos, penteado alto com grampos, robe de gola de nuvens; salão de corte; luz suave; ~50 anos.
- Sun Tzu: Perfil, gorro e barba rala, tiras de bambu; mapa de colinas; luz de lamparina; ~50 anos.

### 9. Índia Antiga
- **Recorte:** Índia antiga: Maurya e Gupta. **Período:** c. 321 a.C. – 550 d.C..
- **Arquitetura N1–N7:**
  - N1–N2: casas de adobe com varanda, poço
  - N3–N4: palissada de madeira (Pataliputra), mandapa, poço escalonado
  - N5: palácio de madeira, pilar de edito, muralha de arenito
  - N6–N7: complexo de templo-torre, observatório de pedra
- **Porto:** Cais de arenito em degraus (ghat) com dhow de vela latina.
- **Fortificação:** Palissada de madeira com torres, depois muralha de arenito.
- **Materiais:** Arenito polido, madeira, estuque, cobre. **Padrão:** Treliça geométrica (jali). **Paleta:** #c28a5a · #9a6a4a · #3d5f7a · #b8914d.
- **Estandarte:** *Dhvaja Maurya*. Pano estreito e longo, com pavão sobre colina. (enum oculto: LONG PENNANT (oculto)).
- **Emblema:** *Pavão sobre colina*. Pavão sobre colina em arco (símbolo de moedas maurya).
- **Representação de cidade:** Palissada de madeira, pilar de edito e palácio.
- **Patronos (fora das Figuras):** Nenhum (divindades de religiões vivas).
- **Reservas futuras:** Chanakya (S); Samudragupta (H); Rajaraja Chola I (H); Kalidasa (H); Prabhavatigupta (H).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Ashoka** | HISTÓRICO | Governante-Reformador | Editos em Pilar (Ação cívica integra +10 em cidades ocupadas) | Dhamma (+15 coesão local em todas as cidades) | Governo e coesão. |
| **Chandragupta Maurya** ★ | HISTÓRICO | Fundador-Comandante | Exércitos Abastecidos (Suprimento +1 hex) | Falange Maurya (+2 Força nos conflitos da rodada) | Fundação e comando. |
| **Aryabhata** | HISTÓRICO | Sábio | Arquivo de Medidas (Limite de Pedra +6) | Padrão de Métodos (+1 ponto de comando da rodada) | Conhecimento. |

**Retratos (direção):**
- Ashoka: Frontal, turbante de dobras planas, joias, pilar de edito; luz de tarde; ~50 anos.
- Chandragupta Maurya: Três-quartos, turbante, arco, elefantes ao fundo; luz de campanha; ~40 anos.
- Aryabhata: Perfil, cabeça raspada com mecha, esfera armilar, folhas de palmeira; céu noturno; ~35 anos.

### 10. Incas (Tawantinsuyu)
- **Recorte:** Tawantinsuyu e a tradição de origem inca. **Período:** c. 1438 – 1533 d.C. (origem em tradição).
- **Arquitetura N1–N7:**
  - N1–N2: casas de pedra e palha, depósito pequeno
  - N3–N4: andenes (terraços), portas trapezoidais, qollqas
  - N5: plataforma escalonada, praça, muralha encaixada
  - N6–N7: cidadela de terraços, muralha em zigue-zague
- **Porto:** Embarcadouro de pedra encaixada com barcos de junco (caballito de totora).
- **Fortificação:** Muralha em zigue-zague de pedra poligonal encaixada.
- **Materiais:** Granito e andesito, palha ichu, adobe, lã de alpaca, ouro. **Padrão:** Tocapu (quadros xadrez). **Paleta:** #a9a493 · #7d7967 · #b79c62 · #a54a3a.
- **Estandarte:** *Unancha*. Pano quadrado com tocapu, em haste. (enum oculto: SQUARE (oculto)).
- **Emblema:** *Mascaipacha*. Borla real vermelha sobre faixa (llautu).
- **Representação de cidade:** Andenes, qollqas e muralha de pedra encaixada.
- **Patronos (fora das Figuras):** Inti, Viracocha, Pachamama (tradição viva: só visual).
- **Reservas futuras:** Túpac Inca Yupanqui (H); Mama Huaco (T); Huayna Cápac (H); Túpac Amaru I (H).

| Figura | Classe | Arquétipo | Passiva | Poder 1× por Era | Estilo |
|---|---|---|---|---|---|
| **Pachacútec** | HISTÓRICO | Reformador-Construtor | Cantaria Encaixada (Limite de Pedra +6) | Mit’a (+15 coesão local em todas as cidades) | Reforma e construção. |
| **Manco Cápac** | TRADICIONAL / ÉPICO | Fundador tradicional | Cuzco, Umbigo do Mundo (Ação cívica integra +10 em cidades ocupadas) | Aliança de Ayllus (tratados ativos duram +2 rodadas) | Fundação e alianças. |
| **Mama Ocllo** ★ | TRADICIONAL / ÉPICO | Fundadora (cultura e produção) | Celeiros de cortesia (Limite de Alimento +6) | Festa da Colheita (+1 Ânimo em todas as cidades) | Produção e cultura. |

**Retratos (direção):**
- Pachacútec: Perfil, llautu e orelheiras, túnica de tocapu, muralha de Cuzco; luz de pedra; ~50 anos.
- Manco Cápac: Frontal, bastão de ouro, montanhas e lago; luz de alvorada; sem idade definida.
- Mama Ocllo: Frontal, manta (lliclla) e alfinete (tupu), fuso, terraços; luz de manhã; ~35 anos.

## 8. Patronos

Separados das Figuras, **sem mecânica**. Religiões vivas: sem Patrono, ou só elemento visual:
- **Helênicos:** Zeus, Atena, Poseidon. **Nórdicos:** Odin, Thor, Freyja. **Romanos:** Júpiter, Marte, Vesta.
- **Egípcios:** estudo separado; os deuses se ligam à realeza (faraó como Hórus), então a Figura apresenta a titulatura como insígnia, não como crença literal. Candidatos: Ptah (artífices, ligado a Imhotep), Tot (escribas), Ísis.
- **Persas:** sem Ahura Mazda (religião viva); luz abstrata.
- **Israel e Judá:** nenhum; o Deus de Israel não é representado.
- **Índia Antiga, Incas:** sem divindades de religiões vivas na carta; Incas só com elemento visual cuidadoso.

## 9. Estandartes e emblemas

Eliminada a identidade fictícia antiga (os emblemas "passo", "folha", "bigorna"… **não** são preservados). Cada civilização tem identidade **material e histórica**, **sem bandeira nacional moderna**. Enums técnicos (SHIELD, PENNANT…) ficam escondidos.

| Civilização | Estandarte | Emblema | Padrão |
|---|---|---|---|
| Helênicos | **Aspis**: escudo redondo com meandro | aspis de bronze | friso de meandro |
| Egípcios | **Insígnia de Nomo**: haste com disco e flâmula | **Sema-tauy** (lótus e papiro atados) | papiro e lótus |
| Mesopotâmicos | **Estandarte de Ur**: painel de mosaico | estrela de oito pontas | tijolo e cunhas |
| Persas | **Águia Real** em haste | águia dourada | rosetas e procissão |
| Israel e Judá | **Degel**: pano tribal com o leão | **Leão de Judá** (tradição); alternativa: selo *lmlk* | romãs e palmeiras |
| Romanos | **Vexillum** | **Aquila** | ovolo e louros |
| Nórdicos | **Estandarte do Corvo** | corvo | entrelaçado |
| Chineses | **Estandarte de Caldeirão** | caldeirão *ding* | meandro de raios |
| Índia Antiga | **Dhvaja Maurya** | pavão sobre colina (moedas maurya) | treliça (*jali*) |
| Incas | **Unancha** | **Mascaipacha** (borla real) | tocapu |

**Evitados de propósito:** Estrela de Davi e menorá (símbolos posteriores ou religiosos vivos), faravahar (religião viva), leão de Sarnath e Ashoka Chakra (emblema nacional moderno), chakana (revivalismo), dragão (identidade moderna da China).

## 10. Material culture

Mesma regra, mesma geometria 3D aprovada. Cada civilização tem arquitetura, Porto, muralha, materiais, telhados, padrão e estandarte próprios; a **cor do jogador continua separada** (aro e estandarte de posse).

## 11. Auditoria histórica interna das 30 Figuras

Auditoria **interna**, para evitar erros grosseiros; não é conteúdo do jogo.

**Helênicos**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Odisseu | LENDÁRIO | Odisseia e Ilíada: tradição oral fixada por escrito entre os séc. VIII e VII a.C. | O mundo micênico e a região de Ítaca são reais; não há evidência de uma pessoa. | O retorno de dez anos e a astúcia (o Cavalo de Troia é narrado na Odisseia). | Ciclope, Circe, sereias, Cila e Caríbdis, descida ao Hades. | Armadura de hoplita (séc. VII a.C. em diante) em figura da Idade do Bronze; trirreme. Usar pilos, escudo grande e barco de remo simples. É o Odisseu da Odisseia. |
| Alexandre III da Macedônia | HISTÓRICO | Arriano, Plutarco, Diodoro e Quinto Cúrcio (séc. I a.C. – II d.C.), a partir de testemunhas perdidas. | Campanhas (Granico, Isso, Gaugamela), fundação de cidades, morte em Babilônia (323 a.C.). | O nó górdio e a visita a Siwa (filho de Amon) são anedotas e propaganda. | Romance de Alexandre (viagens fantásticas). | Macedônio não é "grego clássico"; imperialismo e massacres (Tebas, Tiro). Evitar o "grande homem" sem crítica. |
| Leônidas I | HISTÓRICO | Heródoto (livro VII, c. 430 a.C.). | Rei agíada de Esparta; Termópilas em 480 a.C.; morte em combate. | Os "300" (cerca de 300 espartanos entre milhares de aliados); epitáfio atribuído a Simônides. | Frases célebres ("Molon labe" é de Plutarco, séc. I d.C.). | Cultura pop ("300"), hilotas, capa vermelha de cinema. Retrato sóbrio. |

**Egípcios**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Ramsés II | HISTÓRICO | Inscrições (Poema e Boletim de Kadesh), templos (Abu Simbel, Ramesseu), tratado egípcio-hitita. | Reinado de ~66 anos (c. 1279–1213 a.C.); Kadesh (resultado indeciso, apresentado como vitória); tratado de paz (c. 1259 a.C.). | — | "Ozymandias" (Shelley) é invenção literária. | Propaganda real tomada ao pé da letra; a identificação com o "faraó do Êxodo" é posterior e não confirmada. |
| Hatshepsut | HISTÓRICO | Templo de Deir el-Bahari, inscrições da expedição a Punt, estátuas. | Reinou c. 1479–1458 a.C. (como regente e depois faraó); obras e comércio com Punt; imagens apagadas depois. | Os motivos do apagamento (Tutemés III ou sucessores) são debatidos. | — | "Mulher disfarçada de homem" é simplificação: a barba postiça é insígnia real. |
| Imhotep | HISTÓRICO | Base de estátua de Djoser (Saqqara) com títulos; pirâmide escalonada. | Vizir e chefe de obras de Djoser (c. 2650 a.C.); provável arquiteto da pirâmide. | Deificado séculos depois como deus da cura (os gregos o identificaram com Asclépio). | Textos médicos e "sabedoria" atribuídos a ele são tardios. | "Primeiro médico" e "inventor da pedra" são exageros. |

**Mesopotâmicos**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Hamurabi | HISTÓRICO | Estela de diorito (Louvre, c. 1754 a.C.), cartas reais. | Rei de Babilônia (c. 1792–1750 a.C.); código de leis; unificação do sul mesopotâmico. | — | — | Não é o "primeiro código" (Ur-Nammu, Lipit-Ishtar e Eshnunna são anteriores). |
| Sargão de Akkad | HISTÓRICO | Inscrições reais, crônicas posteriores, Lenda de Sargão (cópias neoassírias). | Funda o império acadiano (c. 2334 a.C.) e liga o Golfo ao Mediterrâneo. | Título "rei dos quatro cantos". | Nascimento em cesta de junco no rio. | Datas e extensão do império são debatidas. |
| Gilgamesh | SEMI-LENDÁRIO | Lista Real Suméria, poemas sumérios (c. 2100 a.C.), Epopeia de Gilgamesh (versão padrão). | Rei de Uruk provavelmente real (c. 2700–2500 a.C.). | Muralhas de Uruk atribuídas a ele. | Dois terços deus, Enkidu, Humbaba, Touro do Céu, dilúvio. | A Epopeia é literatura, não crônica. |

**Persas**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Ciro, o Grande | HISTÓRICO | Cilindro de Ciro (539 a.C.), Crônica de Nabonido, Heródoto, Xenofonte (a Ciropédia é romance moral). | Funda o Império Aquemênida (c. 550 a.C.), conquista a Lídia e Babilônia, restaura cultos locais. | Libertação dos judeus (tradição bíblica, corroborada em parte). | Infância abandonada e criada por pastor (Heródoto). | O Cilindro como "primeira declaração de direitos humanos" é leitura moderna. |
| Dario I | HISTÓRICO | Inscrição de Behistun (c. 520 a.C.), tabuinhas de Persépolis, Estrada Real (Heródoto V), dáricos. | Satrapias, tributo fixo, estradas e correio, moeda, canal no Egito, Persépolis. | Ascensão pelo relincho do cavalo (Heródoto). | — | Behistun é propaganda de legitimidade; trechos da Estrada Real são incertos. |
| Xerxes I | HISTÓRICO | Heródoto (hostil), inscrição dos Daivas, Ponte do Helesponto, canal do Atos. | Invasão da Grécia (480–479 a.C.) e mobilização do império. | Ponte do Helesponto e o mar açoitado (Heródoto). | "Milhões" de soldados (exagero). | Imagem helênica de tirano; números fantasiosos. |

**Israel e Judá**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Davi | TRADICIONAL / ÉPICO | Livros de Samuel, Reis, Crônicas e Salmos (autoria tradicional). | A Estela de Tel Dan (séc. IX a.C.) cita a "Casa de Davi": dinastia atestada. | Unificação das tribos, Jerusalém como capital, reino extenso (debatido). | Golias e a funda. | A "Estrela de Davi" é símbolo medieval; extensão do reino debatida; texto sagrado de religiões vivas. |
| Elias | TRADICIONAL / ÉPICO | 1 Reis 17 – 2 Reis 2 (Reino do Norte, séc. IX a.C.). | O rei Acabe é atestado no Monólito de Salmanasar III (Qarqar, 853 a.C.); Elias não tem fonte externa. | Seca e fome, confronto no Monte Carmelo, viúva de Sarepta. | Subida ao céu (milagre). | Não mostrar milagres; tradição de três religiões (Ilyas no islã); sem "poder mágico". |
| Sansão | TRADICIONAL / ÉPICO | Juízes 13–16 (era dos Juízes). | Os filisteus são atestados (Medinet Habu, c. 1175 a.C.). | Nazireu, Dalila, queda do templo. | Raposas, mandíbula de jumento, portas de Gaza. | Estereótipos sobre filisteus e sobre Dalila; religião viva. |

**Romanos**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Júlio César | HISTÓRICO | Comentários (Guerra das Gálias, propaganda), Cícero, Suetônio, Plutarco. | Conquista da Gália, guerra civil, ditadura e assassinato (44 a.C.). | Coroa de louros para ocultar a calvície (Suetônio). | — | "Et tu, Brute" é Shakespeare; "Veni, vidi, vici" refere-se a Zela. |
| Augusto | HISTÓRICO | Res Gestae, Suetônio, Tácito, Dião Cássio. | Primeiro princeps (27 a.C. – 14 d.C.), reformas e Pax Romana. | "Encontrou Roma de tijolo e deixou-a de mármore" (Suetônio). | — | Propaganda e proscrições; "imperador" no sentido moderno. |
| Trajano | HISTÓRICO | Coluna de Trajano, Plínio, Dião Cássio. | Reinou 98–117 d.C.; Dácia e Pártia; obras (fórum, portos, estradas). | "Optimus princeps". | — | A extensão máxima de 117 é efêmera (Adriano recuou); a Dácia foi guerra dura. |

**Nórdicos**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Harald Cabelo Belo | SEMI-LENDÁRIO | Heimskringla (Snorri, c. 1230), poesia escáldica. | Rei do Vestfold; a unificação da Noruega é tradição debatida. | Batalha de Hafrsfjord (c. 872) como unificação. | Voto de não cortar o cabelo até unificar; muitas esposas. | "Noruega unificada" é construção posterior. |
| Leif Erikson | HISTÓRICO | Grænlendinga saga e Eiríks saga rauða (séc. XIII); L'Anse aux Meadows (c. 1000 d.C.). | A presença nórdica na América é confirmada por escavação; Leif é provável. | Vinland e suas uvas. | — | Elmos com chifres são invenção do séc. XIX; "descobridor da América" é simplificação. |
| Ragnar Lodbrok | TRADICIONAL / ÉPICO | Ragnars saga loðbrókar, Gesta Danorum (Saxo), Krákumál. | Os filhos (Ivar e Halfdan) e o Grande Exército (865) são históricos; Ragnar pode ser composto. | Incursões e morte na Nortúmbria. | Poço de serpentes, Aslaug, lança. | Série de TV e elmos com chifres. Apresentar como tradição. |

**Chineses**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Qin Shi Huang | HISTÓRICO | Shiji (Sima Qian, c. 100 a.C.), tabuinhas de Liye e Yunmeng, Exército de Terracota. | Unificação (221 a.C.), padronização de escrita, pesos e eixos, estradas, muralhas. | Queima de livros e sepultamento de letrados (extensão debatida). | Elixir da imortalidade; rios de mercúrio no túmulo (mercúrio elevado confirmado). | O Shiji é escrito sob os Han, hostis; a Grande Muralha final é Ming. |
| Wu Zetian | HISTÓRICO | Livros Velho e Novo de Tang, Zizhi Tongjian. | Única imperatriz reinante (dinastia Zhou, 690–705), exames, grutas de Longmen. | Crueldades atribuídas a ela. | — | Fontes hostis e misóginas. |
| Sun Tzu | SEMI-LENDÁRIO | Shiji (biografia de Sun Wu), A Arte da Guerra (manuscritos de Yinqueshan). | O texto é antigo e real, compilado nos Estados Combatentes; autor incerto. | General de Wu sob He Lü (c. 512 a.C.) e o episódio das concubinas. | — | Citações modernas de negócios; datação do livro. |

**Índia Antiga**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Ashoka | HISTÓRICO | Editos em rocha e pilar (Brahmi, prácrito), Mahavamsa. | Imperador Maurya (c. 268–232 a.C.); Kalinga; editos de Dhamma. | Conversão ao budismo e lendas (Asokavadana). | 84 mil estupas. | Simplificação "aboliu a guerra"; evitar o leão de Sarnath. |
| Chandragupta Maurya | HISTÓRICO | Megástenes (Indica, fragmentos), Justino, tradições jainista e brâmane; Arthashastra atribuído a Kautilya. | Funda o império Maurya (c. 321 a.C.); contato com Seleuco. | Abdicação final (jainista) e Chanakya como mentor. | — | Arthashastra de data debatida; religiões vivas. |
| Aryabhata | HISTÓRICO | Aryabhatiya (499 d.C.), comentaristas. | Matemático e astrônomo (n. 476 d.C.); rotação da Terra, π, senos. | Ensino em Kusumapura. | — | "Inventor do zero" é mito moderno; debate sobre o nome. |

**Incas (Tawantinsuyu)**

| Figura | Classe | Fonte / tradição | Histórico | Tradição | Lendário | Risco de anacronismo |
|---|---|---|---|---|---|---|
| Pachacútec | HISTÓRICO | Betanzos (1551), Cieza e Sarmiento (cronistas coloniais) com base em tradição oral e quipus; arqueologia. | Nono Sapa Inca (c. 1438–1471); reorganiza o Estado e remodela Cuzco. | Machu Picchu como propriedade real (atribuição provável). | Batalha em que as pedras viram guerreiros (contra os Chancas). | Cronologia incerta; propaganda dinástica. |
| Manco Cápac | TRADICIONAL / ÉPICO | Mito de origem registrado por Garcilaso e Sarmiento (variantes). | Nenhuma evidência de pessoa. | Bastão de ouro que afunda em Cuzco. | Saída das cavernas de Pacaritambo; irmãos Ayar. | Variantes; cosmologia andina viva. |
| Mama Ocllo | TRADICIONAL / ÉPICO | Garcilaso (1609) e outros (variantes). | Nenhuma evidência de pessoa. | Ensina a fiar e tecer. | Saída de Pacaritambo. | Garcilaso é mestiço de elite com nostalgia imperial; confusão com Mama Huaco. |


## 12. Mockups (artifact)

A. Core 10 completo · B. três Figuras por civilização · C. seleção de Figura (Helênicos) · D. Odisseu · E. Davi · F. Elias · G. Sansão · H. Ramsés II · I. Ciro, o Grande · J. Ragnar · K. dez estandartes · L. dez emblemas · M. cidade N5 costeira em dez culturas. Mais: tabelas de recorte, chassi, auditoria e Patronos.

**Leitura honesta:** a 42 px, as culturas diferem sobretudo pelo **tom da massa** e pela cor do aro; telhado e ornamento só aparecem no Focar. Os retratos são composições procedurais, não arte final.

## 13. O que **não** foi feito
Alterar engine, IDs, saves, balanceamento, Porto, Estradas, produção ou `workedHexIds`; trocar nomes no Alpha; gerar assets finais; deploy.

## 14. Decisões a aprovar
1. **Core 10** e os recortes (§2.1), com atenção a Chineses e Helênicos.
2. **Chassi oculto** por civilização (§2.2). **Egípcios:** autoria de `iskara` ou Plano B.
3. **"Figura"** como rótulo de UI (§3).
4. **Classes**, incluindo **TRADICIONAL / ÉPICO** (§4).
5. **Passiva e Poder** como único formato, **sem cobertura forçada** (§5).
6. **Seleção:** três Figuras, ★ recomendada, revelação simultânea (§6).
7. **Estandartes e emblemas** (§9) e a lista de símbolos evitados.
8. **Patronos** separados e sem mecânica (§8).
9. As **30 Figuras** (§7) e as auditorias (§11).
