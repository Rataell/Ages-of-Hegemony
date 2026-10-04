"""V5.1b: Resonance (3 markers per civilization, consumed by any advance), Pulses (one per Era), barbarian bands."""
import random, math
random.seed(3)
print('A) Ressonância: 5 encaixes por civilização; Repercussão ao registrar o 5º avanço')
for pace in (0.5,0.6,0.75):   # advances per round (universal + Convergence + Heritage)
    adv=round(35*pace); rep=adv//5
    print(f'  ritmo {pace} avanço/rodada → {adv} avanços em 35 rodadas → {rep} Repercussões por civilização (1 a cada {35/max(rep,1):.1f} rodadas)')
for players in (2,4,6):
    print(f'  mesa de {players}: {players*3} Repercussões no total (ritmo 0.5), {players*3/35:.2f} por rodada na mesa; Pulsos globais: 7 (um por Era)')
import collections
print('  composição dos 5 registros (pesquisa aleatória entre 5 domínios, 20000 ciclos):')
cnt=collections.Counter()
for _ in range(20000):
    doms=[random.randrange(5) for _ in range(5)]; c=sorted(collections.Counter(doms).values(),reverse=True)
    cnt['3+ de um domínio (família dominante)' if c[0]>=3 else '2+2+1 (híbrida)' if c[:2]==[2,2] else 'cinco diferentes (Confluência)' if c[0]==1 else '2+1+1+1 (família do par)']+=1
for k,v in cnt.most_common(): print(f'    {k}: {v/200:.0f}%')
print('\nB) Bandos de fronteira: surgem em Pulso/Repercussão/Encontro; Ameaça I/II/III; movem 1 hex/rodada rumo à cidade mais próxima acessível')
def band_sim(players,rounds=35,trials=400,clear_rate=0.0):
    # World cap of land camps = players + 2; a spawn above the cap reinforces an eligible camp (+1 Ameaça) instead.
    cap=players+2; first=[]; attacks=[]; camps_end=[]; reinforced=[]; threats=[]
    for _ in range(trials):
        camps=[]; t_first=None; n_att=0; n_re=0
        def spawn():
            nonlocal n_re
            if len(camps)<cap: camps.append({'d':random.randint(3,5),'threat':1})
            else:
                weak=[c for c in camps if c['threat']<3]
                if weak: random.choice(weak)['threat']+=1; n_re+=1
        for r in range(1,rounds+1):
            # Era Pulse: spawn 60% and ATIVAR AMEAÇAS; Repercussão per civ (~1/10 rounds): 25% SURGIR, 25% ATIVAR
            if r%5==1:
                if random.random()<0.6: spawn()
                for c in camps:
                    if c['threat']<3 and random.random()<0.5: c['threat']+=1
            for _ in range(players):
                if random.random()<(1/10):
                    roll=random.random()
                    if roll<0.25: spawn()
                    elif roll<0.5:
                        for c in camps: c['d']-=1   # ATIVAR AMEAÇAS: an extra move
            for c in list(camps):
                c['d']-=1
                if c['d']<=0:
                    n_att+=1; t_first=t_first or r; c['d']=random.randint(2,4)
                    if random.random()<clear_rate: camps.remove(c)  # players clear the camp after the raid
        first.append(t_first or rounds+1); attacks.append(n_att); camps_end.append(len(camps)); reinforced.append(n_re); threats.append(sum(c['threat'] for c in camps)/max(1,len(camps)))
    print(f'  {players}p (cap {cap}, limpeza {clear_rate:.0%}): 1º ataque na rodada {sum(first)/len(first):.1f} (mediana {sorted(first)[len(first)//2]}); ataques em 35 rodadas {sum(attacks)/len(attacks):.1f}; acampamentos vivos no fim {sum(camps_end)/len(camps_end):.1f}; reforços em vez de novos {sum(reinforced)/len(reinforced):.1f}; Ameaça média final {sum(threats)/len(threats):.1f}')
for p in (2,4,6): band_sim(p)
print('  com os jogadores limpando metade dos acampamentos depois de um saque:')
for p in (2,4,6): band_sim(p,clear_rate=0.5)
print('\nD) Piratas: limite mundial separado = ceil(jogadores/2)+1 → 2p 2, 4p 3, 6p 4; surgem só em rota marítima ativa ou fronteira marítima, 1 por Pulso/Repercussão de Troca.')
print('\nC) Composição por Ameaça/Era: I → 2 Infantaria; II → 3 Infantaria + 1 Arqueiros (Era III+: Cavalaria); III → 4 Infantaria + Cavalaria + Cerco (Era V+). Poder total 4 / 8 / 13.')
print('   Contra 2 Guarda + Paliçada numa Vila (defesa ≈ 2·2+1+terreno), Ameaça I perde ~70%, Ameaça II ganha ~55%, Ameaça III ganha ~85% (ver v51b-combate.py).')
