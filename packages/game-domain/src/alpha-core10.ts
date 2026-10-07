import type { LeaderAbilityEffect, LeaderPassive } from './alpha-leaders.js';

/**
 * CORE 10 (RC 1.2): the ten civilizations the player sees. The `chassis` is the hidden technical id every save, kit, card and heritage still uses
 * (`civilization: 'valgard'`); nothing in a new flow shows it. Content comes from docs/product/aoh-historical-civilizations-core10-figures-v1.md.
 * A Figura is the editorial name of what the code calls a leader: one Passiva and one Poder usable once per Era.
 */
export type FigureClass = 'HISTORICAL' | 'SEMI_LEGENDARY' | 'LEGENDARY' | 'MYTHOLOGICAL' | 'TRADITIONAL';
export const FIGURE_CLASS_LABELS: Record<FigureClass, string> = { HISTORICAL: 'Histórico', SEMI_LEGENDARY: 'Semi-lendário', LEGENDARY: 'Lendário', MYTHOLOGICAL: 'Figura de mito', TRADITIONAL: 'Segundo a tradição' };
export interface Core10Figure {
  id: string; name: string; recommended: boolean; cls: FigureClass; archetype: string; style: string; source: string; portrait: string;
  passive: { name: string; text: string; effect: LeaderPassive };
  power: { name: string; text: string; effect: LeaderAbilityEffect };
}
/** Future Figuras shown in the Compêndio only; not selectable in this release. */
export interface Core10ReserveFigure { id: string; name: string; cls: FigureClass; archetype: string; style: string; source: string }
export interface Core10Civilization {
  /** Public id of the civilization (never shown as text; the UI shows `name`). */
  id: string;
  /** Hidden technical id stored in saves (`player.civilization`). */
  chassis: string;
  name: string; adjective: string; scope: string; period: string;
  /** Architecture by city level, N1–N2 … N6–N7. */
  architecture: string[];
  port: string; fortification: string; materials: string; pattern: string; palette: string[];
  banner: { name: string; text: string; enum: string };
  emblem: { name: string; text: string };
  cityLook: string; patrons: string; reserves: string;
  figures: Core10Figure[];
  reserveFigures?: Core10ReserveFigure[];
}
export const CORE10: readonly Core10Civilization[] = [
  {
    "id": "hellenes",
    "chassis": "valgard",
    "name": "Helênicos",
    "adjective": "Helênico",
    "scope": "Mundo helênico: tradição micênica, Grécia clássica e helenismo",
    "period": "c. 1200 – 30 a.C. (Odisseu é tradição da Idade do Bronze)",
    "architecture": [
      "- N1–N2: cabanas de pedra e barro, lareira central",
      "N3–N4: casas de pátio, ágora, estoa de colunas, telhado baixo de terracota",
      "N5: acrópole com templo e muralha de blocos",
      "N6–N7: peristilos, teatro, acrópole monumental"
    ],
    "port": "Mole de pedra clara com trirreme",
    "fortification": "Muralha poligonal com torres redondas e portão",
    "materials": "Mármore, calcário, terracota, bronze",
    "pattern": "Friso de meandro",
    "palette": [
      "#e4ddc8",
      "#b9825e",
      "#7f8a8f",
      "#b8914d"
    ],
    "banner": {
      "name": "Aspis",
      "text": "Escudo redondo de bronze com cercadura de meandro",
      "enum": "SHIELD"
    },
    "emblem": {
      "name": "Aspis de bronze",
      "text": "Escudo redondo com anel de meandro"
    },
    "cityLook": "Acrópole, estoa e muralha de blocos claros",
    "patrons": "Zeus, Atena, Poseidon",
    "reserves": "Agamenon (L); Perseu (L); Héracles (M); Aquiles (L); Péricles (H); Artemísia I (H); Temístocles (H); Arquimedes (H)",
    "figures": [
      {
        "id": "leader-odisseu",
        "name": "Odisseu",
        "recommended": false,
        "cls": "LEGENDARY",
        "archetype": "Explorador-Estrategista",
        "passive": {
          "name": "Naus de Ítaca",
          "text": "Limite de Madeira +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "wood",
            "amount": 6
          }
        },
        "power": {
          "name": "Rota do Retorno",
          "text": "+1 movimento da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "MOVEMENT",
            "amount": 1
          }
        },
        "style": "Mobilidade, exploração, retirada, navegação",
        "source": "Odisseia e Ilíada: tradição oral fixada por escrito entre os séc. VIII e VII a.C.",
        "portrait": "Perfil, barba curta, pilos (gorro cônico), remo na mão, mar à noite; luz de estrelas e lamparina; ~45 anos."
      },
      {
        "id": "leader-alexandre-magno",
        "name": "Alexandre Magno",
        "recommended": true,
        "cls": "HISTORICAL",
        "archetype": "Conquistador-Comandante",
        "passive": {
          "name": "Cidades de Alexandre",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Campanha Relâmpago",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Ofensiva, comando, expansão",
        "source": "Arriano, Plutarco, Diodoro e Quinto Cúrcio (séc. I a.C. – II d.C.), a partir de testemunhas perdidas.",
        "portrait": "Três-quartos, cabelo em anástole (franja erguida), diadema, couraça; plano largo de campo de batalha; luz de aurora."
      },
      {
        "id": "leader-agamenon",
        "name": "Agamenon",
        "recommended": false,
        "cls": "LEGENDARY",
        "archetype": "Rei-Comandante",
        "passive": {
          "name": "Ouro de Micenas",
          "text": "Limite de Riqueza +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "wealth",
            "amount": 6
          }
        },
        "power": {
          "name": "Assembleia dos Reis",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Coalizão, comando, Riqueza guardada",
        "source": "Ilíada (tradição oral fixada por escrito entre os séc. VIII e VII a.C.); ciclo épico.",
        "portrait": "Frontal-perfil, barba grisalha, diadema e cetro, portão de Micenas ao fundo; luz de tocha; ~50 anos."
      }
    ],
    "reserveFigures": [
      {
        "id": "leader-leonidas",
        "name": "Leônidas",
        "cls": "HISTORICAL",
        "archetype": "Comandante-Defensor",
        "style": "Defesa, território, resistência.",
        "source": "Heródoto (livro VII, c. 430 a.C.)."
      },
      {
        "id": "leader-heracles",
        "name": "Héracles",
        "cls": "MYTHOLOGICAL",
        "archetype": "Herói-Campeão",
        "style": "Força e resistência.",
        "source": "Ciclo heróico: Hesíodo, Apolodoro, Píndaro; culto em toda a Grécia."
      },
      {
        "id": "leader-artemisia-i",
        "name": "Artemísia I",
        "cls": "HISTORICAL",
        "archetype": "Comandante Naval",
        "style": "Frota, manobra, coesão.",
        "source": "Heródoto (livros VII e VIII), Polieno."
      }
    ]
  },
  {
    "id": "egyptians",
    "chassis": "nymara",
    "name": "Egípcios",
    "adjective": "Egípcio",
    "scope": "Egito faraônico: do Reino Antigo ao Novo",
    "period": "c. 2700 – 1070 a.C.",
    "architecture": [
      "- N1–N2: casas de tijolo cru e telhado plano, cerca de junco",
      "N3–N4: pátios, capela, colunata papiriforme",
      "N5: pilone com obelisco, templo de arenito",
      "N6–N7: complexo de pilones, avenida de esfinges, pirâmide"
    ],
    "port": "Cais de pedra com cabeços em obelisco e barco de papiro",
    "fortification": "Muralha de tijolo cru com ameias e portão de pilone",
    "materials": "Calcário, arenito, tijolo cru, ouro, azul-egípcio",
    "pattern": "Friso de papiro e lótus",
    "palette": [
      "#e0d5b8",
      "#3f8f9a",
      "#c9a54e",
      "#7a4a3a"
    ],
    "banner": {
      "name": "Insígnia de Nomo",
      "text": "Haste com disco e flâmula, à maneira dos padrões de divisão do exército",
      "enum": "POLE"
    },
    "emblem": {
      "name": "Sema-tauy",
      "text": "Lótus e papiro atados: união das Duas Terras"
    },
    "cityLook": "Pilone, obelisco, colunata papiriforme e tijolo cru",
    "patrons": "Ptah, Tot, Ísis (estudo separado)",
    "reserves": "Tutemés III (H); Akhenaton (H); Cleópatra VII (H); Khufu (H); Amenhotep III (H)",
    "figures": [
      {
        "id": "leader-ramses-ii",
        "name": "Ramsés II",
        "recommended": true,
        "cls": "HISTORICAL",
        "archetype": "Governante-Comandante",
        "passive": {
          "name": "Estradas de Canaã",
          "text": "Suprimento +1 hex",
          "effect": {
            "kind": "SUPPLY",
            "amount": 1
          }
        },
        "power": {
          "name": "Carros de Kadesh",
          "text": "+2 Força nos conflitos da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "STRENGTH",
            "amount": 2
          }
        },
        "style": "Governo e comando: obra e campanha",
        "source": "Inscrições (Poema e Boletim de Kadesh), templos (Abu Simbel, Ramesseu), tratado egípcio-hitita.",
        "portrait": "Frontal, coroa azul (khepresh) com uraeus, colar largo; pilone de Abu Simbel; luz dourada; ~40 anos."
      },
      {
        "id": "leader-hatshepsut",
        "name": "Hatshepsut",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Governante-Construtora",
        "passive": {
          "name": "Mirra de Punt",
          "text": "Limite de Riqueza +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "wealth",
            "amount": 6
          }
        },
        "power": {
          "name": "Festa do Vale",
          "text": "+1 Ânimo em todas as cidades",
          "effect": {
            "kind": "MOOD_ALL",
            "amount": 1
          }
        },
        "style": "Obra pública e comércio",
        "source": "Templo de Deir el-Bahari, inscrições da expedição a Punt, estátuas.",
        "portrait": "Perfil, nemes listrado, barba postiça, colar; terraços de Deir el-Bahari; luz suave de tarde; ~35 anos."
      },
      {
        "id": "leader-imhotep",
        "name": "Imhotep",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Sábio-Arquiteto",
        "passive": {
          "name": "Pedra Lavrada",
          "text": "Limite de Pedra +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "stone",
            "amount": 6
          }
        },
        "power": {
          "name": "Ordem da Obra",
          "text": "+15 coesão local em todas as cidades",
          "effect": {
            "kind": "COHESION_ALL",
            "amount": 15
          }
        },
        "style": "Obra monumental e ordem",
        "source": "Base de estátua de Djoser (Saqqara) com títulos; pirâmide escalonada.",
        "portrait": "Três-quartos, cabeça raspada, cabelo curto, rolo de papiro e régua; pirâmide em degraus; luz de lâmpada; ~50 anos."
      }
    ]
  },
  {
    "id": "mesopotamians",
    "chassis": "meridia",
    "name": "Mesopotâmicos",
    "adjective": "Mesopotâmico",
    "scope": "Mesopotâmia da Idade do Bronze: Suméria, Acádia e Babilônia antiga",
    "period": "c. 2700 – 1600 a.C.",
    "architecture": [
      "- N1–N2: casas de tijolo cru e telhado plano, cerca de junco",
      "N3–N4: pátios internos, templo sobre plataforma, canais",
      "N5: zigurate baixo e muralha de tijolo com contrafortes",
      "N6–N7: zigurate monumental, portal de tijolo vidrado azul"
    ],
    "port": "Cais de tijolo com canais e barcas redondas de junco",
    "fortification": "Muralha maciça de tijolo com contrafortes e ameias",
    "materials": "Tijolo de barro, betume, cerâmica vidrada azul, cobre",
    "pattern": "Friso de tijolo em relevo e cunhas",
    "palette": [
      "#b98f62",
      "#8a6a4a",
      "#2f6f8f",
      "#c9a54e"
    ],
    "banner": {
      "name": "Estandarte de Ur",
      "text": "Painel retangular com faixas de mosaico, sobre haste",
      "enum": "PANEL"
    },
    "emblem": {
      "name": "Estrela de oito pontas",
      "text": "Rosácea de oito pontas sobre cunha"
    },
    "cityLook": "Zigurate, tijolo cru e muralha com contrafortes",
    "patrons": "Enki, Inanna, Shamash",
    "reserves": "Enheduanna (H); Nabucodonosor II (H); Assurbanípal (H); Gudea (H); Semíramis / Shammuramat (S)",
    "figures": [
      {
        "id": "leader-hamurabi",
        "name": "Hamurabi",
        "recommended": true,
        "cls": "HISTORICAL",
        "archetype": "Governante-Legislador",
        "passive": {
          "name": "Casas de câmbio",
          "text": "Limite de Riqueza +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "wealth",
            "amount": 6
          }
        },
        "power": {
          "name": "Rede de Correspondentes",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Leis, contratos e Riqueza",
        "source": "Estela de diorito (Louvre, c. 1754 a.C.), cartas reais.",
        "portrait": "Perfil, barba longa em cachos, gorro redondo com aba, estela ao fundo; luz de lamparina; ~50 anos."
      },
      {
        "id": "leader-sargao-de-akkad",
        "name": "Sargão de Akkad",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Conquistador-Fundador",
        "passive": {
          "name": "Estradas do Império",
          "text": "Suprimento +1 hex",
          "effect": {
            "kind": "SUPPLY",
            "amount": 1
          }
        },
        "power": {
          "name": "Marcha de Akkad",
          "text": "+1 movimento da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "MOVEMENT",
            "amount": 1
          }
        },
        "style": "Expansão e rotas",
        "source": "Inscrições reais, crônicas posteriores, Lenda de Sargão (cópias neoassírias).",
        "portrait": "Três-quartos, barba trançada e coque, estandarte de lança; poeira dourada; ~45 anos."
      },
      {
        "id": "leader-gilgamesh",
        "name": "Gilgamesh",
        "recommended": false,
        "cls": "SEMI_LEGENDARY",
        "archetype": "Herói-Rei",
        "passive": {
          "name": "Muralhas de Uruk",
          "text": "Limite de Pedra +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "stone",
            "amount": 6
          }
        },
        "power": {
          "name": "Força do Touro",
          "text": "+2 Força nos conflitos da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "STRENGTH",
            "amount": 2
          }
        },
        "style": "Muralha, força, resistência",
        "source": "Lista Real Suméria, poemas sumérios (c. 2100 a.C.), Epopeia de Gilgamesh (versão padrão).",
        "portrait": "Corpo de três-quartos, torso largo, cachos e barba, leão sob o braço; alvorada; ~35 anos."
      }
    ]
  },
  {
    "id": "persians",
    "chassis": "dravik",
    "name": "Persas",
    "adjective": "Persa",
    "scope": "Pérsia aquemênida",
    "period": "c. 550 – 330 a.C.",
    "architecture": [
      "- N1–N2: casas de tijolo cru, pátio, torre de vigia",
      "N3–N4: salão de colunas de madeira, jardim fechado (pairidaeza)",
      "N5: terraço palacial de pedra, portão com touros",
      "N6–N7: salas hipostilas de capitéis de touro, relevos de delegações"
    ],
    "port": "Mole de calcário cinza com galera",
    "fortification": "Muralha de tijolo e pedra com torres de portão",
    "materials": "Calcário cinza, tijolo vidrado azul, cedro, ouro",
    "pattern": "Friso de rosetas e procissão de povos",
    "palette": [
      "#b7ad98",
      "#2f5f8f",
      "#c9a54e",
      "#8a5a4a"
    ],
    "banner": {
      "name": "Águia Real",
      "text": "Águia dourada de asas abertas sobre escudo, em haste",
      "enum": "EAGLE"
    },
    "emblem": {
      "name": "Águia dourada",
      "text": "Águia de asas abertas sobre escudo"
    },
    "cityLook": "Terraço palacial, salas de colunas e portão de nações",
    "patrons": "Luz abstrata (sem Ahura Mazda)",
    "reserves": "Cambises II (H); Artaxerxes I (H); Ciro, o Jovem (H); Artemísia I (H, aliada persa)",
    "figures": [
      {
        "id": "leader-ciro-o-grande",
        "name": "Ciro, o Grande",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Governante-Integrador",
        "passive": {
          "name": "Povos do Império",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Selo de Ciro",
          "text": "tratados ativos duram +2 rodadas",
          "effect": {
            "kind": "TREATY_EXTEND",
            "rounds": 2
          }
        },
        "style": "Integração e governo",
        "source": "Cilindro de Ciro (539 a.C.), Crônica de Nabonido, Heródoto, Xenofonte (a Ciropédia é romance moral).",
        "portrait": "Perfil, tiara e barba encaracolada, cilindro de argila nas mãos; Pasárgada; luz suave; ~55 anos."
      },
      {
        "id": "leader-dario-i",
        "name": "Dario I",
        "recommended": true,
        "cls": "HISTORICAL",
        "archetype": "Administrador-Construtor",
        "passive": {
          "name": "Estrada Real",
          "text": "Suprimento +1 hex",
          "effect": {
            "kind": "SUPPLY",
            "amount": 1
          }
        },
        "power": {
          "name": "Satrapias",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Administração, estradas e economia",
        "source": "Inscrição de Behistun (c. 520 a.C.), tabuinhas de Persépolis, Estrada Real (Heródoto V), dáricos.",
        "portrait": "Frontal, cidaris alta, barba em camadas, mapa de rotas e moeda; Persépolis; luz de tarde; ~45 anos."
      },
      {
        "id": "leader-xerxes-i",
        "name": "Xerxes I",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Comandante-Mobilizador",
        "passive": {
          "name": "Magazines do Exército",
          "text": "Limite de Alimento +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "food",
            "amount": 6
          }
        },
        "power": {
          "name": "Exército das Nações",
          "text": "+2 Força nos conflitos da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "STRENGTH",
            "amount": 2
          }
        },
        "style": "Mobilização e comando",
        "source": "Heródoto (hostil), inscrição dos Daivas, Ponte do Helesponto, canal do Atos.",
        "portrait": "Perfil, cidaris, barba trançada, guarda-sol real; ponte de barcos; luz de tempestade; ~35 anos."
      }
    ]
  },
  {
    "id": "israel",
    "chassis": "solenne",
    "name": "Israel e Judá",
    "adjective": "de Israel e Judá",
    "scope": "Israel antigo e Judá (Idade do Ferro)",
    "period": "c. 1200 – 586 a.C.",
    "architecture": [
      "- N1–N2: casas de quatro cômodos, cerca de pedra",
      "N3–N4: cidade murada em colina, portão de seis câmaras",
      "N5: muralha casamata, palácio de pedra lavrada, cisterna",
      "N6–N7: cidade-capital em colina, templo de cedro e pedra, palácio"
    ],
    "port": "Cais de pedra com barcos de madeira (porto fenício aliado)",
    "fortification": "Muralha casamata (parede dupla) com portão de câmaras",
    "materials": "Calcário de Jerusalém, cedro, bronze, tijolo cru, tendas",
    "pattern": "Romãs e palmeiras",
    "palette": [
      "#d8cba8",
      "#7a6a4a",
      "#a8603f",
      "#5f7f8a"
    ],
    "banner": {
      "name": "Degel",
      "text": "Estandarte tribal: pano retangular em haste, com o leão",
      "enum": "DEGEL"
    },
    "emblem": {
      "name": "Leão de Judá",
      "text": "Leão de pé (tradição); alternativa arqueológica: selo lmlk de escaravelho alado"
    },
    "cityLook": "Cidade murada em colina com portão de câmaras",
    "patrons": "Nenhum (Deus de Israel não é representado)",
    "reserves": "Salomão (T); Débora (T); Ezequias (H); Josias (H); Gideão (T); Samuel (T)",
    "figures": [
      {
        "id": "leader-davi",
        "name": "Davi",
        "recommended": true,
        "cls": "TRADITIONAL",
        "archetype": "Rei-Guerreiro",
        "passive": {
          "name": "Tributo de Jerusalém",
          "text": "Limite de Riqueza +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "wealth",
            "amount": 6
          }
        },
        "power": {
          "name": "Campeões do Rei",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Governo, tributo e comando",
        "source": "Livros de Samuel, Reis, Crônicas e Salmos (autoria tradicional).",
        "portrait": "Três-quartos, cabelo cacheado, harpa (kinnor), muros de colina; luz de manhã; ~35 anos."
      },
      {
        "id": "leader-elias",
        "name": "Elias",
        "recommended": false,
        "cls": "TRADITIONAL",
        "archetype": "Profeta",
        "passive": {
          "name": "Voz do Profeta",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Renovação do Povo",
          "text": "+1 Ânimo em todas as cidades",
          "effect": {
            "kind": "MOOD_ALL",
            "amount": 1
          }
        },
        "style": "Coesão, influência e Ânimo em crise",
        "source": "1 Reis 17 – 2 Reis 2 (Reino do Norte, séc. IX a.C.).",
        "portrait": "Perfil magro, barba longa, manto de pelo e cinto de couro, cajado, vale seco; luz de fim de tarde; ~55 anos."
      },
      {
        "id": "leader-sansao",
        "name": "Sansão",
        "recommended": false,
        "cls": "TRADITIONAL",
        "archetype": "Herói-Campeão",
        "passive": {
          "name": "Pilares do Templo",
          "text": "Limite de Pedra +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "stone",
            "amount": 6
          }
        },
        "power": {
          "name": "Força de Sansão",
          "text": "+2 Força nos conflitos da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "STRENGTH",
            "amount": 2
          }
        },
        "style": "Força e resistência",
        "source": "Juízes 13–16 (era dos Juízes).",
        "portrait": "Perfil, sete tranças, barba curta, torso forte, pilares enormes; luz de fogueira; ~30 anos."
      }
    ]
  },
  {
    "id": "romans",
    "chassis": "kor",
    "name": "Romanos",
    "adjective": "Romano",
    "scope": "Roma: República tardia e Principado",
    "period": "c. 100 a.C. – 117 d.C.",
    "architecture": [
      "- N1–N2: casas de tijolo e telha, cerca de estacas (castrum)",
      "N3–N4: fórum, basílica, aqueduto, telha vermelha",
      "N5: termas, arco, muralha de tijolo e concreto",
      "N6–N7: anfiteatro, templos de mármore, avenidas"
    ],
    "port": "Mole de pedra com arcada e liburna",
    "fortification": "Muralha de tijolo e concreto com torres quadradas",
    "materials": "Tijolo, concreto, mármore, telha, bronze",
    "pattern": "Ovolo e louros",
    "palette": [
      "#bdb29a",
      "#a65f40",
      "#8f8a82",
      "#b8914d"
    ],
    "banner": {
      "name": "Vexillum",
      "text": "Pano retangular pendurado de um travessão, com franja",
      "enum": "VEXILLUM"
    },
    "emblem": {
      "name": "Aquila",
      "text": "Águia de legião com asas abertas"
    },
    "cityLook": "Fórum, aqueduto, termas e muralha de tijolo",
    "patrons": "Júpiter, Marte, Vesta",
    "reserves": "Cipião Africano (H); Marco Aurélio (H); Constantino (H); Agripina, a Jovem (H); Adriano (H)",
    "figures": [
      {
        "id": "leader-julio-cesar",
        "name": "Júlio César",
        "recommended": true,
        "cls": "HISTORICAL",
        "archetype": "Comandante de Campanha",
        "passive": {
          "name": "Campanhas Abastecidas",
          "text": "Suprimento +1 hex",
          "effect": {
            "kind": "SUPPLY",
            "amount": 1
          }
        },
        "power": {
          "name": "Veni, Vidi, Vici",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Campanha e comando",
        "source": "Comentários (Guerra das Gálias, propaganda), Cícero, Suetônio, Plutarco.",
        "portrait": "Perfil, rosto magro, coroa de louros, toga; fortificação de Alésia; luz de campanha; ~55 anos."
      },
      {
        "id": "leader-augusto",
        "name": "Augusto",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Governante-Administrador",
        "passive": {
          "name": "Pax Augusta",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Jogos Seculares",
          "text": "+1 Ânimo em todas as cidades",
          "effect": {
            "kind": "MOOD_ALL",
            "amount": 1
          }
        },
        "style": "Governo e administração",
        "source": "Res Gestae, Suetônio, Tácito, Dião Cássio.",
        "portrait": "Frontal idealizado (tipo Prima Porta), couraça lavrada; fórum de mármore; luz limpa; jovem ideal."
      },
      {
        "id": "leader-trajano",
        "name": "Trajano",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Imperador-Construtor",
        "passive": {
          "name": "Obras Públicas",
          "text": "Limite de Pedra +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "stone",
            "amount": 6
          }
        },
        "power": {
          "name": "Via Trajana",
          "text": "+1 movimento da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "MOVEMENT",
            "amount": 1
          }
        },
        "style": "Expansão e infraestrutura",
        "source": "Coluna de Trajano, Plínio, Dião Cássio.",
        "portrait": "Perfil, corte de cabelo reto, paludamento; Coluna de Trajano em espiral; luz de meio-dia; ~50 anos."
      }
    ]
  },
  {
    "id": "norse",
    "chassis": "thalos",
    "name": "Nórdicos",
    "adjective": "Nórdico",
    "scope": "Mundo nórdico da Era Viking",
    "period": "c. 793 – 1066 d.C.",
    "architecture": [
      "- N1–N2: casa longa de madeira e turfa, cerca de estacas",
      "N3–N4: salão longo, estaleiro de drakkar, círculo de pedras",
      "N5: fortaleza circular de madeira e terra, cais",
      "N6–N7: salão real, mercado costeiro (tipo Birka e Hedeby), pedra rúnica"
    ],
    "port": "Cais de madeira com drakkar de vela listrada",
    "fortification": "Palissada e muralha circular de terra",
    "materials": "Carvalho e pinho escuro, turfa, ferro, pedra rúnica",
    "pattern": "Entrelaçado de animais",
    "palette": [
      "#4a3a2c",
      "#7a8a8f",
      "#c9d2d4",
      "#8a3f3a"
    ],
    "banner": {
      "name": "Estandarte do Corvo",
      "text": "Pano triangular com corvo, em haste",
      "enum": "RAVEN"
    },
    "emblem": {
      "name": "Corvo",
      "text": "Corvo de asas abertas sobre entrelaçado"
    },
    "cityLook": "Salão longo, cais de drakkar e palissada circular",
    "patrons": "Odin, Thor, Freyja",
    "reserves": "Lagertha (T); Harald Hardrada (H); Erik, o Vermelho (S); Freydís Eiríksdóttir (S)",
    "figures": [
      {
        "id": "leader-harald-cabelo-belo",
        "name": "Harald Cabelo Belo",
        "recommended": false,
        "cls": "SEMI_LEGENDARY",
        "archetype": "Rei-Unificador",
        "passive": {
          "name": "Reino Unido",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Juramento de Hafrsfjord",
          "text": "+15 coesão local em todas as cidades",
          "effect": {
            "kind": "COHESION_ALL",
            "amount": 15
          }
        },
        "style": "Unificação e governo",
        "source": "Heimskringla (Snorri, c. 1230), poesia escáldica.",
        "portrait": "Perfil, cabelo longo louro e barba, anel de braço, fiorde; luz clara de inverno; ~45 anos."
      },
      {
        "id": "leader-leif-erikson",
        "name": "Leif Erikson",
        "recommended": true,
        "cls": "HISTORICAL",
        "archetype": "Explorador",
        "passive": {
          "name": "Rotas de Vinland",
          "text": "Suprimento +1 hex",
          "effect": {
            "kind": "SUPPLY",
            "amount": 1
          }
        },
        "power": {
          "name": "Travessia",
          "text": "+1 movimento da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "MOVEMENT",
            "amount": 1
          }
        },
        "style": "Exploração",
        "source": "Grænlendinga saga e Eiríks saga rauða (séc. XIII); L'Anse aux Meadows (c. 1000 d.C.).",
        "portrait": "Três-quartos, capuz, barba curta, proa de navio, costa desconhecida; luz de aurora; ~30 anos."
      },
      {
        "id": "leader-ragnar-lodbrok",
        "name": "Ragnar Lodbrok",
        "recommended": false,
        "cls": "TRADITIONAL",
        "archetype": "Guerreiro-Incursor",
        "passive": {
          "name": "Tributo de Incursão",
          "text": "Limite de Riqueza +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "wealth",
            "amount": 6
          }
        },
        "power": {
          "name": "Fúria da Incursão",
          "text": "+2 Força nos conflitos da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "STRENGTH",
            "amount": 2
          }
        },
        "style": "Guerra e incursão",
        "source": "Ragnars saga loðbrókar, Gesta Danorum (Saxo), Krákumál.",
        "portrait": "Perfil, tranças e barba, elmo cônico de nasal, escudo, vela listrada; luz de tocha; ~45 anos."
      }
    ]
  },
  {
    "id": "chinese",
    "chassis": "orinth",
    "name": "Chineses",
    "adjective": "Chinês",
    "scope": "China antiga e imperial inicial",
    "period": "c. 500 a.C. – 705 d.C.",
    "architecture": [
      "- N1–N2: casas de taipa, colmo, cerca de estacas",
      "N3–N4: pátios, salão de beirais curvos, torre de tambor",
      "N5: muralha de taipa com portão de torre",
      "N6–N7: pagode, palácio em plataforma"
    ],
    "port": "Píer de madeira laqueada com junco de velas ripadas",
    "fortification": "Muralha de taipa com torre de portão de telhado curvo",
    "materials": "Taipa, madeira laqueada, telha cinza, bronze, seda",
    "pattern": "Meandro de raios (leiwen)",
    "palette": [
      "#6e5a48",
      "#8e4a3c",
      "#3f4448",
      "#b8914d"
    ],
    "banner": {
      "name": "Estandarte de Caldeirão",
      "text": "Faixa vertical com caudas, ornada com o caldeirão",
      "enum": "STREAMER"
    },
    "emblem": {
      "name": "Caldeirão ding",
      "text": "Tripé de bronze ritual: autoridade"
    },
    "cityLook": "Muralha de taipa, torre de portão e telhado curvo",
    "patrons": "Heróis culturais (sem religião popular viva)",
    "reserves": "Fu Hao (H); Han Wudi (H); Zhang Qian (H); Yu, o Grande (S); Confúcio (H); Mulan (L)",
    "figures": [
      {
        "id": "leader-qin-shi-huang",
        "name": "Qin Shi Huang",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Imperador-Centralizador",
        "passive": {
          "name": "Muralhas Unidas",
          "text": "Limite de Pedra +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "stone",
            "amount": 6
          }
        },
        "power": {
          "name": "Padronização",
          "text": "+15 coesão local em todas as cidades",
          "effect": {
            "kind": "COHESION_ALL",
            "amount": 15
          }
        },
        "style": "Centralização e obra",
        "source": "Shiji (Sima Qian, c. 100 a.C.), tabuinhas de Liye e Yunmeng, Exército de Terracota.",
        "portrait": "Frontal, coroa mian com contas, bigode e cavanhaque, robe negro; exército de terracota; luz fria; ~45 anos."
      },
      {
        "id": "leader-wu-zetian",
        "name": "Wu Zetian",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Imperatriz-Administradora",
        "passive": {
          "name": "Exames Imperiais",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Reinado de Zhou",
          "text": "+1 Ânimo em todas as cidades",
          "effect": {
            "kind": "MOOD_ALL",
            "amount": 1
          }
        },
        "style": "Governo e administração",
        "source": "Livros Velho e Novo de Tang, Zizhi Tongjian.",
        "portrait": "Três-quartos, penteado alto com grampos, robe de gola de nuvens; salão de corte; luz suave; ~50 anos."
      },
      {
        "id": "leader-sun-tzu",
        "name": "Sun Tzu",
        "recommended": true,
        "cls": "SEMI_LEGENDARY",
        "archetype": "Estrategista",
        "passive": {
          "name": "Estrada do General",
          "text": "Suprimento +1 hex",
          "effect": {
            "kind": "SUPPLY",
            "amount": 1
          }
        },
        "power": {
          "name": "Cálculo Prévio",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Estratégia e logística",
        "source": "Shiji (biografia de Sun Wu), A Arte da Guerra (manuscritos de Yinqueshan).",
        "portrait": "Perfil, gorro e barba rala, tiras de bambu; mapa de colinas; luz de lamparina; ~50 anos."
      }
    ]
  },
  {
    "id": "india",
    "chassis": "saren",
    "name": "Índia Antiga",
    "adjective": "Indiano",
    "scope": "Índia antiga: Maurya e Gupta",
    "period": "c. 321 a.C. – 550 d.C.",
    "architecture": [
      "- N1–N2: casas de adobe com varanda, poço",
      "N3–N4: palissada de madeira (Pataliputra), mandapa, poço escalonado",
      "N5: palácio de madeira, pilar de edito, muralha de arenito",
      "N6–N7: complexo de templo-torre, observatório de pedra"
    ],
    "port": "Cais de arenito em degraus (ghat) com dhow de vela latina",
    "fortification": "Palissada de madeira com torres, depois muralha de arenito",
    "materials": "Arenito polido, madeira, estuque, cobre",
    "pattern": "Treliça geométrica (jali)",
    "palette": [
      "#c28a5a",
      "#9a6a4a",
      "#3d5f7a",
      "#b8914d"
    ],
    "banner": {
      "name": "Dhvaja Maurya",
      "text": "Pano estreito e longo, com pavão sobre colina",
      "enum": "LONG"
    },
    "emblem": {
      "name": "Pavão sobre colina",
      "text": "Pavão sobre colina em arco (símbolo de moedas maurya)"
    },
    "cityLook": "Palissada de madeira, pilar de edito e palácio",
    "patrons": "Nenhum (divindades de religiões vivas)",
    "reserves": "Chanakya (S); Samudragupta (H); Rajaraja Chola I (H); Kalidasa (H); Prabhavatigupta (H)",
    "figures": [
      {
        "id": "leader-ashoka",
        "name": "Ashoka",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Governante-Reformador",
        "passive": {
          "name": "Editos em Pilar",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Dhamma",
          "text": "+15 coesão local em todas as cidades",
          "effect": {
            "kind": "COHESION_ALL",
            "amount": 15
          }
        },
        "style": "Governo e coesão",
        "source": "Editos em rocha e pilar (Brahmi, prácrito), Mahavamsa.",
        "portrait": "Frontal, turbante de dobras planas, joias, pilar de edito; luz de tarde; ~50 anos."
      },
      {
        "id": "leader-chandragupta-maurya",
        "name": "Chandragupta Maurya",
        "recommended": true,
        "cls": "HISTORICAL",
        "archetype": "Fundador-Comandante",
        "passive": {
          "name": "Exércitos Abastecidos",
          "text": "Suprimento +1 hex",
          "effect": {
            "kind": "SUPPLY",
            "amount": 1
          }
        },
        "power": {
          "name": "Falange Maurya",
          "text": "+2 Força nos conflitos da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "STRENGTH",
            "amount": 2
          }
        },
        "style": "Fundação e comando",
        "source": "Megástenes (Indica, fragmentos), Justino, tradições jainista e brâmane; Arthashastra atribuído a Kautilya.",
        "portrait": "Três-quartos, turbante, arco, elefantes ao fundo; luz de campanha; ~40 anos."
      },
      {
        "id": "leader-aryabhata",
        "name": "Aryabhata",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Sábio",
        "passive": {
          "name": "Arquivo de Medidas",
          "text": "Limite de Pedra +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "stone",
            "amount": 6
          }
        },
        "power": {
          "name": "Padrão de Métodos",
          "text": "+1 ponto de comando da rodada",
          "effect": {
            "kind": "ROUND_BONUS",
            "bonus": "COMMAND",
            "amount": 1
          }
        },
        "style": "Conhecimento",
        "source": "Aryabhatiya (499 d.C.), comentaristas.",
        "portrait": "Perfil, cabeça raspada com mecha, esfera armilar, folhas de palmeira; céu noturno; ~35 anos."
      }
    ]
  },
  {
    "id": "incas",
    "chassis": "aurelia",
    "name": "Incas (Tawantinsuyu)",
    "adjective": "Inca",
    "scope": "Tawantinsuyu e a tradição de origem inca",
    "period": "c. 1438 – 1533 d.C. (origem em tradição)",
    "architecture": [
      "- N1–N2: casas de pedra e palha, depósito pequeno",
      "N3–N4: andenes (terraços), portas trapezoidais, qollqas",
      "N5: plataforma escalonada, praça, muralha encaixada",
      "N6–N7: cidadela de terraços, muralha em zigue-zague"
    ],
    "port": "Embarcadouro de pedra encaixada com barcos de junco (caballito de totora)",
    "fortification": "Muralha em zigue-zague de pedra poligonal encaixada",
    "materials": "Granito e andesito, palha ichu, adobe, lã de alpaca, ouro",
    "pattern": "Tocapu (quadros xadrez)",
    "palette": [
      "#a9a493",
      "#7d7967",
      "#b79c62",
      "#a54a3a"
    ],
    "banner": {
      "name": "Unancha",
      "text": "Pano quadrado com tocapu, em haste",
      "enum": "SQUARE"
    },
    "emblem": {
      "name": "Mascaipacha",
      "text": "Borla real vermelha sobre faixa (llautu)"
    },
    "cityLook": "Andenes, qollqas e muralha de pedra encaixada",
    "patrons": "Inti, Viracocha, Pachamama (tradição viva: só visual)",
    "reserves": "Túpac Inca Yupanqui (H); Mama Huaco (T); Huayna Cápac (H); Túpac Amaru I (H)",
    "figures": [
      {
        "id": "leader-pachacutec",
        "name": "Pachacútec",
        "recommended": false,
        "cls": "HISTORICAL",
        "archetype": "Reformador-Construtor",
        "passive": {
          "name": "Cantaria Encaixada",
          "text": "Limite de Pedra +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "stone",
            "amount": 6
          }
        },
        "power": {
          "name": "Mit’a",
          "text": "+15 coesão local em todas as cidades",
          "effect": {
            "kind": "COHESION_ALL",
            "amount": 15
          }
        },
        "style": "Reforma e construção",
        "source": "Betanzos (1551), Cieza e Sarmiento (cronistas coloniais) com base em tradição oral e quipus; arqueologia.",
        "portrait": "Perfil, llautu e orelheiras, túnica de tocapu, muralha de Cuzco; luz de pedra; ~50 anos."
      },
      {
        "id": "leader-manco-capac",
        "name": "Manco Cápac",
        "recommended": false,
        "cls": "TRADITIONAL",
        "archetype": "Fundador tradicional",
        "passive": {
          "name": "Cuzco, Umbigo do Mundo",
          "text": "Ação cívica integra +10 em cidades ocupadas",
          "effect": {
            "kind": "INTEGRATION",
            "amount": 10
          }
        },
        "power": {
          "name": "Aliança de Ayllus",
          "text": "tratados ativos duram +2 rodadas",
          "effect": {
            "kind": "TREATY_EXTEND",
            "rounds": 2
          }
        },
        "style": "Fundação e alianças",
        "source": "Mito de origem registrado por Garcilaso e Sarmiento (variantes).",
        "portrait": "Frontal, bastão de ouro, montanhas e lago; luz de alvorada; sem idade definida."
      },
      {
        "id": "leader-mama-ocllo",
        "name": "Mama Ocllo",
        "recommended": true,
        "cls": "TRADITIONAL",
        "archetype": "Fundadora (cultura e produção)",
        "passive": {
          "name": "Celeiros de cortesia",
          "text": "Limite de Alimento +6",
          "effect": {
            "kind": "STORAGE",
            "resource": "food",
            "amount": 6
          }
        },
        "power": {
          "name": "Festa da Colheita",
          "text": "+1 Ânimo em todas as cidades",
          "effect": {
            "kind": "MOOD_ALL",
            "amount": 1
          }
        },
        "style": "Produção e cultura",
        "source": "Garcilaso (1609) e outros (variantes).",
        "portrait": "Frontal, manta (lliclla) e alfinete (tupu), fuso, terraços; luz de manhã; ~35 anos."
      }
    ]
  }
];
export const CORE10_CHASSIS: readonly string[] = CORE10.map(civ => civ.chassis);
export const core10OfChassis = (chassis: string | null | undefined): Core10Civilization | null => CORE10.find(civ => civ.chassis === chassis) ?? null;
/** What the player reads for a civilization: the Core 10 name, never the technical id. */
export const civilizationDisplayName = (chassis: string | null | undefined): string => core10OfChassis(chassis)?.name ?? 'Civilização';
export const isCore10Chassis = (chassis: string | null | undefined): boolean => core10OfChassis(chassis) !== null;
export const FIGURES: readonly (Core10Figure & { civilizationId: string })[] = CORE10.flatMap(civ => civ.figures.map(figure => ({ ...figure, civilizationId: civ.chassis })));
export const figureById = (id: string | null | undefined) => FIGURES.find(figure => figure.id === id) ?? null;
export const recommendedFigure = (chassis: string | null | undefined): Core10Figure | null => core10OfChassis(chassis)?.figures.find(figure => figure.recommended) ?? core10OfChassis(chassis)?.figures[0] ?? null;
