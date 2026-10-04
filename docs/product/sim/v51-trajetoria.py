import math
NAME=['Posto','Aldeia','Vila','Cidade','Grande Cidade','Metrópole','Imperial']
POP=[2,4,6,8,11,14,18]; CAP=[1,1,2,2,3,3,4]
RISE={2:(3,0,0,0,1),3:(4,2,0,0,2),4:(5,3,2,0,3),5:(6,5,3,2,4),6:(8,6,5,3,5),7:(10,8,8,4,6)}
def per_hex(era): return 2+(era>=2)+(era>=4)+(era>=6)
def run(rule,growcost,label,colonies=(5,11),prod_rounds=0.6):
    cities=[dict(lvl=1,pop=2,agr=False)]
    S=dict(food=6,mad=6,ped=2,riq=2,con=2,sold=0,starve=0,lost=0,research=0,infra=0,maxlvl=[])
    out=[]
    for r in range(1,36):
        era=(r-1)//5+1
        for c in cities:
            hexes=CAP[c['lvl']-1]; fh=math.ceil(hexes*0.6); mh=hexes-fh
            prod=c['pop']//2  # Produtores (half the people)
            S['food']+=fh*per_hex(era)+(2 if c['agr'] else 0)+prod//2
            S['mad']+=mh*2+c['pop']//4
            S['ped']+=mh+(1 if c['lvl']>=3 else 0)
            S['riq']+=c['pop']//4+(1 if c['lvl']>=4 else 0)
            S['con']+=max(1,c['pop']//4)+(1 if c['lvl']>=4 else 0)
        totpop=sum(c['pop'] for c in cities)
        need=math.ceil(totpop*rule)+math.ceil(S['sold']/2)
        if S['food']>=need: S['food']-=need
        else: S['starve']+=1; S['food']=0
        # growth: biggest city first, one +1 pop per city per round if surplus
        for c in sorted(cities,key=lambda c:-c['lvl']):
            if S['food']<growcost: break
            nxt=c['lvl']+1
            if c['pop']<(POP[nxt-1] if nxt<=7 else 99)-0:  # free growth up to threshold
                if c['pop']+1==(POP[nxt-1] if nxt<=7 else 99):
                    if nxt>7: continue
                    w,s,rq,k,emin=RISE[nxt]
                    if S['mad']>=w and S['ped']>=s and S['riq']>=rq and S['con']>=k and era>=emin:
                        S['mad']-=w;S['ped']-=s;S['riq']-=rq;S['con']-=k;c['lvl']=nxt;c['pop']+=1;S['food']-=growcost
                        if nxt==3: c['agr']=True
                        S['maxlvl'].append((r,nxt))
                else: c['pop']+=1; S['food']-=growcost
        if r in colonies and S['mad']>=3 and S['food']>=2: cities.append(dict(lvl=1,pop=2,agr=False)); S['mad']-=3;S['food']-=2
        if r%6==0 and S['mad']>=3 and S['ped']>=2 and S['infra']<4: S['mad']-=3;S['ped']-=2;S['infra']+=1
        if r%3==0 and S['mad']>=2 and S['riq']>=1 and S['sold']<10: S['mad']-=2;S['riq']-=1;S['sold']+=1
        if r%2==0 and S['con']>=3: S['con']-=3; S['research']+=1
        capM=15+5*S['infra']; capK=10+5*min(S['infra'],2)
        for k,cv in (('food',capM),('mad',capM),('ped',capM),('riq',capM),('con',capK)):
            if S[k]>cv: S['lost']+=S[k]-cv; S[k]=cv
        if r%5==0: out.append(f"r{r:2d} E{era} "+' '.join(f"N{c['lvl']}/{c['pop']}" for c in cities)+f" | Al{S['food']} Ma{S['mad']} Pe{S['ped']} Ri{S['riq']} Co{S['con']} sold{S['sold']} fome{S['starve']} perdido{S['lost']} avanços{S['research']}")
    print(f'\n{label}'); print('\n'.join(out)); print('subidas:',S['maxlvl'])
for rule in (1.0,0.5):
    for gc in (3,4):
        run(rule,gc,f'sustento {rule}/hab, crescer custa {gc} Alimento')
