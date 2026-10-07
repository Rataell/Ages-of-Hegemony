'use client';
import { useState } from 'react';
import { ADVANCEMENTS, ALPHA_CARDS, AlphaEraSchema, WEB_DOMAIN_NAMES, WebDomainSchema, heritageOf, civilizationKit, civilizationDisplayName, LEGACY_WORK_IDENTITY, ALPHA_RESOURCE_KEYS, RESOURCE_KEYS, TreatyTypeSchema, alphaGainOf, emptyAlphaResourcePool, type AlphaResourcePool, type AlphaEffect } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { ResourceDisplay } from '../play/resource-display';
import { alphaLabel as text } from './alpha-copy';
import { BattleReport } from './alpha-combat';
import type { AlphaSend } from './alpha-board';
import { Pages, type BookPage } from './alpha-details';
import { AlphaCard, CivilizationCard, FigureCard, StatusBadge, WorkSteps, legacyWorkEffectText, workArtOf } from './alpha-card';
type Panel={game:AlphaPlayerView;locked:boolean;send:AlphaSend};
/** A production effect is shown as what it credits in the seven resources (legacy "materials" become Madeira and Pedra). */
function Effect({effect}:{effect:AlphaEffect|null}){if(!effect)return null;const gains=effect.kind==='PRODUCTION'?Object.entries(alphaGainOf(effect.resource,effect.amount)).filter(([,n])=>n>0).map(([key,n])=>`+${n} ${text(key)}`).join(', '):`+${effect.amount} ${text(effect.kind)}`;return <p className="alpha-effect">{gains}</p>;}

