'use client';
import { useState } from 'react';
import { ADVANCEMENTS, ALPHA_CARDS, AlphaEraSchema, CIVILIZATIONS, WEB_DOMAIN_NAMES, WebDomainSchema, heritageOf, civilizationKit, GREAT_PROJECTS, LEADERS, ALPHA_RESOURCE_KEYS, RESOURCE_KEYS, TreatyTypeSchema, alphaGainOf, emptyAlphaResourcePool, type AlphaResourcePool, type AlphaEffect, type CityState } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { ResourceDisplay } from '../play/resource-display';
import { EconomyTable, PopulationManager } from '../play/inspectors';
import { alphaLabel as text } from './alpha-copy';
import { BattleReport } from './alpha-combat';
import type { AlphaSend } from './alpha-board';
import { GovernmentReform } from './alpha-era-turn';
type Panel={game:AlphaPlayerView;locked:boolean;send:AlphaSend};
/** A production effect is shown as what it credits in the seven resources (legacy "materials" become Madeira and Pedra). */
function Effect({effect}:{effect:AlphaEffect|null}){if(!effect)return null;const gains=effect.kind==='PRODUCTION'?Object.entries(alphaGainOf(effect.resource,effect.amount)).filter(([,n])=>n>0).map(([key,n])=>`+${n} ${text(key)}`).join(', '):`+${effect.amount} ${text(effect.kind)}`;return <p className="alpha-effect">{gains}</p>;}
function Piece({kind='city'}:{kind?:string}){return <svg className="alpha-piece-art" viewBox="0 0 100 70" aria-hidden="true"><path d="M8 55L50 68L92 55L50 42Z"/><path d={kind==='project'?'M22 48V18L50 6L78 18V48L50 58ZM16 20L50 3L84 20M38 52V27H62V52':'M25 48V23H38V31H62V23H75V48L50 58ZM20 48L50 60L80 48M43 54V39H57V54'}/></svg>;}

const CITY_LEVEL:Record<string,string>={OUTPOST:'Posto',HAMLET:'Aldeia',VILLAGE:'Vila',CITY:'Cidade',GREAT_CITY:'Grande Cidade',METROPOLIS:'Metrópole',IMPERIAL_METROPOLIS:'Metrópole Imperial'};
const MOOD_BAND:Record<string,string>={REVOLT:'Revolta',SHAKEN:'Abalada',STABLE:'Estável',PROSPEROUS:'Próspera'};
const FORTIFICATION:Record<string,string>={NONE:'nenhuma',PALISADE:'paliçada',STONE_WALL:'muralha de pedra',FORTRESS:'fortaleza',BASTION:'bastião',CITADEL:'cidadela'};
export function AlphaCity({game,city,locked,send,manage}:Panel&{city:CityState;manage:AlphaSend}){
  const details=game.cityDetails.find(c=>c.id===city.id)!,meta=game.cityStates.find(c=>c.cityId===city.id),occupation=game.occupations.find(o=>o.cityId===city.id);
  const admin=game.administration;
  const elevatePlanned=game.self.plannedActions.some(a=>a.type==='URBAN_ACTION'&&a.cityId===city.id&&a.action==='ELEVATE');
  return <section className="alpha-city"><Piece/><h2>{city.name}</h2>
    {meta&&<p className="alpha-city-facts"><b className="alpha-city-seal" title="Nível construído · Capacidade da ativação">N{['OUTPOST','HAMLET','VILLAGE','CITY','GREAT_CITY','METROPOLIS','IMPERIAL_METROPOLIS'].indexOf(meta.level)+1} · {meta.degraded?`${meta.capacity}/${meta.baseCapacity}`:meta.capacity}</b> {CITY_LEVEL[meta.level]??meta.level}{meta.degraded?` (opera como ${CITY_LEVEL[meta.effectiveLevel]})`:''} · {city.population} habitantes (teto {meta.ceiling}) · Ânimo <b>{MOOD_BAND[meta.moodBand]??meta.mood}</b> ({meta.mood}/6) · Fortificação {FORTIFICATION[meta.fortification]??meta.fortification}{meta.status==='OCCUPIED'?` · Integração ${meta.integration}%`:''} · Fundada na rodada {city.foundedRound}</p>}
    {meta&&<p className="alpha-hint">Capacidade é a potência da ativação: Produzir trabalha centro + {meta.capacity} hex; Recrutar até {meta.capacity} peça(s); Governar recupera até {meta.capacity} nível(is) de Ânimo. Ativações nesta rodada: {meta.activationsAllowed}{meta.activationsAllowed===2?' (a segunda custa 1 Ânimo)':''}.{meta.degraded?` Opera abaixo da capacidade: ${city.population} habitantes (${CITY_LEVEL[meta.effectiveLevel]}). Nível construído, vagas e alcance continuam; reponha gente para voltar a ${meta.baseCapacity}.`:''}</p>}
    {(()=>{const g=details.growth,civ=g.civilization;return <p className="alpha-growth-hint">Se todas as suas cidades Produzirem: +{civ.foodProduced} Alimento (esta cidade +{g.producedFood}); sustento {civ.foodEaten} (esta cidade come {g.eats}). {civ.shortage?'Falta Alimento: as cidades sem sustento perdem um habitante e Ânimo.':g.capped?`No teto do nível (${g.ceiling} habitantes): Eleve a cidade para voltar a crescer.`:g.willGrow?`Sobra ${civ.surplus}: esta cidade cresce (+1 Disponível por ${g.growCost} Alimento).`:`Crescer custa ${g.growCost} Alimento; não sobra para esta cidade nesta rodada.`}</p>;})()}{occupation&&<div className="alpha-warning"><p>Cidade ocupada. A integração é feita por Governar (ação cívica), a partir da rodada seguinte à captura.</p></div>}
    <p className="alpha-hint">Administração: carga {admin.load} / capacidade {admin.capacity}{admin.overextended?' · Sobre-extensão: a cidade mais abalada perde Ânimo e ninguém ativa duas vezes':''}.</p>
    {meta?.elevate&&<details open className="alpha-elevate"><summary>Elevar para {CITY_LEVEL[meta.elevate.next]}</summary><ul className="alpha-elevate-reqs"><li data-ok={city.population>=meta.elevate.minPopulation}>{city.population>=meta.elevate.minPopulation?'✓':'✗'} {meta.elevate.minPopulation} habitantes</li><li data-ok={meta.elevate.block===null||!meta.elevate.block.startsWith('Recursos')}>{costText(meta.elevate.cost)}</li>{meta.elevate.advances.map(a=><li key={a.id} data-ok={a.done}>{a.done?'✓':'✗'} {a.name} (Teia)</li>)}<li>Era mínima: {text(meta.elevate.era)}</li></ul>{meta.elevate.block&&<small role="note">{meta.elevate.block}</small>}<button disabled={locked||elevatePlanned||meta.elevate.block!==null||cityActionGate(game,city.id,'ELEVATE')!==null} onClick={()=>void send({type:'URBAN_ACTION',cityId:city.id,action:'ELEVATE'})}>{elevatePlanned?'Elevar planejado':'Elevar (Ordem Cidade)'}</button></details>}
    <details open><summary>Habitantes e papéis</summary><p className="alpha-hint">Redistribua uma vez por cidade no Planejamento; ao confirmar, a alocação trava.</p><PopulationManager city={city} send={async command=>{await manage(command);}} busy={locked}/></details>
    <details><summary>Distritos · {city.districts.length} / {meta?.slots??'?'} vagas</summary><p>{city.districts.length?city.districts.map(d=>text(d.type)).join(' · '):'Nenhum distrito construído.'} Novos distritos são construídos pela ação Construir; cada um ocupa uma vaga e exige o avanço da Teia que o abre.</p></details>
    <details><summary>Edifícios</summary><p>{city.buildings.length?city.buildings.map(b=>text(b.type)).join(' · '):'Nenhum edifício construído.'} Novos edifícios são construídos pela ação Construir.</p></details>
    <details><summary>Economia da cidade</summary><EconomyTable production={details.production} labels={{materials:'Madeira/Pedra'}} help="Madeira/Pedra: a produção de construção é somada e dividida ao Produzir, metade em Madeira (arredondada para cima) e metade em Pedra."/></details>
    <GovernmentReform game={game} locked={locked} manage={manage}/>
  </section>;
}

