"""V5.1a: administrative load vs capacity, 2–6 players, 35 rounds.
Load: integrated city 1, occupied city 2. Capacity: base 2 + capital 1 + Administrativo district 1 each
+ Chancelaria 1 (one per civ) + government (Confederação +1 from Era III) + Teia (Códigos +1 Era II, Urbanismo +1 Era III)."""
import math
def cities_by_round(players, r):
    # founding slows as the map fills: 2p founds every 5 rounds up to 7 cities; 6p every 7 rounds up to 4
    cadence = {2: 5, 3: 5, 4: 6, 5: 7, 6: 7}[players]
    cap = {2: 7, 3: 6, 4: 5, 5: 4, 6: 4}[players]
    return min(cap, 1 + r // cadence)
def occupied(players, r):  # one conquest by late game at busy tables
    return 1 if (players >= 3 and r >= 25) else 0
def admin_capacity(r, districts):
    era = (r - 1) // 5 + 1
    return 2 + 1 + districts + (1 if era >= 2 else 0) + (1 if era >= 3 else 0) + (1 if era >= 4 else 0)  # Códigos, Urbanismo, Chancelaria
print('players round era cities occupied load | cap(0 Adm) cap(1 Adm) cap(2 Adm) | over?(0/1/2)')
for p in (2, 3, 4, 5, 6):
    for r in (5, 10, 15, 20, 25, 30, 35):
        c = cities_by_round(p, r); o = occupied(p, r); load = c + 2 * o
        caps = [admin_capacity(r, d) for d in (0, 1, 2)]
        print(f'{p}p r{r:2d} E{(r-1)//5+1} cities {c} occ {o} load {load:2d} | {caps[0]} {caps[1]} {caps[2]} | ' + ' '.join('OVER' if load > k else 'ok  ' for k in caps))
