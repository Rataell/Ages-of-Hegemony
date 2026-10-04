"""V5.1b: Resonance (3 markers per civilization, consumed by any advance), Pulses (one per Era), barbarian bands."""
import random, math
random.seed(3)
print('A) Ressonância: 3 marcadores por civilização; Repercussão ao consumir o 3º')
for pace in (0.5,0.6,0.75):   # advances per round (universal + Heritage)
    adv=round(35*pace); rep=adv//3
    print(f'  ritmo {pace} avanço/rodada → {adv} avanços em 35 rodadas → {rep} Repercussões por civilização (1 a cada {35/max(rep,1):.1f} rodadas)')
for players in (2,4,6):
    print(f'  mesa de {players}: {players*6} Repercussões no total (ritmo 0.5), {players*6/35:.1f} por rodada na mesa; Pulsos globais: 7 (um por Era)')
print('\nB) Bandos de fronteira: surgem em Pulso/Repercussão/Encontro; Ameaça I/II/III; movem 1 hex/rodada rumo à cidade mais próxima acessível')
def band_sim(players,rounds=35,trials=400):
    first=[]; attacks=[]; camps_end=[]
    for _ in range(trials):
        camps=[]; t_first=None; n_att=0
        for r in range(1,rounds+1):
            era=(r-1)//5+1
            # spawn: Era pulse (r%5==1) spawns one camp at distance 3–5 from a random city with p=0.6; repercussions (per civ ~1/6 rounds) spawn with p=0.25
            if r%5==1 and random.random()<0.6: camps.append({'d':random.randint(3,5),'threat':1,'size':2})
            for _ in range(players):
                if random.random()<(1/6)*0.25: camps.append({'d':random.randint(3,5),'threat':1,'size':2})
            for c in camps:
                if r%5==1 and c['threat']<3 and random.random()<0.5: c['threat']+=1; c['size']+=1
                c['d']-=1   # band moves one hex per round toward target
                if c['d']<=0:
                    n_att+=1; t_first=t_first or r; c['d']=random.randint(2,4)  # after an attack it falls back / respawns from camp
        first.append(t_first or rounds+1); attacks.append(n_att); camps_end.append(len(camps))
    print(f'  {players}p: primeiro ataque bárbaro na rodada {sum(first)/len(first):.1f} (mediana {sorted(first)[len(first)//2]}); ataques em 35 rodadas {sum(attacks)/len(attacks):.1f}; acampamentos vivos no fim {sum(camps_end)/len(camps_end):.1f} (sem ninguém eliminá-los)')
for p in (2,4,6): band_sim(p)
print('\nC) Composição por Ameaça/Era: I → 2 Infantaria; II → 3 Infantaria + 1 Arqueiros (Era III+: Cavalaria); III → 4 Infantaria + Cavalaria + Cerco (Era V+). Poder total 4 / 8 / 13.')
print('   Contra 2 Guarda + Paliçada numa Vila (defesa ≈ 2·2+1+terreno), Ameaça I perde ~70%, Ameaça II ganha ~55%, Ameaça III ganha ~85% (ver v51b-combate.py).')