export const CITY_LEVEL:Record<string,string>={OUTPOST:'Posto',HAMLET:'Aldeia',VILLAGE:'Vila',CITY:'Cidade',GREAT_CITY:'Grande Cidade',METROPOLIS:'Metrópole',IMPERIAL_METROPOLIS:'Metrópole Imperial'};
export const MOOD_BAND:Record<string,string>={REVOLT:'Revolta',SHAKEN:'Abalada',STABLE:'Estável',PROSPEROUS:'Próspera'};
export const FORTIFICATION:Record<string,string>={NONE:'nenhuma',PALISADE:'paliçada',STONE_WALL:'muralha de pedra',FORTRESS:'fortaleza',BASTION:'bastião',CITADEL:'cidadela'};
const RESOURCE_TEXT:Record<string,string>={food:'Alimentos',wood:'Madeira',stone:'Pedra',metal:'Metal',wealth:'Riqueza',knowledge:'Conhecimento',influence:'Influência', culture: 'Cultura'};
export const costText=(cost:Record<string,number>)=>{const parts=Object.entries(cost).filter(([,amount])=>amount>0).map(([key,amount])=>`${amount} ${RESOURCE_TEXT[key]??key}`);return parts.length?parts.join(' · '):'Sem custo';};
type UrbanOption=AlphaPlayerView['urban']['research'][number];
const optionKey=(o:UrbanOption)=>JSON.stringify([o.action,o.build??null,o.unit??null,o.advancementId??null]);
const optionTitle=(o:UrbanOption)=>o.build?.kind==='DISTRICT'?`Distrito ${text(o.build.district)}`:o.build?.kind==='BUILDING'?`Edifício ${text(o.build.building)}`:o.build?.kind==='FORTIFICATION'?'Fortificação':o.unit?`Recrutar ${text(o.unit)}`:o.advancementId?ADVANCEMENTS.find(a=>a.id===o.advancementId)?.name??'Pesquisa':text(o.action);
/** Why the selected city cannot act now (phase, confirmation, actions left, occupation), for options that are not city-specific. */
export function cityActionGate(game:AlphaPlayerView,cityId:string|null,action:string):string|null{
  if(game.phase!=='PLANNING')return 'Disponível apenas no Planejamento.';
  if(game.self.ready)return 'Você já confirmou esta fase.';
  const state=cityId?game.cityStates.find(c=>c.cityId===cityId):undefined;
  if(!state)return 'Selecione uma cidade sua no mapa.';
  // Canon §2 (E-1): pesquisar é a Ordem Avanço; a cidade só a carrega e não gasta ativação.
  if(action==='RESEARCH')return null;
  if(state.status==='OCCUPIED'&&action!=='CIVIC_ACTION')return 'Cidade ocupada: só a Ação cívica está disponível.';
  if(state.plannedUrbanActions>=game.rules.balance.cityActions)return 'Esta cidade já possui sua ação planejada nesta rodada.';
  return null;
}
/** The only place a city acts: one action per city per round. PRODUCE is a choice, not a default. */
export function AlphaUrban({game,locked,send,cityId}:Panel&{cityId:string}){
  const [picked,setPicked]=useState<string|null>(null),[count,setCount]=useState(1),[group,setGroup]=useState('Produzir'),[pageNo,setPageNo]=useState(0);
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
  const tabs:[string,UrbanOption[]][]=[...(state.status!=='OCCUPIED'?[['Produzir',[produce]] as [string,UrbanOption[]]]:[]),...groups.map(([title,list])=>[title.startsWith('Governar')?'Cívica':title,list] as [string,UrbanOption[]])];
  const activeGroup=tabs.some(([t])=>t===group)?group:tabs[0]![0],list=tabs.find(([t])=>t===activeGroup)![1],PAGE=8,pages=Math.max(1,Math.ceil(list.length/PAGE)),at=Math.min(pageNo,pages-1);
  const Pick=({o}:{o:UrbanOption})=><button type="button" className="alpha-urban-pick" aria-pressed={picked===optionKey(o)} data-blocked={o.blocked!==null} onClick={()=>setPicked(optionKey(o))}>{optionTitle(o)}</button>;
  if(selected)return <section className="alpha-panel alpha-urban is-detail" aria-label="Ações urbanas"><button type="button" className="aoh-btn is-sm is-ghost alpha-back" onClick={()=>{setPicked(null);setCount(1);}}>← Voltar às ações</button>
    <article className="alpha-urban-detail" aria-live="polite"><h4>{optionTitle(selected)}</h4><p><strong>Custo:</strong> {costText(selected.cost)}</p><p><strong>Efeito:</strong> {selected.effect}</p>{selected.action==='RECRUIT'&&recruitMax>1&&<label className="alpha-recruit-count"><strong>Quantidade:</strong> <select value={recruitCount} onChange={e=>setCount(Number(e.target.value))} aria-label="Quantidade de peças">{Array.from({length:recruitMax},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select> <small>até {recruitMax} (Capacidade, distrito Militar, governo; 1 Soldado por peça)</small></label>}{selected.action==='MOVE_CAPITAL'&&<p className="alpha-hint">Custa {game.government.current.government==='MONARCHY'?'2 Ordens':'1 Ordem'} Cidade{game.government.current.government==='MONARCHY'?' (limitação da Monarquia)':''}.</p>}<p><strong>Ações planejáveis da cidade:</strong> {left}</p>{reason?<p className="alpha-warning" role="alert"><strong>Indisponível:</strong> {reason}</p>:<p><strong>Requisitos:</strong> atendidos.</p>}<button type="button" className="alpha-recommended" disabled={locked||reason!==null} onClick={()=>{void send({type:'URBAN_ACTION',cityId,action:selected.action,...(selected.build?{build:selected.build}:{}),...(selected.unit?{unit:selected.unit}:{}),...(selected.action==='RECRUIT'&&recruitCount>1?{count:recruitCount}:{}),...(selected.advancementId?{advancementId:selected.advancementId}:{})});setPicked(null);setCount(1);}}>Planejar ação urbana</button></article></section>;
  return <section className="alpha-panel alpha-urban" aria-label="Ações urbanas">
    <p role="status" className="alpha-line">{acting?'':'Ações da cidade são planejadas no Planejamento · '}Ações planejáveis da cidade: <strong>{left}</strong> / {game.rules.balance.cityActions}{state.status==='OCCUPIED'?` · Ocupada, integração ${state.integration}%`:''}</p>
    {plannedHere&&<article className="alpha-produce alpha-urban-planned" aria-label="Ação planejada"><p><b>Nesta rodada: {plannedOption?optionTitle(plannedOption):text(plannedHere.action)}</b> · resolvida quando todos confirmarem.</p><button type="button" disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:plannedHere.id})}>Trocar ação</button></article>}
    {!(plannedHere&&left===0)&&<>
      <div className="alpha-seg is-sub" role="tablist" aria-label="Tipo de ação">{tabs.map(([title,items])=><button key={title} type="button" role="tab" aria-selected={activeGroup===title} onClick={()=>{setGroup(title);setPageNo(0);}}>{title} <small>{items.filter(o=>o.blocked===null).length}</small></button>)}</div>
      <div className="alpha-urban-list" key={`${activeGroup}-${at}`}>{list.length?list.slice(at*PAGE,at*PAGE+PAGE).map(o=>activeGroup==='Produzir'?<article key={optionKey(o)} className="alpha-produce"><p>{o.effect}</p><button type="button" className="alpha-recommended" aria-pressed={picked===optionKey(o)} onClick={()=>setPicked(optionKey(o))}>Escolher produzir</button></article>:<Pick key={optionKey(o)} o={o}/>):<p className="alpha-line is-muted">Nenhuma opção agora.</p>}</div>
      {pages>1&&<div className="alpha-pager"><button type="button" aria-label="Página anterior" disabled={at===0} onClick={()=>setPageNo(at-1)}>‹</button><span>{at+1} / {pages}</span><button type="button" aria-label="Próxima página" disabled={at>=pages-1} onClick={()=>setPageNo(at+1)}>›</button></div>}
    </>}
  </section>;
}
export function AlphaInstitutions({game,locked,send,section,cityId}:Panel&{section:'research'|'era';cityId:string|null}){
  const [search,setSearch]=useState(''),[domain,setDomain]=useState('all');
  if(section==='research')return <section className="alpha-panel"><header><p className="eyebrow">TEIA CIVILIZACIONAL</p><h2>Ideias que transformam instituições</h2><div className="alpha-form-row"><label>Buscar avanço<input value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Domínio<select value={domain} onChange={e=>setDomain(e.target.value)}><option value="all">Todos</option>{WebDomainSchema.options.map(d=><option key={d} value={d}>{WEB_DOMAIN_NAMES[d]}</option>)}</select></label></div></header><div className="alpha-research-grid">{ADVANCEMENTS.filter(a=>(domain==='all'||a.domain===domain)&&a.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).map(a=><article className={`alpha-card ${game.self.research.includes(a.id)?'is-selected':''}`} key={a.id}><small>{WEB_DOMAIN_NAMES[a.domain]} · {text(a.era)}{a.convergence?' · Convergência':''}{a.pair?' · escolha OU':''}{a.milestone?' · ★':''}</small><h3>{a.name}</h3><p>{a.description}</p><Effect effect={a.effect}/><p>{a.prerequisites.length?`Requer: ${a.prerequisites.map(id=>ADVANCEMENTS.find(n=>n.id===id)!.name).join('; ')}`:'Sem pré-requisitos de pesquisa.'}</p>{a.excludes.length>0&&<p>Exclui: {a.excludes.map(id=>ADVANCEMENTS.find(n=>n.id===id)!.name).join('; ')}</p>}{(()=>{const done=game.self.research.includes(a.id),opt=game.urban.research.find(o=>o.advancementId===a.id),why=done?null:cityActionGate(game,cityId,'RESEARCH')??(opt?opt.blocked:'Requer uma era posterior.');return <><p>Custo: {costText(opt?.cost??game.costs.advancements[a.id]!)}</p>{why&&<small role="note">{why}</small>}<button disabled={locked||done||why!==null||!cityId} onClick={()=>void send({type:'URBAN_ACTION',cityId,action:'RESEARCH',advancementId:a.id})}>{done?'Pesquisado':'Pesquisar (ação urbana)'}</button></>;})()}</article>)}</div><h2 style={{marginTop:16}}>Herança da civilização</h2><p className="alpha-hint">Três avanços só seus, fora da Teia universal: cada um pende de um avanço universal, tem Era mínima e custa Conhecimento mais um recurso.</p><div className="alpha-research-grid">{heritageOf(game.self.civilization).map(h=>{const done=game.self.research.includes(h.id),opt=game.urban.research.find(o=>o.advancementId===h.id),why=done?null:cityActionGate(game,cityId,'RESEARCH')??(opt?opt.blocked:'Requer uma Era posterior.');return <article className={`alpha-card ${done?'is-selected':''}`} key={h.id}><small>Herança · {text(h.era)}</small><StatusBadge status={h.status} feminine/><h3>{h.name}</h3><p>{h.effect}</p><p>Requer: {ADVANCEMENTS.find(n=>n.id===h.prerequisite)?.name}</p><p>Custo: {costText(opt?.cost??game.costs.advancements[h.id]!)}</p>{why&&<small role="note">{why}</small>}<button disabled={locked||done||why!==null||!cityId} onClick={()=>void send({type:'URBAN_ACTION',cityId,action:'RESEARCH',advancementId:h.id})}>{done?'Pesquisado':'Pesquisar (ação urbana)'}</button></article>;})}</div></section>;
  const pages:BookPage[]=[
    {key:'path',title:'Trajetória',alert:game.self.pendingChoices.length>0,node:<><ol className="alpha-era-track">{AlphaEraSchema.options.map((era,i)=><li key={era} aria-current={game.self.era===era?'step':undefined}><b>{i+1}</b>{text(era)}</li>)}</ol>{game.milestones.next&&<article className="alpha-card"><h3>Próxima era: {text(game.milestones.next)}</h3><p className="alpha-line">As Eras passam pelo calendário: {game.milestones.roundsPerEra} rodadas cada. Faltam {game.milestones.roundsUntilNext} rodada(s). Marcos abaixo são só referência.</p><ul className="alpha-criteria">{game.milestones.criteria.map(c=><li key={c.key}>{text(c.key)}: {c.current} / {c.minimum}{c.met?' · Concluído':' · Pendente'}</li>)}</ul></article>}
      {game.self.pendingChoices.length>0&&<article className="alpha-card alpha-choices" aria-label="Decisões pendentes">{game.self.pendingChoices.map(choice=><div key={choice.id} className="alpha-choice"><small>{choice.source==='REPERCUSSION'?'Repercussão':choice.source==='ENCOUNTER'?'Encontro':'Pulso'}</small><h3>{choice.title}</h3><p>{choice.text}</p>{choice.options.map(option=><button key={option.id} disabled={locked} onClick={()=>void send({type:'RESOLVE_CHOICE',choiceId:choice.id,optionId:option.id})}>{option.label}</button>)}</div>)}</article>}</>,scroll:true},
    {key:'leader',title:'Figura',node:(()=>{const figureId=game.self.leader?.leaderId;if(!figureId)return <p className="alpha-line is-muted">Sem Figura.</p>;const used=game.self.leader!.eraAbilityUsed,why=used?'O Poder da Figura já foi usado nesta Era.':game.phase!=='PLANNING'?'Disponível na fase Planejamento.':game.self.ready?'Você já confirmou esta fase.':game.leaderBlock;return <div className="alpha-gcard-solo"><FigureCard figureId={figureId} used={used}>{why&&!used&&<small role="note">{why}</small>}<button disabled={locked||why!==null} onClick={()=>void send({type:'LEADER_ABILITY'})}>Usar o Poder da Figura</button></FigureCard></div>;})()},
    {key:'kit',title:'Civilização',node:<div className="alpha-gcard-solo">{civilizationKit(game.self.civilization)?<CivilizationCard chassis={game.self.civilization??''} heritage/>:<p className="alpha-line is-muted">Sem civilização.</p>}{(()=>{const kit=civilizationKit(game.self.civilization);return kit&&kit.cards.length?<p className="alpha-line is-muted">Cartas próprias: {kit.cards.map(card=>card.name).join(', ')}. Ficam na mão e liberam nas Eras I, IV e VII.</p>:null;})()}<p className="alpha-line is-muted">O único poder 1× por Era é o da Figura.</p></div>,scroll:true},
    {key:'hegemony',title:'Hegemonia',node:<><p className="alpha-line">Declare na Era VII, Ascensão. Atenda todos os requisitos e conserve-os por duas rodadas completas. A rodada de qualificação não conta.</p><div className="alpha-research-grid">{game.hegemony.map(path=><article className={`alpha-card ${game.self.hegemony?.path===path.path?'is-selected':''}`} key={path.path}><h3>{text(path.path)}</h3><ul>{path.requirements.map(r=><li key={r.metric}>{text(r.metric)}: {r.current} / {r.minimum}{r.met?' · Atendido':' · Pendente'}</li>)}</ul><button disabled={locked||game.self.hegemony!==null||game.self.era!=='ASCENSION'} onClick={()=>void send({type:'DECLARE_HEGEMONY',path:path.path})}>{game.self.hegemony?.path===path.path?'Caminho declarado':'Declarar caminho'}</button></article>)}</div>{game.declarations.map(d=><p key={d.playerId}>{game.players.find(p=>p.id===d.playerId)?.name} · {text(d.path!)} · {d.qualifiedSince?`Consolidação iniciada na rodada ${d.qualifiedSince}`:'Requisitos ainda não consolidados'}</p>)}</>,scroll:true},
  ];
  return <section className="alpha-panel"><p className="eyebrow">TRAJETÓRIA CIVILIZACIONAL</p><Pages label="Eras e Hegemonia" pages={pages}/></section>;
}

