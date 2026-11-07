/* ═══════════════════════════════════════════════════════════════
   logic.js : Intelligence artificielle, un voyage
   Dépend de index.html (structure) et style.css (classes d’état).
   Modules : Art · Net · Llm · Hud · Overlays · Screen · Deck · Menu · Controls
   ═══════════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ───────── 1. Configuration ───────── */
const CONFIG = { lockMs: 320, mouseNavigates: false, storageKey: 'ia-voyage-position' };
const CHAPTER_NAMES = ['Le début', 'Le voyage', 'La course', 'L’intérieur', 'L’application'];
// Réseau d’arrière-plan : [nombre de points, intensité des liens], par scène puis par étape
const NET_BY_SCENE = {
  'scene-1-ouverture': [[1, 1], [14, 1], [60, 1], [60, .4]],
  'scene-1-quotidien': [[34, .28]],
  'scene-1-questions': [[34, .3]],
  'scene-4-machine':   [[14, .08]],
  'scene-5-final':     [[60, .5]]
};
const NET_BY_CHAPTER = { 1: [34, .28], 2: [10, .12], 3: [26, .18], 4: [40, .2], 5: [22, .2] };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ───────── 2. Illustrations SVG (injectées dans .illustration[data-illustration]) ───────── */
const Art = (() => {
  const shape = (tag, attrs, acc) => `<${tag} class="draw${acc ? ' accent' : ''}" pathLength="1" ${attrs}/>`;
  const P = (d, a) => shape('path', `d="${d}"`, a);
  const R = (x, y, w, h, rx, a) => shape('rect', `x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx || 0}"`, a);
  const C = (x, y, r, a) => shape('circle', `cx="${x}" cy="${y}" r="${r}"`, a);
  const T = (x, y, s, size) => `<text x="${x}" y="${y}" font-size="${size || 16}">${s}</text>`;
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');

  const library = {
    telephone: () => R(30, 8, 60, 134, 10) + P('M52 17h16') + C(60, 72, 14, 1) +
      P('M42 54v-8h8M78 54v-8h-8M42 90v8h8M78 90v8h-8', 1) + P('M54 70v2M66 70v2M55 79q5 4 10 0', 1),
    traduction: () => P('M10 20h58v42H38l-12 12V62H10z') + P('M52 80h58v42H94l-12 12v-12H52z', 1) + T(39, 49, 'A', 22) + T(81, 109, '文', 22),
    robot: () => P('M60 22V10') + C(60, 7, 3, 1) + R(28, 22, 64, 44, 10) + C(46, 44, 5, 1) + C(74, 44, 5, 1) +
      P('M48 56h24') + R(36, 74, 48, 50, 8) + P('M36 88H20v28M84 88h16v28M48 124v18M72 124v18'),
    chatbot: () => R(12, 14, 96, 56, 12) + P('M34 70v14l16-14') + C(44, 42, 2.5, 1) + C(60, 42, 2.5, 1) + C(76, 42, 2.5, 1) +
      R(40, 96, 68, 38, 10) + P('M52 109h44M52 121h28'),
    regles: () => rep(3, k => R(20, 20 + k * 55, 130, 40, 6) + T(85, 45 + k * 55, 'si …') +
      P(`M155 ${40 + k * 55}h50`, 1) + R(210, 20 + k * 55, 130, 40, 6, 1) + T(275, 45 + k * 55, 'alors …')),
    'regles-vs-exemples': () => P('M20 40h120M20 70h100M20 100h120M20 130h80') + P('M165 100h50', 1) +
      [[250, 140], [270, 125], [280, 115], [295, 100], [310, 80], [335, 70], [350, 62], [360, 55]].map(p => C(p[0], p[1], 4)).join('') +
      P('M240 150C290 140 320 60 380 50', 1) + T(80, 175, 'règles', 14) + T(310, 175, 'exemples', 14),
    'reconnaissance-image': () => R(30, 20, 200, 160, 8) + P('M30 150L90 90l40 40 30-30 70 70') + C(190, 60, 14, 1) +
      P('M250 100h40', 1) + R(300, 80, 90, 40, 6, 1) + T(345, 106, 'montagne', 14),
    attention: () => ['Le', 'chat', 'dort', 'car', 'il', 'est', 'fatigué'].map((w, i) => T([22, 62, 108, 150, 182, 222, 290][i], 150, w, 15)).join('') +
      P('M182 132Q122 40 62 132', 1) + P('M182 132Q145 90 108 132'),
    course: () => rep(4, k => P(`M40 ${50 + k * 70}H1160`) + C([880, 760, 640, 520][k], 50 + k * 70, 8, k === 0)),
    gpu: () => rep(2, r => rep(6, c => { const x = 60 + c * 120, y = 40 + r * 130;
      return R(x, y, 90, 90, 8) + R(x + 25, y + 25, 40, 40, 4, (r + c) % 3 === 0) + P(`M${x + 20} ${y}v-12M${x + 45} ${y}v-12M${x + 70} ${y}v-12`); })),
    datacenter: () => rep(6, i => { const x = 60 + i * 150;
      return R(x, 110, 110, 250, 6) + rep(6, j => P(`M${x + 14} ${140 + j * 36}h82`)) + P(`M${x + 55} 70V110`, i % 2 === 0); }) + P('M115 70H865', 1),
    donnees: () => R(50, 30, 100, 130, 6) + R(40, 40, 100, 130, 6) + R(30, 50, 100, 130, 6, 1) + P('M45 80h70M45 100h70M45 120h50'),
    parametres: () => rep(3, k => P(`M30 ${50 + k * 50}H170`) + C([70, 130, 100][k], 50 + k * 50, 9, 1)),
    neurones: () => { const xs = [30, 100, 170], ns = [3, 4, 3], y = (l, i) => 100 + (i - (ns[l] - 1) / 2) * 40; let s = '';
      for (let l = 0; l < 2; l++) for (let i = 0; i < ns[l]; i++) for (let j = 0; j < ns[l + 1]; j++) s += P(`M${xs[l]} ${y(l, i)}L${xs[l + 1]} ${y(l + 1, j)}`);
      for (let l = 0; l < 3; l++) for (let i = 0; i < ns[l]; i++) s += C(xs[l], y(l, i), 7, l === 1); return s; },
    final: () => { const N = [[120, 250], [200, 170], [200, 330], [290, 250], [330, 130], [330, 370], [420, 250]];
      const L = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [2, 5], [3, 6], [4, 6], [5, 6]];
      return L.map(([a, b]) => P(`M${N[a][0]} ${N[a][1]}L${N[b][0]} ${N[b][1]}`)).join('') + N.map(p => C(p[0], p[1], 8)).join('') +
        P('M450 250H820', 1) + rep(7, i => P(`M${450 + i * 55} 238v24`)) + C(960, 190, 26) +
        P('M920 330c0-50 25-80 40-80s40 30 40 80') + P('M890 350q70-30 140 0v70q-70-30-140 0z', 1) + P('M960 345v70', 1); }
  };
  return { build() { $$('.illustration[data-illustration]').forEach(svg => { const f = library[svg.dataset.illustration]; if (f) svg.innerHTML = f(); }); } };
})();

