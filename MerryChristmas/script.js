const arr = [];
const c = document.querySelector("#c");
const ctx = c.getContext("2d");

const cw = (c.width = 4000);
const ch = (c.height = 4000);
const T = Math.PI * 2;

const TREE_X_SHIFT = -900;
const TREE_Y_TOP = 600;

const m = { x: cw / 2, y: 0 };
const xTo = gsap.quickTo(m, "x", { duration: 1.5, ease: "expo" });
const yTo = gsap.quickTo(m, "y", { duration: 1.5, ease: "expo" });

const arr2 = [];
const c2 = document.querySelector("#c2");
const ctx2 = c2.getContext("2d");
c2.width = c2.height = 4000;

c.addEventListener("pointermove", (e) => {
  const rect = c.getBoundingClientRect();
  const scaleX = c.width / rect.width;
  const scaleY = c.height / rect.height;
  xTo((e.x - rect.left) * scaleX);
  yTo((e.y - rect.top) * scaleY);
});

const textDots = [];

// -------------------------
// Create TREE dots (unchanged)
// -------------------------
for (let i = 0; i < 999; i++) {
  arr.push({
    i,
    cx: cw / 2 + TREE_X_SHIFT,
    cy: gsap.utils.mapRange(0, 999, TREE_Y_TOP, 3700, i),
    r: i < 900 ? gsap.utils.mapRange(0, 999, 3, 770, i) : 50,
    dot: 8,
    prog: 0.25,
    s: 1
  });

  const d = 99;
  arr[i].t = gsap.timeline({ repeat: -1 })
    .to(arr[i], { duration: d, prog: "+=1", ease: "slow(0.3,0.4)" })
    .to(arr[i], { duration: d / 2, s: 0.15, repeat: 1, yoyo: true, ease: "power3.inOut" }, 0)
    .seek(Math.random() * d);

  arr2.push({
    x: cw * Math.random(),
    y: -9,
    i,
    s: 3 + 5 * Math.random(),
    a: 0.1 + 0.5 * Math.random()
  });

  arr2[i].t = gsap.to(arr2[i], { ease: "none", y: ch, repeat: -1 })
    .seek(Math.random() * 99)
    .timeScale(arr2[i].s / 700);
}

// -------------------------
// STAR - Yellow dotted outline
// -------------------------
function drawStar() {
  const cx = cw / 2 + TREE_X_SHIFT;
  const cy = TREE_Y_TOP - 80;
  const rOuter = 80;
  const rInner = 35;

  let points = [];

  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r
    });
  }

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const steps = 5;
    for (let s = 0; s < steps; s++) {
      if (s % 2 !== 0) continue;
      const x = p1.x + (p2.x - p1.x) * (s / steps);
      const y = p1.y + (p2.y - p1.y) * (s / steps);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, T);
      ctx.fillStyle = "yellow";
      ctx.fill();
    }
  }
}

// -------------------------
// CREATE "MERRY CHRISTMAS"
// -------------------------
function createTextDots() {
  const tempCanvas = document.createElement("canvas");
  const tctx = tempCanvas.getContext("2d");

  tempCanvas.width = 3000;
  tempCanvas.height = 1500;

  tctx.font = "470px 'Great Vibes', cursive";
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillStyle = "white";

  tctx.fillText("Merry", tempCanvas.width / 2, 450);
  tctx.fillText("Christmas", tempCanvas.width / 2, 1000);

  const img = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;

  for (let y = 0; y < tempCanvas.height; y += 10) {
    for (let x = 0; x < tempCanvas.width; x += 10) {

      const i = (y * tempCanvas.width + x) * 4;

      if (img[i + 3] > 100) {
        textDots.push({
          x: x + 1400,
          y: y + 1400,
          dot: 5
        });
      }
    }
  }
}

createTextDots();

// -------------------------
// DRAW
// -------------------------
gsap.ticker.add(render);

function render() {
  ctx.clearRect(0, 0, cw, ch);
  ctx2.clearRect(0, 0, cw, ch);

  arr.forEach(drawTreeDot);
  drawStar();
  textDots.forEach(drawTextDot);
  arr2.forEach(drawSnow);
}

function drawTreeDot(c) {
  const angle = c.prog * T;
  const vs = 0.2;
  const x = Math.cos(angle) * c.r + c.cx;
  const y = Math.sin(angle) * c.r * vs + c.cy;

  ctx.beginPath();
  ctx.arc(x, y, c.dot * c.s, 0, T);
  ctx.fillStyle = "darkgreen";
  ctx.fill();
}

function drawTextDot(c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.dot, 0, T);
  ctx.fillStyle = "white";
  ctx.fill();
}

function drawSnow(c) {
  const ys = gsap.utils.interpolate(1.3, 0.1, c.y / ch);

  ctx2.save();
  ctx2.beginPath();
  ctx2.translate(c.x, c.y);
  ctx2.rotate(50 * c.t.progress());

  ctx2.arc(
    gsap.utils.interpolate(-55, 55, c.i / 999),
    gsap.utils.interpolate(-25, 25, c.i / 999),
    c.s * ys,
    0,
    T
  );

  ctx2.globalAlpha = c.a * ys;
  ctx2.fillStyle = "#fff";
  ctx2.fill();
  ctx2.restore();
}

// intro reveal
gsap.from(arr, { duration: 1, dot: 0, ease: "back.out(9)", stagger: -0.0009 });