/** The first decision of the match. Shown on the board at start and in Cartas & Projetos until confirmed. */
export function AmbitionChooser({game,locked,send}:Panel){
  const [keep,setKeep]=useState<string[]>([]);
  const card=(id:string)=>ALPHA_CARDS.find(c=>c.id===id)!;
  return <><h3 id="alpha-ambitions-title">Escolha duas ambições secretas</h3><p>Conclua objetivos para ganhar Prestígio. Ambições não concedem Hegemonia diretamente. Ninguém mais vê a sua escolha.</p><div className="alpha-card-row">{game.self.ambitions.map(id=><label className={`alpha-card ${keep.includes(id)?'is-selected':''}`} key={id}><input type="checkbox" checked={keep.includes(id)} disabled={!keep.includes(id)&&keep.length>=2} onChange={e=>setKeep(old=>e.target.checked?[...old,id]:old.filter(x=>x!==id))}/><h4>{card(id).name}</h4><p>{text(card(id).objective!.metric)}: {card(id).objective!.threshold}</p><p>{card(id).objective!.prestige} Prestígio</p></label>)}</div><button className="primary" disabled={locked||keep.length!==2} onClick={()=>void send({type:'CHOOSE_AMBITIONS',cardIds:keep})}>Confirmar duas ambições</button></>;
}

