module.exports = [
"[project]/apps/web/app/play/hex-map.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HexMap",
    ()=>HexMap,
    "points",
    ()=>points
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/app/play/presentation.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/app/play/map-frame.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/app/alpha/table-art.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const svgFragment = (html)=>({
        __html: html
    });
/** The two corners a tile shares with a neighbour centred at (nx, ny): the tile corners nearest to it. */ function sharedEdge(x, y, nx, ny, r) {
    const corners = Array.from({
        length: 6
    }, (_, i)=>{
        const a = (60 * i - 30) * Math.PI / 180;
        return [
            x + r * Math.cos(a),
            y + r * Math.sin(a)
        ];
    }).sort((a, b)=>Math.hypot(a[0] - nx, a[1] - ny) - Math.hypot(b[0] - nx, b[1] - ny));
    return [
        corners[0][0],
        corners[0][1],
        corners[1][0],
        corners[1][1]
    ];
}
const NEIGHBOURS = [
    [
        1,
        0
    ],
    [
        1,
        -1
    ],
    [
        0,
        -1
    ],
    [
        -1,
        0
    ],
    [
        -1,
        1
    ],
    [
        0,
        1
    ]
];
const points = Array.from({
    length: 6
}, (_, i)=>{
    const angle = (60 * i - 30) * Math.PI / 180;
    return `${(52 * Math.cos(angle)).toFixed(1)},${(52 * Math.sin(angle)).toFixed(1)}`;
}).join(' ');
const innerPoints = Array.from({
    length: 6
}, (_, i)=>{
    const angle = (60 * i - 30) * Math.PI / 180;
    return `${(47 * Math.cos(angle)).toFixed(1)},${(47 * Math.sin(angle)).toFixed(1)}`;
}).join(' ');
const terrainGlyphs = {
    PLAINS: '⌁',
    FOREST: '♠',
    HILLS: '⌃⌃',
    MOUNTAINS: '▲',
    COAST: '≈',
    SEA: '≈',
    UNKNOWN: '?'
};
const featureGlyphs = {
    RIVER: '≈',
    FERTILE: '✦',
    TIMBER: '⋈',
    STONE: '◇',
    METAL: '◆',
    FISH: '⋊'
};
const improvementIcons = {
    FARM: '🌾',
    LUMBER_CAMP: '🪵',
    QUARRY: '🪨',
    MINE: '⛏',
    FISHERY: '🐟'
};
const HexMap = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["memo"])(function HexMap({ data, selected, focus, working, worked, onSelect, units = [], peoples = [], threats = [], art, board, seatStatus = {}, plateBubble = {}, plateTone = {}, onSelfPlate, safe = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_SAFE"], targets = null, onBackground, onSelectPieces }) {
    const svgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // null = fitted to the projected tiles; otherwise an explicit centre and zoom (1 shows the whole fitted frame).
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [drag, setDrag] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [moved, setMoved] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const tiles = data.view.visibleTerritory;
    const targetSet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>new Set(targets?.hexIds ?? []), [
        targets
    ]);
    const mesa = board !== undefined;
    const [size, setSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        w: 1280,
        h: 720
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const svg = svgRef.current;
        if (!svg || typeof ResizeObserver === 'undefined') return;
        const read = ()=>{
            const box = svg.getBoundingClientRect();
            if (box.width > 0 && box.height > 0) setSize({
                w: box.width,
                h: box.height
            });
        };
        read();
        const observer = new ResizeObserver(read);
        observer.observe(svg);
        return ()=>observer.disconnect();
    }, []);
    // MESA: the frame is the WHOLE board (public topology), never just what the player has explored. Without a board (old atlas) it fits the known tiles.
    const boardHexes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(board ?? []).flatMap((region)=>region.hexIds.map((id)=>{
                const [q, r] = id.split(',').map(Number);
                return {
                    id,
                    q: q ?? 0,
                    r: r ?? 0,
                    regionId: region.id
                };
            })), [
        board
    ]);
    const frame = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        // The whole board; tiles outside any Region (old saves, test maps) are included so nothing is ever clipped out of the frame.
        if (mesa) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapFrame"])([
            ...boardHexes,
            ...tiles
        ], {
            padding: 24
        });
        const known = tiles.filter((tile)=>tile.terrain !== 'UNKNOWN');
        return known.length >= 3 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapFrame"])(known, {
            padding: 70
        }) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapFrame"])(tiles);
    }, [
        tiles,
        mesa,
        boardHexes
    ]);
    // null = MESA (fit); otherwise an explicit centre and a zoom relative to the fit. Nothing re-centres the camera by itself: only MESA and FOCAR do.
    const current = view ?? {
        cx: frame.cx,
        cy: frame.cy,
        zoom: 1
    };
    const camera = mesa ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cameraBox"])(frame, size, safe, view) : {
        viewBox: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["viewBoxOf"])(frame, view),
        scale: 1
    };
    const focusTile = tiles.find((t)=>t.id === focus);
    const zoomed = mesa && camera.scale / (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fitScale"])(frame, size, safe) > 1.8;
    const focusHere = ()=>{
        const target = tiles.find((t)=>t.id === selected) ?? focusTile ?? tiles.find((t)=>t.id === data.view.player.civilization.cities[0]?.hexId);
        if (!target) return;
        const at = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(target.q, target.r);
        setView({
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clampCentre"])(frame, at.x, at.y),
            zoom: 2.4
        });
    };
    // A Region that just turned face up flips for a moment.
    const closedBefore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const [flipping, setFlipping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!board) return;
        const nowClosed = new Set(board.filter((region)=>region.closed).map((region)=>region.id));
        const opened = board.filter((region)=>!region.closed && closedBefore.current.has(region.id)).flatMap((region)=>region.hexIds);
        closedBefore.current = nowClosed;
        if (opened.length) {
            setFlipping(new Set(opened));
            const timer = setTimeout(()=>setFlipping(new Set()), 900);
            return ()=>clearTimeout(timer);
        }
    }, [
        board
    ]);
    const cities = [
        ...data.view.player.civilization.cities,
        ...data.view.visibleCities
    ];
    // Shared table: a piece or city that appears (or lands) because of anyone's resolved action pops in for a moment, so every window reads the change.
    const seenPieces = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [arriving, setArriving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const now = new Map();
        for (const unit of units)now.set(`${unit.id}@${unit.hexId}`, unit.hexId);
        for (const city of cities)now.set(`city:${city.id}`, city.hexId);
        const before = seenPieces.current;
        seenPieces.current = new Set(now.keys());
        if (!before) return;
        const added = [
            ...now
        ].filter(([key])=>!before.has(key)).map(([, hex])=>hex);
        if (!added.length) return;
        setArriving(new Set(added));
        const timer = setTimeout(()=>setArriving(new Set()), 800);
        return ()=>clearTimeout(timer);
    }, [
        units,
        cities.length
    ]);
    /** Roads and own routes, per tile, as half-segments toward each linked neighbour: drawn inside the tile, under its pieces. */ const ways = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const out = new Map();
        if (!art) return out;
        const get = (id)=>{
            let entry = out.get(id);
            if (!entry) {
                entry = {
                    road: [],
                    route: []
                };
                out.set(id, entry);
            }
            return entry;
        };
        const coords = (id)=>{
            const [q, r] = id.split(',').map(Number);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(q ?? 0, r ?? 0);
        };
        const half = (from, to)=>{
            const a = coords(from), b = coords(to);
            return [
                (b.x - a.x) / 2,
                (b.y - a.y) / 2
            ];
        };
        const roads = new Set(art.roads ?? []), cityHexes = new Set(cities.map((c)=>c.hexId));
        for (const id of roads){
            const [q, r] = id.split(',').map(Number);
            for (const [dq, dr] of NEIGHBOURS){
                const n = `${(q ?? 0) + dq},${(r ?? 0) + dr}`;
                if (roads.has(n) || cityHexes.has(n)) {
                    get(id).road.push(half(id, n));
                    if (cityHexes.has(n)) get(n).road.push(half(n, id));
                }
            }
        }
        for (const route of art.routes ?? [])route.path.forEach((id, k)=>{
            for (const other of [
                route.path[k - 1],
                route.path[k + 1]
            ])if (other) get(id).route.push({
                d: half(id, other),
                suspended: route.suspended
            });
        });
        return out;
    }, [
        art?.roads,
        art?.routes,
        cities.length
    ]);
    const capitalId = data.view.player.civilization.capitalCityId;
    const handlePointerDown = (e)=>{
        if (e.button !== 0) return;
        setDrag({
            x: e.clientX,
            y: e.clientY
        });
        setMoved(false);
    };
    const handlePointerMove = (e)=>{
        if (!drag || !(e.buttons & 1)) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) {
            setMoved(true);
            // The svg scales the frame uniformly to fit, so one pixel is 1 / scale units. Sample the size with non-zero fallbacks.
            const svg = svgRef.current;
            const clientW = svg?.clientWidth || svg?.getBoundingClientRect().width || 800;
            const clientH = svg?.clientHeight || svg?.getBoundingClientRect().height || 600;
            const w = clientW > 0 ? clientW : 800, h = clientH > 0 ? clientH : 600;
            const unitsPerPixel = mesa ? 1 / camera.scale : 1 / Math.min(w / (frame.width / current.zoom), h / (frame.height / current.zoom));
            setView({
                ...current,
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clampCentre"])(frame, current.cx - dx * unitsPerPixel, current.cy - dy * unitsPerPixel)
            });
            setDrag({
                x: e.clientX,
                y: e.clientY
            });
        }
    };
    const handlePointerEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setDrag(null);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "map-stage",
        "aria-label": "Mapa do mundo",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "eyebrow",
                        children: [
                            "ATLAS DE ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(data.view.era).toUpperCase()
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 232,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            tiles.length,
                            " territórios cartografados · projeção estratégica"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 233,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                lineNumber: 231,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ref: svgRef,
                className: `world-map${art ? ' art-mode' : ''}${mesa ? ' has-board' : ''}${zoomed ? ' zoom-near' : ''}${targetSet.size ? ' has-targets' : ''}`,
                viewBox: camera.viewBox,
                "aria-label": "Mapa hexagonal interativo",
                onPointerDown: handlePointerDown,
                onPointerMove: handlePointerMove,
                onPointerUp: handlePointerEnd,
                onPointerLeave: handlePointerEnd,
                onPointerCancel: handlePointerEnd,
                onLostPointerCapture: handlePointerEnd,
                onClick: (e)=>{
                    if (!moved && onBackground && !e.target.closest('.hex')) onBackground();
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                                id: "sea-waves",
                                width: "24",
                                height: "16",
                                patternUnits: "userSpaceOnUse",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M0 8 Q6 3 12 8 T24 8",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeOpacity: ".18",
                                    strokeWidth: "1.2"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 251,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 250,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                                id: "forest-dots",
                                width: "14",
                                height: "14",
                                patternUnits: "userSpaceOnUse",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "7",
                                    cy: "7",
                                    r: "1.5",
                                    fill: "currentColor",
                                    fillOpacity: ".15"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 254,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 253,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                                id: "hills-hatching",
                                width: "18",
                                height: "18",
                                patternTransform: "rotate(45)",
                                patternUnits: "userSpaceOnUse",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: "0",
                                    y1: "0",
                                    x2: "0",
                                    y2: "18",
                                    stroke: "currentColor",
                                    strokeOpacity: ".12",
                                    strokeWidth: "1"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 257,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 256,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("filter", {
                                id: "soft-glow",
                                x: "-20%",
                                y: "-20%",
                                width: "140%",
                                height: "140%",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feGaussianBlur", {
                                        stdDeviation: "3",
                                        result: "blur"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 260,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feComposite", {
                                        in: "SourceGraphic",
                                        in2: "blur",
                                        operator: "over"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 261,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 259,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 249,
                        columnNumber: 9
                    }, this),
                    mesa && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        className: "region-backs",
                        "aria-hidden": "true",
                        children: board.filter((region)=>region.closed).map((region)=>{
                            const centres = region.hexIds.map((id)=>{
                                const [q, r] = id.split(',').map(Number);
                                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(q ?? 0, r ?? 0);
                            });
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                className: `region-back${region.homeOf ? ' is-homeland' : ''}${targetSet.size && region.hexIds.some((id)=>targetSet.has(id)) ? ' is-target' : ''}`,
                                style: region.homeOf && art?.seats[region.homeOf] ? {
                                    ['--seat']: art.seats[region.homeOf].color
                                } : undefined,
                                children: [
                                    centres.map((c, k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                            className: "region-back-hex",
                                            points: points,
                                            transform: `translate(${c.x} ${c.y}) scale(1.08)`
                                        }, k, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 269,
                                            columnNumber: 36
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        className: "region-back-edge",
                                        d: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["regionOutline"])(centres, 56)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 270,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, region.id, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 268,
                                columnNumber: 18
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 266,
                        columnNumber: 18
                    }, this),
                    tiles.map((tile)=>{
                        const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(tile.q, tile.r);
                        const city = cities.find((c)=>c.hexId === tile.id);
                        const ownerIndex = data.players.findIndex((player)=>player.id === tile.ownerId);
                        const owner = ownerIndex >= 0 ? ownerIndex + 1 : 0;
                        const isPlayerOwned = tile.ownerId === data.view.player.id;
                        const isForeign = tile.ownerId && !isPlayerOwned;
                        const isWorked = data.view.player.civilization.cities.some((c)=>c.workedHexIds.includes(tile.id));
                        const eligible = working ? data.workable.includes(tile.id) : data.claimable.includes(tile.id);
                        const isSelected = selected === tile.id;
                        const isCapital = city?.id === capitalId;
                        const stateClasses = [
                            `hex`,
                            `terrain-${tile.terrain}`,
                            `owner-${owner}`,
                            isSelected ? 'selected' : '',
                            targetSet.has(tile.id) ? `target target-${targets.kind}` : '',
                            eligible ? 'eligible' : '',
                            working && !eligible ? 'unavailable' : '',
                            isForeign ? 'foreign' : '',
                            isWorked ? 'is-worked' : '',
                            flipping.has(tile.id) ? 'flip-in' : '',
                            arriving.has(tile.id) ? 'arrive' : ''
                        ].filter(Boolean).join(' ');
                        const cityOwner = city && city.ownerId !== data.view.player.id ? data.players.find((player)=>player.id === city.ownerId)?.name : undefined;
                        const ariaTitle = `${city?.name ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(tile.terrain)}${cityOwner ? ` (${cityOwner})` : ''} ${tile.id}${isWorked ? ', trabalhado' : ''}`;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                            "data-hex": tile.id,
                            transform: `translate(${p.x} ${p.y})`,
                            role: "button",
                            tabIndex: 0,
                            "aria-pressed": isSelected,
                            "aria-label": ariaTitle,
                            className: stateClasses,
                            onClick: ()=>{
                                if (!moved) onSelect(tile.id);
                            },
                            onKeyDown: (e)=>{
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect(tile.id);
                                }
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                    children: [
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tileSummary"])({
                                            terrain: tile.terrain,
                                            id: tile.id,
                                            ownerName: tile.ownerId ? data.players.find((pl)=>pl.id === tile.ownerId)?.name : undefined,
                                            controllerCityId: tile.controllerCityId ?? null
                                        }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(tile.terrain)),
                                        eligible ? working ? ' · Elegível para trabalho' : ' · Reivindicável' : '',
                                        isWorked ? ' · Trabalhado' : ''
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 322,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                    className: "hex-base",
                                    points: points
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 329,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                    className: "hex-texture",
                                    points: innerPoints
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 332,
                                    columnNumber: 15
                                }, this),
                                owner > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                    className: "hex-owner-tint",
                                    points: innerPoints
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 335,
                                    columnNumber: 29
                                }, this),
                                art && ways.get(tile.id) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    className: "art-ways",
                                    "aria-hidden": "true",
                                    children: [
                                        ways.get(tile.id).road.map(([dx, dy], k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "0",
                                                y1: "0",
                                                x2: dx,
                                                y2: dy,
                                                className: "art-road"
                                            }, `r${k}`, false, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 338,
                                                columnNumber: 63
                                            }, this)),
                                        ways.get(tile.id).route.map((part, k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "0",
                                                y1: "0",
                                                x2: part.d[0],
                                                y2: part.d[1],
                                                className: `art-route${part.suspended ? ' is-suspended' : ''}`
                                            }, `t${k}`, false, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 339,
                                                columnNumber: 60
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 337,
                                    columnNumber: 44
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                    className: "hex-border",
                                    points: points
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 342,
                                    columnNumber: 15
                                }, this),
                                city && art ? (()=>{
                                    const mark = art.cityMarks.find((m)=>m.cityId === city.id), seat = art.seats[city.ownerId];
                                    const level = mark?.level ?? 1, color = seat?.color ?? '#9aa4a2';
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                        className: "city-anchor art-city",
                                        "data-level": level,
                                        "data-fortification": mark?.fortification.level ?? 'NONE',
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                dangerouslySetInnerHTML: svgFragment((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cityArt"])(level, 50, {
                                                    color,
                                                    seed: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["seedOf"])(city.id)
                                                }) + (mark ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fortificationArt"])(mark.fortification.level, mark.fortification.state, 50) : '') + (seat?.mark ? `<g transform="translate(30 -5)">${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["bannerArt"])(seat.mark, color, 22)}</g>` : ''))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 349,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                transform: "translate(-21 -23)",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                        x: mark?.capacity ? -15 : -9,
                                                        y: "-9",
                                                        width: mark?.capacity ? 30 : 18,
                                                        height: "18",
                                                        rx: "9",
                                                        className: "art-level-seal",
                                                        style: {
                                                            stroke: color
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 351,
                                                        columnNumber: 53
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                        className: "art-level",
                                                        y: "4",
                                                        children: mark?.capacity ? `${level}·${mark.capacity}` : level
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 351,
                                                        columnNumber: 203
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 351,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 348,
                                        columnNumber: 24
                                    }, this);
                                })() : city ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    className: `city-anchor ${isCapital ? 'is-capital' : ''}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                            x: "-24",
                                            y: "-22",
                                            width: "48",
                                            height: "42",
                                            rx: "4",
                                            className: "city-plate"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 356,
                                            columnNumber: 19
                                        }, this),
                                        isCapital ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            className: "capital-crest",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M-14 -4 L-14 -16 L-7 -10 L0 -19 L7 -10 L14 -16 L14 -4 Z M-16 -4 L16 -4 L16 -1 L-16 -1 Z",
                                                    className: "citadel-crest capital-citadel"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                    lineNumber: 361,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "0",
                                                    cy: "-21",
                                                    r: "2.5",
                                                    className: "capital-crown-gem"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                    lineNumber: 365,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 360,
                                            columnNumber: 21
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M-12 -3 L-12 -14 L-6 -14 L-6 -9 L6 -9 L6 -14 L12 -14 L12 -3 Z M-14 -3 L14 -3 L14 0 L-14 0 Z",
                                            className: "citadel-crest municipal-citadel"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 368,
                                            columnNumber: 21
                                        }, this),
                                        (()=>{
                                            const name = `${isCapital ? '★ ' : ''}${city.name}`, natural = name.length * 6.8, fitted = Math.min(natural, 92);
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                transform: "translate(0, 10)",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                        x: -Math.max(30, fitted / 2 + 6),
                                                        y: "-8",
                                                        width: Math.max(60, fitted + 12),
                                                        height: "15",
                                                        rx: "3",
                                                        className: "city-banner-bg"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 379,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                        className: "city-name",
                                                        y: "3",
                                                        ...natural > fitted ? {
                                                            textLength: fitted,
                                                            lengthAdjust: 'spacingAndGlyphs'
                                                        } : {},
                                                        children: name
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 380,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 378,
                                                columnNumber: 28
                                            }, this);
                                        })(),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            transform: "translate(0, 24)",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                    x: "-26",
                                                    y: "-6",
                                                    width: "52",
                                                    height: "12",
                                                    rx: "6",
                                                    className: "city-pill-bg"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                    lineNumber: 386,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                    className: "city-stat",
                                                    y: "3",
                                                    children: [
                                                        city.population,
                                                        " hab · ",
                                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roman"][city.development]
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 385,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 354,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    className: "rural-tile",
                                    children: [
                                        !(mesa && tile.terrain === 'UNKNOWN') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                            className: "terrain-glyph",
                                            y: "4",
                                            children: terrainGlyphs[tile.terrain]
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 394,
                                            columnNumber: 61
                                        }, this),
                                        tile.features.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                            className: "features",
                                            y: "22",
                                            children: tile.features.map((f)=>featureGlyphs[f] ?? '').join(' ')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 398,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 393,
                                    columnNumber: 17
                                }, this),
                                tile.improvement && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    transform: "translate(-25, -23)",
                                    className: "improvement-badge",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(tile.improvement)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 408,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "0",
                                            cy: "0",
                                            r: "9",
                                            className: "badge-bg"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 409,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                            className: "improvement-symbol",
                                            x: "0",
                                            y: "3.5",
                                            children: improvementIcons[tile.improvement] ?? '▤'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 410,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 407,
                                    columnNumber: 17
                                }, this),
                                (working ? worked.includes(tile.id) : isWorked) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    transform: "translate(25, -23)",
                                    className: "worked-seal",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                            children: "Território trabalhado"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 419,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "0",
                                            cy: "0",
                                            r: "8.5",
                                            className: "worked-bg"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 420,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "0",
                                            cy: "0",
                                            r: "5",
                                            className: "worked-inner"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 421,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 418,
                                    columnNumber: 17
                                }, this),
                                targetSet.has(tile.id) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                    className: "target-pulse",
                                    points: innerPoints
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 425,
                                    columnNumber: 42
                                }, this),
                                eligible && !working && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                    className: "frontier-pulse",
                                    points: innerPoints
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 428,
                                    columnNumber: 17
                                }, this),
                                (()=>{
                                    const people = peoples.find((p)=>p.hexId === tile.id && p.integratedBy === null), threat = threats.find((r)=>r.hexId === tile.id);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            people && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                transform: city && art ? 'translate(0 -40)' : 'translate(0 -28)',
                                                className: `alpha-people attitude-${people.attitude}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                        x: "-13",
                                                        y: "-10",
                                                        width: "26",
                                                        height: "20",
                                                        rx: "4",
                                                        className: "people-badge"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 154
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M-7 5V-1L0 -6L7 -1V5Z M-2 5V1H2V5",
                                                        className: "people-glyph"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 233
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                                        children: [
                                                            "Povo independente (",
                                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(people.type),
                                                            " · ",
                                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(people.attitude),
                                                            ")"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 304
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 434,
                                                columnNumber: 30
                                            }, this),
                                            threat && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                transform: city && art ? 'translate(0 -40)' : 'translate(0 -28)',
                                                className: `alpha-raid alpha-threat kind-${threat.kind} status-${threat.status}${threat.fresh ? ' is-fresh' : ''}`,
                                                "data-level": threat.level,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                        x: "-19",
                                                        y: "-10",
                                                        width: "38",
                                                        height: "20",
                                                        rx: "4",
                                                        className: "raid-badge"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 241
                                                    }, this),
                                                    threat.kind === 'PIRATE' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M-14 6L-3 6L-9 -6Z M-9 -6V7",
                                                        className: "raid-glyph"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 346
                                                    }, this) : threat.status === 'CAMPED' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M-14 6L-8 -6L-2 6Z M-8 -6V6",
                                                        className: "raid-glyph"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 441
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M-13 6L-3 -5M-13 -5L-3 6",
                                                        className: "raid-glyph"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 507
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                        x: "9",
                                                        y: "4",
                                                        className: "raid-count",
                                                        textAnchor: "middle",
                                                        children: [
                                                            'I',
                                                            'II',
                                                            'III'
                                                        ][threat.level - 1]
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 568
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                                        children: [
                                                            threat.kind === 'PIRATE' ? threat.status === 'CAMPED' ? 'Ancoradouro pirata' : 'Piratas' : threat.status === 'CAMPED' ? 'Acampamento' : 'Bando em marcha',
                                                            " · Ameaça ",
                                                            [
                                                                'I',
                                                                'II',
                                                                'III'
                                                            ][threat.level - 1]
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 674
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 435,
                                                columnNumber: 30
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 433,
                                        columnNumber: 24
                                    }, this);
                                })(),
                                art && (()=>{
                                    const here = units.filter((u)=>u.hexId === tile.id);
                                    if (!here.length) return null;
                                    const owners = [
                                        ...new Set(here.map((u)=>u.ownerId))
                                    ].sort((a, b)=>Number(b === data.view.player.id) - Number(a === data.view.player.id));
                                    // On a city the pieces stand at its lower corners, so the plan stays readable; in the field they take the centre.
                                    return owners.slice(0, 2).map((ownerId, slot)=>{
                                        const all = here.filter((u)=>u.ownerId === ownerId), color = art.seats[ownerId]?.color ?? '#9aa4a2', own = ownerId === data.view.player.id;
                                        // Cargo rides inside its fleet: the fleet is drawn, the cargo is a count on it.
                                        const cargo = all.filter((u)=>u.carrierId), mine = all.filter((u)=>!u.carrierId);
                                        if (!mine.length) return null;
                                        const military = mine.filter((u)=>!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CIVIL_PIECES"].has(u.kind)), civil = [
                                            ...new Set(mine.filter((u)=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CIVIL_PIECES"].has(u.kind)).map((u)=>u.kind))
                                        ];
                                        const lead = military.some((u)=>u.kind === 'FLEET') ? 'FLEET' : mine.some((u)=>u.kind === 'COASTAL_VESSEL') ? 'COASTAL_VESSEL' : military.length ? [
                                            ...military.reduce((m, u)=>m.set(u.kind, (m.get(u.kind) ?? 0) + 1), new Map())
                                        ].sort((a, b)=>b[1] - a[1])[0][0] : civil[0];
                                        const count = lead === 'FLEET' || lead === 'COASTAL_VESSEL' ? mine.filter((u)=>u.kind === lead).length : military.length || mine.filter((u)=>u.kind === lead).length, side = military.length ? civil : civil.slice(1);
                                        // Inside the hex: the lower corners of a city hex are narrow (apothem 45, circumradius 52), so pieces sit higher and smaller there.
                                        const x = city ? slot === 0 ? -23 : 23 : owners.length > 1 ? slot === 0 ? -21 : 19 : -2, y = city ? 17 : 0;
                                        const kinds = [
                                            ...all.reduce((m, u)=>m.set(u.kind, (m.get(u.kind) ?? 0) + 1), new Map())
                                        ].map(([k, n])=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(k)} ×${n}`).join(', ');
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            transform: `translate(${x} ${y})`,
                                            className: `art-stack ${own ? 'own' : 'foreign'}`,
                                            "data-lead": lead,
                                            style: own && onSelectPieces ? {
                                                cursor: 'pointer'
                                            } : undefined,
                                            onClick: own && onSelectPieces ? (e)=>{
                                                if (!moved) {
                                                    e.stopPropagation();
                                                    onSelectPieces(tile.id);
                                                }
                                            } : undefined,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                                    children: [
                                                        own ? 'Suas peças' : `Peças de ${data.players.find((p)=>p.id === ownerId)?.name ?? 'outra civilização'}`,
                                                        ": ",
                                                        kinds
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                    lineNumber: 456,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                    dangerouslySetInnerHTML: svgFragment((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pieceArt"])(lead, color, city ? 26 : 34, count, art.seats[ownerId]?.signature === lead) + side.map((kind, i)=>`<g transform="translate(${-19 - i * 17} -14)">${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pieceArt"])(kind, color, 20, 0, art.seats[ownerId]?.signature === kind)}</g>`).join(''))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                    lineNumber: 457,
                                                    columnNumber: 21
                                                }, this),
                                                cargo.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                    transform: "translate(0 -24)",
                                                    className: "art-cargo",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                            x: "-22",
                                                            y: "-8",
                                                            width: "44",
                                                            height: "15",
                                                            rx: "7"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                            lineNumber: 458,
                                                            columnNumber: 96
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                            y: "3",
                                                            children: [
                                                                "carga ",
                                                                cargo.length
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                            lineNumber: 458,
                                                            columnNumber: 149
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                    lineNumber: 458,
                                                    columnNumber: 42
                                                }, this)
                                            ]
                                        }, ownerId, true, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 455,
                                            columnNumber: 26
                                        }, this);
                                    });
                                })(),
                                !art && (()=>{
                                    const here = units.filter((u)=>u.hexId === tile.id);
                                    if (!here.length) return null;
                                    const owners = [
                                        ...new Set(here.map((u)=>u.ownerId))
                                    ].sort((a, b)=>Number(b === data.view.player.id) - Number(a === data.view.player.id));
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                        transform: "translate(0 40)",
                                        children: owners.slice(0, 2).map((ownerId, slot)=>{
                                            const mine = here.filter((u)=>u.ownerId === ownerId), index = data.players.findIndex((p)=>p.id === ownerId), own = ownerId === data.view.player.id;
                                            const military = mine.some((u)=>![
                                                    'PIONEER',
                                                    'PIONEER',
                                                    'ENVOY'
                                                ].includes(u.kind));
                                            const kinds = [
                                                ...mine.reduce((m, u)=>m.set(u.kind, (m.get(u.kind) ?? 0) + 1), new Map())
                                            ].map(([k, n])=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(k)} ×${n}`).join(', ');
                                            const x = owners.length > 1 ? slot === 0 ? -26 : 26 : 0;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                transform: `translate(${x} 0)`,
                                                className: `alpha-unit-stack owner-${index + 1} ${own ? 'own' : 'foreign'}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                        x: "-24",
                                                        y: "-9",
                                                        width: "48",
                                                        height: "18",
                                                        rx: "4",
                                                        className: "unit-badge"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 472,
                                                        columnNumber: 21
                                                    }, this),
                                                    military ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M-17 5L-9 -5M-9 -5L-7 -7M-15 -1L-11 3",
                                                        className: "unit-glyph"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 473,
                                                        columnNumber: 33
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M-16 6V-7M-16 -7H-8L-10 -4L-8 -1H-16",
                                                        className: "unit-glyph"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 473,
                                                        columnNumber: 109
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                        x: "7",
                                                        y: "4",
                                                        className: "unit-count",
                                                        textAnchor: "middle",
                                                        children: mine.length
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 474,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                                        children: [
                                                            own ? 'Suas peças' : `Peças de ${data.players[index]?.name ?? 'outra civilização'}`,
                                                            ": ",
                                                            kinds
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                        lineNumber: 475,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, ownerId, true, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 471,
                                                columnNumber: 26
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 466,
                                        columnNumber: 24
                                    }, this);
                                })()
                            ]
                        }, tile.id, true, {
                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                            lineNumber: 303,
                            columnNumber: 13
                        }, this);
                    }),
                    art && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        className: "art-borders",
                        "aria-hidden": "true",
                        children: (()=>{
                            // Territorial edges: seat color with the owner's civilization pattern, drawn once per edge between different owners.
                            const byCoord = new Map(tiles.map((t)=>[
                                    `${t.q},${t.r}`,
                                    t
                                ]));
                            return tiles.flatMap((tile)=>{
                                if (!tile.ownerId) return [];
                                const seat = art.seats[tile.ownerId], p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(tile.q, tile.r);
                                if (!seat) return [];
                                return NEIGHBOURS.flatMap(([dq, dr])=>{
                                    const n = byCoord.get(`${tile.q + dq},${tile.r + dr}`);
                                    if (n?.ownerId === tile.ownerId) return [];
                                    const np = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(tile.q + dq, tile.r + dr), [x1, y1, x2, y2] = sharedEdge(p.x, p.y, np.x, np.y, 52);
                                    const pattern = seat.mark?.border ?? 'SOLID';
                                    return [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            dangerouslySetInnerHTML: svgFragment(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0b1114" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>` + (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["borderStrokes"])(pattern, seat.color, 3).map((st)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${st}/>`).join(''))
                                        }, `${tile.id}>${dq},${dr}`, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 494,
                                            columnNumber: 23
                                        }, this)
                                    ];
                                });
                            });
                        })()
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 482,
                        columnNumber: 17
                    }, this),
                    art?.marks && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        className: "art-marks",
                        "aria-hidden": "true",
                        children: art.marks.map((mark, i)=>{
                            const tile = tiles.find((t)=>t.id === mark.hexId);
                            if (!tile) return null;
                            const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(tile.q, tile.r), same = art.marks.slice(0, i).filter((m)=>m.hexId === mark.hexId).length, w = Math.max(44, mark.label.length * 6.4 + 14);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                transform: `translate(${p.x} ${p.y})${mark.tone === 'plan' ? ` scale(${Math.max(1, 0.55 / camera.scale).toFixed(2)})` : ''}`,
                                className: `art-mark tone-${mark.tone}`,
                                children: [
                                    same === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        r: "47",
                                        className: "art-mark-halo"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 503,
                                        columnNumber: 28
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                        transform: `translate(0 ${-44 - same * 17})`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                x: -w / 2,
                                                y: "-8",
                                                width: w,
                                                height: "16",
                                                rx: "8",
                                                className: "art-mark-tag"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 504,
                                                columnNumber: 62
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                y: "4",
                                                className: "art-mark-text",
                                                children: mark.label
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                                lineNumber: 504,
                                                columnNumber: 142
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 504,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, `${mark.hexId}-${i}`, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 502,
                                columnNumber: 18
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 498,
                        columnNumber: 24
                    }, this),
                    art && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        className: "art-labels",
                        "aria-hidden": "true",
                        children: cities.flatMap((city)=>{
                            // City names sit above every tile, so the next row never covers them.
                            const tile = tiles.find((t)=>t.id === city.hexId);
                            if (!tile) return [];
                            const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(tile.q, tile.r), name = `${city.id === capitalId ? '★ ' : ''}${city.name}`, natural = name.length * 6.2, fitted = Math.min(natural, 88);
                            return [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    transform: `translate(${p.x} ${p.y + 50})`,
                                    className: "art-label",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                            x: -Math.max(26, fitted / 2 + 5),
                                            y: "-7",
                                            width: Math.max(52, fitted + 10),
                                            height: "13",
                                            rx: "3",
                                            className: "city-banner-bg"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 513,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                            className: "city-name art-city-name",
                                            y: "3",
                                            ...natural > fitted ? {
                                                textLength: fitted,
                                                lengthAdjust: 'spacingAndGlyphs'
                                            } : {},
                                            children: name
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 514,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, city.id, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 512,
                                    columnNumber: 19
                                }, this)
                            ];
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 507,
                        columnNumber: 17
                    }, this),
                    mesa && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        className: "home-banners",
                        children: board.filter((region)=>region.closed && region.homeOf && region.homeOf !== data.view.player.id).map((region)=>{
                            const seat = art?.seats[region.homeOf], who = data.players.find((player)=>player.id === region.homeOf);
                            const spots = region.hexIds.map((id)=>{
                                const [q, r] = id.split(',').map(Number);
                                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(q ?? 0, r ?? 0);
                            });
                            const cx = spots.reduce((n, c)=>n + c.x, 0) / spots.length, cy = spots.reduce((n, c)=>n + c.y, 0) / spots.length;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                className: "home-banner",
                                transform: `translate(${cx} ${cy}) scale(${Math.max(1, 0.5 / camera.scale).toFixed(2)})`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                        dangerouslySetInnerHTML: svgFragment(seat?.mark ? `<g transform="translate(0 -26)">${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$alpha$2f$table$2d$art$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["bannerArt"])(seat.mark, seat.color, 76)}</g>` : `<rect x="-14" y="-52" width="28" height="44" fill="${seat?.color ?? '#9aa4a2'}"/>`)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 523,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                        className: "home-banner-name",
                                        y: "34",
                                        textAnchor: "middle",
                                        children: who?.name ?? 'Pátria'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 524,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                        className: "home-banner-sub",
                                        y: "52",
                                        textAnchor: "middle",
                                        children: "Região Pátria · conteúdo oculto"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 525,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, region.id, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 522,
                                columnNumber: 18
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 518,
                        columnNumber: 18
                    }, this),
                    threats.some((t)=>t.intent?.nextHexId || t.intent?.targetHexId) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        className: "threat-heading",
                        "aria-hidden": "true",
                        children: threats.flatMap((threat)=>{
                            // Authoritative intention from the engine: a line to the target when it is inside the player's vision, else only the next step. Nothing is estimated here.
                            const aim = threat.intent?.targetKnown && threat.intent.targetHexId ? threat.intent.targetHexId : threat.intent?.nextHexId;
                            if (!aim || aim === threat.hexId) return [];
                            const [tq, tr] = threat.hexId.split(',').map(Number), [aq, ar] = aim.split(',').map(Number);
                            const from = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(tq ?? 0, tr ?? 0), to = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(aq ?? 0, ar ?? 0), exact = threat.intent?.targetKnown === true;
                            return [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    className: `alpha-threat-intent${exact ? ' is-target' : ' is-step'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: from.x,
                                            y1: from.y,
                                            x2: to.x,
                                            y2: to.y,
                                            className: "alpha-threat-heading"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 534,
                                            columnNumber: 108
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: to.x,
                                            cy: to.y,
                                            r: exact ? 15 : 6,
                                            className: "alpha-threat-aim"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 534,
                                            columnNumber: 193
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                                            children: exact ? `Alvo de ${threat.id}: ${threat.intent.targetKind === 'CITY' ? 'cidade' : threat.intent.targetKind === 'PORT' ? 'porto' : 'rota'} ${threat.intent.targetId}, a ${threat.intent.distance} hex(es).` : `Próximo passo de ${threat.id}; o alvo está além da névoa.`
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 534,
                                            columnNumber: 271
                                        }, this)
                                    ]
                                }, threat.id, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 534,
                                    columnNumber: 19
                                }, this)
                            ];
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 528,
                        columnNumber: 77
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                lineNumber: 236,
                columnNumber: 7
            }, this),
            mesa && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "seat-plates",
                "aria-label": "Quem está na mesa",
                children: (()=>{
                    const homes = board.filter((region)=>region.homeOf);
                    const centre = {
                        x: frame.cx,
                        y: frame.cy
                    };
                    return homes.map((region)=>{
                        const spots = region.hexIds.map((id)=>{
                            const [q, r] = id.split(',').map(Number);
                            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["position"])(q ?? 0, r ?? 0);
                        });
                        const at = {
                            x: spots.reduce((n, c)=>n + c.x, 0) / spots.length,
                            y: spots.reduce((n, c)=>n + c.y, 0) / spots.length
                        };
                        const dx = at.x - centre.x, dy = at.y - centre.y;
                        // Project the direction onto the safe rectangle: the plate sits where that ray leaves it.
                        const halfW = (size.w - safe.left - safe.right) / 2, halfH = (size.h - safe.top - safe.bottom) / 2, k = Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH) || 1;
                        const rawLeft = safe.left + halfW + dx / k * 1.0, rawTop = safe.top + halfH + dy / k * 1.0;
                        // A plate is ~180 px wide and centred on its point: keep it fully on the table even for a Pátria on the far left/right.
                        const left = Math.min(Math.max(rawLeft, 100), Math.max(100, size.w - 100)), top = Math.min(Math.max(rawTop, 18), Math.max(18, size.h - 18));
                        const who = data.players.find((player)=>player.id === region.homeOf), seat = art?.seats[region.homeOf];
                        const mine = region.homeOf === data.view.player.id;
                        const bubble = plateBubble[region.homeOf];
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            className: `seat-plate${mine ? ' is-mine' : ''}${plateTone[region.homeOf] ? ` is-${plateTone[region.homeOf]}` : ''}`,
                            style: {
                                left,
                                top,
                                ['--seat']: seat?.color ?? '#9aa4a2'
                            },
                            ...mine && onSelfPlate ? {
                                role: 'button',
                                tabIndex: 0,
                                'aria-label': 'Reagir',
                                title: 'Reagir aos outros jogadores',
                                onClick: (e)=>onSelfPlate(e.currentTarget),
                                onKeyDown: (e)=>{
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelfPlate(e.currentTarget);
                                    }
                                }
                            } : {},
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 556,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    children: who?.name ?? 'Pátria'
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 556,
                                    columnNumber: 37
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: seatStatus[region.homeOf] ?? ''
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 556,
                                    columnNumber: 67
                                }, this),
                                bubble && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "seat-bubble",
                                    role: "status",
                                    "aria-label": bubble.label,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "aria-hidden": "true",
                                            children: bubble.glyph
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 557,
                                            columnNumber: 111
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                            children: bubble.label
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                            lineNumber: 557,
                                            columnNumber: 157
                                        }, this)
                                    ]
                                }, bubble.key, true, {
                                    fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                    lineNumber: 557,
                                    columnNumber: 24
                                }, this)
                            ]
                        }, region.id, true, {
                            fileName: "[project]/apps/web/app/play/hex-map.tsx",
                            lineNumber: 554,
                            columnNumber: 18
                        }, this);
                    });
                })()
            }, void 0, false, {
                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                lineNumber: 539,
                columnNumber: 16
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-tools",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        "aria-label": "Diminuir zoom",
                        onClick: ()=>setView({
                                ...current,
                                zoom: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clampZoom"])(current.zoom / 1.25)
                            }),
                        children: "−"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 563,
                        columnNumber: 9
                    }, this),
                    mesa ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                title: "Ver a mesa inteira",
                                "aria-pressed": view === null,
                                onClick: ()=>setView(null),
                                children: "Mesa"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 566,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                title: "Voltar para a minha área ou seleção",
                                onClick: focusHere,
                                children: "Focar"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 567,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 565,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        title: "Enquadrar todo o território conhecido",
                        onClick: ()=>setView(null),
                        children: "Centralizar"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 569,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        "aria-label": "Aumentar zoom",
                        onClick: ()=>setView({
                                ...current,
                                zoom: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$map$2d$frame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clampZoom"])(current.zoom * 1.25)
                            }),
                        children: "+"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 570,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                lineNumber: 562,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-legend",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "legend-hint",
                        children: "Arraste para mover o atlas · Clique para inspecionar"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 574,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "legend-items",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        className: "legend-swatch border-claimable"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 576,
                                        columnNumber: 17
                                    }, this),
                                    " Reivindicável"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 576,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        className: "legend-swatch seal-worked"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 577,
                                        columnNumber: 17
                                    }, this),
                                    " Trabalhado"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 577,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        className: "legend-swatch icon-improved"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 578,
                                        columnNumber: 17
                                    }, this),
                                    " Melhoria"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 578,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        className: "legend-swatch mark-capital"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                        lineNumber: 579,
                                        columnNumber: 17
                                    }, this),
                                    " ★ Capital"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                                lineNumber: 579,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 575,
                        columnNumber: 9
                    }, this),
                    working && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        className: "working-prompt",
                        children: "Modo Atribuição: Selecione os territórios para os produtores trabalharem"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/hex-map.tsx",
                        lineNumber: 581,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/hex-map.tsx",
                lineNumber: 573,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/app/play/hex-map.tsx",
        lineNumber: 230,
        columnNumber: 5
    }, this);
});
}),
"[project]/apps/web/app/play/inspectors.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActionButton",
    ()=>ActionButton,
    "CityInspector",
    ()=>CityInspector,
    "EconomyTable",
    ()=>EconomyTable,
    "HexInspector",
    ()=>HexInspector,
    "PopulationManager",
    ()=>PopulationManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/app/play/presentation.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$resource$2d$display$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/app/play/resource-display.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function ActionButton({ action, title, run, busy, isPrimary = false }) {
    if (!action) return null;
    const isAvailable = action.available && !busy;
    const reasonText = action.reason ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ruleMessage"])(action.reason) : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `action-item ${isPrimary ? 'action-item-primary' : ''}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: isPrimary ? 'primary' : '',
                disabled: !isAvailable,
                title: reasonText ?? title,
                onClick: ()=>run(action),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: title
                }, void 0, false, {
                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                    lineNumber: 36,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            action.cost && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$resource$2d$display$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ResourceDisplay"], {
                values: action.cost,
                compact: true
            }, void 0, false, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 38,
                columnNumber: 23
            }, this),
            reasonText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                className: "reason-badge",
                role: "note",
                children: reasonText
            }, void 0, false, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 39,
                columnNumber: 22
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/app/play/inspectors.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
function PopulationManager({ city, send, busy }) {
    const [workers, setWorkers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(city.workers);
    const total = Object.values(workers).reduce((a, b)=>a + b, 0);
    const isValid = !busy && total === city.population && Object.values(workers).every((n)=>n >= 0 && Number.isInteger(n));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "inspector-section population-section",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        children: "Alocação de Habitantes"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `pop-counter ${total === city.population ? 'valid' : 'invalid'}`,
                        children: [
                            total,
                            " / ",
                            city.population,
                            " alocados"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "population-grid",
                children: Object.entries(workers).map(([role, n])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "population-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "role-meta",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "role-title",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(role)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        className: "role-desc",
                                        children: role === 'producers' ? 'Trabalham o território exterior' : role === 'artisans' ? 'Produzem manufaturas e materiais' : role === 'merchants' ? 'Geram riqueza e mantêm o tesouro' : role === 'scholars' ? 'Desenvolvem conhecimento e arquivos' : role === 'soldiers' ? 'Recrutar mobiliza 1 por peça terrestre' : 'Recém-chegado: arraste para um papel'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(role),
                                type: "number",
                                min: 0,
                                max: city.population,
                                value: n,
                                onChange: (e)=>setWorkers((w)=>({
                                            ...w,
                                            [role]: Number(e.target.value)
                                        }))
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 82,
                                columnNumber: 13
                            }, this)
                        ]
                    }, role, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "primary apply-pop-btn",
                disabled: !isValid,
                onClick: ()=>void send({
                        type: 'ASSIGN_POPULATION',
                        cityId: city.id,
                        workers
                    }),
                children: "Aplicar distribuição"
            }, void 0, false, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                className: "hint-text",
                children: "Dica: Reduza territórios trabalhados antes de reduzir produtores abaixo desse total."
            }, void 0, false, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/app/play/inspectors.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
