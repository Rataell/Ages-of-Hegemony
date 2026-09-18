'use client';
import { useEffect, useRef, useState } from 'react';

type Category = 'GOVERNMENTS' | 'DISTRICTS' | 'BUILDINGS' | 'IMPROVEMENTS' | 'ROLES' | 'RESOURCES' | 'RULES';

interface CompendiumCard {
  id: string;
  category: Category;
  title: string;
  subtitle: string;
  badge?: string;
  cost?: string;
  effect: string;
  synergy?: string;
  tradeoff?: string;
  icon?: string;
}

const cardsData: CompendiumCard[] = [
  // GOVERNMENTS
  {
    id: 'gov-monarchy',
    category: 'GOVERNMENTS',
    title: 'Monarquia',
    subtitle: 'Autoridade Régia Centralizada',
    badge: 'Institucional',
    effect: '+2 de Capacidade Administrativa e +3 de estabilidade na capital a cada manutenção.',
    tradeoff: 'Penalidade de -5 de estabilidade em todas as cidades caso a capital caia em crise (<20).',
    icon: '👑',
  },
  {
    id: 'gov-republic',
    category: 'GOVERNMENTS',
    title: 'República',
    subtitle: 'Ordem Cívica & Senado Urbano',
    badge: 'Cívico',
    effect: '+2 de estabilidade em cidades desenvolvidas (Nível III+); +10% de bônus futuro em Conhecimento e Influência.',
    tradeoff: 'Perda de -1 de capacidade administrativa para cada cidade que estiver instável (<40).',
    icon: '🏛️',
  },
  {
    id: 'gov-oligarchy',
    category: 'GOVERNMENTS',
    title: 'Oligarquia',
    subtitle: 'Poder Mercantil & Consórcio de Magnatas',
    badge: 'Mercantil',
    effect: '+10% de Riqueza bruta; +15% de Riqueza adicional em cidades com especialização comercial.',
    tradeoff: 'Desigualdade social acentuada gera risco de -2 de estabilidade futura.',
    icon: '🪙',
  },
  {
    id: 'gov-theocracy',
    category: 'GOVERNMENTS',
    title: 'Teocracia',
    subtitle: 'Soberania Espiritual & Primazia Sagrada',
    badge: 'Religioso',
    effect: '+2 de Estabilidade Global em todas as cidades do reino; +10% de Influência futura.',
    tradeoff: 'Dogmatismo eclesiástico impõe -1 de flexibilidade para reformas futuras.',
    icon: '🕊️',
  },
  {
    id: 'gov-confederation',
    category: 'GOVERNMENTS',
    title: 'Confederação',
    subtitle: 'Pacto Federativo de Cidades Livres',
    badge: 'Federativo',
    effect: '+1 de Capacidade Administrativa por cidade; +2 de estabilidade em reinos com múltiplas cidades.',
    tradeoff: 'Deliberações descentralizadas impõem custo de -1 Ponto de Comando por rodada.',
    icon: '🛡️',
  },

  // DISTRICTS
  {
    id: 'dist-agrarian',
    category: 'DISTRICTS',
    title: 'Distrito Agrário',
    subtitle: 'Cultivo e Armazenamento Rural',
    cost: '2 Materiais',
    effect: '+1 Alimento por manutenção (requer ao menos 1 Produtor ativo na cidade).',
    synergy: 'Potencializado pela Especialização Agrária. Permite construir Celeiro.',
    icon: '🌾',
  },
  {
    id: 'dist-commercial',
    category: 'DISTRICTS',
    title: 'Distrito Comercial',
    subtitle: 'Feiras Urbanas e Alfândegas',
    cost: '2 Materiais, 1 Riqueza',
    effect: '+1 Riqueza por manutenção (requer ao menos 1 Mercador ativo).',
    synergy: 'Sinergia com Oligarquia e Especialização Comercial. Permite construir Mercado.',
    icon: '⚖️',
  },
  {
    id: 'dist-academic',
    category: 'DISTRICTS',
    title: 'Distrito Acadêmico',
    subtitle: 'Academias de Escribas e Filosofia',
    cost: '3 Materiais, 1 Riqueza',
    effect: '+1 Conhecimento por manutenção (requer ao menos 1 Estudioso ativo).',
    synergy: 'Base para o futuro avanço científico. Permite construir Biblioteca.',
    icon: '📜',
  },
  {
    id: 'dist-admin',
    category: 'DISTRICTS',
    title: 'Distrito Administrativo',
    subtitle: 'Fórum de Magistrados e Tribunais',
    cost: '3 Materiais',
    effect: '+1 de Capacidade Administrativa (+1 extra se especializada).',
    synergy: 'Evita a sobre-extensão do império. Permite construir Arquivo.',
    icon: '🏛️',
  },
  {
    id: 'dist-military',
    category: 'DISTRICTS',
    title: 'Distrito Militar',
    subtitle: 'Praça de Armas e Quartéis',
    cost: '3 Materiais',
    effect: '+1 de Guarnição defensiva municipal (+1 extra se especializada).',
    synergy: 'Segurança e defesa. Permite construir Quartel.',
    icon: '⚔️',
  },
  {
    id: 'dist-industrial',
    category: 'DISTRICTS',
    title: 'Distrito Industrial',
    subtitle: 'Olarias, Forjas e Manufaturas',
    cost: '3 Materiais',
    effect: '+1 Material por manutenção (requer ao menos 1 Artesão ativo).',
    synergy: 'Acelera a expansão física. Permite construir Oficina.',
    icon: '🔨',
  },
  {
    id: 'dist-cultural',
    category: 'DISTRICTS',
    title: 'Distrito Cultural',
    subtitle: 'Fórum Cívico e Monumentos',
    cost: '2 Materiais, 1 Riqueza',
    effect: '+1 de Influência por manutenção.',
    synergy: 'Acelera a reivindicação de territórios. Permite construir Centro Cultural.',
    icon: '🎭',
  },

  // BUILDINGS
  {
    id: 'bld-granary',
    category: 'BUILDINGS',
    title: 'Celeiro',
    subtitle: 'Armazém Agrário',
    cost: '2 Materiais · Requer Distrito Agrário',
    effect: 'Reduz o limiar de crescimento demográfico em 2 pontos (de 10 para 8 alimentos).',
    icon: '🏺',
  },
  {
    id: 'bld-market',
    category: 'BUILDINGS',
    title: 'Mercado',
    subtitle: 'Bazar Central e Câmbio',
    cost: '2 Materiais, 1 Riqueza · Requer Distrito Comercial',
    effect: '+1 Riqueza por manutenção (requer Mercador ativo).',
    icon: '💰',
  },
  {
    id: 'bld-library',
    category: 'BUILDINGS',
    title: 'Biblioteca',
    subtitle: 'Repositório de Rolos e Manuscritos',
    cost: '3 Materiais, 1 Riqueza · Requer Distrito Acadêmico',
    effect: '+1 Conhecimento por manutenção (requer Estudioso ativo).',
    icon: '📖',
  },
  {
    id: 'bld-archive',
    category: 'BUILDINGS',
    title: 'Arquivo',
    subtitle: 'Cartório do Estado e Registro Cívico',
    cost: '2 Materiais · Requer Distrito Administrativo',
    effect: '+1 de Capacidade Administrativa permanente para o reino.',
    icon: '🗄️',
  },
  {
    id: 'bld-barracks',
    category: 'BUILDINGS',
    title: 'Quartel',
    subtitle: 'Alojamento e Guarnição Urbana',
    cost: '3 Materiais · Requer Distrito Militar',
    effect: '+2 de Guarnição defensiva na cidade.',
    icon: '🛡️',
  },
  {
    id: 'bld-workshop',
    category: 'BUILDINGS',
    title: 'Oficina',
    subtitle: 'Manufatura de Ferramentas',
    cost: '3 Materiais · Requer Distrito Industrial',
    effect: '+1 Material por manutenção (requer Artesão ativo).',
    icon: '⚙️',
  },
  {
    id: 'bld-cultural-center',
    category: 'BUILDINGS',
    title: 'Centro Cultural',
    subtitle: 'Teatro e Monumento Cívico',
    cost: '2 Materiais, 1 Riqueza · Requer Distrito Cultural',
    effect: '+1 de Influência por manutenção.',
    icon: '🎪',
  },

  // IMPROVEMENTS
  {
    id: 'imp-farm',
    category: 'IMPROVEMENTS',
    title: 'Fazenda',
    subtitle: 'Cultivo de Trigo e Cevada',
    cost: '1 Material · Terreno: Planície (ou Fértil)',
    effect: '+1 Alimento ao hexágono quando trabalhado por um produtor.',
    icon: '🌾',
  },
  {
    id: 'imp-lumber',
    category: 'IMPROVEMENTS',
    title: 'Serraria',
    subtitle: 'Corte e Aparelhamento de Madeira',
    cost: '1 Material · Terreno: Floresta',
    effect: '+1 Material ao hexágono quando trabalhado.',
    icon: '🪵',
  },
  {
    id: 'imp-quarry',
    category: 'IMPROVEMENTS',
    title: 'Pedreira',
    subtitle: 'Lavra de Cantaria e Rocha',
    cost: '2 Materiais · Terreno: Colinas ou Montanhas',
    effect: '+1 Material ao hexágono quando trabalhado.',
    icon: '🪨',
  },
  {
    id: 'imp-mine',
    category: 'IMPROVEMENTS',
    title: 'Mina',
    subtitle: 'Extração Metalúrgica Profunda',
    cost: '2 Materiais, 1 Riqueza · Terreno: Colinas ou Montanhas',
    effect: '+2 Materiais ao hexágono quando trabalhado.',
    icon: '⛏️',
  },
  {
    id: 'imp-fishery',
    category: 'IMPROVEMENTS',
    title: 'Pesqueiro',
    subtitle: 'Armadilhas e Redes Costeiras',
    cost: '1 Material · Terreno: Costa (requer Peixe)',
    effect: '+1 Alimento ao hexágono quando trabalhado.',
    icon: '🐟',
  },

  // ROLES
  {
    id: 'role-producer',
    category: 'ROLES',
    title: 'Produtor',
    subtitle: 'Trabalho Agrário & Rural',
    effect: '2 Alimentos base. Único papel capaz de trabalhar hexágonos externos no mapa.',
    icon: '👨‍🌾',
  },
  {
    id: 'role-artisan',
    category: 'ROLES',
    title: 'Artesão',
    subtitle: 'Mão de Obra Especializada',
    effect: '1 Material base. Ativa a produção de Oficinas e Distritos Industriais.',
    icon: '⚒️',
  },
  {
    id: 'role-merchant',
    category: 'ROLES',
    title: 'Mercador',
    subtitle: 'Trocas Comerciais & Finanças',
    effect: '1 Riqueza base. Ativa a produção de Mercados e Distritos Comerciais.',
    icon: '⚖️',
  },
  {
    id: 'role-scholar',
    category: 'ROLES',
    title: 'Estudioso',
    subtitle: 'Homem de Letras & Escriba',
    effect: '1 Conhecimento base. Ativa a produção de Bibliotecas e Distritos Acadêmicos.',
    icon: '📜',
  },
  {
    id: 'role-soldier',
    category: 'ROLES',
    title: 'Soldado',
    subtitle: 'Força de Segurança Urbana',
    effect: 'Compõe a guarnição municipal e a capacidade defensiva da cidade.',
    icon: '🛡️',
  },
  {
    id: 'role-unassigned',
    category: 'ROLES',
    title: 'Livre',
    subtitle: 'Reserva Demográfica',
    effect: 'Habitante sem especialização atribuída. Não gera rendimentos especiais.',
    icon: '👤',
  },

  // RESOURCES
  {
    id: 'res-food',
    category: 'RESOURCES',
    title: 'Alimento (Food)',
    subtitle: 'Sustento e Demografia',
    effect: 'Consumido na proporção de 1/habitante. O excedente gera crescimento demográfico (limiar 10/8).',
    icon: '🌾',
  },
  {
    id: 'res-materials',
    category: 'RESOURCES',
    title: 'Materiais (Materials)',
    subtitle: 'Construção e Obras Físicas',
    effect: 'Matéria-prima indispensável para melhorias rurais, distritos, edifícios e cidades.',
    icon: '🪵',
  },
  {
    id: 'res-wealth',
    category: 'RESOURCES',
    title: 'Riqueza (Wealth)',
    subtitle: 'Tesouro e Manutenção Avançada',
    effect: 'Moeda estatal necessária para fundar cidades, edifícios mercantis e governos.',
    icon: '🪙',
  },
  {
    id: 'res-knowledge',
    category: 'RESOURCES',
    title: 'Conhecimento (Knowledge)',
    subtitle: 'Acervo Intelectual e Registros',
    effect: 'Produzido por intelectuais e bibliotecas. Base para a futura árvore de inovações.',
    icon: '📜',
  },
  {
    id: 'res-influence',
    category: 'RESOURCES',
    title: 'Influência (Influence)',
    subtitle: 'Autoridade Política e Soberania',
    effect: 'Recurso diplomático gasto para reivindicar territórios (1/hex) e aprovar reformas governamentais.',
    icon: '👑',
  },

  // RULES
  {
    id: 'rule-admin',
    category: 'RULES',
    title: 'Administração & Sobre-extensão',
    subtitle: 'Carga vs Capacidade do Estado',
    effect: 'Carga = Cidades + Dev/2 + Pop/5 + Hexes/5. Se Carga > Capacidade: perda de 10% da receita não-alimentar e -3 estabilidade por turno.',
    icon: '⚖️',
  },
  {
    id: 'rule-stability',
    category: 'RULES',
    title: 'Estabilidade Social',
    subtitle: 'Ordem e Coesão Institucional',
    effect: 'Próspera (80-100: +10% produção), Estável (60-79: 100%), Tensa (40-59: 100%), Instável (20-39: 90%), Crítica (0-19: 75% e bloqueia novos desenvolvimentos).',
    icon: '🏛️',
  },
  {
    id: 'rule-development',
    category: 'RULES',
    title: 'Desenvolvimento Urbano',
    subtitle: 'Níveis Civilizacionais (I a V)',
    effect: 'Cada nível eleva a população máxima (3, 5, 8, 12, 16), o alcance territorial (1, 1, 2, 2, 3) e destrava slots de distritos (1 a 5).',
    icon: '⭐',
  },
  {
    id: 'rule-worked',
    category: 'RULES',
    title: 'Território Trabalhado',
    subtitle: 'Extração Rural Externa',
    effect: 'Apenas produtores alocados na cidade podem trabalhar hexágonos no mapa. Cada produtor opera exatamente 1 território soberano elegível.',
    icon: '🚜',
  },
];

