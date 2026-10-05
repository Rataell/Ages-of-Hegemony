export const labels: Record<string, string> = {
  EXPANSION: 'Expansão', CIVILIZATION: 'Civilização', EMPIRES: 'Impérios', HEGEMONY: 'Hegemonia',
  food: 'Alimento', materials: 'Materiais', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura',
  producers: 'Produtores', artisans: 'Artesãos', merchants: 'Mercadores', scholars: 'Eruditos', soldiers: 'Soldados', unassigned: 'Disponível',
  PROTO_GOVERNANCE: 'Governo inicial', MONARCHY: 'Monarquia', REPUBLIC: 'República', OLIGARCHY: 'Oligarquia', THEOCRACY: 'Teocracia', CONFEDERATION: 'Confederação',
  AGRARIAN: 'Agrário', COMMERCIAL: 'Comercial', ACADEMIC: 'Acadêmico', ADMINISTRATIVE: 'Administrativo', MILITARY: 'Militar', INDUSTRIAL: 'Industrial', CULTURAL: 'Cultural',
  GRANARY: 'Celeiro', MARKET: 'Mercado', LIBRARY: 'Biblioteca', ARCHIVE: 'Arquivo', BARRACKS: 'Quartel', WORKSHOP: 'Oficina', CULTURAL_CENTER: 'Centro cultural',
  FARM: 'Fazenda', LUMBER_CAMP: 'Serraria', QUARRY: 'Pedreira', MINE: 'Mina', FISHERY: 'Pesqueiro',
  PLAINS: 'Planície', FOREST: 'Floresta', HILLS: 'Colinas', MOUNTAINS: 'Montanhas', COAST: 'Costa', SEA: 'Mar', UNKNOWN: 'Desconhecido',
  RIVER: 'Rio', FERTILE: 'Fértil', TIMBER: 'Madeira', STONE: 'Pedra', METAL: 'Metal', FISH: 'Peixe',
  population: 'População', terrain: 'Terreno', feature: 'Características', improvement: 'Melhoria', district: 'Distrito', building: 'Edifício', specialization: 'Especialização', government: 'Governo', stability: 'Estabilidade',
  CRITICAL: 'Crítica', UNSTABLE: 'Instável', TENSE: 'Tensa', STABLE: 'Estável', PROSPEROUS: 'Próspera',
  VILLAGE: 'Aldeia', TOWN: 'Vila', CITY_STATE: 'Cidade-estado', HOSTILE: 'Hostil', WARY: 'Desconfiado', NEUTRAL: 'Neutro', FRIENDLY: 'Amistoso',
  INFANTRY: 'Infantaria', GUARD: 'Guarda', RANGED: 'Arqueiros', CAVALRY: 'Cavalaria', SIEGE: 'Engenho de cerco', FLEET: 'Frota', COASTAL_VESSEL: 'Embarcação Costeira', PIONEER: 'Pioneiro', ENVOY: 'Enviado',
  PRODUCER: 'Produtor', ARTISAN: 'Artesão', MERCHANT: 'Mercador', SCHOLAR: 'Estudioso', SOLDIER: 'Soldado',
  MAINTENANCE: 'Manutenção', PLANNING: 'Planejamento', RESOLUTION: 'Resolução', REACTION: 'Reação', END_ROUND: 'Fim da rodada', FOUNDATION: 'Fundação',
};
export const label = (key: string) => labels[key] ?? key;
export const roman = ['', 'I', 'II', 'III', 'IV', 'V'];
export function ruleMessage(reason: string) {
  const code = reason.split(':')[0] ?? '';
  const messages: Record<string, string> = {
    WRONG_PHASE: 'Disponível durante Planejamento. Avance a fase.', HEX_NOT_FREE: 'Território já possui proprietário.', HEX_NOT_OWNED: 'Requer território da sua civilização.',
    OUT_OF_RANGE: 'Fora do alcance administrativo da cidade.', DISCONNECTED_TERRITORY: 'Requer conexão territorial com a cidade.', INVALID_TERRITORY: 'Mar e terreno desconhecido não podem ser reivindicados.',
    INSUFFICIENT_RESOURCES: 'Recursos insuficientes para o custo indicado.', CITY_TOO_CLOSE: 'Distância mínima entre cidades não atendida.', INVALID_CITY_SITE: 'Requer terreno permitido, sem cidade e sem trabalhadores.',
    CITY_NOT_OWNED: 'Esta cidade pertence a outra civilização.', INVALID_ALLOCATION: 'Distribuição incompatível com população ou territórios trabalhados.',
    INVALID_WORKED_HEXES: 'Use um território elegível por produtor, sem repetição.', INVALID_IMPROVEMENT: 'Melhoria incompatível com terreno ou características.', ALREADY_IMPROVED: 'Território já possui melhoria. Troca indisponível.',
    DISTRICT_LIMIT: 'Sem slots. Desenvolva a cidade.', DUPLICATE_DISTRICT: 'Distrito já construído.', MISSING_DISTRICT: 'Construa primeiro o distrito correspondente.', DUPLICATE_BUILDING: 'Edifício já construído.',
    ALREADY_SPECIALIZED: 'Especialização permanente já escolhida.', GOVERNMENT_ALREADY_ADOPTED: 'Governo já adotado.', MAX_DEVELOPMENT: 'Desenvolvimento máximo.', DEVELOPMENT_REQUIRED: 'Desenvolvimento insuficiente.',
    CRITICAL_STABILITY: 'Estabilidade crítica impede desenvolvimento.', VERSION_CONFLICT: 'Estado atualizado por outra ação. Revise e tente novamente.', FORBIDDEN: 'Comando não autorizado para esta perspectiva.',
  };
  return messages[code] ?? reason;
}
