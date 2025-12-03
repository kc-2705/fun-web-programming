const garden = document.getElementById('garden');
const modeToggle = document.getElementById('modeToggle');
const musicToggle = document.getElementById('musicToggle');
const bgMusic = document.getElementById('bgMusic');
const ground = document.getElementById('ground');

let isDark = false;
let musicOn = false;

const STEM_DURATION = 1200;
const LEAF_APPEAR_FRACTION = 0.45;
const BUD_POP_DELAY = 80;
const PETAL_DELAY = 220;

function rnd(a,b){ return Math.random()*(b-a)+a; }

/* prevent controls from triggering flower creation */
[modeToggle, musicToggle].forEach(btn=>{
  btn.addEventListener("click", e=> e.stopPropagation());
});

/* toggle light/dark */
modeToggle.addEventListener("click", ()=>{
  isDark = !isDark;
  document.body.classList.toggle("dark", isDark);
  modeToggle.textContent = isDark ? "🌙" : "☀️";
});

/* toggle music */
const music = document.getElementById("bgMusic");

musicToggle.addEventListener("click", ()=>{
  musicOn = !musicOn;
  if(musicOn){
    bgMusic.play();
    musicToggle.classList.remove("off");
  } else {
    bgMusic.pause();
    musicToggle.classList.add("off");
  }
});

/* click to create flower */
document.addEventListener("click", e=>{
  createFlower(e.clientX, e.clientY);
});

function createFlower(x,y){
  const svgNS = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(svgNS,"g");

  const groundY = window.innerHeight - parseFloat(getComputedStyle(ground).height);

  const cp1x = x + rnd(-80,80);
  const cp1y = rnd(groundY - (groundY - y)*0.25, groundY - 40);
  const cp2x = x + rnd(-80,80);
  const cp2y = y + rnd(-80,20);

  const d = `M ${x} ${groundY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;

  const stem = document.createElementNS(svgNS,"path");
  stem.setAttribute("d", d);
  stem.setAttribute("class", "stem");

  group.appendChild(stem);
  garden.appendChild(group);

  const len = stem.getTotalLength();
  stem.style.strokeDasharray = len;
  stem.style.strokeDashoffset = len;
  stem.getBoundingClientRect();
  stem.style.transition = `stroke-dashoffset ${STEM_DURATION}ms linear`;
  stem.style.strokeDashoffset = "0";

  /* leaf */
  const leafTime = STEM_DURATION * LEAF_APPEAR_FRACTION;
  setTimeout(()=>{
    const p = stem.getPointAtLength(len * LEAF_APPEAR_FRACTION);
    const leaf = document.createElementNS(svgNS,"ellipse");
    leaf.setAttribute("cx", p.x);
    leaf.setAttribute("cy", p.y);
    leaf.setAttribute("rx", 0);
    leaf.setAttribute("ry", 0);
    leaf.setAttribute("class","leaf");
    leaf.style.transition = "rx 380ms, ry 380ms, transform 380ms";
    group.appendChild(leaf);

    requestAnimationFrame(()=>{
      leaf.setAttribute("rx", 9);
      leaf.setAttribute("ry", 5);
      leaf.style.transform = `rotate(${rnd(-30,0)}deg)`;
    });
  }, leafTime);

  /* bud + petals */
  setTimeout(()=>{
    const tip = stem.getPointAtLength(len);

    const bud = document.createElementNS(svgNS,"circle");
    bud.setAttribute("cx",tip.x);
    bud.setAttribute("cy",tip.y);
    bud.setAttribute("r",3);
    bud.setAttribute("fill","#9fd56b");
    bud.setAttribute("class","bud");
    group.appendChild(bud);

    requestAnimationFrame(()=> bud.style.transform = "scale(1.15)");

    setTimeout(()=>{
      bud.style.transform = "scale(1)";
      setTimeout(()=> bloom(group, tip.x, tip.y, bud), PETAL_DELAY);
    }, BUD_POP_DELAY + 120);

  }, STEM_DURATION+20);
}

function bloom(group, cx, cy, bud){
  const svgNS = "http://www.w3.org/2000/svg";

  const colors = isDark
    ? ['#ff9cff','#ffd6f0','#ff8fe6']
    : ['#ff6fa8','#ff9acd','#ff84c6'];

  const petals = [];
  const count = 6;

  for(let i=0;i<count;i++){
    const p = document.createElementNS(svgNS,"circle");
    p.setAttribute("cx",cx);
    p.setAttribute("cy",cy);
    p.setAttribute("r",14);
    p.setAttribute("fill", colors[i%colors.length]);
    p.setAttribute("class","flower-petal");

    const angle = (i * 360 / count) * Math.PI/180;
    p.dataset.tx = Math.cos(angle)*20;
    p.dataset.ty = Math.sin(angle)*20;

    group.appendChild(p);
    petals.push(p);
  }

  const center = document.createElementNS(svgNS,"circle");
  center.setAttribute("cx",cx);
  center.setAttribute("cy",cy);
  center.setAttribute("r",7);
  center.setAttribute("class","flower-center");
  group.appendChild(center);

  petals.forEach((p, i)=>{
    const delay = 60 + i*60;
    setTimeout(()=>{
      p.classList.add("petal-animate");
      p.style.transform = `translate(${p.dataset.tx}px, ${p.dataset.ty}px) scale(1)`;
      p.style.opacity = "1";
    }, delay);
  });

  bud.style.transition = "opacity 220ms";
  setTimeout(()=> bud.style.opacity = "0", 80);
}

/* create fireflies in dark mode */
function spawnFireflies() {
  if (!isDark) return;

  for (let i=0; i<12; i++) {
    const f = document.createElement("div");
    f.className = "firefly";
    f.style.left = rnd(0, window.innerWidth) + "px";
    f.style.top = rnd(0, window.innerHeight * 0.6) + "px";
    document.body.appendChild(f);

    setTimeout(() => f.remove(), rnd(6000, 12000));
  }
}

setInterval(() => { if (isDark) spawnFireflies(); }, 3000);

