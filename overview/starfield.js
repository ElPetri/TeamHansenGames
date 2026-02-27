// Animated starfield background for Overview page
const STAR_COUNT = 80;
const STAR_COLORS = ['#fff', '#b5eaff', '#a7a3ff', '#7fffd4'];
const STAR_MIN_SIZE = 0.8;
const STAR_MAX_SIZE = 2.2;
const STAR_SPEED = 0.08;

const canvas = document.createElement('canvas');
canvas.className = 'starfield-bg';
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');
let stars = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function createStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: STAR_MIN_SIZE + Math.random() * (STAR_MAX_SIZE - STAR_MIN_SIZE),
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
      speed: STAR_SPEED + Math.random() * 0.07
    });
  }
}
createStars();
window.addEventListener('resize', createStars);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const star of stars) {
    // Twinkle effect
    const alpha = 0.7 + 0.3 * Math.sin(star.twinkle);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.shadowColor = star.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Move star
    star.y += star.speed;
    if (star.y > canvas.height + 4) {
      star.y = -4;
      star.x = Math.random() * canvas.width;
    }
    star.twinkle += 0.03 + Math.random() * 0.01;
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(animate);
}
animate();
