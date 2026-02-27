const STAR_LAYERS = [
  { count: 120, minR: 0.5, maxR: 1.5, speed: 0.07 },
  { count: 70, minR: 0.9, maxR: 2.2, speed: 0.12 },
  { count: 36, minR: 1.6, maxR: 3.0, speed: 0.18 }
];
const STAR_COLORS = ['#fefefe', '#b5eaff', '#a7a3ff', '#7fffd4'];
const SHOOTING_MAX = 3;
const PARTICLE_MAX = 120;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.createElement('canvas');
canvas.className = 'starfield-bg';
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');

let width = 0;
let height = 0;
let stars = [];
let nebulas = [];
let shootingStars = [];
let particles = [];
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
let overloadUntil = 0;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  createStars();
  createNebulas();
}

function createStars() {
  stars = [];
  STAR_LAYERS.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i += 1) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: layer.minR + Math.random() * (layer.maxR - layer.minR),
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        twinkle: Math.random() * Math.PI * 2,
        speed: layer.speed + Math.random() * 0.08,
        depth: layerIndex + 1
      });
    }
  });
}

function createNebulas() {
  nebulas = [];
  for (let i = 0; i < 5; i += 1) {
    nebulas.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.max(width, height) * (0.22 + Math.random() * 0.16),
      color: STAR_COLORS[(i + 1) % STAR_COLORS.length],
      alpha: 0.05 + Math.random() * 0.05,
      driftX: (Math.random() - 0.5) * 0.07,
      driftY: (Math.random() - 0.5) * 0.05,
      pulse: Math.random() * Math.PI * 2
    });
  }
}

function spawnShootingStar() {
  if (shootingStars.length >= SHOOTING_MAX || reducedMotion) {
    return;
  }
  shootingStars.push({
    x: Math.random() * width * 0.75,
    y: -20,
    vx: 7 + Math.random() * 4,
    vy: 2 + Math.random() * 1.7,
    life: 0,
    maxLife: 28 + Math.random() * 14
  });
}

function spawnTrailParticle(x, y, intensity = 1) {
  if (particles.length >= PARTICLE_MAX || reducedMotion) {
    return;
  }
  const speed = 0.6 + Math.random() * 1.6 * intensity;
  const angle = Math.random() * Math.PI * 2;
  const palette = ['#00f0ff', '#00ff88', '#bd00ff', '#ffaa00'];
  particles.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 25 + Math.random() * 20,
    radius: 1 + Math.random() * 2,
    color: palette[Math.floor(Math.random() * palette.length)]
  });
}

function drawNebulas() {
  for (const nebula of nebulas) {
    nebula.x += nebula.driftX;
    nebula.y += nebula.driftY;
    if (nebula.x < -nebula.r) nebula.x = width + nebula.r;
    if (nebula.x > width + nebula.r) nebula.x = -nebula.r;
    if (nebula.y < -nebula.r) nebula.y = height + nebula.r;
    if (nebula.y > height + nebula.r) nebula.y = -nebula.r;

    nebula.pulse += 0.003;
    const alpha = nebula.alpha + Math.sin(nebula.pulse) * 0.015;
    const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.r);
    gradient.addColorStop(0, `${nebula.color}${Math.round(Math.max(0, alpha) * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(nebula.x - nebula.r, nebula.y - nebula.r, nebula.r * 2, nebula.r * 2);
  }
}

function drawStars() {
  const parallaxX = ((mouse.x / width) - 0.5) * 12;
  const parallaxY = ((mouse.y / height) - 0.5) * 12;

  for (const star of stars) {
    star.twinkle += 0.03;
    star.y += star.speed * (Date.now() < overloadUntil ? 4.2 : 1);
    if (star.y > height + 4) {
      star.y = -4;
      star.x = Math.random() * width;
    }

    const dx = star.x - mouse.x;
    const dy = star.y - mouse.y;
    const dist = Math.hypot(dx, dy);
    const proximity = Math.max(0, 1 - dist / 200);
    const alpha = 0.45 + 0.55 * Math.sin(star.twinkle) + proximity * 0.25;
    const shiftX = parallaxX / star.depth;
    const shiftY = parallaxY / star.depth;

    ctx.globalAlpha = Math.min(1, alpha);
    ctx.beginPath();
    ctx.arc(star.x - shiftX, star.y - shiftY, star.r + proximity * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.shadowColor = star.color;
    ctx.shadowBlur = 8 + proximity * 8;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i -= 1) {
    const meteor = shootingStars[i];
    meteor.life += 1;
    meteor.x += meteor.vx;
    meteor.y += meteor.vy;

    const progress = meteor.life / meteor.maxLife;
    const alpha = Math.max(0, 1 - progress);

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#c7f6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    ctx.lineTo(meteor.x - meteor.vx * 4.2, meteor.y - meteor.vy * 4.2);
    ctx.stroke();

    if (meteor.life > meteor.maxLife || meteor.x > width + 100 || meteor.y > height + 100) {
      shootingStars.splice(i, 1);
    }
  }
  ctx.globalAlpha = 1;
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.life += 1;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.98;
    particle.vy *= 0.98;

    const progress = particle.life / particle.maxLife;
    const alpha = Math.max(0, 1 - progress);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, Math.max(0.2, particle.radius * alpha), 0, Math.PI * 2);
    ctx.fill();

    if (particle.life >= particle.maxLife) {
      particles.splice(i, 1);
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  drawNebulas();
  drawStars();
  drawShootingStars();
  drawParticles();

  if (!reducedMotion && Math.random() < (Date.now() < overloadUntil ? 0.055 : 0.012)) {
    spawnShootingStar();
  }

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  mouse.active = true;
  spawnTrailParticle(mouse.x, mouse.y, Date.now() < overloadUntil ? 1.7 : 1);
});
window.addEventListener('click', (event) => {
  for (let i = 0; i < 16; i += 1) {
    spawnTrailParticle(event.clientX, event.clientY, 2);
  }
});

window.addEventListener('overview-orb-captured', (event) => {
  const count = (event.detail?.index ?? 0) + 1;
  const burstSize = 12 + count * 2;
  const orbLayer = document.getElementById('orb-layer');
  const orb = orbLayer?.querySelector(`[data-index="${event.detail?.index}"]`);
  if (orb) {
    const rect = orb.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    for (let i = 0; i < burstSize; i += 1) {
      spawnTrailParticle(originX, originY, 2.4);
    }
  }
});

window.addEventListener('overview-neon-overload', () => {
  overloadUntil = Date.now() + 5000;
  for (let i = 0; i < 40; i += 1) {
    spawnTrailParticle(Math.random() * width, Math.random() * height, 2.7);
  }
});

window.addEventListener('overview-station-online', () => {
  for (let i = 0; i < 64; i += 1) {
    spawnTrailParticle(Math.random() * width, Math.random() * height * 0.9, 2.9);
  }
});

resize();
animate();