const RESOURCE_TEXT:Record<string,string>={food:'Alimentos',wood:'Madeira',stone:'Pedra',metal:'Metal',wealth:'Riqueza',knowledge:'Conhecimento',influence:'Influência', culture: 'Cultura'};
const costText=(cost:Record<string,number>)=>{const parts=Object.entries(cost).filter(([,amount])=>amount>0).map(([key,amount])=>`${amount} ${RESOURCE_TEXT[key]??key}`);return parts.length?parts.join(' · '):'Sem custo';};
type UrbanOption=AlphaPlayerView['urban']['research'][number];
const optionKey=(o:UrbanOption)=>JSON.stringify([o.action,o.build??null,o.unit??null,o.advancementId??null]);
const optionTitle=(o:UrbanOption)=>o.build?.kind==='DISTRICT'?`Distrito ${text(o.build.district)}`:o.build?.kind==='BUILDING'?`Edifício ${text(o.build.building)}`:o.build?.kind==='FORTIFICATION'?'Fortificação':o.unit?`Recrutar ${text(o.unit)}`:o.advancementId?ADVANCEMENTS.find(a=>a.id===o.advancementId)?.name??'Pesquisa':text(o.action);
/** Why the selected city cannot act now (phase, confirmation, actions left, occupation), for options that are not city-specific. */
export function cityActionGate(game:AlphaPlayerView,cityId:string|null,action:string):string|null{
  if(game.phase!=='PLANNING')return 'Disponível apenas no Planejamento.';
  if(game.self.ready)return 'Você já confirmou esta fase.';
  const state=cityId?game.cityStates.find(c=>c.cityId===cityId):undefined;
  if(!state)return 'Selecione uma cidade sua no mapa.';
  if(state.status==='OCCUPIED'&&action!=='CIVIC_ACTION')return 'Cidade ocupada: só a Ação cívica está disponível.';
  if(state.plannedUrbanActions>=game.rules.balance.cityActions)return 'Esta cidade já possui sua ação planejada nesta rodada.';
  return null;
}
/** The only place a city acts: one action per city per round. PRODUCE is a choice, not a default. */
export function AlphaUrban({game,locked,send,cityId}:Panel&{cityId:string}){
  const [picked,setPicked]=useState<string|null>(null),[count,setCount]=useState(1);
  const state=game.cityStates.find(c=>c.cityId===cityId),options=game.urban.cities[cityId];
  if(!state||!options)return null;
  const left=Math.max(0,game.rules.balance.cityActions-state.plannedUrbanActions),acting=game.phase==='PLANNING';
  const researchable=game.urban.research.filter(o=>o.blocked===null||!o.blocked.startsWith('Complete')&&!o.blocked.includes('era posterior'));
  const groups:[string,UrbanOption[]][]=[
    ['Construir',options.filter(o=>o.action==='BUILD')],['Elevar',options.filter(o=>o.action==='ELEVATE')],['Recrutar',options.filter(o=>o.action==='RECRUIT')],['Pesquisar',researchable],
    ['Governar, comércio e cívica',options.filter(o=>['PROMOTE_MOOD','SUPPORT_TRADE','CIVIC_ACTION','MOVE_CAPITAL'].includes(o.action))],
  ];
  const all=[...options,...game.urban.research];
  const selected=all.find(o=>optionKey(o)===picked)??null,recruitMax=Math.max(1,Math.min(6,game.recruitLimits[cityId]??1)),recruitCount=Math.min(count,recruitMax);
  const reason=selected?(cityActionGate(game,cityId,selected.action)??selected.blocked):null;
  const produce=options.find(o=>o.action==='PRODUCE')!;
  const plannedHere=game.self.plannedActions.find(a=>a.type==='URBAN_ACTION'&&a.cityId===cityId) as Extract<AlphaPlayerView['self']['plannedActions'][number],{type:'URBAN_ACTION'}>|undefined;
  const plannedOption=plannedHere?all.find(o=>o.action===plannedHere.action&&JSON.stringify(o.build??null)===JSON.stringify(plannedHere.build??null)&&(o.unit??null)===(plannedHere.unit??null)&&(o.advancementId??null)===(plannedHere.advancementId??null)):undefined;
  const Pick=({o}:{o:UrbanOption})=><button type="button" className="alpha-urban-pick" aria-pressed={picked===optionKey(o)} data-blocked={o.blocked!==null} onClick={()=>setPicked(optionKey(o))}>{optionTitle(o)}</button>;
  return <section className="alpha-panel alpha-urban" aria-label="Ações urbanas">
    <p className="eyebrow">AÇÃO DA CIDADE</p><h3>{acting?'Planeje a ação desta cidade':'Ações da cidade são planejadas no Planejamento'}</h3>
    <p role="status">Ações planejáveis da cidade: <strong>{left}</strong> / {game.rules.balance.cityActions}{state.status==='OCCUPIED'?` · Ocupada, integração ${state.integration}%`:''}</p>
    {plannedHere&&<article className="alpha-produce alpha-urban-planned" aria-label="Ação planejada"><h4>Nesta rodada: {plannedOption?optionTitle(plannedOption):text(plannedHere.action)}</h4>{plannedOption&&<p>{plannedOption.effect}</p>}<p>Resolvida quando todos confirmarem o planejamento.</p><button type="button" disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:plannedHere.id})}>Trocar ação</button></article>}
    {!(plannedHere&&left===0)&&<>
    {state.status!=='OCCUPIED'&&<article className="alpha-produce"><h4>Produzir</h4><p>{produce.effect}</p><button type="button" className="alpha-recommended" aria-pressed={picked===optionKey(produce)} onClick={()=>setPicked(optionKey(produce))}>Escolher produzir</button></article>}
    {groups.map(([title,list])=><details key={title}><summary>{title} ({list.filter(o=>o.blocked===null).length} disponíveis)</summary><div className="alpha-urban-list">{list.length?list.map(o=><Pick key={optionKey(o)} o={o}/>):<p>Nenhuma opção agora.</p>}</div></details>)}
    {selected&&<article className="alpha-urban-detail" aria-live="polite"><h4>{optionTitle(selected)}</h4><p><strong>Custo:</strong> {costText(selected.cost)}</p><p><strong>Efeito:</strong> {selected.effect}</p>{selected.action==='RECRUIT'&&recruitMax>1&&<label className="alpha-recruit-count"><strong>Quantidade:</strong> <select value={recruitCount} onChange={e=>setCount(Number(e.target.value))} aria-label="Quantidade de peças">{Array.from({length:recruitMax},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select> <small>até {recruitMax} nesta ativação (Capacidade, distrito Militar, governo; 1 Soldado por peça)</small></label>}{selected.action==='MOVE_CAPITAL'&&<p className="alpha-hint">Custa {game.government.current.government==='MONARCHY'?'2 Ordens':'1 Ordem'} Cidade{game.government.current.government==='MONARCHY'?' (limitação da Monarquia)':''}.</p>}<p><strong>Ações planejáveis da cidade:</strong> {left}</p>{reason?<p className="alpha-warning" role="alert"><strong>Indisponível:</strong> {reason}</p>:<p><strong>Requisitos:</strong> atendidos.</p>}<button type="button" className="alpha-recommended" disabled={locked||reason!==null} onClick={()=>{void send({type:'URBAN_ACTION',cityId,action:selected.action,...(selected.build?{build:selected.build}:{}),...(selected.unit?{unit:selected.unit}:{}),...(selected.action==='RECRUIT'&&recruitCount>1?{count:recruitCount}:{}),...(selected.advancementId?{advancementId:selected.advancementId}:{})});setPicked(null);setCount(1);}}>Planejar ação urbana</button></article>}</>}
  </section>;
}
export function AlphaInstitutions({game,locked,send,section,cityId}:Panel&{section:'research'|'era';cityId:string|null}){
  const [search,setSearch]=useState(''),[domain,setDomain]=useState('all');
  const identity=CIVILIZATIONS.find(c=>c.id===game.self.civilization);
  if(section==='research')return <section className="alpha-panel"><header><p className="eyebrow">TEIA CIVILIZACIONAL</p><h2>Ideias que transformam instituições</h2><div className="alpha-form-row"><label>Buscar avanço<input value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Domínio<select value={domain} onChange={e=>setDomain(e.target.value)}><option value="all">Todos</option>{WebDomainSchema.options.map(d=><option key={d} value={d}>{WEB_DOMAIN_NAMES[d]}</option>)}</select></label></div></header><div className="alpha-research-grid">{ADVANCEMENTS.filter(a=>(domain==='all'||a.domain===domain)&&a.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).map(a=><article className={`alpha-card ${game.self.research.includes(a.id)?'is-selected':''}`} key={a.id}><small>{WEB_DOMAIN_NAMES[a.domain]} · {text(a.era)}{a.convergence?' · Convergência':''}{a.pair?' · escolha OU':''}{a.milestone?' · ★':''}</small><h3>{a.name}</h3><p>{a.description}</p><Effect effect={a.effect}/><p>{a.prerequisites.length?`Requer: ${a.prerequisites.map(id=>ADVANCEMENTS.find(n=>n.id===id)!.name).join('; ')}`:'Sem pré-requisitos de pesquisa.'}</p>{a.excludes.length>0&&<p>Exclui: {a.excludes.map(id=>ADVANCEMENTS.find(n=>n.id===id)!.name).join('; ')}</p>}{(()=>{const done=game.self.research.includes(a.id),opt=game.urban.research.find(o=>o.advancementId===a.id),why=done?null:cityActionGate(game,cityId,'RESEARCH')??(opt?opt.blocked:'Requer uma era posterior.');return <><p>Custo: {costText(opt?.cost??game.costs.advancements[a.id]!)}</p>{why&&<small role="note">{why}</small>}<button disabled={locked||done||why!==null||!cityId} onClick={()=>void send({type:'URBAN_ACTION',cityId,action:'RESEARCH',advancementId:a.id})}>{done?'Pesquisado':'Pesquisar (ação urbana)'}</button></>;})()}</article>)}</div><h2 style={{marginTop:16}}>Herança da civilização</h2><p className="alpha-hint">Três avanços só seus, fora da Teia universal: cada um pende de um avanço universal, tem Era mínima e custa Conhecimento mais um recurso.</p><div className="alpha-research-grid">{heritageOf(game.self.civilization).map(h=>{const done=game.self.research.includes(h.id),opt=game.urban.research.find(o=>o.advancementId===h.id),why=done?null:cityActionGate(game,cityId,'RESEARCH')??(opt?opt.blocked:'Requer uma Era posterior.');return <article className={`alpha-card ${done?'is-selected':''}`} key={h.id}><small>Herança · {text(h.era)}{h.status==='PLANNED'?' · efeito planejado':''}</small><h3>{h.name}</h3><p>{h.effect}</p><p>Requer: {ADVANCEMENTS.find(n=>n.id===h.prerequisite)?.name}</p><p>Custo: {costText(opt?.cost??game.costs.advancements[h.id]!)}</p>{why&&<small role="note">{why}</small>}<button disabled={locked||done||why!==null||!cityId} onClick={()=>void send({type:'URBAN_ACTION',cityId,action:'RESEARCH',advancementId:h.id})}>{done?'Pesquisado':'Pesquisar (ação urbana)'}</button></article>;})}</div></section>;
  return <section className="alpha-panel"><p className="eyebrow">TRAJETÓRIA CIVILIZACIONAL</p><h2>{text(game.self.era)}</h2><ol className="alpha-era-track">{AlphaEraSchema.options.map((era,i)=><li key={era} aria-current={game.self.era===era?'step':undefined}><b>{i+1}</b>{text(era)}</li>)}</ol>{game.milestones.next&&<article className="alpha-card"><h3>Próxima era: {text(game.milestones.next)}</h3><p>As Eras passam pelo calendário: {game.milestones.roundsPerEra} rodadas cada. Faltam {game.milestones.roundsUntilNext} rodada(s). Marcos abaixo são só referência de progresso.</p><ul>{game.milestones.criteria.map(c=><li key={c.key}>{text(c.key)}: {c.current} / {c.minimum}{c.met?' · Concluído':' · Pendente'}</li>)}</ul></article>}
    {game.self.pendingChoices.length>0&&<article className="alpha-card alpha-choices" aria-label="Decisões pendentes">{game.self.pendingChoices.map(choice=><div key={choice.id} className="alpha-choice"><small>{choice.source==='REPERCUSSION'?'Repercussão':choice.source==='ENCOUNTER'?'Encontro':'Pulso'}</small><h3>{choice.title}</h3><p>{choice.text}</p>{choice.options.map(option=><button key={option.id} disabled={locked} onClick={()=>void send({type:'RESOLVE_CHOICE',choiceId:choice.id,optionId:option.id})}>{option.label}</button>)}</div>)}</article>}
    {(()=>{const leader=LEADERS.find(l=>l.id===game.self.leader?.leaderId);if(!leader)return null;const used=game.self.leader!.eraAbilityUsed,why=used?'A habilidade do líder já foi usada nesta Era.':game.phase!=='PLANNING'?'Disponível na fase Planejamento.':game.self.ready?'Você já confirmou esta fase.':game.leaderBlock;return <article className="alpha-card alpha-leader" aria-label="Líder da civilização"><div className="alpha-leader-head"><span className="alpha-leader-avatar" aria-hidden="true">{leader.symbol}</span><div><small>Líder da civilização</small><h3>{leader.name}</h3><p>{leader.title}</p></div></div><h4>Passiva · {leader.passiveAbility.name}</h4><p>{leader.passiveAbility.description}</p><h4>Habilidade da Era · {leader.eraAbility.name}</h4><p>{leader.eraAbility.description}</p><p role="status"><strong>{used?'Usada nesta Era':'Disponível'}</strong></p>{why&&!used&&<small role="note">{why}</small>}<button disabled={locked||why!==null} onClick={()=>void send({type:'LEADER_ABILITY'})}>Usar habilidade do líder</button></article>;})()}
    {(()=>{const kit=civilizationKit(game.self.civilization);if(!kit)return null;const line=(title:string,entry:{text:string;status:string})=><li key={title}><b>{title}</b> {entry.text}{entry.status==='PLANNED'&&<em className="alpha-kit-planned"> · planejado</em>}</li>;return <article className="alpha-card" aria-label="Kit da civilização"><small>KIT DA CIVILIZAÇÃO</small><h3>{kit.name}</h3><ul className="alpha-civ-facts">{line('Traço',kit.trait)}{line('Herança',kit.heritage)}{line(kit.signature.kind==='UNIT'?`Peça: ${kit.signature.name}`:`Estrutura: ${kit.signature.name}`,kit.signature.item)}{line('Limitação',kit.limitation)}</ul><p className="alpha-hint">Cartas próprias: {kit.cards.map(card=>card.name).join(', ')}. Ficam na mão sobre o mapa e liberam nas Eras I, III e V.</p></article>;})()}
    {identity&&<article className="alpha-card"><h3>{identity.name}</h3><p>{identity.identity}</p>{identity.passives.map((e,i)=><div key={i}><small>Benefício por manutenção</small><Effect effect={e}/></div>)}<p className="alpha-hint">O único poder 1× por Era é o do Líder (canon V5.1a §14).</p></article>}
    <h2>Caminhos da Hegemonia</h2><p>Declare na Era VII, Ascensão. Atenda todos os requisitos e conserve-os por duas rodadas completas. A rodada de qualificação não conta.</p><div className="alpha-research-grid">{game.hegemony.map(path=><article className={`alpha-card ${game.self.hegemony?.path===path.path?'is-selected':''}`} key={path.path}><h3>{text(path.path)}</h3><ul>{path.requirements.map(r=><li key={r.metric}>{text(r.metric)}: {r.current} / {r.minimum}{r.met?' · Atendido':' · Pendente'}</li>)}</ul><button disabled={locked||game.self.hegemony!==null||game.self.era!=='ASCENSION'} onClick={()=>void send({type:'DECLARE_HEGEMONY',path:path.path})}>{game.self.hegemony?.path===path.path?'Caminho declarado':'Declarar caminho'}</button></article>)}</div><h3>Declarações públicas</h3>{game.declarations.map(d=><p key={d.playerId}>{game.players.find(p=>p.id===d.playerId)?.name} · {text(d.path!)} · {d.qualifiedSince?`Consolidação iniciada na rodada ${d.qualifiedSince}`:'Requisitos ainda não consolidados'}</p>)}</section>;
}

/** The first decision of the match. Shown on the board at start and in Cartas & Projetos until confirmed. */
export function AmbitionChooser({game,locked,send}:Panel){
  const [keep,setKeep]=useState<string[]>([]);
  const card=(id:string)=>ALPHA_CARDS.find(c=>c.id===id)!;
  return <><h3 id="alpha-ambitions-title">Escolha duas ambições secretas</h3><p>Conclua objetivos para ganhar Prestígio. Ambições não concedem Hegemonia diretamente. Ninguém mais vê a sua escolha.</p><div className="alpha-card-row">{game.self.ambitions.map(id=><label className={`alpha-card ${keep.includes(id)?'is-selected':''}`} key={id}><input type="checkbox" checked={keep.includes(id)} disabled={!keep.includes(id)&&keep.length>=2} onChange={e=>setKeep(old=>e.target.checked?[...old,id]:old.filter(x=>x!==id))}/><h4>{card(id).name}</h4><p>{text(card(id).objective!.metric)}: {card(id).objective!.threshold}</p><p>{card(id).objective!.prestige} Prestígio</p></label>)}</div><button className="primary" disabled={locked||keep.length!==2} onClick={()=>void send({type:'CHOOSE_AMBITIONS',cardIds:keep})}>Confirmar duas ambições</button></>;
}

export function AlphaCards({game,locked,send,cityId}:Panel&{cityId:string|null}){
  const [openHand,setOpenHand]=useState(true);
  const card=(id:string)=>ALPHA_CARDS.find(c=>c.id===id)!;
  return <section className="alpha-panel"><p className="eyebrow">CARTAS, CONSELHEIROS E OBRAS</p><h2>Instrumentos de uma civilização</h2>
    {!game.self.ambitionsChosen&&<section className="alpha-card"><AmbitionChooser game={game} locked={locked} send={send}/></section>}
    {game.self.ambitionsChosen&&<details><summary>Suas ambições secretas</summary>{game.self.ambitions.map(id=><article className="alpha-card" key={id}><h3>{card(id).name}</h3><p>{text(card(id).objective!.metric)}: {card(id).objective!.threshold} · {card(id).objective!.prestige} Prestígio</p><p>{game.self.completedAmbitions.includes(id)?'Concluída':'Em andamento'}</p></article>)}</details>}
    {game.worldEvent&&<article className="alpha-world-event alpha-card"><small>EVENTO MUNDIAL</small><h3>{card(game.worldEvent).name}</h3><Effect effect={card(game.worldEvent).effect}/><p>{card(game.worldEvent).reminder}</p><button disabled={locked||!game.worldDecisionPending} onClick={()=>void send({type:'WORLD_CHOICE',choice:'RESOURCE'})}>Receber recurso</button><button disabled={locked||!game.worldDecisionPending} onClick={()=>void send({type:'WORLD_CHOICE',choice:'PRESTIGE'})}>Receber 1 Prestígio</button></article>}
    <h3>Conselheiros · {game.self.advisors.length} / {game.rules.advisorLimit}</h3><div className="alpha-card-row">{[...game.self.advisors,...game.advisorMarket].map(id=><article className="alpha-card" key={id}><small>CONSELHEIRO</small><h3>{card(id).name}</h3><Effect effect={card(id).effect}/>{game.self.advisors.includes(id)?<p>Conselheiro ativo</p>:<><ResourceDisplay values={game.costs.advisor} compact/><button disabled={locked} onClick={()=>void send({type:'HIRE_ADVISOR',cardId:id})}>Contratar</button></>}</article>)}</div>
    <h3>Grandes Projetos</h3><p>Construção na cidade selecionada no mapa. Projetos são exclusivos no mundo.</p><div className="alpha-research-grid">{GREAT_PROJECTS.map(p=>{const completed=game.projects.find(g=>g.projectId===p.id);return <article className="alpha-card" key={p.id}><Piece kind="project"/><small>{text(p.era)} · {text(p.district)}</small><h3>{p.name}</h3><Effect effect={p.effect}/><ResourceDisplay values={game.costs.projects[p.id]!} compact/><p>{p.prestige} Prestígio</p>{completed?<p>Concluído por {game.players.find(player=>player.id===completed.ownerId)?.name}</p>:<button disabled={locked||!cityId} onClick={()=>void send({type:'BUILD_PROJECT',projectId:p.id,cityId})}>Construir projeto</button>}</article>;})}</div>
    <section className="alpha-hand"><button aria-expanded={openHand} onClick={()=>setOpenHand(!openHand)}>Sua mão · {game.self.hand.length} cartas {openHand?'−':'+'}</button>{openHand&&<div className="alpha-card-row">{game.self.hand.map(id=><article className="alpha-card" key={id}><small>ESTRATÉGIA · {text(card(id).timing)}</small><h3>{card(id).name}</h3><Effect effect={card(id).effect}/><p>{card(id).reminder}</p><button disabled={locked||card(id).timing!==game.view.phase} onClick={()=>void send({type:'PLAY_CARD',cardId:id})}>Jogar carta</button></article>)}</div>}</section>
  </section>;
}

const TREATY_HELP:Record<string,string>={
  TRADE_AGREEMENT:'Permite rotas comerciais entre as duas civilizações, inclusive pelo território do parceiro, desde que estejam em paz e sem embargo.',
  NON_AGGRESSION_PACT:'Compromisso de paz. Ao ser ativado, encerra uma guerra em curso entre as duas.',
  OPEN_BORDERS:'As peças de cada uma podem atravessar o território da outra.',
  DEFENSIVE_PACT:'Se uma das duas sofrer uma declaração de guerra, a outra entra na guerra contra o agressor.',
  ALLIANCE:'Fronteiras abertas, defesa mútua e fim de qualquer guerra entre as duas.',
  EMBARGO:'Bloqueia o comércio internacional entre as duas civilizações.',
};
/** Small resource offer in the seven resources. */
function DealInputs({title,value,onChange}:{title:string;value:AlphaResourcePool;onChange:(next:AlphaResourcePool)=>void}){
  return <fieldset className="alpha-deal"><legend>{title}</legend>{ALPHA_RESOURCE_KEYS.map(key=><label key={key}><span>{text(key)}</span><input type="number" min={0} max={999} value={value[key]} onChange={e=>onChange({...value,[key]:Math.max(0,Number(e.target.value)||0)})}/></label>)}</fieldset>;
}

const SEVEN=['food','wood','stone','metal','wealth','knowledge','influence'] as const;
type Seven=Record<(typeof SEVEN)[number],number>;
const noGoods=():Seven=>({food:0,wood:0,stone:0,metal:0,wealth:0,knowledge:0,influence:0});
const TRADE_KINDS:Record<string,{name:string;give:string;get:string|null;due:boolean;help:string}>={
  TRADE_INSTANT:{name:'Troca imediata',give:'Você entrega',get:'Você recebe',due:false,help:'Os dois lados trocam na hora em que a outra civilização aceitar.'},
  GIFT:{name:'Presente',give:'Você dá',get:null,due:false,help:'Entregue sem pedir nada em troca.'},
  FUTURE_PROMISE:{name:'Promessa futura',give:'Você entrega no prazo',get:'Você recebe agora',due:true,help:'Você recebe agora e paga até o prazo. Não pagar é calote: −2 Prestígio.'},
  LOAN:{name:'Empréstimo',give:'Você empresta agora',get:'Você recebe de volta no prazo',due:true,help:'Você entrega agora e recebe de volta até o prazo. Se não pagarem, quem deve perde 2 Prestígio.'},
};
function GoodsInputs({title,value,onChange}:{title:string;value:Seven;onChange:(next:Seven)=>void}){
  return <fieldset className="alpha-deal"><legend>{title}</legend>{SEVEN.map(key=><label key={key}><span>{text(key)}</span><input type="number" min={0} max={999} value={value[key]} onChange={e=>onChange({...value,[key]:Math.max(0,Number(e.target.value)||0)})}/></label>)}</fieldset>;
}
type TradeOffer=AlphaPlayerView['tradeOffers'][number];
/** "Ana entrega 3 Madeira e recebe 2 Conhecimento", worded for the offer's type. */
function offerText(game:AlphaPlayerView,offer:TradeOffer){
  const who=game.players.find(p=>p.id===offer.proposerId)?.name??'Alguém',due=offer.dueRound?` até a rodada ${offer.dueRound}`:'';
  const give=<ResourceDisplay values={offer.offer} compact/>,get=<ResourceDisplay values={offer.request} compact/>;
  return offer.type==='GIFT'?<>{who} dá {give}</>:offer.type==='TRADE_INSTANT'?<>{who} entrega {give} e recebe {get}</>:offer.type==='FUTURE_PROMISE'?<>{who} recebe {get} agora e entrega {give}{due}</>:<>{who} empresta {give} agora e recebe {get} de volta{due}</>;
}
function TradePanel({game,locked,send,otherId}:Panel&{otherId:string}){
  const [kind,setKind]=useState('TRADE_INSTANT'),[give,setGive]=useState(noGoods),[get,setGet]=useState(noGoods),[due,setDue]=useState(game.view.round+2);
  const spec=TRADE_KINDS[kind]!,self=game.self.playerId;
  const offers=game.tradeOffers.filter(o=>[o.proposerId,o.recipientId].includes(otherId as never));
  const lastRound=game.rules.roundLimit,dueChoices=Array.from({length:Math.max(0,lastRound-game.view.round)},(_,i)=>game.view.round+1+i);
  return <div className="alpha-trade"><h4>Troca de recursos</h4>
    {offers.filter(o=>o.status==='PROPOSED'&&o.recipientId===self).map(o=><div className="alpha-relation-proposal" key={o.id} role="group" aria-label="Oferta recebida"><div>{offerText(game,o)}.</div><button className="primary" disabled={locked} onClick={()=>void send({type:'RESPOND_TRADE',offerId:o.id,accept:true})}>Aceitar oferta</button><button disabled={locked} onClick={()=>void send({type:'RESPOND_TRADE',offerId:o.id,accept:false})}>Recusar</button></div>)}
    {offers.filter(o=>o.status==='PROPOSED'&&o.proposerId===self).map(o=><div className="alpha-hint" key={o.id}>Sua oferta aguarda resposta nesta rodada: {offerText(game,o)}.<button disabled={locked} onClick={()=>void send({type:'RESPOND_TRADE',offerId:o.id,accept:false})}>Retirar</button></div>)}
    {offers.filter(o=>o.status==='ACCEPTED').map(o=><div className="alpha-hint" key={o.id}>Em aberto: {offerText(game,o)}.</div>)}
    {offers.filter(o=>o.status==='DEFAULTED').slice(-2).map(o=><div className="alpha-warning" key={o.id}>Calote: {offerText(game,o)}.</div>)}
    <form onSubmit={e=>{e.preventDefault();void send({type:'PROPOSE_TRADE',recipientId:otherId,offerType:kind,offer:give,request:spec.get?get:noGoods(),treatyTerms:[],dueRound:spec.due?due:null}).then(ok=>{if(ok){setGive(noGoods());setGet(noGoods());}});}}>
      <label>Tipo de oferta<select value={kind} onChange={e=>setKind(e.target.value)}>{Object.entries(TRADE_KINDS).map(([key,entry])=><option key={key} value={key}>{entry.name}</option>)}</select></label>
      <p className="alpha-treaty-help">{spec.help} Ofertas valem até o fim da rodada.</p>
      <div className="alpha-form-row"><GoodsInputs title={spec.give} value={give} onChange={setGive}/>{spec.get&&<GoodsInputs title={spec.get} value={get} onChange={setGet}/>}</div>
      {spec.due&&<label>Prazo<select value={due} onChange={e=>setDue(Number(e.target.value))}>{dueChoices.map(r=><option key={r} value={r}>Rodada {r}</option>)}</select></label>}
      <button disabled={locked||(spec.due&&dueChoices.length===0)}>Enviar oferta · 1 ação</button>
    </form></div>;
}

/** One card per other civilization: relation, agreements, pending proposals and what can be decided now. */
function RelationCard({game,locked,send,otherId}:Panel&{otherId:AlphaPlayerView['self']['playerId']}){
  const [kind,setKind]=useState('TRADE_AGREEMENT'),[withDeal,setWithDeal]=useState(false),[give,setGive]=useState(emptyAlphaResourcePool()),[receive,setReceive]=useState(emptyAlphaResourcePool()),[confirmWar,setConfirmWar]=useState(false);
  const self=game.self.playerId,name=game.players.find(p=>p.id===otherId)?.name??'Civilização';
  const contact=game.self.contacts.includes(otherId),war=game.wars.some(pair=>pair.includes(otherId));
  const between=game.treaties.filter(t=>[t.proposerId,t.recipientId].includes(otherId));
  const active=between.filter(t=>t.status==='ACTIVE'),incoming=between.filter(t=>t.status==='PROPOSED'&&t.recipientId===self),outgoing=between.filter(t=>['PROPOSED','ACCEPTED'].includes(t.status)&&t.proposerId===self);
  const planned=game.self.plannedActions.filter(a=>(a.type==='PROPOSE_TREATY'&&a.recipientId===otherId)||(a.type==='DECLARE_WAR'&&a.targetId===otherId));
  const status=!contact?'Sem contato':war?'Em guerra':active.length?'Em paz · com acordos':'Em paz';
  return <article className={`alpha-card alpha-relation ${war?'is-war':''}`} aria-label={`Relação com ${name}`}>
    <header><h3>{name}<small>{CIVILIZATIONS.find(c=>c.id===game.players.find(p=>p.id===otherId)?.civilization)?.name}</small></h3><span className={`alpha-relation-status ${war?'war':contact?'peace':'unknown'}`}>{status}</span></header>
    {!contact&&<p>Ainda não encontrada. Avistar uma peça ou cidade desta civilização abre a negociação.</p>}
    {active.length>0&&<ul className="alpha-relation-list">{active.map(t=><li key={t.id}><b>{text(t.type)}</b> · até a rodada {t.expiresRound}<button disabled={locked} onClick={()=>void send({type:'END_TREATY',treatyId:t.id})}>Encerrar (−2 Prestígio)</button></li>)}</ul>}
    {incoming.map(t=><div className="alpha-relation-proposal" key={t.id} role="group" aria-label={`Proposta de ${name}`}><p><b>{name} propõe {text(t.type)}</b>. {TREATY_HELP[t.type]}</p>{(Object.values(t.deal.give).some(Boolean)||Object.values(t.deal.receive).some(Boolean))&&<div className="alpha-deal-summary">Você recebe <ResourceDisplay values={t.deal.give} compact/> e entrega <ResourceDisplay values={t.deal.receive} compact/></div>}<button className="primary" disabled={locked} onClick={()=>void send({type:'RESPOND_TREATY',treatyId:t.id,accept:true})}>Aceitar</button><button disabled={locked} onClick={()=>void send({type:'RESPOND_TREATY',treatyId:t.id,accept:false})}>Recusar</button></div>)}
    {outgoing.map(t=><p key={t.id} className="alpha-hint">Sua proposta de {text(t.type)} {t.status==='ACCEPTED'?'foi aceita e entra em vigor na resolução.':'aguarda resposta.'}{t.status==='PROPOSED'&&<button disabled={locked} onClick={()=>void send({type:'END_TREATY',treatyId:t.id})}>Retirar</button>}</p>)}
    {planned.map(a=><p key={a.id} className="alpha-hint">Planejado nesta rodada: {a.type==='PROPOSE_TREATY'?`proposta de ${text(a.treaty)}`:'declaração de guerra'}.<button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:a.id})}>Cancelar</button></p>)}
    {contact&&<div className="alpha-relation-actions">
      <form onSubmit={e=>{e.preventDefault();void send({type:'PROPOSE_TREATY',recipientId:otherId,treaty:kind,deal:withDeal?{give,receive}:{give:emptyAlphaResourcePool(),receive:emptyAlphaResourcePool()}});}}>
        <label>Propor acordo<select value={kind} onChange={e=>setKind(e.target.value)}>{TreatyTypeSchema.options.map(t=><option key={t} value={t}>{text(t)}</option>)}</select></label>
        <p className="alpha-treaty-help">{TREATY_HELP[kind]} Dura {game.rules.treatyDuration} rodadas depois de aceito.</p>
        <label className="alpha-inline-check"><input type="checkbox" checked={withDeal} onChange={e=>setWithDeal(e.target.checked)}/> Incluir troca de recursos</label>
        {withDeal&&<div className="alpha-form-row"><DealInputs title="Você oferece" value={give} onChange={setGive}/><DealInputs title="Você pede" value={receive} onChange={setReceive}/></div>}
        <button className="primary" disabled={locked}>Enviar proposta · 1 ação</button>
      </form>
      {!war&&!planned.some(a=>a.type==='DECLARE_WAR')&&(confirmWar?<div className="alpha-war-confirm" role="alert"><p>Declarar guerra a {name} encerra os acordos entre vocês (−2 Prestígio por acordo) e chama os aliados defensivos de {name}.</p><button className="danger" disabled={locked} onClick={()=>void send({type:'DECLARE_WAR',targetId:otherId}).then(()=>setConfirmWar(false))}>Confirmar declaração de guerra</button><button onClick={()=>setConfirmWar(false)}>Manter a paz</button></div>
        :<button className="alpha-war-button" disabled={locked} onClick={()=>setConfirmWar(true)}>Declarar guerra…</button>)}
      {!war&&<TradePanel game={game} locked={locked} send={send} otherId={otherId}/>}
      {war&&<p className="alpha-hint">Em guerra: ataque com peças militares adjacentes pelo painel Militar. Um pacto de não agressão ou aliança aceito encerra a guerra.</p>}
    </div>}
  </article>;
}