export function AlphaCards({game,locked,send,cityId}:Panel&{cityId:string|null}){
  const card=(id:string)=>ALPHA_CARDS.find(c=>c.id===id)!;
  const ambitionsPending=!game.self.ambitionsChosen,worldPending=!!game.worldEvent&&game.worldDecisionPending;
  const pages:BookPage[]=[
    {key:'hand',title:`Mão · ${game.self.hand.length}`,node:<div className="alpha-card-row">{game.self.hand.length?game.self.hand.map(id=><article className="alpha-card" key={id}><small>ESTRATÉGIA · {text(card(id).timing)}</small><h3>{card(id).name}</h3><Effect effect={card(id).effect}/><p>{card(id).reminder}</p><button disabled={locked||card(id).timing!==game.view.phase} onClick={()=>void send({type:'PLAY_CARD',cardId:id})}>Jogar carta</button></article>):<p className="alpha-line is-muted">Nenhuma carta na mão.</p>}</div>},
    {key:'ambitions',title:'Ambições',alert:ambitionsPending,node:ambitionsPending?<section className="alpha-card"><AmbitionChooser game={game} locked={locked} send={send}/></section>:<div className="alpha-card-row">{game.self.ambitions.map(id=><article className="alpha-card" key={id}><h3>{card(id).name}</h3><p>{text(card(id).objective!.metric)}: {card(id).objective!.threshold} · {card(id).objective!.prestige} Prestígio</p><p>{game.self.completedAmbitions.includes(id)?'Concluída':'Em andamento'}</p></article>)}</div>},
    {key:'advisors',title:`Conselheiros · ${game.self.advisors.length} / ${game.rules.advisorLimit}`,node:<div className="alpha-card-row">{[...game.self.advisors,...game.advisorMarket].map(id=><article className="alpha-card" key={id}><small>CONSELHEIRO</small><h3>{card(id).name}</h3><Effect effect={card(id).effect}/>{game.self.advisors.includes(id)?<p>Conselheiro ativo</p>:<><ResourceDisplay values={game.costs.advisor} compact/><button disabled={locked} onClick={()=>void send({type:'HIRE_ADVISOR',cardId:id})}>Contratar</button></>}</article>)}</div>},
    {key:'works',title:'Obras de Legado',node:<><p className="alpha-line is-muted">Uma Obra tem {game.legacyWorks[0]?.steps??3} passos, um por Ordem de Legado, na cidade selecionada no mapa. Única no mundo; conclui com +4 Prestígio e um efeito permanente.</p><div className="alpha-gcard-row">{game.legacyWorks.map(work=>{const owner=work.progress&&game.players.find(player=>player.id===work.progress!.ownerId)?.name;const here=work.cities.find(entry=>entry.cityId===cityId);const mine=work.progress?.cityId===cityId;const label=work.progress?'Avançar Obra':'Iniciar Obra';const done=work.progress?.stepsDone??0;const full=legacyWorkEffectText(work.id);return <AlphaCard kind="work" key={work.id} compact art={workArtOf(work.id,48,work.progress?.complete?work.steps:done)} name={work.name} subtitle={`${text(work.path)}${work.source==='CONVERTED'?' · Alpha':''}`} identity={LEGACY_WORK_IDENTITY[work.id]?.identity} badge={work.progress?.complete?'Concluída':undefined}
      effects={[{key:'effect',label:'Efeito',text:<>+4 Prestígio{full?<> · {full}</>:null}</>},{key:'cost',label:'Custo',text:`${Object.values(work.cost).reduce((a,b)=>a+b,0)} em ${work.steps} passos · ${work.progress?.complete?'pago':`próximo: ${costText(work.nextStepCost)}`}`},...(work.gate&&!work.progress?[{key:'gate',label:'Exige',text:work.gate.name}]:[])]}
      icons={<><WorkSteps done={work.progress?.complete?work.steps:done} total={work.steps}/><span>{work.progress?(work.progress.complete?`Concluída por ${owner}`:`${owner}: passo ${work.progress.stepsDone} de ${work.steps}`):'Livre'}</span></>}>
      {!(work.progress?.complete)&&(!work.progress||work.progress.ownerId===game.self.playerId)&&<><button disabled={locked||!cityId||!here||here.blocker!==null||(work.progress!==null&&!mine)} onClick={()=>void send({type:'ADVANCE_LEGACY_WORK',workId:work.id,cityId:cityId!})}>{label}</button>{cityId&&here?.blocker&&<small>{here.blocker}</small>}</>}</AlphaCard>;})}</div></>,scroll:true},
    ...(game.worldEvent?[{key:'event',title:'Evento mundial',alert:worldPending,node:<article className="alpha-world-event alpha-card"><small>EVENTO MUNDIAL</small><h3>{card(game.worldEvent).name}</h3><Effect effect={card(game.worldEvent).effect}/><p>{card(game.worldEvent).reminder}</p><button disabled={locked||!game.worldDecisionPending} onClick={()=>void send({type:'WORLD_CHOICE',choice:'RESOURCE'})}>Receber recurso</button><button disabled={locked||!game.worldDecisionPending} onClick={()=>void send({type:'WORLD_CHOICE',choice:'PRESTIGE'})}>Receber 1 Prestígio</button></article>}]:[]),
  ];
  return <section className="alpha-panel"><Pages label="Cartas e Projetos" pages={pages} initial={ambitionsPending?'ambitions':worldPending?'event':'hand'}/></section>;
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
  const [sub,setSub]=useState<'status'|'treaty'|'trade'>('status'),[kind,setKind]=useState('TRADE_AGREEMENT'),[withDeal,setWithDeal]=useState(false),[give,setGive]=useState(emptyAlphaResourcePool()),[receive,setReceive]=useState(emptyAlphaResourcePool()),[confirmWar,setConfirmWar]=useState(false);
  const self=game.self.playerId,name=game.players.find(p=>p.id===otherId)?.name??'Civilização';
  const contact=game.self.contacts.includes(otherId),war=game.wars.some(pair=>pair.includes(otherId));
  const between=game.treaties.filter(t=>[t.proposerId,t.recipientId].includes(otherId));
  const active=between.filter(t=>t.status==='ACTIVE'),incoming=between.filter(t=>t.status==='PROPOSED'&&t.recipientId===self),outgoing=between.filter(t=>['PROPOSED','ACCEPTED'].includes(t.status)&&t.proposerId===self);
  const planned=game.self.plannedActions.filter(a=>(a.type==='PROPOSE_TREATY'&&a.recipientId===otherId)||(a.type==='DECLARE_WAR'&&a.targetId===otherId));
  const status=!contact?'Sem contato':war?'Em guerra':active.length?'Em paz · com acordos':'Em paz';
  return <article className={`alpha-card alpha-relation ${war?'is-war':''}`} aria-label={`Relação com ${name}`}>
    <header><h3>{name}<small>{civilizationDisplayName(game.players.find(p=>p.id===otherId)?.civilization)}</small></h3><span className={`alpha-relation-status ${war?'war':contact?'peace':'unknown'}`}>{status}</span></header>
    {!contact&&<p>Ainda não encontrada. Avistar uma peça ou cidade desta civilização abre a negociação.</p>}
    {contact&&<div className="alpha-seg is-sub" role="tablist" aria-label="Relação">{([['status','Estado'],['treaty','Acordo'],['trade','Troca']] as const).map(([k,t])=><button key={k} type="button" role="tab" aria-selected={sub===k} onClick={()=>setSub(k)}>{t}</button>)}</div>}
    {(sub==='status'||!contact)&&<>
    {active.length>0&&<ul className="alpha-relation-list">{active.map(t=><li key={t.id}><b>{text(t.type)}</b> · até a rodada {t.expiresRound}<button disabled={locked} onClick={()=>void send({type:'END_TREATY',treatyId:t.id})}>Encerrar (−2 Prestígio)</button></li>)}</ul>}
    {incoming.map(t=><div className="alpha-relation-proposal" key={t.id} role="group" aria-label={`Proposta de ${name}`}><p><b>{name} propõe {text(t.type)}</b>. {TREATY_HELP[t.type]}</p>{(Object.values(t.deal.give).some(Boolean)||Object.values(t.deal.receive).some(Boolean))&&<div className="alpha-deal-summary">Você recebe <ResourceDisplay values={t.deal.give} compact/> e entrega <ResourceDisplay values={t.deal.receive} compact/></div>}<button className="primary" disabled={locked} onClick={()=>void send({type:'RESPOND_TREATY',treatyId:t.id,accept:true})}>Aceitar</button><button disabled={locked} onClick={()=>void send({type:'RESPOND_TREATY',treatyId:t.id,accept:false})}>Recusar</button></div>)}
    {outgoing.map(t=><p key={t.id} className="alpha-hint">Sua proposta de {text(t.type)} {t.status==='ACCEPTED'?'foi aceita e entra em vigor na resolução.':'aguarda resposta.'}{t.status==='PROPOSED'&&<button disabled={locked} onClick={()=>void send({type:'END_TREATY',treatyId:t.id})}>Retirar</button>}</p>)}
    {planned.map(a=><p key={a.id} className="alpha-hint">Planejado nesta rodada: {a.type==='PROPOSE_TREATY'?`proposta de ${text(a.treaty)}`:'declaração de guerra'}.<button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:a.id})}>Cancelar</button></p>)}
    {contact&&<div className="alpha-relation-actions">
      {!war&&!planned.some(a=>a.type==='DECLARE_WAR')&&(confirmWar?<div className="alpha-war-confirm" role="alert"><p>Declarar guerra a {name} encerra os acordos entre vocês (−2 Prestígio por acordo) e chama os aliados defensivos de {name}.</p><button className="danger" disabled={locked} onClick={()=>void send({type:'DECLARE_WAR',targetId:otherId}).then(()=>setConfirmWar(false))}>Confirmar declaração de guerra</button><button onClick={()=>setConfirmWar(false)}>Manter a paz</button></div>
        :<button className="alpha-war-button" disabled={locked} onClick={()=>setConfirmWar(true)}>Declarar guerra…</button>)}
      {war&&<p className="alpha-hint">Em guerra: ataque com peças militares adjacentes pelo painel Militar. Um pacto de não agressão ou aliança aceito encerra a guerra.</p>}
    </div>}
    </>}
    {contact&&sub==='treaty'&&<div className="alpha-relation-actions">
      <form onSubmit={e=>{e.preventDefault();void send({type:'PROPOSE_TREATY',recipientId:otherId,treaty:kind,deal:withDeal?{give,receive}:{give:emptyAlphaResourcePool(),receive:emptyAlphaResourcePool()}});}}>
        <label>Propor acordo<select value={kind} onChange={e=>setKind(e.target.value)}>{TreatyTypeSchema.options.map(t=><option key={t} value={t}>{text(t)}</option>)}</select></label>
        <p className="alpha-treaty-help">{TREATY_HELP[kind]} Dura {game.rules.treatyDuration} rodadas depois de aceito.</p>
        <label className="alpha-inline-check"><input type="checkbox" checked={withDeal} onChange={e=>setWithDeal(e.target.checked)}/> Incluir troca de recursos</label>
        {withDeal&&<div className="alpha-form-row"><DealInputs title="Você oferece" value={give} onChange={setGive}/><DealInputs title="Você pede" value={receive} onChange={setReceive}/></div>}
        <button className="primary" disabled={locked}>Enviar proposta · 1 ação</button>
      </form>
    </div>}
    {contact&&sub==='trade'&&<div className="alpha-relation-actions">
      {!war?<TradePanel game={game} locked={locked} send={send} otherId={otherId}/>:<p className="alpha-hint">Em guerra: o comércio está suspenso.</p>}
    </div>}
  </article>;
}