/* ───────── 3. Réseau d’arrière-plan (canvas) ───────── */
const Net = (() => {
  const c = $('#bg-network'), g = c.getContext('2d');
  let W, H, dpr, nodes = [], target = 1, dimT = 1, dim = 0, run = false, last = 0, acc = 0;
  const cap = () => innerWidth < 700 ? 42 : 80;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; if (REDUCED) draw(); }
  function spawn() {
    const p = nodes.length ? nodes[(Math.random() * nodes.length) | 0] : { x: W / 2, y: H / 2 };
    const a = Math.random() * 6.283, r = (60 + Math.random() * 130) * dpr;
    nodes.push({ x: Math.min(W * .97, Math.max(W * .03, p.x + Math.cos(a) * r)), y: Math.min(H * .97, Math.max(H * .03, p.y + Math.sin(a) * r)),
      vx: (Math.random() - .5) * .12 * dpr, vy: (Math.random() - .5) * .12 * dpr, a: REDUCED ? 1 : 0 });
  }
  function draw() {
    g.clearRect(0, 0, W, H);
    const L = 170 * dpr; g.lineWidth = dpr;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const n = nodes[i], m = nodes[j], d = Math.hypot(n.x - m.x, n.y - m.y);
      if (d < L) { g.strokeStyle = `rgba(143,184,255,${(1 - d / L) * .4 * dim * Math.min(n.a, m.a)})`; g.beginPath(); g.moveTo(n.x, n.y); g.lineTo(m.x, m.y); g.stroke(); }
    }
    nodes.forEach((n, i) => {
      if (i === 0) { const k = REDUCED ? 1 : 1 + .25 * Math.sin(performance.now() / 700), R = 46 * dpr * k, gr = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, R);
        gr.addColorStop(0, 'rgba(236,232,223,.55)'); gr.addColorStop(1, 'rgba(236,232,223,0)'); g.fillStyle = gr; g.beginPath(); g.arc(n.x, n.y, R, 0, 6.283); g.fill(); }
      g.fillStyle = `rgba(236,232,223,${n.a * (i === 0 ? 1 : dim)})`; g.beginPath(); g.arc(n.x, n.y, (i === 0 ? 3.2 : 1.8) * dpr, 0, 6.283); g.fill();
    });
  }
  function frame(t) {
    if (!run) return;
    const dt = Math.min(t - last, 80); last = t; acc += dt; dim += (dimT - dim) * .04;
    if (acc > 90) { acc = 0; if (nodes.length < target) spawn(); else if (nodes.length > target) nodes.pop(); }
    nodes.forEach(n => { n.a = Math.min(1, n.a + dt / 900); n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; });
    draw(); requestAnimationFrame(frame);
  }
  function start() { if (REDUCED || run) return; run = true; last = performance.now(); requestAnimationFrame(frame); }
  return {
    init() { size(); nodes = [{ x: W / 2, y: H / 2, vx: 0, vy: 0, a: REDUCED ? 1 : 0 }];
      addEventListener('resize', size);
      document.addEventListener('visibilitychange', () => { if (document.hidden) run = false; else start(); });
      start(); draw(); },
    set(n, d) { target = Math.min(n, cap()); dimT = d;
      if (REDUCED) { while (nodes.length < target) spawn(); while (nodes.length > target) nodes.pop(); dim = d; draw(); } }
  };
})();

