/*
 * Interactive Garden
 * Plain JavaScript, no build step: open index.html and it works.
 *
 * Sections: state & storage · flower drawing · planting & growing · sky & time ·
 * visitors (butterflies, bees, fireflies) · rain · sound · picture & share · UI.
 */
(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const garden = $('garden');
  const critterLayer = $('critters');
  const rainCanvas = $('rain');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const el = (tag, attrs = {}, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  };

  // ------------------------------------------------------------------
  // State & storage
  // ------------------------------------------------------------------

  const STORE_KEY = 'garden.v2';
  const MAX_FLOWERS = 250;
  const state = {
    flowers: [],       // { id, type, x (0..1 of width), h (px), color, size, bend }
    history: [],       // snapshots for undo
    type: 'mix',       // flower chosen in the toolbar
    tool: 'plant',     // 'plant' | 'water'
    timeMode: 'auto',  // 'auto' | 'sunrise' | 'day' | 'sunset' | 'night'
    sound: false,
    raining: false,
    hideHelp: false,
  };
  let nextId = 1;

  function save() {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ flowers: state.flowers, timeMode: state.timeMode, type: state.type, hideHelp: state.hideHelp }),
      );
    } catch {
      // Private mode or storage full: the garden still works, it just won't be remembered.
    }
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!saved) return;
      state.flowers = Array.isArray(saved.flowers) ? saved.flowers.filter(validFlower).slice(0, MAX_FLOWERS) : [];
      state.timeMode = ['auto', 'sunrise', 'day', 'sunset', 'night'].includes(saved.timeMode) ? saved.timeMode : 'auto';
      state.type = FLOWERS[saved.type] || saved.type === 'mix' ? saved.type : 'mix';
      state.hideHelp = Boolean(saved.hideHelp);
    } catch {
      // Ignore a broken save.
    }
  }

  const validFlower = (f) =>
    f && FLOWERS[f.type] && Number.isFinite(f.x) && Number.isFinite(f.h) && typeof f.color === 'string';

  function remember() {
    state.history.push(JSON.stringify(state.flowers));
    if (state.history.length > 50) state.history.shift();
  }

  // ------------------------------------------------------------------
  // Flower drawing. Each flower is drawn around its own base at (0, 0),
  // growing upward (negative y). Final shapes are plain SVG attributes and
  // all motion is CSS, so a saved picture shows the finished garden.
  // ------------------------------------------------------------------

  const FLOWERS = {
    daisy: { label: 'Daisy', colors: ['#ffffff', '#fff6fb', '#fdf0ff'], note: 0 },
    tulip: { label: 'Tulip', colors: ['#ff4f6d', '#ff8a3d', '#ffd23f', '#c86bfa', '#ff6fb1'], note: 2 },
    sunflower: { label: 'Sunflower', colors: ['#ffc928', '#ffb300', '#ffd84d'], note: 4 },
    rose: { label: 'Rose', colors: ['#e3254a', '#ff5c8a', '#ff9ab8', '#b5179e'], note: 5 },
    lavender: { label: 'Lavender', colors: ['#9b7bf2', '#b48cff', '#7c5ce0'], note: 7 },
    blossom: { label: 'Blossom', colors: ['#ff6fa8', '#ff9acd', '#7fd3ff', '#ffb36b'], note: 9 },
  };
  const TYPE_KEYS = Object.keys(FLOWERS);

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => clamp(Math.round(v + amt * 255), 0, 255);
    return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
  }

  // Petal helper: an ellipse pointing away from the center at `angle` degrees.
  // The rotation sits on a wrapper so the CSS unfurl animation (which uses
  // `transform`) doesn't wipe out the petal's position.
  function petal(parent, angle, dist, rx, ry, fill, i, delay = 0) {
    const wrap = el('g', { transform: `rotate(${angle})` }, parent);
    const p = el('ellipse', { cx: 0, cy: -dist, rx, ry, fill, class: 'petal' }, wrap);
    p.style.animationDelay = `${delay + i * 0.04}s`;
    return p;
  }

  const DRAW_HEAD = {
    daisy(g, f) {
      const s = f.size;
      for (let i = 0; i < 14; i++) petal(g, (360 / 14) * i, 11 * s, 3.6 * s, 10 * s, f.color, i);
      el('circle', { r: 6.5 * s, fill: '#f6c22c', class: 'petal' }, g).style.animationDelay = '0.45s';
      el('circle', { r: 3 * s, fill: '#e3a414', class: 'petal' }, g).style.animationDelay = '0.5s';
    },
    tulip(g, f) {
      const s = f.size;
      const dark = shade(f.color, -0.12);
      const cup = (d, fill, i) => {
        const p = el('path', { d, fill, class: 'petal' }, g);
        p.style.animationDelay = `${i * 0.08}s`;
      };
      cup(`M ${-12 * s} ${-2 * s} C ${-15 * s} ${-18 * s}, ${-8 * s} ${-28 * s}, ${-3 * s} ${-26 * s} L 0 ${-14 * s} Z`, dark, 0);
      cup(`M ${12 * s} ${-2 * s} C ${15 * s} ${-18 * s}, ${8 * s} ${-28 * s}, ${3 * s} ${-26 * s} L 0 ${-14 * s} Z`, dark, 1);
      cup(`M ${-10 * s} 0 C ${-12 * s} ${-16 * s}, ${-5 * s} ${-30 * s}, 0 ${-30 * s} C ${5 * s} ${-30 * s}, ${12 * s} ${-16 * s}, ${10 * s} 0 Z`, f.color, 2);
    },
    sunflower(g, f) {
      const s = f.size * 1.15;
      for (let i = 0; i < 20; i++) petal(g, 18 * i, 15 * s, 4 * s, 9 * s, i % 2 ? f.color : shade(f.color, -0.08), i);
      el('circle', { r: 10 * s, fill: '#5b3a1e', class: 'petal' }, g).style.animationDelay = '0.6s';
      for (let i = 0; i < 18; i++) {
        const a = i * 2.4;
        const r = Math.sqrt(i) * 2.2 * s;
        el('circle', { cx: Math.cos(a) * r, cy: Math.sin(a) * r, r: 0.9 * s, fill: '#8a5a2b', class: 'petal' }, g).style.animationDelay = '0.65s';
      }
    },
    rose(g, f) {
      const s = f.size;
      const rings = [
        { n: 6, d: 9, r: 8, c: shade(f.color, -0.1) },
        { n: 5, d: 5.5, r: 6.5, c: f.color },
        { n: 4, d: 2.5, r: 4.5, c: shade(f.color, 0.08) },
      ];
      let i = 0;
      rings.forEach((ring, k) => {
        for (let j = 0; j < ring.n; j++) {
          const a = (360 / ring.n) * j + k * 20;
          const wrap = el('g', { transform: `rotate(${a})` }, g);
          const p = el('circle', { cx: 0, cy: -ring.d * s, r: ring.r * s, fill: ring.c, class: 'petal' }, wrap);
          p.style.animationDelay = `${i++ * 0.035}s`;
        }
      });
      el('circle', { r: 2.6 * s, fill: shade(f.color, -0.25), class: 'petal' }, g).style.animationDelay = '0.55s';
    },
    blossom(g, f) {
      const s = f.size;
      for (let i = 0; i < 6; i++) {
        const a = ((360 / 6) * i * Math.PI) / 180;
        const p = el('circle', { cx: Math.cos(a) * 11 * s, cy: Math.sin(a) * 11 * s, r: 9 * s, fill: i % 2 ? f.color : shade(f.color, 0.08), class: 'petal' }, g);
        p.style.animationDelay = `${i * 0.06}s`;
      }
      el('circle', { r: 6 * s, fill: '#f8d56f', class: 'petal' }, g).style.animationDelay = '0.4s';
    },
  };

  /** Builds one plant. `animate` plays the growing animation (new plants only). */
  function buildPlant(f, animate) {
    const W = window.innerWidth;
    const plant = el('g', { class: 'plant', 'data-id': f.id, transform: `translate(${(f.x * W).toFixed(1)} 0)` });
    plant.dataset.id = f.id;
    const sway = el('g', { class: reduceMotion ? '' : 'sway' }, plant);
    sway.style.setProperty('--sway-dur', `${(3.4 + (f.id % 7) * 0.35).toFixed(2)}s`);
    sway.style.setProperty('--sway-delay', `${-(f.id % 5) * 0.7}s`);

    const h = f.h;
    const tipX = f.bend * 0.5;
    const tipY = -h;
    const lavender = f.type === 'lavender';
    const d = lavender
      ? `M 0 0 C ${f.bend * 0.1} ${-h * 0.4}, ${f.bend * 0.3} ${-h * 0.7}, ${tipX} ${tipY + h * 0.28}`
      : `M 0 0 C ${f.bend} ${-h * 0.35}, ${-f.bend * 0.6} ${-h * 0.7}, ${tipX} ${tipY}`;
    const stem = el('path', { d, class: `stem${animate ? ' grow-stem' : ''}`, pathLength: 1 }, sway);
    if (f.type === 'sunflower') stem.setAttribute('stroke-width', 5.5);

    // Two leaves along the stem.
    [0.32, 0.55].forEach((t, i) => {
      const pt = stem.getPointAtLength ? pointOn(stem, t) : { x: 0, y: -h * t };
      const side = i % 2 ? 1 : -1;
      const spot = el('g', { transform: `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${side * -18})` }, sway);
      const leaf = el('path', {
        d: `M 0 0 C ${side * 10} -10, ${side * 24} -8, ${side * 28} 2 C ${side * 18} 6, ${side * 8} 6, 0 0 Z`,
        class: `leaf${animate ? ' pop' : ''}`,
      }, spot);
      if (animate) leaf.style.animationDelay = `${0.45 + i * 0.15}s`;
    });

    if (lavender) {
      // A spike of small buds instead of one flower head.
      const spike = el('g', { class: `spike${animate ? ' bloom' : ''}`, transform: `translate(${tipX.toFixed(1)} ${(tipY + h * 0.28).toFixed(1)})` }, sway);
      const len = h * 0.3;
      for (let i = 0; i < 12; i++) {
        const y = -(i / 11) * len;
        const r = (3.8 - i * 0.18) * f.size;
        [-1, 1].forEach((side) => {
          const bud = el('ellipse', {
            cx: side * 2.6 * f.size,
            cy: y,
            rx: r,
            ry: r * 1.35,
            fill: side < 0 ? (i % 2 ? f.color : shade(f.color, 0.1)) : shade(f.color, -0.08),
            class: 'petal',
          }, spike);
          bud.style.animationDelay = `${(animate ? 0.9 : 0) + i * 0.05}s`;
        });
      }
      if (!animate) spike.querySelectorAll('.petal').forEach((p) => (p.style.animation = 'none'));
    } else {
      const head = el('g', { class: `head${animate ? ' bloom' : ''}`, transform: `translate(${tipX.toFixed(1)} ${tipY.toFixed(1)})` }, sway);
      DRAW_HEAD[f.type](head, f);
      if (animate) head.querySelectorAll('.petal').forEach((p) => {
        p.style.animationDelay = `${1.05 + parseFloat(p.style.animationDelay || 0)}s`;
      });
      else head.querySelectorAll('.petal').forEach((p) => (p.style.animation = 'none'));
    }
    return plant;
  }

  // Point along the stem path, measured before the element is on screen.
  const measure = el('svg', { width: 0, height: 0, style: 'position:absolute;visibility:hidden' });
  document.body.appendChild(measure);
  function pointOn(path, t) {
    const clone = path.cloneNode();
    measure.appendChild(clone);
    const len = clone.getTotalLength();
    const p = clone.getPointAtLength(len * t);
    clone.remove();
    return p;
  }

  /** Where a flower's head is on screen, for watering and visitors. */
  function headPosition(f) {
    const W = window.innerWidth;
    const lavenderDrop = f.type === 'lavender' ? f.h * 0.15 : 0;
    return { x: f.x * W + f.bend * 0.5, y: groundY() - f.h + lavenderDrop };
  }

  const groundY = () => window.innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ground-h')) + 6;

  // ------------------------------------------------------------------
  // Planting & growing
  // ------------------------------------------------------------------

  const plantsLayer = el('g', { id: 'plants' }, garden);
  const fxLayer = el('g', { id: 'fx' }, garden);

  function layout() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    garden.setAttribute('viewBox', `0 0 ${W} ${H}`);
    critterLayer.setAttribute('viewBox', `0 0 ${W} ${H}`);
    plantsLayer.setAttribute('transform', `translate(0 ${groundY().toFixed(1)})`);
    for (const node of plantsLayer.children) {
      const f = state.flowers.find((x) => x.id === Number(node.dataset.id));
      if (f) node.setAttribute('transform', `translate(${(f.x * W).toFixed(1)} 0)`);
    }
    rainCanvas.width = W;
    rainCanvas.height = H;
  }

  function renderAll() {
    plantsLayer.replaceChildren(...[...state.flowers].sort((a, b) => b.h - a.h).map((f) => buildPlant(f, false)));
    updateCount();
  }

  function plantAt(x, y) {
    if (state.flowers.length >= MAX_FLOWERS) return toast(`The garden is full (${MAX_FLOWERS} flowers). Undo or clear to plant more.`);
    const gy = groundY();
    const h = clamp(gy - y, 46, gy - 70);
    const type = state.type === 'mix' ? pick(TYPE_KEYS) : state.type;
    const f = {
      id: nextId++,
      type,
      x: clamp(x / window.innerWidth, 0, 1),
      h: Math.round(h),
      color: pick(FLOWERS[type].colors),
      size: Math.round(rnd(0.85, 1.2) * 100) / 100,
      bend: Math.round(rnd(-26, 26)),
    };
    remember();
    state.flowers.push(f);
    // Taller plants sit behind shorter ones.
    const node = buildPlant(f, true);
    const before = [...plantsLayer.children].find((n) => (state.flowers.find((x) => x.id === Number(n.dataset.id))?.h ?? 0) < f.h);
    plantsLayer.insertBefore(node, before ?? null);
    sparkleAt(x, gy - 4, '#c9f7a6');
    setTimeout(() => chime(FLOWERS[type].note), 1000);
    updateCount();
    save();
  }

  function growFlower(f, factor) {
    const gy = groundY();
    const newH = Math.round(clamp(f.h * factor, 46, gy - 60));
    if (newH === f.h) return false;
    const ratio = f.h / newH;
    f.h = newH;
    f.size = Math.min(1.6, Math.round(f.size * (1 + (factor - 1) * 0.6) * 100) / 100);
    const old = plantsLayer.querySelector(`[data-id="${f.id}"]`);
    const fresh = buildPlant(f, false);
    const sway = fresh.firstChild;
    sway.classList.add('grew');
    sway.style.setProperty('--from', ratio.toFixed(3));
    sway.addEventListener('animationend', (e) => e.animationName === 'grew' && sway.classList.remove('grew'));
    if (old) old.replaceWith(fresh);
    return true;
  }

  function waterAt(x, y) {
    // The flower whose head is nearest the click, within reach.
    let best = null;
    let bestD = 90;
    for (const f of state.flowers) {
      const p = headPosition(f);
      const dist = Math.hypot(p.x - x, p.y - y);
      const stemHit = Math.abs(f.x * window.innerWidth - x) < 22 && y > p.y && y < groundY();
      const d = stemHit ? Math.min(dist, 40) : dist;
      if (d < bestD) {
        best = f;
        bestD = d;
      }
    }
    dropsAt(x, y);
    if (!best) return toast('Click on a flower to water it');
    remember();
    if (growFlower(best, 1.14)) {
      const p = headPosition(best);
      sparkleAt(p.x, p.y, '#ffffff');
      chime(FLOWERS[best.type].note + 12);
      save();
    } else {
      toast('That flower is as tall as it can grow');
    }
  }

  function undo() {
    const prev = state.history.pop();
    if (!prev) return toast('Nothing to undo');
    state.flowers = JSON.parse(prev);
    renderAll();
    save();
  }

  function clearGarden() {
    if (!state.flowers.length) return;
    remember();
    state.flowers = [];
    renderAll();
    save();
    toast('Garden cleared. Press Undo to bring it back.');
  }

  function sparkleAt(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const s = el('circle', { cx: x + rnd(-14, 14), cy: y + rnd(-14, 8), r: rnd(1.5, 3.2), class: 'sparkle', fill: color }, fxLayer);
      s.style.animationDelay = `${i * 0.05}s`;
      setTimeout(() => s.remove(), 1200);
    }
  }

  function dropsAt(x, y) {
    for (let i = 0; i < 7; i++) {
      const dr = el('ellipse', { cx: x + rnd(-12, 12), cy: y + rnd(-6, 6), rx: 1.8, ry: 3.2, class: 'drop' }, fxLayer);
      dr.style.animationDelay = `${i * 0.04}s`;
      setTimeout(() => dr.remove(), 1000);
    }
  }

  function updateCount() {
    const n = state.flowers.length;
    $('count').textContent = n;
    $('count-label').textContent = n === 1 ? 'flower' : 'flowers';
  }

  // ------------------------------------------------------------------
  // Sky & time. t runs 0..1 over one garden day: 0 midnight, 0.5 noon.
  // ------------------------------------------------------------------

  const DAY_SECONDS = 150;
  const FIXED_TIME = { sunrise: 0.285, day: 0.5, sunset: 0.755, night: 0.02 };
  const SKY = [
    // [t, top, bottom]
    [0.0, '#0b1230', '#1d2b55'],
    [0.2, '#18224d', '#4b4a7e'],
    [0.26, '#f6a38f', '#ffd6a5'],
    [0.34, '#79c3f1', '#dff4ff'],
    [0.66, '#6fbaf0', '#e6f6ff'],
    [0.74, '#ff8c69', '#ffd29d'],
    [0.8, '#3c2f6b', '#c46a7d'],
    [0.88, '#111a3d', '#28366a'],
    [1.0, '#0b1230', '#1d2b55'],
  ];
  let clockT = 0.45;
  let displayT = 0.45;
  let lastFrame = performance.now();

  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
  };

  function skyAt(t) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const [t0, top0, bot0] = SKY[i];
      const [t1, top1, bot1] = SKY[i + 1];
      if (t >= t0 && t <= t1) {
        const k = (t - t0) / (t1 - t0);
        return [mix(top0, top1, k), mix(bot0, bot1, k)];
      }
    }
    return [SKY[0][1], SKY[0][2]];
  }

  /** 1 at midnight, 0 in daytime, smooth in between. */
  function nightness(t) {
    const fromNoon = Math.abs(t - 0.5) * 2; // 0 at noon, 1 at midnight
    return clamp((fromNoon - 0.5) / 0.3, 0, 1);
  }

  const timeName = (t) => (t < 0.22 || t > 0.86 ? 'Night' : t < 0.32 ? 'Sunrise' : t < 0.7 ? 'Day' : 'Sunset');

  function paintSky(t) {
    const [top, bottom] = skyAt(t);
    const root = document.documentElement.style;
    root.setProperty('--sky-top', top);
    root.setProperty('--sky-bottom', bottom);
    const n = nightness(t);
    root.setProperty('--night', n.toFixed(3));
    document.body.classList.toggle('night', n > 0.6);
    document.body.classList.toggle('night-ui', n > 0.5);

    // Sun and moon travel on an arc across the sky.
    const W = window.innerWidth;
    const H = window.innerHeight;
    const arc = (p) => ({ x: p * (W + 120) - 60, y: H * 0.62 - Math.sin(p * Math.PI) * H * 0.48 });
    const sunP = (t - 0.22) / 0.56;
    const moonP = ((t + 0.28) % 1) / 0.56;
    const sun = arc(clamp(sunP, -0.1, 1.1));
    const moon = arc(clamp(moonP, -0.1, 1.1));
    $('sun').style.transform = `translate(${sun.x - 42}px, ${sun.y - 42}px)`;
    $('sun').style.opacity = sunP > -0.05 && sunP < 1.05 ? 1 : 0;
    $('moon').style.transform = `translate(${moon.x - 30}px, ${moon.y - 30}px)`;
    $('moon').style.opacity = moonP > -0.05 && moonP < 1.05 ? 1 : 0;
    $('clock-label').textContent = state.timeMode === 'auto' ? `${timeName(t)} · auto` : timeName(t);
  }

  function makeStars() {
    const box = $('stars');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 110; i++) {
      const s = document.createElement('i');
      s.className = 'star';
      s.style.left = `${rnd(0, 100)}%`;
      s.style.top = `${rnd(0, 62)}%`;
      const size = rnd(1, 2.6);
      s.style.width = s.style.height = `${size}px`;
      s.style.animationDelay = `${rnd(0, 3)}s`;
      frag.appendChild(s);
    }
    box.appendChild(frag);
  }

  function makeClouds() {
    const box = $('clouds');
    for (let i = 0; i < 5; i++) {
      const c = document.createElement('div');
      c.className = 'cloud';
      c.style.top = `${rnd(6, 34)}%`;
      c.style.width = `${rnd(110, 220)}px`;
      c.style.animationDuration = `${rnd(70, 140)}s`;
      c.style.animationDelay = `${-rnd(0, 140)}s`;
      c.style.opacity = rnd(0.6, 0.95);
      box.appendChild(c);
    }
  }

  // ------------------------------------------------------------------
  // Visitors: butterflies and bees by day, fireflies at night.
  // ------------------------------------------------------------------

  const visitors = [];

  function makeVisitor(kind) {
    const g = el('g', { class: kind }, critterLayer);
    if (kind === 'butterfly') {
      const c1 = pick(['#ff9f1c', '#7b61ff', '#2ec4b6', '#ff5d8f', '#4cc9f0']);
      const c2 = shade(c1, -0.15);
      el('ellipse', { cx: -7, cy: -4, rx: 7, ry: 9, fill: c1, class: 'wing l' }, g);
      el('ellipse', { cx: -5, cy: 6, rx: 5, ry: 6, fill: c2, class: 'wing l' }, g);
      el('ellipse', { cx: 7, cy: -4, rx: 7, ry: 9, fill: c1, class: 'wing r' }, g);
      el('ellipse', { cx: 5, cy: 6, rx: 5, ry: 6, fill: c2, class: 'wing r' }, g);
      el('rect', { x: -1.2, y: -8, width: 2.4, height: 18, rx: 1.2, fill: '#2b2b2b' }, g);
    } else {
      el('ellipse', { cx: -3, cy: -6, rx: 4, ry: 6, fill: 'rgba(255,255,255,0.8)', class: 'wing l' }, g);
      el('ellipse', { cx: 3, cy: -6, rx: 4, ry: 6, fill: 'rgba(255,255,255,0.8)', class: 'wing r' }, g);
      el('ellipse', { cx: 0, cy: 0, rx: 7, ry: 5, fill: '#ffc62e' }, g);
      el('rect', { x: -2.5, y: -5, width: 2, height: 10, fill: '#2b2b2b' }, g);
      el('rect', { x: 1.5, y: -5, width: 2, height: 10, fill: '#2b2b2b' }, g);
    }
    const v = {
      kind,
      g,
      x: Math.random() < 0.5 ? -30 : window.innerWidth + 30,
      y: rnd(80, window.innerHeight * 0.5),
      target: null,
      rest: 0,
      phase: rnd(0, 6),
      speed: kind === 'bee' ? 150 : 70,
    };
    visitors.push(v);
    return v;
  }

  function chooseTarget(v) {
    if (!state.flowers.length) {
      v.target = { x: rnd(0, window.innerWidth), y: rnd(60, window.innerHeight * 0.55), land: false };
      return;
    }
    const f = pick(state.flowers);
    const p = headPosition(f);
    v.target = { x: p.x, y: p.y - 8, land: true };
  }

  function updateVisitors(dt, night) {
    const wanted = night > 0.5 || !state.flowers.length ? 0 : Math.min(2 + Math.floor(state.flowers.length / 6), 6);
    while (visitors.length < wanted) makeVisitor(visitors.length % 3 === 2 ? 'bee' : 'butterfly');
    for (let i = visitors.length - 1; i >= 0; i--) {
      const v = visitors[i];
      const leaving = visitors.length > wanted && i >= wanted;
      if (leaving && !v.leaving) {
        v.leaving = true;
        v.target = { x: v.x < window.innerWidth / 2 ? -60 : window.innerWidth + 60, y: rnd(40, 200), land: false };
      }
      if (v.rest > 0) {
        v.rest -= dt;
      } else {
        if (!v.target) chooseTarget(v);
        const dx = v.target.x - v.x;
        const dy = v.target.y - v.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) {
          if (v.leaving) {
            v.g.remove();
            visitors.splice(i, 1);
            continue;
          }
          v.rest = v.target.land ? rnd(1.5, 3.5) : 0;
          v.target = null;
        } else {
          const step = Math.min(dist, v.speed * dt);
          v.phase += dt * (v.kind === 'bee' ? 14 : 5);
          v.x += (dx / dist) * step;
          v.y += (dy / dist) * step + Math.sin(v.phase) * (v.kind === 'bee' ? 0.8 : 1.6);
        }
      }
      const tilt = v.rest > 0 ? 0 : clamp((v.target?.x ?? v.x) - v.x, -20, 20);
      v.g.setAttribute('transform', `translate(${v.x.toFixed(1)} ${v.y.toFixed(1)}) rotate(${tilt.toFixed(1)})`);
    }
  }

  let fireflies = [];
  function updateFireflies(night) {
    const wanted = night > 0.6 ? 14 : 0;
    while (fireflies.length < wanted) {
      const f = document.createElement('div');
      f.className = 'firefly';
      f.style.left = `${rnd(2, 98)}%`;
      f.style.top = `${rnd(35, 88)}%`;
      f.style.animationDelay = `${-rnd(0, 6)}s, ${-rnd(0, 2.4)}s`;
      document.body.appendChild(f);
      fireflies.push(f);
    }
    if (fireflies.length > wanted) {
      fireflies.splice(wanted).forEach((f) => f.remove());
    }
  }

  // ------------------------------------------------------------------
  // Rain
  // ------------------------------------------------------------------

  const rainCtx = rainCanvas.getContext('2d');
  let drops = [];
  let rainUntil = 0;

  function startRain() {
    if (state.raining) return;
    state.raining = true;
    rainUntil = performance.now() + 5200;
    $('tool-rain').setAttribute('aria-pressed', 'true');
    document.documentElement.style.setProperty('--wind', '2.2');
    rainNoise(true);
    toast(state.flowers.length ? 'Rain! Every flower grows a little.' : 'Rain! Plant some flowers to see them grow.');
    // Flowers grow in two steps while it rains.
    if (state.flowers.length) remember();
    [1600, 3600].forEach((ms) =>
      setTimeout(() => {
        state.flowers.forEach((f) => growFlower(f, 1.06));
        save();
      }, ms),
    );
  }

  function updateRain(now, dt) {
    const W = rainCanvas.width;
    const H = rainCanvas.height;
    rainCtx.clearRect(0, 0, W, H);
    if (!state.raining) return;
    const active = now < rainUntil;
    if (active) for (let i = 0; i < Math.ceil(W / 40); i++) drops.push({ x: rnd(-40, W), y: rnd(-60, -10), v: rnd(700, 1000), l: rnd(10, 22) });
    rainCtx.strokeStyle = 'rgba(190, 215, 255, 0.6)';
    rainCtx.lineWidth = 1.3;
    rainCtx.beginPath();
    drops = drops.filter((d) => {
      d.y += d.v * dt;
      d.x += d.v * dt * 0.12;
      rainCtx.moveTo(d.x, d.y);
      rainCtx.lineTo(d.x + d.l * 0.12, d.y + d.l);
      return d.y < H;
    });
    rainCtx.stroke();
    if (!active && !drops.length) {
      state.raining = false;
      $('tool-rain').setAttribute('aria-pressed', 'false');
      document.documentElement.style.setProperty('--wind', '1');
      rainNoise(false);
    }
  }

  // ------------------------------------------------------------------
  // Sound: made in the browser with Web Audio, so no music file is needed.
  // ------------------------------------------------------------------

  let audio = null;
  const PENTATONIC = [0, 2, 4, 7, 9]; // major pentatonic steps

  function audioCtx() {
    if (!audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0.5;
      // A short echo makes the chimes feel like they're in an open garden.
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.28;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.32;
      delay.connect(feedback).connect(delay);
      delay.connect(master);
      master.connect(ctx.destination);
      audio = { ctx, master, delay, pad: null, rain: null };
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio;
  }

  function chime(step) {
    if (!state.sound) return;
    const a = audioCtx();
    if (!a) return;
    const { ctx } = a;
    const octave = Math.floor(step / 10);
    const semis = PENTATONIC[step % 5] + 12 * octave + 12 * Math.floor((step % 10) / 5);
    const freq = 523.25 * Math.pow(2, semis / 12);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    osc.connect(gain);
    gain.connect(a.master);
    gain.connect(a.delay);
    osc.start();
    osc.stop(ctx.currentTime + 1.7);
  }

  function setPad(on) {
    const a = audioCtx();
    if (!a) return;
    const { ctx } = a;
    if (on && !a.pad) {
      // A soft, slowly breathing chord under everything.
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      const oscs = [261.63, 329.63, 392.0, 523.25].map((f, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = rnd(-6, 6);
        o.connect(filter);
        o.start();
        return o;
      });
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
      filter.connect(gain).connect(a.master);
      a.pad = { gain, oscs: [...oscs, lfo] };
    } else if (!on && a.pad) {
      const { gain, oscs } = a.pad;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      oscs.forEach((o) => o.stop(ctx.currentTime + 1.5));
      a.pad = null;
    }
  }

  function rainNoise(on) {
    if (!state.sound) return;
    const a = audioCtx();
    if (!a) return;
    const { ctx } = a;
    if (on && !a.rain) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 0.6;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.8);
      src.connect(filter).connect(gain).connect(a.master);
      src.start();
      a.rain = { src, gain };
    } else if (!on && a.rain) {
      a.rain.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      a.rain.src.stop(ctx.currentTime + 2);
      a.rain = null;
    }
  }

  function toggleSound() {
    state.sound = !state.sound;
    $('tool-sound').setAttribute('aria-pressed', String(state.sound));
    if (state.sound) {
      setPad(true);
      chime(4);
      toast('Sound on');
    } else if (audio) {
      setPad(false);
      rainNoise(false);
      toast('Sound off');
    }
  }

  // ------------------------------------------------------------------
  // Picture & share
  // ------------------------------------------------------------------

  function savePicture() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const [top, bottom] = skyAt(displayT);
    const n = nightness(displayT);
    const stars = n > 0.3
      ? [...$('stars').children].map((s) => `<circle cx="${(parseFloat(s.style.left) / 100) * W}" cy="${(parseFloat(s.style.top) / 100) * H}" r="${parseFloat(s.style.width) / 2}" fill="#fff" opacity="${(0.4 + Math.random() * 0.6) * n}"/>`).join('')
      : '';
    const gh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ground-h'));
    const plants = new XMLSerializer().serializeToString(plantsLayer);
    const svg = `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
      <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fae4e"/><stop offset="1" stop-color="#2f6b2e"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#sky)"/>${stars}
      <g fill="none" stroke-linecap="round" stroke-width="4">${plants.replace(/class="stem[^"]*"/g, 'stroke="#2a7a3b"').replace(/class="leaf[^"]*"/g, 'fill="#2f8f46"')}</g>
      <rect y="${H - gh}" width="100%" height="${gh}" fill="url(#soil)" opacity="${1 - n * 0.5}"/>
      <text x="${W - 16}" y="${H - 16}" text-anchor="end" font-family="sans-serif" font-size="14" fill="#ffffff" opacity="0.85">Interactive Garden · ${state.flowers.length} flowers</text>
    </svg>`;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const scale = Math.min(2, window.devicePixelRatio || 1);
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `my-garden-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('Picture saved to your downloads');
      }, 'image/png');
    };
    img.onerror = () => toast('Could not make the picture. Try again.');
    img.src = url;
  }

  // Compact text form of the garden for share links: type,x,h,color,size,bend per flower.
  function encodeGarden() {
    const rows = state.flowers.map((f) => [TYPE_KEYS.indexOf(f.type), Math.round(f.x * 1000), f.h, f.color.slice(1), Math.round(f.size * 100), f.bend].join(','));
    return btoa(rows.join(';')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeGarden(code) {
    try {
      const text = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
      return text
        .split(';')
        .filter(Boolean)
        .slice(0, MAX_FLOWERS)
        .map((row, i) => {
          const [t, x, h, color, size, bend] = row.split(',');
          return { id: i + 1, type: TYPE_KEYS[Number(t)], x: Number(x) / 1000, h: Number(h), color: `#${color}`, size: Number(size) / 100, bend: Number(bend) };
        })
        .filter((f) => validFlower(f) && /^#[0-9a-f]{6}$/i.test(f.color));
    } catch {
      return null;
    }
  }

  async function shareLink() {
    if (!state.flowers.length) return toast('Plant something first, then share it');
    const url = `${location.href.split('#')[0]}#g=${encodeGarden()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied. Anyone who opens it sees your garden.');
    } catch {
      window.prompt('Copy this link to share your garden:', url);
    }
  }

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------

  let toastTimer;
  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function buildPicker() {
    const box = $('flower-picker');
    const options = [...TYPE_KEYS, 'mix'];
    options.forEach((key, i) => {
      const b = document.createElement('button');
      b.className = 'tool';
      b.setAttribute('role', 'radio');
      b.dataset.type = key;
      b.title = `${key === 'mix' ? 'Surprise mix' : FLOWERS[key].label} (${i + 1})`;
      const mini = el('svg', { class: 'mini', viewBox: '-26 -26 52 52', 'aria-hidden': 'true' });
      if (key === 'mix') {
        ['#ff6fa8', '#ffc928', '#9b7bf2'].forEach((c, j) => el('circle', { cx: -9 + j * 9, cy: j === 1 ? -6 : 4, r: 9, fill: c }, mini));
      } else if (key === 'lavender') {
        for (let k = 0; k < 6; k++) el('ellipse', { cx: k % 2 ? 4 : -4, cy: 16 - k * 6, rx: 4, ry: 5, fill: FLOWERS.lavender.colors[0] }, mini);
      } else {
        const g = el('g', { transform: key === 'tulip' ? 'translate(0 14)' : '' }, mini);
        DRAW_HEAD[key](g, { color: FLOWERS[key].colors[0] === '#ffffff' ? '#ffffff' : FLOWERS[key].colors[0], size: key === 'sunflower' ? 0.85 : 1 });
        g.querySelectorAll('.petal').forEach((p) => p.removeAttribute('class'));
        if (key === 'daisy') g.querySelectorAll('ellipse').forEach((p) => p.setAttribute('stroke', '#d6d6e0'));
      }
      b.appendChild(mini);
      const label = document.createElement('span');
      label.textContent = key === 'mix' ? 'Mix' : FLOWERS[key].label;
      b.appendChild(label);
      b.addEventListener('click', () => chooseType(key));
      box.appendChild(b);
    });
    syncPicker();
  }

  function chooseType(key) {
    state.type = key;
    setTool('plant');
    syncPicker();
    save();
  }

  function syncPicker() {
    document.querySelectorAll('#flower-picker .tool').forEach((b) => {
      b.setAttribute('aria-checked', String(state.tool === 'plant' && b.dataset.type === state.type));
    });
  }

  function setTool(tool) {
    state.tool = tool;
    $('tool-water').setAttribute('aria-pressed', String(tool === 'water'));
    document.body.classList.toggle('tool-water', tool === 'water');
    syncPicker();
  }

  const TIME_MODES = ['auto', 'sunrise', 'day', 'sunset', 'night'];
  const TIME_LABELS = { auto: 'Auto', sunrise: 'Sunrise', day: 'Day', sunset: 'Sunset', night: 'Night' };

  function setTimeMode(mode) {
    state.timeMode = mode;
    $('time-label').textContent = TIME_LABELS[mode];
    document.querySelectorAll('#time-menu [data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
    toast(mode === 'auto' ? 'Time moves on its own: a full day is about 2½ minutes' : `It stays ${TIME_LABELS[mode].toLowerCase()} until you change it`);
    save();
  }

  // T key: step through the modes without opening the menu.
  function cycleTime() {
    setTimeMode(TIME_MODES[(TIME_MODES.indexOf(state.timeMode) + 1) % TIME_MODES.length]);
  }

  let menuAnchor = null;
  function openTimeMenu(anchor) {
    const menu = $('time-menu');
    if (!menu.hidden && menuAnchor === anchor) return closeTimeMenu();
    closeTimeMenu();
    menuAnchor = anchor;
    anchor.setAttribute('aria-expanded', 'true');
    menu.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === state.timeMode)));
    menu.hidden = false;
    // Open below the clock, or above the toolbar button.
    const r = anchor.getBoundingClientRect();
    const w = menu.offsetWidth;
    menu.style.left = `${clamp(r.left + r.width / 2 - w / 2, 8, window.innerWidth - w - 8)}px`;
    if (r.top < window.innerHeight / 2) {
      menu.style.top = `${r.bottom + 8}px`;
      menu.style.bottom = '';
    } else {
      menu.style.top = '';
      menu.style.bottom = `${window.innerHeight - r.top + 10}px`;
    }
    menu.querySelector('[aria-checked="true"]')?.focus();
  }

  function closeTimeMenu() {
    $('time-menu').hidden = true;
    menuAnchor?.setAttribute('aria-expanded', 'false');
    menuAnchor = null;
  }

  function showHelp(show) {
    $('help').hidden = !show;
    if (show) {
      $('help-hide').checked = state.hideHelp;
      $('help-start').focus();
    }
  }

  function closeHelp() {
    state.hideHelp = $('help-hide').checked;
    save();
    showHelp(false);
  }

  function isOverUi(target) {
    return target.closest('.toolbar, .overlay, .hud');
  }

  function wire() {
    // pointerdown handles mouse, touch and pen with one handler.
    garden.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || isOverUi(e.target)) return;
      // A click outside an open menu just closes it.
      if (!$('time-menu').hidden) return closeTimeMenu();
      if (state.tool === 'water') waterAt(e.clientX, e.clientY);
      else plantAt(e.clientX, e.clientY);
    });
    $('tool-water').addEventListener('click', () => setTool(state.tool === 'water' ? 'plant' : 'water'));
    $('tool-rain').addEventListener('click', startRain);
    $('tool-time').addEventListener('click', (e) => openTimeMenu(e.currentTarget));
    $('clock').addEventListener('click', (e) => openTimeMenu(e.currentTarget));
    $('time-menu').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      setTimeMode(b.dataset.mode);
      closeTimeMenu();
    });
    $('tool-sound').addEventListener('click', toggleSound);
    $('tool-undo').addEventListener('click', undo);
    $('tool-photo').addEventListener('click', savePicture);
    $('tool-share').addEventListener('click', shareLink);
    $('tool-help').addEventListener('click', () => showHelp(true));
    $('help-start').addEventListener('click', closeHelp);
    $('tool-clear').addEventListener('click', () => {
      if (!state.flowers.length) return toast('The garden is already empty');
      $('confirm-clear').hidden = false;
      $('clear-cancel').focus();
    });
    $('clear-cancel').addEventListener('click', () => ($('confirm-clear').hidden = true));
    $('clear-yes').addEventListener('click', () => {
      $('confirm-clear').hidden = true;
      clearGarden();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTimeMenu();
        if (!$('help').hidden) closeHelp();
        $('confirm-clear').hidden = true;
        return;
      }
      if (!$('help').hidden || !$('confirm-clear').hidden || e.target.closest('input')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        return undo();
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 6) return chooseType([...TYPE_KEYS, 'mix'][n - 1]);
      const k = e.key.toLowerCase();
      if (k === 'w') setTool(state.tool === 'water' ? 'plant' : 'water');
      else if (k === 'r') startRain();
      else if (k === 't') cycleTime();
      else if (k === 'm') toggleSound();
      else if (k === 's') savePicture();
      else if (e.key === '?' || k === 'h') showHelp(true);
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        layout();
        renderAll();
      }, 120);
    });
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    clockT = (clockT + dt / DAY_SECONDS) % 1;
    const goal = state.timeMode === 'auto' ? clockT : FIXED_TIME[state.timeMode];
    // Ease toward the chosen time so switching modes fades instead of jumping.
    let diff = goal - displayT;
    if (diff > 0.5) diff -= 1;
    if (diff < -0.5) diff += 1;
    displayT = (displayT + diff * Math.min(1, dt * 2.5) + 1) % 1;
    if (state.timeMode !== 'auto') clockT = displayT;
    paintSky(displayT);
    const night = nightness(displayT);
    if (!reduceMotion) updateVisitors(dt, night);
    updateFireflies(reduceMotion ? 0 : night);
    updateRain(now, dt);
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------------
  // Start
  // ------------------------------------------------------------------

  load();
  const shared = location.hash.startsWith('#g=') ? decodeGarden(location.hash.slice(3)) : null;
  if (shared && shared.length) {
    state.flowers = shared;
    history.replaceState(null, '', location.pathname + location.search);
  }
  nextId = state.flowers.reduce((m, f) => Math.max(m, f.id), 0) + 1;
  $('time-label').textContent = TIME_LABELS[state.timeMode];
  displayT = clockT = state.timeMode === 'auto' ? 0.45 : FIXED_TIME[state.timeMode];

  makeStars();
  makeClouds();
  buildPicker();
  layout();
  renderAll();
  wire();
  paintSky(displayT);
  requestAnimationFrame(frame);

  if (shared && shared.length) {
    save();
    toast(`You’re looking at a shared garden with ${shared.length} flowers`);
  } else if (state.flowers.length) {
    toast(`Welcome back! Your ${state.flowers.length} flowers are still here.`);
  }
  showHelp(!state.hideHelp);
})();