function EconomyTable({ production, labels = {}, help }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "table-scroll",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "economy-matrix",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("caption", {
                    children: [
                        "Produção estimada por manutenção",
                        help && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                            children: [
                                " ",
                                help
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                            lineNumber: 122,
                            columnNumber: 59
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                    lineNumber: 122,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                children: "Fonte"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this),
                            Object.keys(production.total).map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    children: labels[k] ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(k)
                                }, k, false, {
                                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                    lineNumber: 127,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                    lineNumber: 123,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: [
                        production.sources.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(s.source)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this),
                                    Object.values(s.delta).map((v, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: v > 0 ? 'pos-val' : v < 0 ? 'neg-val' : '',
                                            children: v > 0 ? `+${v}` : v
                                        }, i, false, {
                                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                            lineNumber: 136,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, s.source, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "total-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    children: "Total Líquido"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                    lineNumber: 143,
                                    columnNumber: 13
                                }, this),
                                Object.values(production.total).map((v, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: v > 0 ? 'pos-val' : v < 0 ? 'neg-val' : '',
                                        children: v > 0 ? `+${v}` : v
                                    }, i, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 145,
                                        columnNumber: 15
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                            lineNumber: 142,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                    lineNumber: 131,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/web/app/play/inspectors.tsx",
            lineNumber: 121,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/app/play/inspectors.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
function CityInspector({ data, city, send, run, busy, browse, assign }) {
    const details = data.cities.find((c)=>c.id === city.id);
    const config = data.view.config;
    const infrastructure = data.view.cityInfrastructure.find((c)=>c.cityId === city.id);
    const isCapital = city.id === data.view.player.civilization.capitalCityId;
    const maxDev = city.development >= config.maxDevelopment;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "inspector-content",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inspector-title",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "eyebrow",
                        children: isCapital ? 'CAPITAL DO REINO' : 'MUNICÍPIO URBANO'
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: city.name
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            city.population,
                            " habitantes · Desenvolvimento ",
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roman"][city.development]
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 185,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "vital-badges",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "badge-pill pop-badge",
                                children: [
                                    "👥 ",
                                    city.population,
                                    " hab"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 187,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "badge-pill dev-badge",
                                children: [
                                    "Nível ",
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roman"][city.development]
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `badge-pill stability-badge ${details?.category?.toLowerCase()}`,
                                children: [
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(details?.category ?? 'STABLE'),
                                    " (",
                                    city.stability,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 186,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 182,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overview-strip",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "stability-meter-box",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "meter-label",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        title: "Ordem local e coesão das instituições urbanas.",
                                        children: "Estabilidade Social"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 198,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: [
                                            city.stability,
                                            " / 100"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 199,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 197,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("meter", {
                                min: "0",
                                max: "100",
                                value: city.stability,
                                "aria-label": "Estabilidade"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 201,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 196,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "meta-line",
                        children: [
                            "Fundada na Rodada ",
                            city.foundedRound,
                            " · Crescimento: ",
                            city.growthProgress,
                            " / ",
                            infrastructure?.growthThreshold,
                            " alimento"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                open: true,
                className: "inspector-collapsible",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        children: "Economia & Produção"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "collapsible-body",
                        children: [
                            details && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EconomyTable, {
                                production: details.production
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 212,
                                columnNumber: 23
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "admin-stat-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Aporte administrativo da infraestrutura:"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 214,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: [
                                            "+",
                                            infrastructure?.administrativeCapacity ?? 0
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 215,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 213,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "admin-stat-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Capacidade da guarnição defensiva:"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 218,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: infrastructure?.garrisonCapacity ?? 0
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 219,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 217,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 209,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                open: true,
                className: "inspector-collapsible",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        children: "Habitantes & Trabalho"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 226,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "collapsible-body",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PopulationManager, {
                            city: city,
                            send: send,
                            busy: busy || data.view.phase !== 'PLANNING'
                        }, `${city.id}-${data.view.version}`, false, {
                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                            lineNumber: 228,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 225,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                open: true,
                className: "inspector-collapsible",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        children: "Território Trabalhado"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 239,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "collapsible-body",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "territory-stat-card",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-value",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: city.workedHexIds.length
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                            lineNumber: 243,
                                            columnNumber: 15
                                        }, this),
                                        " / ",
                                        city.workers.producers
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                    lineNumber: 242,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: [
                                        city.workedHexIds.length,
                                        " trabalhados · ",
                                        data.workable.length,
                                        " elegíveis · ",
                                        city.workers.producers,
                                        " produtores"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                    lineNumber: 245,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "action-secondary",
                                    disabled: busy || data.view.phase !== 'PLANNING',
                                    onClick: assign,
                                    children: "Atribuir território"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                    lineNumber: 248,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                            lineNumber: 241,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 240,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 238,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                className: "inspector-collapsible",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        children: "Desenvolvimento e especialização"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 262,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "collapsible-body",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "tier-info",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        title: "Capacidade urbana da cidade.",
                                        children: [
                                            "Desenvolvimento ",
                                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roman"][city.development],
                                            " · Limite populacional ",
                                            config.developmentPopulationCaps[city.development - 1]
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 265,
                                        columnNumber: 13
                                    }, this),
                                    !maxDev && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "next-tier-hint",
                                        children: [
                                            "Próximo: ",
                                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roman"][city.development + 1],
                                            " · Limite ",
                                            config.developmentPopulationCaps[city.development]
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 269,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 264,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ActionButton, {
                                action: data.actions.find((a)=>a.command.type === 'DEVELOP_CITY'),
                                title: "Desenvolver cidade",
                                run: run,
                                busy: busy,
                                isPrimary: true
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 275,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "specialization-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "spec-label",
                                        children: "Especialização Municipal:"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 284,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: city.specialization ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(city.specialization) : 'Não definida'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 285,
                                        columnNumber: 13
                                    }, this),
                                    !city.specialization && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "action-secondary",
                                        disabled: busy || data.view.phase !== 'PLANNING',
                                        onClick: ()=>browse('SPECIALIZE_CITY'),
                                        children: "Escolher especialização"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 287,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 283,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 263,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 261,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                open: true,
                className: "inspector-collapsible",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        children: "Distritos & Edifícios"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 302,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "collapsible-body",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "slots-header",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Capacidade de Distritos:"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 305,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: [
                                            city.districts.length,
                                            " / ",
                                            config.territory.districtSlots[city.development - 1],
                                            " slots"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 306,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 304,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "slots",
                                children: [
                                    city.districts.map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "slot",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "slot-head",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(d.type)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                                            lineNumber: 313,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "slot-badge",
                                                            children: "Distrito"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                                            lineNumber: 314,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                                    lineNumber: 312,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    className: "slot-building",
                                                    children: city.buildings.filter((b)=>config.territory.buildings[b.type].district === d.type).map((b)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(b.type)).join(', ') || 'Sem edifício construído'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                                    lineNumber: 316,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, d.type, true, {
                                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                            lineNumber: 311,
                                            columnNumber: 15
                                        }, this)),
                                    city.districts.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "empty-hint",
                                        children: "Nenhum distrito construído. Use slots disponíveis para expandir a cidade."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 325,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 309,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "button-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "action-secondary",
                                        disabled: busy || data.view.phase !== 'PLANNING',
                                        onClick: ()=>browse('BUILD_DISTRICT'),
                                        children: "Construir distrito"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 330,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "action-secondary",
                                        disabled: busy || data.view.phase !== 'PLANNING',
                                        onClick: ()=>browse('BUILD_BUILDING'),
                                        children: "Construir edifício"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                        lineNumber: 338,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                                lineNumber: 329,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 303,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 301,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/app/play/inspectors.tsx",
        lineNumber: 180,
        columnNumber: 5
    }, this);
}
function HexInspector({ data, hexId, run, busy, browse }) {
    const tile = data.view.visibleTerritory.find((t)=>t.id === hexId);
    if (!tile) return null;
    const cities = [
        ...data.view.player.civilization.cities,
        ...data.view.visibleCities
    ];
    const worked = data.view.player.civilization.cities.find((c)=>c.workedHexIds.includes(tile.id));
    const isOwner = tile.ownerId === data.view.player.id;
    const ownerPlayer = data.players.find((p)=>p.id === tile.ownerId);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "inspector-content hex-inspector",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inspector-title",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "eyebrow",
                        children: [
                            "TERRITÓRIO HEXAGONAL ",
                            tile.id
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 378,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(tile.terrain)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 379,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "features-list",
                        children: tile.features.map(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"]).join(' · ') || 'Sem características geomorfológicas especiais'
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 380,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 377,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                className: "status-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Soberania"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 387,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        className: isOwner ? 'owner-player' : ownerPlayer ? 'owner-foreign' : 'owner-free',
                        children: ownerPlayer?.name ?? 'Livre (Não reclamado)'
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 388,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Controle Urbano"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 392,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: cities.find((c)=>c.id === tile.controllerCityId)?.name ?? 'Nenhum'
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 393,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Melhoria"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 395,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: tile.improvement ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(tile.improvement) : 'Nenhuma'
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 396,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Trabalhado por"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 398,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: worked?.name ?? (tile.ownerId && tile.ownerId !== data.view.player.id ? 'Informação protegida' : 'Ninguém')
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 399,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Distância da capital"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 403,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: [
                            data.distance,
                            " hexes"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 404,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 386,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "yield-card",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Produção Territorial"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 409,
                        columnNumber: 9
                    }, this),
                    tile.yield && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$resource$2d$display$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ResourceDisplay"], {
                        values: tile.yield
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 410,
                        columnNumber: 24
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        className: "yield-note",
                        children: "Rendimento creditado a cada manutenção quando alocado a um produtor ativo."
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 411,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 408,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hex-actions-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Ações Territoriais"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 418,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ActionButton, {
                        action: data.actions.find((a)=>a.command.type === 'CLAIM_HEX'),
                        title: "Reivindicar território",
                        run: run,
                        busy: busy,
                        isPrimary: true
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 420,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "action-item",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "action-secondary",
                            disabled: busy || data.view.phase !== 'PLANNING' || !isOwner,
                            onClick: ()=>browse('IMPROVE_HEX'),
                            children: "Melhorar território"
                        }, void 0, false, {
                            fileName: "[project]/apps/web/app/play/inspectors.tsx",
                            lineNumber: 429,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 428,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ActionButton, {
                        action: data.actions.find((a)=>a.command.type === 'FOUND_CITY'),
                        title: "Fundar cidade",
                        run: ()=>browse('FOUND_CITY'),
                        busy: busy,
                        isPrimary: true
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 439,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "rule-note",
                        children: [
                            "Distância mínima entre centros urbanos: ",
                            data.view.config.territory.minimumCityDistance,
                            " hexes."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/inspectors.tsx",
                        lineNumber: 447,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/play/inspectors.tsx",
                lineNumber: 417,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/app/play/inspectors.tsx",
        lineNumber: 375,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/app/play/map-frame.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Pure geometry for the atlas: where tiles sit and which frame shows exactly the tiles the server projected. No React, no state. */ __turbopack_context__.s([
    "DEFAULT_SAFE",
    ()=>DEFAULT_SAFE,
    "HEX_HALF_HEIGHT",
    ()=>HEX_HALF_HEIGHT,
    "HEX_HALF_WIDTH",
    ()=>HEX_HALF_WIDTH,
    "MAX_ZOOM",
    ()=>MAX_ZOOM,
    "MIN_ZOOM",
    ()=>MIN_ZOOM,
    "cameraBox",
    ()=>cameraBox,
    "clampCentre",
    ()=>clampCentre,
    "clampZoom",
    ()=>clampZoom,
    "fitScale",
    ()=>fitScale,
    "mapFrame",
    ()=>mapFrame,
    "position",
    ()=>position,
    "regionOutline",
    ()=>regionOutline,
    "tileSummary",
    ()=>tileSummary,
    "viewBoxOf",
    ()=>viewBoxOf
]);
const position = (q, r)=>({
        x: 80 + 56 * Math.sqrt(3) * (q + r / 2),
        y: 80 + 84 * r
    });
const HEX_HALF_WIDTH = 45;
const HEX_HALF_HEIGHT = 52;
function mapFrame(tiles, { padding = 24, minWidth = 300, minHeight = 260 } = {}) {
    if (tiles.length === 0) return {
        x: 0,
        y: 0,
        width: 600,
        height: 500,
        cx: 300,
        cy: 250
    };
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    for (const tile of tiles){
        const { x, y } = position(tile.q, tile.r);
        left = Math.min(left, x - HEX_HALF_WIDTH);
        right = Math.max(right, x + HEX_HALF_WIDTH);
        top = Math.min(top, y - HEX_HALF_HEIGHT);
        bottom = Math.max(bottom, y + HEX_HALF_HEIGHT);
    }
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    const width = Math.max(right - left + 2 * padding, minWidth), height = Math.max(bottom - top + 2 * padding, minHeight);
    return {
        x: cx - width / 2,
        y: cy - height / 2,
        width,
        height,
        cx,
        cy
    };
}
const MIN_ZOOM = 0.5, MAX_ZOOM = 4;
const clampZoom = (zoom)=>Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
function viewBoxOf(frame, view) {
    if (!view) return `${frame.x} ${frame.y} ${frame.width} ${frame.height}`;
    const width = frame.width / view.zoom, height = frame.height / view.zoom;
    return `${view.cx - width / 2} ${view.cy - height / 2} ${width} ${height}`;
}
const clampCentre = (frame, cx, cy)=>({
        cx: Math.min(frame.x + frame.width, Math.max(frame.x, cx)),
        cy: Math.min(frame.y + frame.height, Math.max(frame.y, cy))
    });
function tileSummary(tile, terrainLabel) {
    if (tile.terrain === 'UNKNOWN') return `${terrainLabel} · ${tile.id}`;
    return `${terrainLabel} · ${tile.id} · ${tile.ownerName ?? 'Livre'} · Controle: ${tile.controllerCityId ?? 'nenhum'}`;
}
const DEFAULT_SAFE = {
    top: 76,
    bottom: 132,
    left: 16,
    right: 16
};
const fitScale = (frame, size, safe)=>Math.max(0.05, Math.min((size.w - safe.left - safe.right) / frame.width, (size.h - safe.top - safe.bottom) / frame.height));
function cameraBox(frame, size, safe, view) {
    const scale = fitScale(frame, size, safe) * (view?.zoom ?? 1), cx = view?.cx ?? frame.cx, cy = view?.cy ?? frame.cy;
    const sx = (safe.left + (size.w - safe.right)) / 2, sy = (safe.top + (size.h - safe.bottom)) / 2;
    return {
        viewBox: `${cx - sx / scale} ${cy - sy / scale} ${size.w / scale} ${size.h / scale}`,
        scale
    };
}
function regionOutline(centres, r) {
    const key = (x, y)=>`${x.toFixed(1)},${y.toFixed(1)}`, edges = new Map(), count = new Map();
    for (const c of centres){
        const corners = Array.from({
            length: 6
        }, (_, i)=>{
            const a = (60 * i - 30) * Math.PI / 180;
            return [
                c.x + r * Math.cos(a),
                c.y + r * Math.sin(a)
            ];
        });
        for(let i = 0; i < 6; i++){
            const a = corners[i], b = corners[(i + 1) % 6], id = [
                key(a[0], a[1]),
                key(b[0], b[1])
            ].sort().join('|');
            edges.set(id, [
                a[0],
                a[1],
                b[0],
                b[1]
            ]);
            count.set(id, (count.get(id) ?? 0) + 1);
        }
    }
    return [
        ...edges
    ].filter(([id])=>count.get(id) === 1).map(([, e])=>`M${e[0].toFixed(1)},${e[1].toFixed(1)}L${e[2].toFixed(1)},${e[3].toFixed(1)}`).join('');
}
}),
"[project]/apps/web/app/play/presentation.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "label",
    ()=>label,
    "labels",
    ()=>labels,
    "roman",
    ()=>roman,
    "ruleMessage",
    ()=>ruleMessage
]);
const labels = {
    EXPANSION: 'Expansão',
    CIVILIZATION: 'Civilização',
    EMPIRES: 'Impérios',
    HEGEMONY: 'Hegemonia',
    food: 'Alimento',
    materials: 'Materiais',
    wood: 'Madeira',
    stone: 'Pedra',
    metal: 'Metal',
    wealth: 'Riqueza',
    knowledge: 'Conhecimento',
    influence: 'Influência',
    culture: 'Cultura',
    producers: 'Produtores',
    artisans: 'Artesãos',
    merchants: 'Mercadores',
    scholars: 'Eruditos',
    soldiers: 'Soldados',
    unassigned: 'Disponível',
    PROTO_GOVERNANCE: 'Governo inicial',
    MONARCHY: 'Monarquia',
    REPUBLIC: 'República',
    OLIGARCHY: 'Oligarquia',
    THEOCRACY: 'Teocracia',
    CONFEDERATION: 'Confederação',
    AGRARIAN: 'Agrário',
    COMMERCIAL: 'Comercial',
    ACADEMIC: 'Acadêmico',
    ADMINISTRATIVE: 'Administrativo',
    MILITARY: 'Militar',
    INDUSTRIAL: 'Industrial',
    CULTURAL: 'Cultural',
    GRANARY: 'Celeiro',
    MARKET: 'Mercado',
    LIBRARY: 'Biblioteca',
    ARCHIVE: 'Arquivo',
    BARRACKS: 'Quartel',
    WORKSHOP: 'Oficina',
    CULTURAL_CENTER: 'Centro cultural',
    FARM: 'Fazenda',
    LUMBER_CAMP: 'Serraria',
    QUARRY: 'Pedreira',
    MINE: 'Mina',
    FISHERY: 'Pesqueiro',
    PLAINS: 'Planície',
    FOREST: 'Floresta',
    HILLS: 'Colinas',
    MOUNTAINS: 'Montanhas',
    COAST: 'Costa',
    SEA: 'Mar',
    UNKNOWN: 'Desconhecido',
    RIVER: 'Rio',
    FERTILE: 'Fértil',
    TIMBER: 'Madeira',
    STONE: 'Pedra',
    METAL: 'Metal',
    FISH: 'Peixe',
    population: 'População',
    terrain: 'Terreno',
    feature: 'Características',
    improvement: 'Melhoria',
    district: 'Distrito',
    building: 'Edifício',
    specialization: 'Especialização',
    government: 'Governo',
    stability: 'Estabilidade',
    CRITICAL: 'Crítica',
    UNSTABLE: 'Instável',
    TENSE: 'Tensa',
    STABLE: 'Estável',
    PROSPEROUS: 'Próspera',
    VILLAGE: 'Aldeia',
    TOWN: 'Vila',
    CITY_STATE: 'Cidade-estado',
    HOSTILE: 'Hostil',
    WARY: 'Desconfiado',
    NEUTRAL: 'Neutro',
    FRIENDLY: 'Amistoso',
    INFANTRY: 'Infantaria',
    GUARD: 'Guarda',
    RANGED: 'Arqueiros',
    CAVALRY: 'Cavalaria',
    SIEGE: 'Engenho de cerco',
    FLEET: 'Frota',
    COASTAL_VESSEL: 'Embarcação Costeira',
    PIONEER: 'Pioneiro',
    ENVOY: 'Enviado',
    PRODUCER: 'Produtor',
    ARTISAN: 'Artesão',
    MERCHANT: 'Mercador',
    SCHOLAR: 'Estudioso',
    SOLDIER: 'Soldado',
    MAINTENANCE: 'Manutenção',
    PLANNING: 'Planejamento',
    RESOLUTION: 'Resolução',
    REACTION: 'Reação',
    END_ROUND: 'Fim da rodada',
    FOUNDATION: 'Fundação'
};
const label = (key)=>labels[key] ?? key;
const roman = [
    '',
    'I',
    'II',
    'III',
    'IV',
    'V'
];
function ruleMessage(reason) {
    const code = reason.split(':')[0] ?? '';
    const messages = {
        WRONG_PHASE: 'Disponível durante Planejamento. Avance a fase.',
        HEX_NOT_FREE: 'Território já possui proprietário.',
        HEX_NOT_OWNED: 'Requer território da sua civilização.',
        OUT_OF_RANGE: 'Fora do alcance administrativo da cidade.',
        DISCONNECTED_TERRITORY: 'Requer conexão territorial com a cidade.',
        INVALID_TERRITORY: 'Mar e terreno desconhecido não podem ser reivindicados.',
        INSUFFICIENT_RESOURCES: 'Recursos insuficientes para o custo indicado.',
        CITY_TOO_CLOSE: 'Distância mínima entre cidades não atendida.',
        INVALID_CITY_SITE: 'Requer terreno permitido, sem cidade e sem trabalhadores.',
        CITY_NOT_OWNED: 'Esta cidade pertence a outra civilização.',
        INVALID_ALLOCATION: 'Distribuição incompatível com população ou territórios trabalhados.',
        INVALID_WORKED_HEXES: 'Use um território elegível por produtor, sem repetição.',
        INVALID_IMPROVEMENT: 'Melhoria incompatível com terreno ou características.',
        ALREADY_IMPROVED: 'Território já possui melhoria. Troca indisponível.',
        DISTRICT_LIMIT: 'Sem slots. Desenvolva a cidade.',
        DUPLICATE_DISTRICT: 'Distrito já construído.',
        MISSING_DISTRICT: 'Construa primeiro o distrito correspondente.',
        DUPLICATE_BUILDING: 'Edifício já construído.',
        ALREADY_SPECIALIZED: 'Especialização permanente já escolhida.',
        GOVERNMENT_ALREADY_ADOPTED: 'Governo já adotado.',
        MAX_DEVELOPMENT: 'Desenvolvimento máximo.',
        DEVELOPMENT_REQUIRED: 'Desenvolvimento insuficiente.',
        CRITICAL_STABILITY: 'Estabilidade crítica impede desenvolvimento.',
        VERSION_CONFLICT: 'Estado atualizado por outra ação. Revise e tente novamente.',
        FORBIDDEN: 'Comando não autorizado para esta perspectiva.'
    };
    return messages[code] ?? reason;
}
}),
"[project]/apps/web/app/play/resource-display.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ResourceDisplay",
    ()=>ResourceDisplay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/app/play/presentation.ts [app-ssr] (ecmascript)");
;
;
const paths = {
    food: 'M12 21V4M12 10C4 10 4 3 4 3C12 3 12 10 12 10M12 16C20 16 20 9 20 9C12 9 12 16 12 16',
    materials: 'M3 18L8 5L16 3L21 16L14 21Z M8 5L14 21M8 5L21 16',
    wood: 'M12 2L6 10H9L4 17H10V22H14V17H20L15 10H18Z',
    stone: 'M4 19L7 8L14 4L21 11L18 20Z M7 8L18 20M14 4L12 14',
    metal: 'M7 3H17L20 8L17 21H7L4 8Z M4 8H20M9 8L10 21M15 8L14 21',
    wealth: 'M12 2L22 12L12 22L2 12ZM12 7V17M8 12H16',
    knowledge: 'M12 6Q7 2 2 5V20Q7 17 12 21Q17 17 22 20V5Q17 2 12 6V21',
    influence: 'M12 22V3M4 5H20L17 13H7ZM7 20H17',
    culture: 'M4 20H20M6 20V9L12 4L18 9V20M10 20V14H14V20'
};
function ResourceDisplay({ values, compact = false, caps, labels = {} }) {
    const name = (key)=>labels[key] ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$app$2f$play$2f$presentation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["label"])(key);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `resources ${compact ? 'compact' : ''}`,
        children: Object.entries(values).filter(([, n])=>!compact || n !== 0).map(([key, n])=>{
            const cap = caps?.[key], full = cap !== undefined && n >= cap;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `resource ${key}${full ? ' full' : ''}`,
                title: cap === undefined ? name(key) : `${name(key)}: ${n} de ${cap} no armazém${full ? ' · cheio, o excedente é descartado' : ''}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        "aria-hidden": "true",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: paths[key]
                        }, void 0, false, {
                            fileName: "[project]/apps/web/app/play/resource-display.tsx",
                            lineNumber: 21,
                            columnNumber: 257
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/play/resource-display.tsx",
                        lineNumber: 21,
                        columnNumber: 213
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            !compact && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: name(key)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/resource-display.tsx",
                                lineNumber: 21,
                                columnNumber: 305
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                children: n
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/resource-display.tsx",
                                lineNumber: 21,
                                columnNumber: 332
                            }, this),
                            cap !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "resource-meter",
                                "aria-hidden": "true",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                    style: {
                                        width: `${Math.min(100, Math.round(n / Math.max(cap, 1) * 100))}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/app/play/resource-display.tsx",
                                    lineNumber: 21,
                                    columnNumber: 416
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/app/play/resource-display.tsx",
                                lineNumber: 21,
                                columnNumber: 364
                            }, this),
                            compact && ` ${name(key)}`
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/app/play/resource-display.tsx",
                        lineNumber: 21,
                        columnNumber: 286
                    }, this)
                ]
            }, key, true, {
                fileName: "[project]/apps/web/app/play/resource-display.tsx",
                lineNumber: 21,
                columnNumber: 12
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/apps/web/app/play/resource-display.tsx",
        lineNumber: 19,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=apps_web_app_play_0qr3_hx._.js.map