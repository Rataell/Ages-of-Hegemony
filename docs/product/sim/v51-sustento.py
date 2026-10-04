import math
# V5.1 city ladder (index = level-1)
NAME=['Posto','Aldeia','Vila','Cidade','Grande Cidade','Metrópole','Imperial']
POP=[2,4,6,8,11,14,18]; CAP=[1,1,2,2,3,3,4]; SLOTS=[1,1,2,3,4,5,6]
# cost to RISE to level (Madeira, Pedra, Riqueza, Conhecimento), era min, required Web advance
RISE={2:(3,0,0,0,1,'Agricultura'),3:(4,2,0,0,2,'Alvenaria'),4:(5,3,2,0,3,'Engenharia'),5:(6,5,3,2,4,'Urbanismo'),6:(8,6,5,3,5,'Saneamento'),7:(10,8,8,4,6,'Metrópole (Convergência)')}
# yields: hex worked gives 2 Alimento (Fazenda) or 2 Madeira/Pedra; Irrigação(+1/food hex, era2), Rotação(+1, era4), Agronomia(+1, era6)
def food_max(lvl,era,agrario):
    hexes=CAP[lvl-1]; per=2+(era>=2)+(era>=4)+(era>=6)
    return hexes*per+ (2 if agrario else 0) + (1 if lvl>=5 else 0)
def upkeep(pop,rule): return math.ceil(pop*rule)
print('A) Sustento vs produção máxima de Alimento por nível (todos hexes como Fazenda, distrito Agrário):')
print('nível  pop  cap  1/hab  1/2hab  food_max(era mín)  saldo(1/hab)  saldo(1/2hab)')
for i,l in enumerate(range(1,8)):
    era=RISE.get(l,(0,0,0,0,1))[4]; fm=food_max(l,era,l>=3)
    print(f'{l} {NAME[i]:14s} {POP[i]:3d} {CAP[i]:3d} {upkeep(POP[i],1):4d} {upkeep(POP[i],.5):6d}   {fm:3d} (Era {era})      {fm-upkeep(POP[i],1):+4d}        {fm-upkeep(POP[i],.5):+4d}')
# B) storage vs rise costs
print('\nB) Armazém: base 15 materiais/10 Conhecimento; infra +5 cada (Armazém, Celeiro, Tesouro, Arquivo). Máx 30/20.')
for l,(w,s,r,k,era,adv) in RISE.items():
    need_cap_mat=max(w,s); print(f'  subir N{l}: Madeira {w} Pedra {s} Riqueza {r} Conhec {k} | cabe no cap base? mat {need_cap_mat<=15} conhec {k<=10} | com 1 Armazém (20): {need_cap_mat<=20}')
# C) 35-round trajectory, capital + 2 colonies, deterministic plan
def run(rule,label):
    cities=[dict(lvl=1,pop=2,growth=0,agr=False)]
    S=dict(food=6,mad=6,ped=2,riq=2,con=2,sold=0,starve=0,lost=0,infra=0,research=[])
    out=[]
    for r in range(1,36):
        era=(r-1)//5+1
        # production: each city's Order = Produzir on 3 of 5 rounds (others: Construir/Pesquisar/Recrutar)
        for c in cities:
            hexes=CAP[c['lvl']-1]; fh=math.ceil(hexes*0.6); mh=hexes-fh
            per=2+(era>=2)+(era>=4)+(era>=6)
            S['food']+=fh*per+(2 if c['agr'] else 0)+(1 if c['lvl']>=5 else 0)
            S['mad']+=mh*2+(1 if c['lvl']>=2 else 0)+c['pop']//6   # Artesãos
            S['ped']+=(mh*2)//2+(1 if c['lvl']>=4 else 0)
            S['riq']+=c['pop']//4                                   # Mercadores
            S['con']+=max(1,c['pop']//4)+(1 if c['lvl']>=4 else 0)   # Eruditos
        totpop=sum(c['pop'] for c in cities)
        need=upkeep(totpop,rule)+math.ceil(S['sold']/2)
        if S['food']>=need: S['food']-=need
        else: S['starve']+=1; S['food']=0
        # growth: every 3 surplus food → 1 growth point; 4 points → +1 pop (if under cap of level or can rise)
        for c in cities:
            share=S['food']//len(cities)
            spend=min(share,3); S['food']-=spend; c['growth']+=spend
            if c['growth']>=6:
                nxt=c['lvl']+1
                if c['pop']<POP[c['lvl']-1]+ (POP[min(nxt,7)-1]-POP[c['lvl']-1]) if nxt<=7 else False:
                    # need to rise when pop reaches next threshold
                    if c['pop']+1>=POP[nxt-1]:
                        w,s,rq,k,emin,adv=RISE[nxt]
                        if S['mad']>=w and S['ped']>=s and S['riq']>=rq and S['con']>=k and era>=emin:
                            S['mad']-=w;S['ped']-=s;S['riq']-=rq;S['con']-=k;c['lvl']=nxt;c['pop']+=1;c['growth']-=6
                            if nxt==3: c['agr']=True
                        else: c['growth']=6  # waits; food overflow lost
                    else: c['pop']+=1;c['growth']-=6
        # spending: colonies at r 5,11; infra; soldiers; research
        if r in (5,11) and S['mad']>=3 and S['food']>=2: cities.append(dict(lvl=1,pop=2,growth=0,agr=False)); S['mad']-=3;S['food']-=2
        if r%6==0 and S['mad']>=3 and S['ped']>=2 and S['infra']<4: S['mad']-=3;S['ped']-=2;S['infra']+=1
        if r%3==0 and S['mad']>=2 and S['riq']>=1 and S['sold']<10: S['mad']-=2;S['riq']-=1;S['sold']+=1
        if r%2==0 and S['con']>=3: S['con']-=3; S['research'].append(r)
        capM=15+5*S['infra']; capK=10+5*min(S['infra'],2)
        for k,cv in (('food',capM),('mad',capM),('ped',capM),('riq',capM),('con',capK)):
            if S[k]>cv: S['lost']+=S[k]-cv; S[k]=cv
        if r%5==0: out.append(f"r{r:2d} E{era} "+' '.join(f"N{c['lvl']}/{c['pop']}" for c in cities)+f" | Al{S['food']} Ma{S['mad']} Pe{S['ped']} Ri{S['riq']} Co{S['con']} sold{S['sold']} fome{S['starve']} perdido{S['lost']} avanços{len(S['research'])}")
    print(f'\nC) Trajetória 35 rodadas — {label}'); print('\n'.join(out))
run(1.0,'1 Alimento/habitante'); run(0.5,'1 Alimento por 2 habitantes')