/* ───────── 4. Diagramme interactif : comment un modèle de langage produit du texte ───────── */
const Llm = (() => {
  const NS = 'http://www.w3.org/2000/svg', DEFAULT_Q = 'Pourquoi le ciel est-il bleu ?';
  // Valeurs ILLUSTRATIVES : le premier candidat de chaque ligne est celui qui est choisi.
  const SCRIPT_DEFAULT = [
    [['Parce', .62], ['Le', .18], ['Car', .10]], [['que', .92], ['qu’', .04], ['à', .02]], [['l’air', .40], ['la', .30], ['les', .15]],
    [['diffuse', .35], ['renvoie', .20], ['disperse', .18]], [['davantage', .40], ['surtout', .25], ['mieux', .10]],
    [['la', .70], ['les', .12], ['une', .08]], [['lumière', .55], ['couleur', .15], ['clarté', .10]],
    [['bleue', .50], ['du', .20], ['solaire', .12]], [['.', .60], [',', .20], ['visible', .10]]];
  const SCRIPT_GENERIC = [
    [['Voici', .40], ['Il', .25], ['Cela', .15]], [['une', .50], ['la', .20], ['ma', .10]], [['réponse', .45], ['piste', .20], ['idée', .15]],
    [['possible', .50], ['simple', .20], ['courte', .10]], [['.', .60], [',', .20], ['!', .05]]];
  let svg, input, qText, resText, tokG, netG, attG, genG, candG, outG, stages, caps, tokens = [], script = SCRIPT_DEFAULT, chips = [], timers = [], cur = 0;

  const el = (name, attrs, text) => { const n = document.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; };
  const clear = g => { while (g.firstChild) g.removeChild(g.firstChild); };
  const link = (x1, y1, x2, y2) => el('line', { class: 'llm-link', x1, y1, x2, y2, pathLength: 1 });
  const hash = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const stop = () => { timers.forEach(clearTimeout); timers = []; };

  // Découpage SIMPLIFIÉ : un vrai tokenizer utilise un vocabulaire appris, pas des demi-mots.
  function tokenize(text) {
    const raw = text.match(/[\p{L}\p{N}’']+|[^\s\p{L}\p{N}]/gu) || [], out = [];
    raw.forEach(w => { if (w.length > 8) { const h = Math.ceil(w.length / 2); out.push(w.slice(0, h), w.slice(h)); } else out.push(w); });
    return out.slice(0, 8);
  }
  function drawIn(group) {  // fait « circuler » l’information : les liens se tracent un à un
    if (REDUCED || !group.firstChild || !group.animate) return;
    $$('.llm-link', group).forEach((l, i) => l.animate(
      [{ strokeDasharray: '1', strokeDashoffset: 1 }, { strokeDasharray: '1', strokeDashoffset: 0 }], { duration: 800, delay: i * 25, easing: 'ease-out' }));
  }
  function build() {
    const q = (input.value || '').trim() || DEFAULT_Q;
    tokens = tokenize(q); script = q === DEFAULT_Q ? SCRIPT_DEFAULT : SCRIPT_GENERIC;
    [tokG, netG, attG].forEach(clear); clear(candG); clear(outG);
    qText.textContent = q.length > 26 ? q.slice(0, 25) + '…' : q;
    // étape 2 : tokens
    const ty = i => 150 + i * 38, edge = [];
    tokens.forEach((t, i) => { const w = Math.min(180, 26 + t.length * 10); edge.push(310 + w);
      tokG.append(link(262, 240, 310, ty(i) + 15), el('rect', { class: 'llm-token', x: 310, y: ty(i), width: w, height: 30 }),
        el('text', { class: 'llm-token-text', x: 310 + w / 2, y: ty(i) + 20 }, t)); });
    // étape 3 : réseau de neurones (schéma, pas un vrai modèle)
    const pos = [[590, 4], [660, 5], [730, 4]].map(([x, n]) => Array.from({ length: n }, (_, i) => [x, 250 + (i - (n - 1) / 2) * 42]));
    for (let a = 0; a < 2; a++) pos[a].forEach(p => pos[a + 1].forEach(r => netG.append(link(p[0], p[1], r[0], r[1]))));
    tokens.forEach((t, i) => { const r = pos[0][i % 4]; netG.append(link(edge[i], ty(i) + 15, r[0], r[1])); });
    pos.flat().forEach(p => netG.append(el('circle', { class: 'llm-node', cx: p[0], cy: p[1], r: 7 })));
    // étape 4 : attention du dernier token vers les autres (poids illustratifs)
    const n = tokens.length, last = n - 1, xs = tokens.map((_, i) => n === 1 ? 660 : 560 + i * 200 / (n - 1));
    const w = tokens.map((t, i) => i === last ? -1 : hash(t + tokens[last]) % 100);
    const strong = w.map((v, i) => i).filter(i => i !== last).sort((a, b) => w[b] - w[a]).slice(0, 2);
    xs.forEach((x, i) => { if (i === last) return; const h = 26 + Math.abs(x - xs[last]) * .4;
      attG.append(el('path', { class: 'llm-link' + (strong.includes(i) ? ' is-strong' : ''), d: `M${x} 434Q${(x + xs[last]) / 2} ${434 - h * 2} ${xs[last]} 434`, pathLength: 1 })); });
    xs.forEach(x => attG.append(el('circle', { class: 'llm-node', cx: x, cy: 440, r: 5 })));
    // étape 5 : mise en place des pastilles de sortie ; étape 6 : texte final
    chips = []; let x = 800, y = 310;
    script.forEach(c => { const word = c[0][0], cw = Math.max(30, 16 + word.length * 9); if (x + cw > 1180) { x = 800; y += 38; } chips.push({ word, x, y, w: cw }); x += cw + 8; });
    const text = chips.map(c => c.word).join(' ').replace(/ ([.,!?])/g, '$1'), lines = []; let cur = '';
    text.split(' ').forEach(wd => { if ((cur + ' ' + wd).trim().length > 22) { lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }); lines.push(cur);
    clear(resText); lines.forEach((ln, i) => resText.append(el('tspan', { x: 960, dy: i ? '1.3em' : 0 }, ln)));
  }
  function showCands(k) {
    clear(candG);
    script[k].forEach(([w, p], r) => { const y = 180 + r * 26;
      candG.append(el('text', { class: 'llm-token-text', x: 800, y, style: 'text-anchor:start;font-size:15px' }, w),
        el('rect', { class: 'llm-next', x: 880, y: y - 10, width: Math.max(4, p * 60), height: 8, opacity: .35 })); });
  }
  function addChip(i) {
    const c = chips[i];
    outG.append(el('rect', { class: 'llm-token', x: c.x, y: c.y, width: c.w, height: 30 }), el('text', { class: 'llm-token-text', x: c.x + c.w / 2, y: c.y + 20 }, c.word));
  }
  function play() {   // le token suivant est choisi un par un
    stop(); clear(candG); clear(outG);
    if (REDUCED) { chips.forEach((_, i) => addChip(i)); return; }
    let k = 0;
    const next = () => { if (k >= script.length) { clear(candG); return; }
      showCands(k); later(() => { $$('rect', candG).forEach((r, i) => r.setAttribute('opacity', i ? .2 : 1)); addChip(k); k++; later(next, 450); }, 550); };
    next();
  }
  function finish() { stop(); clear(candG); clear(outG); chips.forEach((_, i) => addChip(i)); }
  function setStep(step) {
    cur = step;
    stages.forEach(g => g.classList.toggle('is-current', +g.dataset.step === step));
    caps.forEach(li => li.classList.toggle('is-current', +li.dataset.step === step));
    if (step === 2) drawIn(tokG); if (step === 3) drawIn(netG); if (step === 4) drawIn(attG);
    if (step === 5) play(); else if (step >= 6) finish(); else { stop(); clear(candG); clear(outG); }
  }
  return {
    init() {
      svg = $('#llm-diagram'); if (!svg) return null;
      input = $('#llm-input'); tokG = $('#llm-tokens'); netG = $('#llm-network'); attG = $('#llm-attention'); genG = $('#llm-generation');
      stages = $$('.llm-stage', svg); caps = $$('#llm-captions li');
      qText = el('text', { class: 'llm-label', x: 150, y: 268, style: 'font-size:13px' }); $('#llm-stage-1').append(qText);
      resText = el('text', { class: 'llm-token-text', x: 960, y: 330, style: 'text-anchor:start;font-size:16px' }); $('#llm-stage-6').append(resText);
      candG = el('g', {}); outG = el('g', {});
      genG.append(el('text', { class: 'llm-label', x: 870, y: 268, style: 'font-size:12px' }, 'valeurs illustratives'), candG, outG);
      const rerun = () => { build(); setStep(cur); };
      $('#llm-run').addEventListener('click', rerun);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); rerun(); } });
      build(); return this;
    },
    setStep, stop
  };
})();

