const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const heartPoints = [];
const totalPoints = 1200;
const scale = 14;

function heartFunction(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
        13 * Math.cos(t) - 5 * Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);
    return {x: x * scale, y: -y * scale};
}

for (let i = 0; i < totalPoints; i++) {
    const t = Math.PI * 2 * i / totalPoints;
    const {x, y} = heartFunction(t);
    heartPoints.push({x, y});
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width - canvas.width/2;
        this.y = Math.random() * canvas.height - canvas.height/2;
        this.size = 1.2 + Math.random()*1.5;
        this.color = 'rgba(0,100,0,0.8)'; // initial dark green
    }

    moveTo(targetX, targetY, speed=0.02) {
        this.x += (targetX - this.x) * speed;
        this.y += (targetY - this.y) * speed;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size*6;
        ctx.shadowColor = this.color;
        ctx.arc(this.x + canvas.width/2, this.y + canvas.height/2, this.size, 0, Math.PI*2);
        ctx.fill();
    }
}

const particles = [];
for (let i = 0; i < totalPoints; i++) {
    particles.push(new Particle());
}

let drawIndex = 0;
const totalDrawPoints = heartPoints.length;
let phase = 0;

function animate() {
    ctx.fillStyle = 'rgba(0,0,0,1)'; // slow trail fade
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // move particles along heart points slowly
        if (i <= drawIndex) {
            const target = heartPoints[i];
            p.moveTo(target.x, target.y, 0.03);
        } else {
            p.moveTo((Math.random()-0.5)*canvas.width, (Math.random()-0.5)*canvas.height, 0.01);
        }

        // Color transitions
        if (drawIndex < totalDrawPoints/2) {
            p.color = 'rgba(0,100,0,0.8)'; // dark green while first half forms
        } else if (drawIndex >= totalDrawPoints/2 && drawIndex < totalDrawPoints) {
            // transition all heart particles to purple-pink and grow slightly
            p.color = 'rgba(180,50,180,0.9)'; // dark purple-pink
            p.size = 2.0; // slight growth
        }

        if (drawIndex >= totalDrawPoints) {
            // heart fully formed: red-orange-yellow glow
            const r = 255;
            const g = 100 + Math.sin(phase)*50;
            const b = 0;
            p.color = `rgba(${r},${g},${b},1)`;
            p.size = 2.5;
        }

        p.draw();
    }

    drawIndex += 1; // slow drawing
    if (drawIndex > totalDrawPoints + 50) { // after full heart, scatter
        drawIndex = 0;
        // reset particle sizes for next cycle
        particles.forEach(p => p.size = 1.5);
    }

    phase += 0.02;
    requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
