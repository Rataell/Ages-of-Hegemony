# Ages of Hegemony — Conceito do Produto & Visão Estratégica

## 1. Visão Geral
*Ages of Hegemony* é um jogo de estratégia histórica por turnos (4X) com motor determinístico autoritativo, focado na transição de assentamentos agrários primitivos para grandes confederações, impérios e estados hegemônicos.

Ao contrário de jogos focados primariamente em expansão militar imediata ou árvores de tecnologia arbitrárias, *Ages of Hegemony* coloca as instituições, o território e a capacidade administrativa no centro da experiência. O território não é meramente um pano de fundo: é a base física e econômica da sobrevivência e da soberania.

---

## 2. Pilares de Design

### I. O Território é o Começo
Cada pedaço de terra possui características geomorfológicas próprias (planícies fluviais, florestas temperadas, colinas ricas em minérios, litorais de pesca). Para extrair a riqueza da terra, não basta controlar as fronteiras: é preciso alocar produtores rurais dedicados e erguer benfeitorias físicas (fazendas, pedreiras, minas).

### II. Instituições e Carga Administrativa
Cidades e territórios não se governam sozinhos. Expandir sem instituições sobrecarrega a administração pública (*Overextension*), erodindo a estabilidade social e estrangulando a receita fiscal. O crescimento exige investimento contínuo em burocracia cívica, arquivos e distritos administrativos.

### III. Sociedade Orgânica e Alocação Humana
A população urbana não é um mero número abstrato de crescimento. Cada cidadão precisa ser distribuído entre papéis cívicos essenciais:
- **Produtores** que trabalham a terra;
- **Artesãos** que forjam materiais;
- **Mercadores** que geram riqueza e sustentam o tesouro;
- **Estudiosos** que organizam o saber e os arquivos;
- **Soldados** que compõem a guarnição defensiva;
- **Livres** que formam a reserva demográfica.

### IV. Determinismo e Soberania do Motor
O motor de *Ages of Hegemony* é determinístico e desacoplado da interface gráfica. Toda transição de estado, manutenção econômica e resolução de comandos é validada por regras matemáticas estritas com controle de concorrência optimista (CAS) e versões de estado sequenciais.

---

## 3. Escopo da Fatia Atual (Playable Slice v0.1)

### O que está implementado e jogável:
- **Partida Local / Hotseat:** 2 a 6 civilizações em mapa cartográfico fixo de 7 territórios revelados.
- **Ciclo Completo de Rodada:** Fases de Manutenção, Planejamento, Resolução, Reação e Fim de Rodada.
- **Gestão Demográfica & Cidades:** Crescimento populacional por acúmulo de alimento, níveis de desenvolvimento (I a V), especializações municipais e capacidade de distritos.
- **Expansão Territorial:** Reivindicação de hexágonos adjacentes com influência, atribuição de territórios trabalhados e construção de melhorias rurais.
- **Urbanismo:** Construção de 7 distritos especializados e 7 edifícios cívicos com sinergias estruturais.
- **Formas de Governo:** Adoção de 5 regimes históricos (Monarquia, República, Oligarquia, Teocracia, Confederação) a partir do proto-governo inicial.
- **Relatório Estratégico:** Balanço detalhado de produção, consumo, variação de estoques e eventos cívicos.

### O que NÃO está implementado nesta fatia (Sistemas Futuros):
- **Pesquisa Completa:** Árvore de inovações tecnológicas e teia civilizacional (previsto para v0.6).
- **Diplomacia & Comércio Internacional:** Tratados, rotas mercantis externas e relações exteriores (previsto para v0.7).
- **Unidades Móveis & Combate:** Movimento militar em mapa, logística de exércitos e guerras hegemônicas (previsto para v0.8 e v0.9).
- **Multiplayer Online:** Transporte WebSocket e persistência compartilhada em tempo real (previsto para v0.10).
- **Condições de Vitória & IA:** Vitória hegemônica e oponentes autônomos (previsto para v0.11).
