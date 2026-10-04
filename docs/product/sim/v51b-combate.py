"""V5.1b combat: one tactical shock. Power + one AoH die per unit + family signature + posture + terrain + fortification + supply.
Die: Impacto, Impacto, Guarda, Manobra, Comando, Vazio. Postures circular: Assalto > Manobra > Manter > Assalto.
Δ = attack − defense. Sign = winner, |Δ| = intensity. |Δ| ≤ 1 tactical tie: each side with 2+ pieces loses 1, attacker falls back.
|Δ| 2–4 victory: loser loses 1 and retreats. |Δ| ≥ 5 decisive: loser loses 2 and retreats. Δ > 0 the attacker may advance; Δ < 0 the defender holds. Fortification: intact adds level (1–5) to defender and absorbs the first breach;
Cerco: 1 power in the field, +2 against a fortified city and converts one Comando into a breach step.
Grades: I base; II signature stronger (Infantaria Guarda cancels 2; Cavalaria Manobra +1 move; Arqueiros 2 conversions;
Guarda +1 in city); III +1 power on the family's own signature situation only.
"""
import random, itertools
random.seed(7)
DIE=['IMPACT','IMPACT','GUARD','MANEUVER','COMMAND','EMPTY']
POWER={'INF':2,'GUARD':2,'ARCH':2,'CAV':3,'SIEGE':1,'FLEET':3}
BEATS={'ASSAULT':'MANEUVER','MANEUVER':'HOLD','HOLD':'ASSAULT'}
EMPOWER={'ASSAULT':'IMPACT','HOLD':'GUARD','MANEUVER':'MANEUVER'}
def side_total(units,grades,posture,enemy_posture,attacking,terrain='PLAINS',fort=0,supplied=True,in_city=False):
    rolls=[random.choice(DIE) for _ in units]
    total=sum(POWER[u] for u in units)
    guards=0; maneuvers=0; commands=0
    for u,g,r in zip(units,grades,rolls):
        if r=='IMPACT': total+=1+(1 if EMPOWER[posture]=='IMPACT' else 0)
        elif r=='GUARD': guards+=1+(1 if EMPOWER[posture]=='GUARD' else 0)+(1 if u=='INF' and g>=2 else 0)
        elif r=='MANEUVER': maneuvers+=1+(1 if EMPOWER[posture]=='MANEUVER' else 0)
        elif r=='COMMAND':
            commands+=1
            if u=='CAV' and terrain=='PLAINS': total+=1+(1 if g>=3 else 0)   # flank
            elif u=='ARCH': total+=1+(1 if g>=2 else 0)                     # volley converts
            elif u=='SIEGE' and not attacking is False and fort>0: total+=2  # breach
            elif u=='FLEET': total+=1
        # signatures regardless of die
        if u=='GUARD' and in_city and not attacking: total+=1+(1 if g>=3 else 0)
        if u=='SIEGE' and attacking and fort>0: total+=2
    total+=maneuvers
    if BEATS[posture]==enemy_posture: total+=1
    if not attacking: total+= {'PLAINS':0,'HILLS':1,'MOUNTAINS':2}[terrain] + fort
    if not supplied: total-=2
    return total,guards
def battle(att,ag,dfn,dg,ap='ASSAULT',dp='HOLD',terrain='PLAINS',fort=0,asup=True):
    a,ag_=side_total(att,ag,ap,dp,True,terrain,fort,asup)
    d,dg_=side_total(dfn,dg,dp,ap,False,terrain,fort,True,in_city=fort>0)
    a-=min(dg_,2 if dp=='HOLD' else 1); d-=min(ag_,1)
    m=a-d
    if abs(m)<2: return 'stand',m
    if m>=5: return 'att_big',m
    if m>=2: return 'att',m
    if m<=-5: return 'def_big',m
    return 'def',m
def run(label,att,ag,dfn,dg,**kw):
    n=4000; c={}; la=ld=0; retreats_att=retreats_def=0
    for _ in range(n):
        r,m=battle(att,ag,dfn,dg,**kw); c[r]=c.get(r,0)+1
        if r=='stand': la+=1 if len(att)>=2 else 0; ld+=1 if len(dfn)>=2 else 0; retreats_att+=1
        elif r=='att': ld+=1; retreats_def+=1
        elif r=='att_big': ld+=2; retreats_def+=1
        elif r=='def': la+=1; retreats_att+=1
        else: la+=2; retreats_att+=1
    att_w=(c.get('att',0)+c.get('att_big',0))/n; def_w=(c.get('def',0)+c.get('def_big',0))/n
    print(f'{label:50s} A vence {att_w:4.0%} (decisiva {c.get("att_big",0)/n:3.0%}) · D vence {def_w:4.0%} (decisiva {c.get("def_big",0)/n:3.0%}) · empate tático {c.get("stand",0)/n:4.0%} · baixas A {la/n:.2f} D {ld/n:.2f} · recua A {retreats_att/n:4.0%} D {retreats_def/n:4.0%}')
I=[1]
run('1v1 Infantaria I vs Infantaria I (planície)',['INF'],I,['INF'],I)
run('3v3 Infantaria I vs Infantaria I',['INF']*3,I*3,['INF']*3,I*3)
run('6v6 Infantaria I vs Infantaria I',['INF']*6,I*6,['INF']*6,I*6)
run('3 Inf+Cav+Arq I vs 3 Inf I (planície, Assalto vs Manter)',['INF','CAV','ARCH'],I*3,['INF']*3,I*3)
run('3 Inf+Cav+Arq I vs 3 Inf I, defensor Manobra',['INF','CAV','ARCH'],I*3,['INF']*3,I*3,dp='MANEUVER')
run('3 Inf III vs 3 Inf I',['INF']*3,[3]*3,['INF']*3,I*3)
run('3 Inf I vs 3 Inf II (Guarda cancela 2)',['INF']*3,I*3,['INF']*3,[2]*3)
run('4 Inf I vs 2 Guarda I em Paliçada (1)',['INF']*4,I*4,['GUARD']*2,I*2,fort=1)
run('4 Inf I vs 2 Guarda I em Fortaleza (3)',['INF']*4,I*4,['GUARD']*2,I*2,fort=3)
run('3 Inf + Cerco I vs 2 Guarda I em Fortaleza (3)',['INF']*3+['SIEGE'],I*4,['GUARD']*2,I*2,fort=3)
run('3 Inf + 2 Cerco I vs 2 Guarda I em Cidadela (5)',['INF']*3+['SIEGE']*2,I*5,['GUARD']*2,I*2,fort=5)
run('3 Inf I sem suprimento vs 3 Inf I',['INF']*3,I*3,['INF']*3,I*3,asup=False)
run('3 Inf I vs 2 Inf I em Colina',['INF']*3,I*3,['INF']*2,I*2,terrain='HILLS')
run('2 Frotas vs 2 Frotas',['FLEET']*2,I*2,['FLEET']*2,I*2)
