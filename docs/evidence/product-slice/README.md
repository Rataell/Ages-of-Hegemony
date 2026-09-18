# Evidência visual

Chromium headless real via Playwright, servidor Next em modo development, porta isolada 3107. As capturas são produzidas por `npm run test:e2e`, sem simulação de respostas ou estado do jogo.

| Vista | 1440 × 900 | 1280 × 800 | 390 × 844 |
| --- | --- | --- | --- |
| Mapa geral | [Mapa](1440-map.png) | [Mapa](1280-map.png) | [Mapa](390-map.png) |
| Cidade | [Cidade](1440-city.png) | [Cidade](1280-city.png) | [Cidade](390-city.png) |
| Distrito | [Catálogo](1440-district.png) | [Catálogo](1280-district.png) | [Catálogo](390-district.png) |
| Relatório | [Relatório](1440-report.png) | [Relatório](1280-report.png) | [Relatório](390-report.png) |

As imagens `*-territory-full.png` registram a página completa após claim, melhoria, trabalho territorial e manutenção. No mobile o inspector exige rolagem, conforme o escopo desktop-first.

Revisão visual: tokens aplicados, terreno/cidade/proprietário distintos, seleção clara, catálogo contido na viewport com rolagem, recursos atualizados, relatório legível e ausência de overflow horizontal. Uma primeira captura revelou BOM invalidando o seletor :root; o arquivo foi corrigido e o E2E passou a verificar a cor computada do tema antes de capturar. Estas imagens são posteriores à correção.