const categoryLabels: Record<Category, string> = {
  GOVERNMENTS: 'Governos',
  DISTRICTS: 'Distritos',
  BUILDINGS: 'Edifícios',
  IMPROVEMENTS: 'Melhorias',
  ROLES: 'População',
  RESOURCES: 'Recursos',
  RULES: 'Regras & Conceitos',
};

export function CompendiumModal({
  isOpen,
  onClose,
  onRestartTutorial,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRestartTutorial: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('GOVERNMENTS');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const d = dialogRef.current;
    if (isOpen) {
      d?.showModal();
    } else {
      d?.close();
    }
  }, [isOpen]);

  const filteredCards = cardsData.filter(card => {
    const matchesCategory = activeCategory === 'RULES' ? card.category === 'RULES' : card.category === activeCategory;
    const query = search.trim().toLowerCase();
    if (!query) return matchesCategory;
    return (
      (card.category === activeCategory || !matchesCategory) &&
      (card.title.toLowerCase().includes(query) ||
        card.subtitle.toLowerCase().includes(query) ||
        card.effect.toLowerCase().includes(query))
    );
  });

  return (
    <dialog
      ref={dialogRef}
      className="compendium-dialog"
      onCancel={onClose}
      aria-labelledby="compendium-title"
    >
      <header className="compendium-header">
        <div>
          <span className="eyebrow">ARQUIVO CENTRAL DO ESTADO</span>
          <h2 id="compendium-title">Compêndio & Manual de Regras</h2>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="action-secondary tutorial-restart-btn"
            onClick={() => {
              onRestartTutorial();
              onClose();
            }}
            title="Reinicia o assistente de primeiros passos na barra do mapa"
          >
            ✦ Reiniciar Tutorial
          </button>
          <button
            type="button"
            className="compendium-close"
            aria-label="Fechar compêndio"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </header>

      {/* Navigation tabs & Search bar */}
      <div className="compendium-toolbar">
        <nav className="compendium-categories" aria-label="Categorias do compêndio">
          {(Object.keys(categoryLabels) as Category[]).map(cat => (
            <button
              key={cat}
              type="button"
              className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setSearch('');
              }}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </nav>

        <div className="compendium-search">
          <input
            type="search"
            placeholder="Buscar no compêndio…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar termo no compêndio"
          />
        </div>
      </div>

      {/* Cards Catalog */}
      <div className="compendium-grid" role="region" aria-label="Lista de cartas do compêndio">
        {filteredCards.map(card => (
          <article key={card.id} className="compendium-card">
            <div className="card-top">
              <span className="card-icon">{card.icon}</span>
              <div className="card-title-block">
                <h3>{card.title}</h3>
                <small className="card-sub">{card.subtitle}</small>
              </div>
              {card.badge && <span className="card-badge">{card.badge}</span>}
            </div>

            {card.cost && (
              <div className="card-cost">
                <small>Custo / Requisito:</small>
                <b>{card.cost}</b>
              </div>
            )}

            <p className="card-effect">{card.effect}</p>

            {card.synergy && (
              <div className="card-meta synergy">
                <small>Sinergia:</small> {card.synergy}
              </div>
            )}

            {card.tradeoff && (
              <div className="card-meta tradeoff">
                <small>Trade-off institucional:</small> {card.tradeoff}
              </div>
            )}
          </article>
        ))}

        {filteredCards.length === 0 && (
          <p className="compendium-empty">Nenhum termo correspondente encontrado no acervo.</p>
        )}
      </div>
    </dialog>
  );
}
