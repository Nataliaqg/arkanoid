const W = 800, H = 600;
const COLS = 10, ROWS = 6;
const BLOCK_W = 64, BLOCK_H = 24;      // se escalan desde 32x16
const GRID_X = 80, GRID_Y = 60;        // 80 + 10*64 + 80 = 800
const ROW_COLORS = ['red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink'];
const PADDLE_W = 120, PADDLE_H = 14;   // se escala desde 162x14
const PADDLE_SPEED = 520;              // px/s con teclado
const BALL_SIZE = 16;
const BALL_SPEED = 360;                // px/s
const MAX_BOUNCE_ANGLE = 60;           // grados desde la vertical
const LIVES = 3;
const POINTS_PER_BLOCK = 10;
const LAUNCH_ANGLE = 20;               // grados desde la vertical, hacia la derecha

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const sounds = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break: new Audio('assets/sounds/break-sound.mp3'),
};

const SOUND_BTN = { x: W / 2 - 150, y: H / 2 + 40, w: 300, h: 44 };

let soundOn = true;
try { soundOn = localStorage.getItem('arkanoid-sound') !== 'off'; } catch (e) {}

function toggleSound() {
  soundOn = !soundOn;
  try { localStorage.setItem('arkanoid-sound', soundOn ? 'on' : 'off'); } catch (e) {}
}

function playSound(name) {
  if (!soundOn) return;
  const clone = sounds[name].cloneNode();   // permite solapar reproducciones
  clone.play().catch(() => {});
}

function createBlocks() {
  const blocks = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      blocks.push({
        x: GRID_X + col * BLOCK_W,
        y: GRID_Y + row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: ROW_COLORS[row],
        alive: true,
      });
    }
  }
  return blocks;
}

const state = {
  mode: 'ready',   // 'ready' | 'playing' | 'paused' | 'gameover' | 'won'
  score: 0,
  lives: LIVES,
  paddle: { x: (W - PADDLE_W) / 2, y: H - 40, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE },
  blocks: createBlocks(),
  explosions: [],   // { x, y, w, h, color, elapsed }
};

function placeBallOnPaddle() {
  const p = state.paddle, b = state.ball;
  b.x = p.x + (p.w - b.size) / 2;
  b.y = p.y - b.size;
}

function launchBall() {
  if (state.mode !== 'ready') return;
  const angle = LAUNCH_ANGLE * Math.PI / 180;
  state.ball.vx = BALL_SPEED * Math.sin(angle);
  state.ball.vy = -BALL_SPEED * Math.cos(angle);
  state.mode = 'playing';
}

placeBallOnPaddle();

function resetGame() {
  state.mode = 'ready';
  state.score = 0;
  state.lives = LIVES;
  state.paddle.x = (W - PADDLE_W) / 2;
  state.blocks = createBlocks();
  state.explosions = [];
  placeBallOnPaddle();
}

let lastTime = 0;

const keys = { left: false, right: false };

function setKey(code, pressed) {
  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = pressed;
  if (code === 'ArrowRight' || code === 'KeyD') keys.right = pressed;
}

function clampPaddle() {
  const p = state.paddle;
  p.x = Math.max(0, Math.min(W - p.w, p.x));
}

document.addEventListener('keydown', (e) => {
  setKey(e.code, true);
  if (e.code === 'Space') {
    e.preventDefault();
    launchBall();
  }
  if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) {
    if (state.mode === 'playing') state.mode = 'paused';
    else if (state.mode === 'paused') state.mode = 'playing';
  }
  if ((e.code === 'KeyS' || e.code === 'KeyM') && !e.repeat && state.mode === 'paused') {
    toggleSound();
  }
  if (e.code === 'Enter' && (state.mode === 'gameover' || state.mode === 'won')) {
    resetGame();
  }
});
canvas.addEventListener('click', (e) => {
  if (state.mode === 'paused') {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    if (x >= SOUND_BTN.x && x <= SOUND_BTN.x + SOUND_BTN.w &&
        y >= SOUND_BTN.y && y <= SOUND_BTN.y + SOUND_BTN.h) toggleSound();
    return;
  }
  launchBall();
});
document.addEventListener('keyup', (e) => setKey(e.code, false));

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  state.paddle.x = (e.clientX - rect.left) * (W / rect.width) - state.paddle.w / 2;
  clampPaddle();
});