/* ───────── 5. Interface : progression, chapitres, frise ───────── */
const Hud = (() => {
  const nav = $$('#chapter-nav li'), name = $('#chapter-name'), bar = $('#progress'), live = $('#live-region');
  const tlLayer = $('#timeline-layer'), tlTrack = $('#timeline-track'), tl = $$('#timeline-track li');
  const btnPrev = $('#btn-prev'), btnNext = $('#btn-next');
  return {
    update(scene, index, total) {
      const ratio = total > 1 ? index / (total - 1) : 0;
      bar.style.setProperty('--progress', ratio); bar.setAttribute('aria-valuenow', Math.round(ratio * 100));
      nav.forEach(li => { const n = +li.dataset.chapter; li.classList.toggle('is-active', n === scene.chapter); li.classList.toggle('is-past', n < scene.chapter); });
      name.textContent = `Chapitre ${scene.chapter} · ${CHAPTER_NAMES[scene.chapter - 1]}`;
      btnPrev.disabled = index === 0; btnNext.disabled = index === total - 1;
    },
    announce(scene) { live.textContent = scene.label; },
    timeline(scene) {   // la frise n’existe que dans le chapitre 2
      const on = scene.chapter === 2; tlLayer.classList.toggle('is-visible', on); if (!on) return;
      let idx = tl.findIndex(li => li.dataset.scene === scene.id); if (idx < 0) idx = tl.length - 1;
      tl.forEach((li, k) => { li.classList.toggle('is-active', k === idx); li.classList.toggle('is-past', k < idx); });
      tlTrack.style.setProperty('--timeline-progress', tl.length > 1 ? idx / (tl.length - 1) : 0);
    }
  };
})();