export function AlphaDiplomacy({game,locked,send}:Panel){
  const [from,setFrom]=useState(game.view.player.civilization.cities[0]?.id??''),[to,setTo]=useState('');
  const cities=[...game.view.player.civilization.cities,...game.view.visibleCities];
  const others=game.players.filter(p=>p.id!==game.self.playerId).sort((a,b)=>Number(game.self.contacts.includes(b.id))-Number(game.self.contacts.includes(a.id)));
  const pages:BookPage[]=[
    ...others.map(p=>({key:p.id,title:p.name,alert:game.treaties.some(t=>t.status==='PROPOSED'&&t.recipientId===game.self.playerId&&t.proposerId===p.id),node:<RelationCard key={p.id} game={game} locked={locked} send={send} otherId={p.id as AlphaPlayerView['self']['playerId']}/>})),
    {key:'routes',title:'Rotas comerciais',node:<><form className="alpha-card" onSubmit={e=>{e.preventDefault();void send({type:'QUEUE_ORDER',order:{id:`trade-${game.version}`,type:'TRADE',fromCityId:from,toCityId:to}});}}><div className="alpha-form-row"><label>Origem<select value={from} onChange={e=>setFrom(e.target.value)}>{game.view.player.civilization.cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Destino visível<select value={to} onChange={e=>setTo(e.target.value)}><option value="">Selecione uma cidade</option>{cities.filter(c=>c.id!==from).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><button disabled={locked||!to}>Reservar rota</button><p className="alpha-line is-muted">Requer caminho conhecido. Rota internacional requer acordo comercial ativo e paz; guerra ou embargo a suspendem.</p></form>{game.routes.map(r=><p key={r.id}>{cities.find(c=>c.id===r.fromCityId)?.name??'Origem'} — {cities.find(c=>c.id===r.toCityId)?.name??'Destino conhecido'} · {r.suspended?'Suspensa':'Ativa'}</p>)}</>,scroll:true},
  ];
  return <section className="alpha-panel"><p className="alpha-line is-muted">Propostas e declarações são planejadas como ações principais e resolvidas na fase Diplomacia. A resposta a uma proposta é livre.</p><Pages label="Diplomacia" pages={pages}/></section>;
}

type RoundReport=AlphaPlayerView['roundReports'][number];
/** Every ledger line of the round, gains with + and outflows with −, so opening plus the lines equals closing. Empty lines are skipped. */
function reportRows(report:RoundReport):[string,RoundReport['opening'],number][]{
  const lines:[string,RoundReport['opening'],number][]=[['Produção das cidades',report.production,1],['Mineração',report.mining,1],['Instituições',report.institutions,1],['Comércio',report.trade,1],['Eventos e outros ganhos',report.other,1],
    ['Gastos com ações',report.expenses,-1],['Manutenção (população e peças)',report.upkeepPaid,-1],['Perdas',report.losses,-1],['Descartado (armazém cheio)',report.discarded,-1]];
  return [['Estoque inicial',report.opening,0],...lines.filter(([,pool])=>RESOURCE_KEYS.some(key=>pool[key]!==0)),['Estoque final',report.closing,0]];
}
export function AlphaReports({game}:{game:AlphaPlayerView}){
  const [at,setAt]=useState(0);
  const reports=[...game.roundReports].reverse(),report=reports[Math.min(at,Math.max(0,reports.length-1))];
  const pages:BookPage[]=[
    {key:'upkeep',title:'Manutenção',node:report?<><div className="alpha-pager is-inline"><button type="button" aria-label="Rodada mais recente" disabled={at===0} onClick={()=>setAt(at-1)}>‹</button><span>Rodada {report.round}</span><button type="button" aria-label="Rodada anterior" disabled={at>=reports.length-1} onClick={()=>setAt(at+1)}>›</button></div><div className="table-scroll"><table><thead><tr><th>Etapa</th>{RESOURCE_KEYS.map(k=><th key={k}>{k==='materials'?'Madeira + Pedra + Metal':text(k)}</th>)}</tr></thead><tbody>{reportRows(report).map(([name,pool,sign])=><tr key={name} className={sign<0?'is-outflow':sign===0?'is-total':''}><th>{name}</th>{RESOURCE_KEYS.map(k=><td key={k}>{sign<0&&pool[k]>0?'−':sign>0&&pool[k]>0?'+':''}{pool[k]}</td>)}</tr>)}</tbody></table></div><p className="alpha-line">Alimento (população e peças): {report.upkeepPaid.food} pagos de {report.upkeepRequired.food}.{report.upkeepPaid.food<report.upkeepRequired.food?' Faltou alimento: a estabilidade caiu.':''} Administração {report.administrativeLoad} / {report.administrativeCapacity}.</p>{report.cities.map(c=><p className="alpha-line is-muted" key={c.cityId}>{game.view.player.civilization.cities.find(city=>city.id===c.cityId)?.name??'Cidade'} · População {c.populationBefore} → {c.populationAfter} · Estabilidade {c.stabilityBefore} → {c.stabilityAfter}</p>)}</>:<p className="alpha-line is-muted">Nenhum relatório ainda.</p>,scroll:true},
    {key:'conflicts',title:`Conflitos · ${game.battles.length}`,node:game.battles.length?<>{[...game.battles].reverse().map(b=><BattleReport key={b.id} battle={b} players={game.players}/>)}</>:<p className="alpha-line is-muted">Nenhum conflito ainda.</p>,scroll:true},
    {key:'events',title:'Acontecimentos',node:<ol className="alpha-feed">{[...game.events].reverse().slice(0,60).map(e=><li key={e.id}><small>Rodada {e.round}</small> {e.message}</li>)}</ol>,scroll:true},
  ];
  return <section className="alpha-panel"><Pages label="Crônicas da civilização" pages={pages}/></section>;
}
