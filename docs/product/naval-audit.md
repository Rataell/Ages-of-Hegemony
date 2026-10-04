# Naval — auditoria das sete classes (GR-27)

Data: 2026-10-04. A DEC-014 torna o naval **core planejado do Alpha**.

**Ordem de autoridade:** V4 e decisões > Bíblia v3.1 > atlas visual V2.2.

## O que existe no produto (vertical slice)

Uma classe genérica, **Frota**, com:

- Força 3 e movimento 3; o Comando dá +1 na Costa ou no Mar.
- Era II (Expansão); custo de 3 materiais + 2 Riqueza + 1 Metal.
- **Transporte 3.** Cavalaria e Cerco ocupam 2 vagas; as demais peças, 1.
- Recrutamento em porto: cidade na Costa ou vizinha à água. A frota é lançada na água ao lado.
- Embarque e desembarque (1 ação cada); a carga navega com a frota.
- Ataque anfíbio com −1. A carga não luta no mar.
- Naufrágio com resgate:
  - outra frota própria com vaga, no mesmo hex;
  - uma costa livre ao lado salva uma peça.
- Bloqueio de porto por frota inimiga em guerra: impede lançar frotas e suspende as rotas da cidade.
- Os rivais veem a frota, nunca a carga.

## As sete classes da Bíblia

Valores da prancha 13.

| Classe | Requer | Era | Ataque | Casco | Mov. | Transp. | Manut. | Papel |
|---|---|---|---|---|---|---|---|---|
| Embarcação Costeira | Navegação Costeira | I | 0 | 1 | 2 | 1 | 1 | exploração e pesca perto da costa |
| Mercante | Moeda | II | 0 | 1 | 2 | 2 | 1 | rotas comerciais e peças; não combate |
| Galera | Metalurgia | II | 1 | 2 | 3 | 2 | 2 | guerra costeira, veloz |
| Galera de Guerra | Arquitetura Naval | III | 2 | 3 | 3 | 2 | 3 | escolta pesada |
| Nau de Transporte | Arquitetura Naval | III | 0 | 2 | 2 | 6 | 3 | travessias com grandes contingentes |
| Carraca | Navegação Oceânica | IV | 2 | 4 | 2 | 4 | 4 | oceânica: transporta e resiste |
| Fragata | Pólvora + Navegação Oceânica | V | 3 | 4 | 4 | 2 | 5 | combate a distância |

Missões da Bíblia:

- **Escoltar:** ataques ao transporte atingem antes a escolta.
- **Bloquear:** rotas e entrada de porto.
- **Transportar.**
- **Patrulhar:** revelar e interceptar em raio 2.

## Divergências encontradas

| Tema | Bíblia | Alpha / V4 | Resolução proposta |
|---|---|---|---|
| Requisitos | avanços nomeados (Navegação Costeira, Moeda, Arquitetura Naval…) | a Teia do Alpha não tem esses nós; as peças são liberadas por Era | liberar por Era (como o Alpha) até a DEC-012 fechar a Teia |
| Casco | estatística própria (pontos de dano) | o combate do Alpha não tem dano parcial: a peça vive ou morre | casco vira desempate/defesa até haver dano por passos |
| Ataque 0 | Mercante e Nau não combatem | toda peça com força > 0 luta no Alpha | força 0 = não ataca; defende só com a escolta (Escoltar) |
| Manutenção | 1–5 por navio | só Alimento/Riqueza por peça | mapear para Riqueza (frotas custam dinheiro, não comida) |
| Embarcação Costeira na Era I | existe | o Alpha não tem nenhum navio antes da Era II | **manter na Era I**: dá às civilizações marítimas (Thalos, Norvak) assimetria real desde o início |
| Transporte da Frota genérica | — | 3 (slice) | equivale a uma Galera reforçada; some quando as classes entrarem |
| Elefante (3 vagas) | Targan | sem Elefantes no Alpha | entra com a assinatura de Targan |

## Recomendação de cristalização (ordem)

1. **Embarcação Costeira** (Era I, sem combate): explora a costa e revela regiões costeiras. Habilita a herança de Thalos e Norvak.
2. **Galera de Guerra** (combate e escolta): substitui a Frota genérica no papel militar.
3. **Nau de Transporte** (6 vagas, sem combate): torna o transporte uma decisão — sem escolta, ela é um alvo.
4. **Mercante:** só quando houver rota marítima (DEC-019).
5. **Carraca e Fragata:** com as Eras IV e V completas.

A Galera (Era II) e a Galera de Guerra se sobrepõem no Alpha. Proposta: a Frota genérica do slice cumpre o papel da Galera até as classes entrarem.

## Estado

- O slice está no produto.
- As classes não estão. Cristalizar as sete exige:
  - um esquema por classe (ataque, casco, transporte, manutenção);
  - a missão Escoltar;
  - decisão sobre dano parcial.

Esses itens ficam no Gap Register como GR-27.