/* ───────── 6. Superpositions (aide, sources, aller à) ───────── */
const Overlays = (() => {
  let openEl = null, back = null;
  const focusables = () => $$('button,[href],input', openEl).filter(n => !n.disabled);
  return {
    isOpen: () => !!openEl,
    open(id) { const o = $('#' + id); if (!o) return; this.close(); back = document.activeElement; openEl = o; o.hidden = false; const f = focusables(); if (f[0]) f[0].focus(); },
    close() { if (!openEl) return; openEl.hidden = true; openEl = null; if (back && back.focus) back.focus(); },
    trap(e) { const f = focusables(); if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  };
})();

/* ───────── 7. Plein écran et écran allumé ───────── */
const Screen = (() => {
  const d = document, root = d.documentElement, btn = $('#btn-fullscreen');
  const supported = !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
  const current = () => d.fullscreenElement || d.webkitFullscreenElement;
  let wake = null;
  async function keepAwake() { try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { /* facultatif */ } }
  return {
    init() {
      if (!supported) { btn.hidden = true; return; }
      const sync = () => { const on = !!current(); root.classList.toggle('is-fullscreen', on); btn.textContent = on ? 'Quitter' : 'Plein écran'; };
      d.addEventListener('fullscreenchange', sync); d.addEventListener('webkitfullscreenchange', sync);
      d.addEventListener('visibilitychange', () => { if (!d.hidden) keepAwake(); });
    },
    toggle() { if (!supported) return;
      try { const p = current() ? (d.exitFullscreen || d.webkitExitFullscreen).call(d) : (root.requestFullscreen || root.webkitRequestFullscreen).call(root); if (p && p.catch) p.catch(() => {}); } catch (e) { /* refusé */ } },
    keepAwake
  };
})();

/* ───────── 8. Moteur : scènes, étapes, navigation, sauts ───────── */
const Deck = (() => {
  const scenes = $$('.stage .scene').map((el, index) => {
    const items = $$('[data-step]', el);
    return { el, index, id: el.id, chapter: +el.dataset.chapter, label: el.getAttribute('aria-label') || '',
      items, freeArt: $$('.illustration', el).filter(n => !n.closest('[data-step]')),
      steps: 1 + Math.max(0, ...items.map(n => +n.dataset.step || 0)) };
  });
  const flat = []; scenes.forEach(s => { for (let k = 0; k < s.steps; k++) flat.push([s.index, k]); });
  const state = { i: 0, lock: 0 };
  // Comportements propres à certaines scènes
  const hooks = {
    'scene-4-machine': {
      step: step => Llm.setStep(step),
      exit: () => Llm.stop()
    },
    'scene-5-merci': {   // vidéo plein écran : étape 0 = image fixe, étape 1 = lecture
      step: step => {
        const v = $('#thanks-video'); if (!v) return;
        document.documentElement.classList.add('is-video');
        if (step === 1) {
          v.currentTime = 0; v.muted = false;
          v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
        } else { v.pause(); v.currentTime = 0; }
      },
      exit: () => {
        const v = $('#thanks-video'); if (v) { v.pause(); v.currentTime = 0; }
        document.documentElement.classList.remove('is-video');
      }
    }
  };

  function applyStep(s, step) {   // identique en avant, en arrière et en saut : l’état dépend seulement de l’étape
    s.items.forEach(n => { const at = +n.dataset.step || 0, out = n.dataset.stepOut !== undefined ? +n.dataset.stepOut : Infinity;
      n.classList.toggle('is-visible', step >= at && step < out); });
    s.freeArt.forEach(n => n.classList.add('is-visible'));
    const cfg = NET_BY_SCENE[s.id] || [NET_BY_CHAPTER[s.chapter]], n = cfg[Math.min(step, cfg.length - 1)]; Net.set(n[0], n[1]);
    if (hooks[s.id] && hooks[s.id].step) hooks[s.id].step(step);
  }
  const enterScene = (s, step) => { s.el.classList.add('is-active'); applyStep(s, step); Hud.timeline(s); Hud.announce(s); };
  const exitScene = s => { s.el.classList.remove('is-active'); if (hooks[s.id] && hooks[s.id].exit) hooks[s.id].exit(); };
  function refresh() {
    const s = scenes[flat[state.i][0]];
    scenes.forEach(o => o.el.classList.toggle('is-past', o.index < s.index));
    Hud.update(s, state.i, flat.length);
    try { sessionStorage.setItem(CONFIG.storageKey, state.i); } catch (e) { /* facultatif */ }
  }
  function jump(j) {   // saute vers n’importe quelle étape de la liste plate ; refuse les appuis trop rapprochés
    if (j < 0 || j >= flat.length || j === state.i) return false;
    const now = performance.now(); if (now - state.lock < CONFIG.lockMs) return false;
    state.lock = now;
    const [a] = flat[state.i], [b, k] = flat[j];
    if (a !== b) { exitScene(scenes[a]); enterScene(scenes[b], k); } else applyStep(scenes[b], k);
    state.i = j; refresh(); return true;
  }
  const go = d => jump(state.i + d);   // +1 avancer, −1 reculer
  const goToChapter = n => jump(flat.findIndex(([si]) => scenes[si].chapter === n));
  const goToScene = id => jump(flat.findIndex(([si]) => scenes[si].id === id));
  return {
    state, go, jump, goToChapter, goToScene, scenes, total: flat.length,
    current: () => scenes[flat[state.i][0]],
    init() {
      let start = 0; try { const v = +sessionStorage.getItem(CONFIG.storageKey); if (v > 0 && v < flat.length) start = v; } catch (e) { /* facultatif */ }
      const [s0, k0] = flat[start];
      if (scenes[s0].id === 'scene-5-merci' && k0 > 0) start -= k0;   // un rechargement ne relance pas la vidéo
      state.i = start; const [si, k] = flat[start]; enterScene(scenes[si], k); refresh();
    }
  };
})();

/* ───────── 9. Menu « Aller à » ───────── */
const Menu = (() => {
  const list = () => $('#jump-list');
  return {
    build() {
      const box = list(); if (!box) return;
      let ul = null, ch = 0;
      Deck.scenes.forEach(s => {
        if (s.chapter !== ch) {
          ch = s.chapter;
          const h = document.createElement('h3'); h.textContent = `${ch}. ${CHAPTER_NAMES[ch - 1]}`;
          ul = document.createElement('ul'); box.append(h, ul);
        }
        const li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.dataset.scene = s.id; b.textContent = s.label; li.append(b); ul.append(li);
      });
      box.addEventListener('click', e => {
        const b = e.target.closest('button[data-scene]'); if (!b) return;
        Overlays.close(); Deck.goToScene(b.dataset.scene);
      });
    },
    open() {
      Overlays.open('jump-overlay');
      const cur = Deck.current().id;
      $$('#jump-list button').forEach(b => { const on = b.dataset.scene === cur; b.toggleAttribute('aria-current', on); if (on) b.scrollIntoView({ block: 'center' }); });
    }
  };
})();

/* ───────── 10. Commandes : clavier, toucher, boutons ───────── */
function bindControls() {
  const go = d => Deck.go(d);
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    Screen.keepAwake();
    const t = e.target, k = e.key;
    if (Overlays.isOpen()) { if (k === 'Escape') { e.preventDefault(); Overlays.close(); } else if (k === 'Tab') Overlays.trap(e); return; }
    if (t.matches && t.matches('input,textarea,select,[contenteditable]')) { if (k === 'Escape') t.blur(); return; }
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); if (!e.repeat) go(1); }
    else if (k === ' ') { if (t.closest && t.closest('button')) return; e.preventDefault(); if (!e.repeat) go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); if (!e.repeat) go(-1); }
    else if (/^[1-5]$/.test(k)) Deck.goToChapter(+k);
    else if (k === 'Home') Deck.jump(0);
    else if (k === 'End') Deck.goToScene('scene-5-merci');
    else if (k === 'f' || k === 'F') Screen.toggle();
    else if (k === 'g' || k === 'G') Menu.open();
    else if (k === 's' || k === 'S') Overlays.open('sources-overlay');
    else if (k === 'h' || k === 'H' || k === '?') Overlays.open('help-overlay');
    else if (k === 'v' || k === 'V') document.documentElement.classList.toggle('show-verify');   // aide de relecture
  });
  let down = null;
  document.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, type: e.pointerType }; });
  document.addEventListener('pointercancel', () => { down = null; });
  document.addEventListener('pointerup', e => {
    const d = down; down = null; Screen.keepAwake();
    if (!d || Overlays.isOpen() || e.target.closest('button,input,a,.overlay,.hud')) return;
    if (d.type === 'mouse' && !CONFIG.mouseNavigates) return;   // une souris ne fait pas avancer
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) go(e.clientX < innerWidth * .3 ? -1 : 1);
  });
  $('#btn-prev').addEventListener('click', e => { go(-1); e.currentTarget.blur(); });
  $('#btn-next').addEventListener('click', e => { go(1); e.currentTarget.blur(); });
  $('#btn-fullscreen').addEventListener('click', () => Screen.toggle());
  $('#btn-help').addEventListener('click', () => Overlays.open('help-overlay'));
  $('#btn-sources').addEventListener('click', () => Overlays.open('sources-overlay'));
  const bj = $('#btn-jump'); if (bj) bj.addEventListener('click', () => Menu.open());
  $$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-close]')) Overlays.close(); }));
}

/* ───────── 11. Démarrage ───────── */
document.documentElement.classList.remove('no-js');
Art.build(); Net.init(); Llm.init(); Screen.init(); bindControls(); Deck.init(); Menu.build();
window.Presentation = { go: Deck.go, jump: Deck.jump, state: Deck.state, scenes: Deck.scenes };   // pour tester dans la console
})();
