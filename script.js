const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize',resize);

function bezierPoint(t,P0,P1,P2,P3) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  return {
    x:  uu * u * P0.x +
        3 * uu * t * P1.x +
        3 * u * tt * P2.x +
        tt * t * P3.x,
    y:  uu * u * P0.y +
        3 * uu * t * P1.y +
        3 * u * tt * P2.y +
        tt * t * P3.y
  };
}

function bezierDerivative(t, P0,P1,P2,P3) {
  const u = 1 - t;
  return {
    x: 3*u*u*(P1.x-P0.x)+ 6*u*t*(P2.x-P1.x)+ 3*t*t*(P3.x - P2.x),
    y: 3*u*u *(P1.y-P0.y)+ 6*u*t*(P2.y-P1.y) + 3*t*t*(P3.y-P2.y)
  };
}

function normalize(v) {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x/len, y: v.y/len };
}

function createSpringPoint(x,y) {
  return { pos: { x,y }, vel:{ x:0, y:0 }, target:{ x,y } };
}

function updateSpring(p,dt) {
  const k=800;
  const d=80;
  const ax=-k*(p.pos.x - p.target.x) - d*p.vel.x;
  const ay= -k*(p.pos.y - p.target.y)-d*p.vel.y;
  p.vel.x += ax*dt;
  p.vel.y += ay*dt;
  p.pos.x += p.vel.x*dt;
  p.pos.y += p.vel.y*dt;
}

const P0 = { pos: { x:120, y:window.innerHeight/2 } };
const P3 = { pos: { x:window.innerWidth - 120, y:window.innerHeight/2 } };
const P1 =createSpringPoint(window.innerWidth/3,window.innerHeight/2);
const P2 = createSpringPoint(window.innerWidth*0.66,window.innerHeight/2);

P1.target.x = P1.pos.x; P1.target.y = P1.pos.y;
P2.target.x = P2.pos.x; P2.target.y = P2.pos.y;

let dragging = null;
const hitRadius = 14;

function getPointerPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function nearestControl(pt) {
  const list = [P1, P2];
  let best = null, bestD = Infinity;
  for (let p of list) {
    const d = Math.hypot(p.pos.x - pt.x, p.pos.y - pt.y);
    if (d < bestD) { bestD = d; best = p; }
  }
  return bestD <= hitRadius ? best : null;
}

canvas.addEventListener('pointerdown', e => {
  const pt = getPointerPos(e);
  const hit = nearestControl(pt);
  if (hit) { dragging = hit; canvas.setPointerCapture(e.pointerId); }
});

canvas.addEventListener('pointermove', e => {
  const pt = getPointerPos(e);
  if (dragging) {
    dragging.target.x = pt.x;
    dragging.target.y = pt.y;
  } else {
    P1.target.x = pt.x;
    P1.target.y = pt.y;
    P2.target.x = pt.x + 80;
    P2.target.y = pt.y + 30;
  }
});

canvas.addEventListener('pointerup', e => { dragging = null; });
canvas.addEventListener('pointercancel', () => { dragging = null; });

function drawPoint(p, color) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.stroke();
}

function drawCurve() {
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const p = bezierPoint(t, P0.pos, P1.pos, P2.pos, P3.pos);
    if (t === 0)
      ctx.moveTo(p.x, p.y); 
    else
      ctx.lineTo(p.x, p.y);
  }
  ctx.save();
  ctx.strokeStyle = 'rgba(30,64,175,0.10)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();
  const g = ctx.createLinearGradient(P0.pos.x, P0.pos.y, P3.pos.x, P3.pos.y);
  g.addColorStop(0, '#2b6cb0');
  g.addColorStop(1, '#3b82f6');
  ctx.strokeStyle = g; 
  ctx.lineWidth = 4; 
  ctx.stroke();
  ctx.restore();
}

function drawTangents() {
  const samples = 6;
  const start = 0.12, end = 0.88;
  const len = 30;
  for (let i = 0; i < samples; i++) {
    const t = start + (i/(samples - 1))*(end - start);
    const p = bezierPoint(t, P0.pos, P1.pos, P2.pos, P3.pos);
    const d = bezierDerivative(t, P0.pos, P1.pos, P2.pos, P3.pos);
    const n = normalize(d);
    const hx= (n.x*len)/2;
    const hy=(n.y*len)/2;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.2; 
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); 
    ctx.moveTo(p.x - hx, p.y - hy); 
    ctx.lineTo(p.x + hx, p.y + hy); 
    ctx.stroke();
    ctx.lineWidth = 1.2; 
    ctx.strokeStyle = 'rgba(220,220,230,0.95)';
    ctx.beginPath(); 
    ctx.moveTo(p.x - hx, p.y - hy); 
    ctx.lineTo(p.x + hx, p.y + hy); 
    ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.95)'; 
    ctx.beginPath(); 
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); 
    ctx.fill();
    ctx.restore();
  }
}

function drawControlLines() {
  ctx.save();
  ctx.setLineDash([8,6]); 
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(P0.pos.x, P0.pos.y); 
  ctx.lineTo(P1.pos.x, P1.pos.y); 
  ctx.lineTo(P2.pos.x, P2.pos.y); 
  ctx.lineTo(P3.pos.x, P3.pos.y); 
  ctx.stroke();
  ctx.restore();
}

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  updateSpring(P1, dt);
  updateSpring(P2, dt);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#071027'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawControlLines(); 
  drawCurve(); 
  drawTangents();
  drawPoint(P0.pos, '#9fbff8'); 
  drawPoint(P1.pos, '#d6a3b8'); 
  drawPoint(P2.pos, '#d6a3b8'); 
  drawPoint(P3.pos, '#9fbff8');
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