function update(dt) {
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  state.paddle.x += dir * PADDLE_SPEED * dt;
  clampPaddle();

  if (state.mode !== 'paused') {
    for (const ex of state.explosions) ex.elapsed += dt * 1000;   // EXPLOSION_DURATION en ms
    state.explosions = state.explosions.filter((ex) => ex.elapsed < EXPLOSION_DURATION);
  }

  const b = state.ball;
  if (state.mode === 'ready') {
    placeBallOnPaddle();
  } else if (state.mode === 'playing') {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x < 0) {
      b.x = 0;
      b.vx = Math.abs(b.vx);
      playSound('bounce');
    } else if (b.x + b.size > W) {
      b.x = W - b.size;
      b.vx = -Math.abs(b.vx);
      playSound('bounce');
    }
    if (b.y < 0) {
      b.y = 0;
      b.vy = Math.abs(b.vy);
      playSound('bounce');
    }

    const p = state.paddle;
    const hitsPaddle = b.vy > 0 &&
      b.x + b.size > p.x && b.x < p.x + p.w &&
      b.y + b.size > p.y && b.y + b.size < p.y + p.h + b.size;
    if (hitsPaddle) {
      const offset = (b.x + b.size / 2 - (p.x + p.w / 2)) / (p.w / 2);
      const angle = Math.max(-1, Math.min(1, offset)) * MAX_BOUNCE_ANGLE * Math.PI / 180;
      b.vx = BALL_SPEED * Math.sin(angle);
      b.vy = -BALL_SPEED * Math.cos(angle);
      b.y = p.y - b.size;
      playSound('bounce');
    }

    // un bloque por frame, resolviendo por menor solapamiento
    for (const blk of state.blocks) {
      if (!blk.alive) continue;
      if (b.x + b.size <= blk.x || b.x >= blk.x + blk.w ||
          b.y + b.size <= blk.y || b.y >= blk.y + blk.h) continue;

      const overlapLeft = b.x + b.size - blk.x;
      const overlapRight = blk.x + blk.w - b.x;
      const overlapTop = b.y + b.size - blk.y;
      const overlapBottom = blk.y + blk.h - b.y;
      const minX = Math.min(overlapLeft, overlapRight);
      const minY = Math.min(overlapTop, overlapBottom);

      if (minX < minY) {
        if (overlapLeft < overlapRight) {
          b.x -= overlapLeft;
          b.vx = -Math.abs(b.vx);
        } else {
          b.x += overlapRight;
          b.vx = Math.abs(b.vx);
        }
      } else if (overlapTop < overlapBottom) {
        b.y -= overlapTop;
        b.vy = -Math.abs(b.vy);
      } else {
        b.y += overlapBottom;
        b.vy = Math.abs(b.vy);
      }
      blk.alive = false;
      state.score += POINTS_PER_BLOCK;
      playSound('break');
      state.explosions.push({ x: blk.x, y: blk.y, w: blk.w, h: blk.h, color: blk.color, elapsed: 0 });
      break;
    }

    if (state.blocks.every((blk) => !blk.alive)) {
      state.mode = 'won';
    } else if (b.y > H) {
      state.lives--;
      if (state.lives <= 0) {
        state.mode = 'gameover';
      } else {
        state.mode = 'ready';
        placeBallOnPaddle();
      }
    }
  }
}

const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
bgGradient.addColorStop(0, '#2a4d7f');
bgGradient.addColorStop(1, '#1a3358');
const OVERLAY = 'rgba(12, 28, 56, 0.7)';

function draw() {
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, W, H);

  for (const b of state.blocks) {
    if (b.alive) drawSprite(ctx, 'block_' + b.color, b.x, b.y, b.w, b.h);
  }

  for (const ex of state.explosions) {
    const frames = EXPLOSION_FRAMES[ex.color];
    const i = Math.min(frames.length - 1, Math.floor(ex.elapsed / EXPLOSION_DURATION * frames.length));
    drawFrame(ctx, frames[i], ex.x, ex.y, ex.w, ex.h);
  }

  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('PUNTAJE: ' + state.score, 16, 16);
  ctx.textAlign = 'right';
  ctx.fillText('VIDAS: ' + state.lives, W - 16, 16);

  const b = state.ball;
  drawSprite(ctx, 'ball', b.x, b.y, b.size, b.size);

  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);

  if (state.mode === 'paused') {
    ctx.fillStyle = OVERLAY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('PAUSA', W / 2, H / 2 - 20);

    const s = SOUND_BTN;
    ctx.fillStyle = soundOn ? 'rgba(80, 200, 120, 0.25)' : 'rgba(230, 90, 90, 0.25)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = soundOn ? '#6fdc8c' : '#f08080';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SONIDO: ' + (soundOn ? 'ACTIVADO' : 'DESACTIVADO'), W / 2, s.y + s.h / 2);
    ctx.font = '14px monospace';
    ctx.fillText('S o clic para cambiar · P para continuar', W / 2, s.y + s.h + 28);
  }

  if (state.mode === 'gameover' || state.mode === 'won') {
    ctx.fillStyle = OVERLAY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px monospace';
    ctx.fillText(state.mode === 'gameover' ? 'GAME OVER' : '¡VICTORIA!', W / 2, H / 2 - 20);
    ctx.font = '20px monospace';
    ctx.fillText('Puntaje: ' + state.score, W / 2, H / 2 + 24);
    ctx.fillText('Pulsa Enter para reiniciar', W / 2, H / 2 + 56);
  }
}

function frame(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);  // limitado a 50 ms
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

loadSpritesheet(() => {
  requestAnimationFrame((time) => {
    lastTime = time;
    frame(time);
  });
});