export function AlphaDiplomacy({game,locked,send}:Panel){
  const [from,setFrom]=useState(game.view.player.civilization.cities[0]?.id??''),[to,setTo]=useState('');
  const cities=[...game.view.player.civilization.cities,...game.view.visibleCities];
  const others=game.players.filter(p=>p.id!==game.self.playerId).sort((a,b)=>Number(game.self.contacts.includes(b.id))-Number(game.self.contacts.includes(a.id)));
  return <section className="alpha-panel"><p className="eyebrow">MESA DE NEGOCIAÇÃO</p><h2>Diplomacia</h2><p>Propostas e declarações são planejadas como ações principais e resolvidas na fase Diplomacia. A resposta a uma proposta é livre.</p>
    <div className="alpha-relations">{others.map(p=><RelationCard key={p.id} game={game} locked={locked} send={send} otherId={p.id as AlphaPlayerView['self']['playerId']}/>)}</div>
    <h3>Rotas comerciais</h3><form className="alpha-card" onSubmit={e=>{e.preventDefault();void send({type:'QUEUE_ORDER',order:{id:`trade-${game.version}`,type:'TRADE',fromCityId:from,toCityId:to}});}}><div className="alpha-form-row"><label>Origem<select value={from} onChange={e=>setFrom(e.target.value)}>{game.view.player.civilization.cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Destino visível<select value={to} onChange={e=>setTo(e.target.value)}><option value="">Selecione uma cidade</option>{cities.filter(c=>c.id!==from).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><button disabled={locked||!to}>Reservar rota</button><p>Requer caminho conhecido. Rota internacional requer acordo comercial ativo (que abre o território do parceiro à rota) e paz; guerra ou embargo a suspendem.</p></form>{game.routes.map(r=><p key={r.id}>{cities.find(c=>c.id===r.fromCityId)?.name??'Origem'} — {cities.find(c=>c.id===r.toCityId)?.name??'Destino conhecido'} · {r.suspended?'Suspensa':'Ativa'}</p>)}
  </section>;
}

type RoundReport=AlphaPlayerView['roundReports'][number];
/** Every ledger line of the round, gains with + and outflows with −, so opening plus the lines equals closing. Empty lines are skipped. */
function reportRows(report:RoundReport):[string,RoundReport['opening'],number][]{
  const lines:[string,RoundReport['opening'],number][]=[['Produção das cidades',report.production,1],['Mineração',report.mining,1],['Instituições',report.institutions,1],['Comércio',report.trade,1],['Eventos e outros ganhos',report.other,1],
    ['Gastos com ações',report.expenses,-1],['Manutenção (população e peças)',report.upkeepPaid,-1],['Perdas',report.losses,-1],['Descartado (armazém cheio)',report.discarded,-1]];
  return [['Estoque inicial',report.opening,0],...lines.filter(([,pool])=>RESOURCE_KEYS.some(key=>pool[key]!==0)),['Estoque final',report.closing,0]];
}
export function AlphaReports({game}:{game:AlphaPlayerView}){
  return <section className="alpha-panel"><p className="eyebrow">CRÔNICAS DA CIVILIZAÇÃO</p><h2>Relatórios e conflitos</h2>{[...game.roundReports].reverse().map(report=><details key={report.round} open={report.round===game.view.round}><summary>Manutenção · Rodada {report.round}</summary><div className="table-scroll"><table><thead><tr><th>Etapa</th>{RESOURCE_KEYS.map(k=><th key={k}>{k==='materials'?'Madeira + Pedra + Metal':text(k)}</th>)}</tr></thead><tbody>{reportRows(report).map(([name,pool,sign])=><tr key={name} className={sign<0?'is-outflow':sign===0?'is-total':''}><th>{name}</th>{RESOURCE_KEYS.map(k=><td key={k}>{sign<0&&pool[k]>0?'−':sign>0&&pool[k]>0?'+':''}{pool[k]}</td>)}</tr>)}</tbody></table></div><p>Manutenção de alimento (população e peças): {report.upkeepPaid.food} pagos de {report.upkeepRequired.food} necessários.{report.upkeepPaid.food<report.upkeepRequired.food?' Faltou alimento: a estabilidade caiu.':''}</p><p>Administração: carga {report.administrativeLoad} / capacidade {report.administrativeCapacity}</p>{report.cities.map(c=><p key={c.cityId}>{game.view.player.civilization.cities.find(city=>city.id===c.cityId)?.name??'Cidade'} · População {c.populationBefore} → {c.populationAfter} · Estabilidade {c.stabilityBefore} → {c.stabilityAfter}</p>)}</details>)}
    <h3>Conflitos</h3>{[...game.battles].reverse().map(b=><BattleReport key={b.id} battle={b} players={game.players}/>)}<h3>Acontecimentos autorizados</h3><ol className="alpha-feed">{[...game.events].reverse().slice(0,60).map(e=><li key={e.id}><small>Rodada {e.round}</small> {e.message}</li>)}</ol></section>;
}
