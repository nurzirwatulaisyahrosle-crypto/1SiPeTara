const MAP_W = 1600;
const MAP_H = 900;

const game = {
  studentName: "",
  score: 0,
  currentCheckpoint: 1,
  completedCheckpoints: [],
  modalCheckpoint: null,
  player: { x: 800, y: 795, speed: 4.2, direction: "up", moving: false, frame: 0 }
};

// Positions are percentages/coordinates over the 1600x900 backdrop.
// They can be fine-tuned later without changing the map image.
const checkpoints = [
  { id: 1, x: 630,  y: 520, label: "Misi 1" },
  { id: 2, x: 790,  y: 745, label: "Misi 2" },
  { id: 3, x: 1000, y: 520, label: "Misi 3" },
  { id: 4, x: 455,  y: 205, label: "Misi 4" },
  { id: 5, x: 1190, y: 240, label: "Misi 5" }
];

const finish = { id: "finish", x: 805, y: 115, label: "Penamat" };

const keys = new Set();
let scale = 1;
let lastAnim = 0;

const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const nameInput = document.querySelector("#studentName");
const nameError = document.querySelector("#nameError");
const world = document.querySelector("#world");
const player = document.querySelector("#player");
const playerSprite = document.querySelector("#playerSprite");
const playerName = document.querySelector("#playerName");
const hudName = document.querySelector("#hudName");
const scoreEl = document.querySelector("#score");
const progressEl = document.querySelector("#progress");
const cpLayer = document.querySelector("#checkpointLayer");
const interaction = document.querySelector("#interactionMessage");
const modal = document.querySelector("#checkpointModal");
const modalTitle = document.querySelector("#modalTitle");

function startGame() {
  const name = nameInput.value.trim();
  if (!name) {
    nameError.textContent = "⚠️ Sila masukkan nama kamu dahulu.";
    nameInput.focus();
    return;
  }
  game.studentName = name;
  hudName.textContent = name;
  playerName.textContent = name;
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  createCheckpoints();
  updateHUD();
  resizeWorld();
  requestAnimationFrame(loop);
}

document.querySelector("#startBtn").addEventListener("click", startGame);
nameInput.addEventListener("keydown", e => { if (e.key === "Enter") startGame(); });
nameInput.addEventListener("input", () => nameError.textContent = "");

function checkpointState(id) {
  if (game.completedCheckpoints.includes(id)) return "completed";
  if (id === game.currentCheckpoint) return "active";
  return "locked";
}

function assetFor(id, state) {
  return `assets/checkpoints/cp${id}-${state}.png`;
}

function createCheckpoints() {
  cpLayer.innerHTML = "";
  checkpoints.forEach(cp => {
    const el = document.createElement("div");
    el.className = "checkpoint";
    el.dataset.cp = cp.id;
    el.style.left = cp.x + "px";
    el.style.top = cp.y + "px";
    el.innerHTML = `<img alt="${cp.label}">`;
    cpLayer.appendChild(el);
  });

  const f = document.createElement("div");
  f.className = "checkpoint";
  f.dataset.cp = "finish";
  f.style.left = finish.x + "px";
  f.style.top = finish.y + "px";
  f.innerHTML = `<img alt="Penamat">`;
  cpLayer.appendChild(f);
  refreshCheckpointGraphics();
}

function refreshCheckpointGraphics() {
  checkpoints.forEach(cp => {
    const state = checkpointState(cp.id);
    const el = document.querySelector(`[data-cp="${cp.id}"]`);
    if (!el) return;
    el.className = `checkpoint ${state}`;
    el.querySelector("img").src = assetFor(cp.id, state);
  });

  const f = document.querySelector('[data-cp="finish"]');
  if (f) {
    const state = game.completedCheckpoints.length === 5 ? "active" : "locked";
    f.className = `checkpoint ${state}`;
    f.querySelector("img").src = `assets/checkpoints/finish-${state}.png`;
  }
}

function updateHUD() {
  scoreEl.textContent = game.score;
  progressEl.textContent = `${game.completedCheckpoints.length}/5`;
}

function getNearestTarget() {
  let nearest = null;
  let best = Infinity;
  [...checkpoints, finish].forEach(cp => {
    const d = Math.hypot(game.player.x - cp.x, game.player.y - cp.y);
    if (d < best) { best = d; nearest = cp; }
  });
  return { target: nearest, distance: best };
}

function handleInteraction() {
  const { target, distance } = getNearestTarget();
  if (!target || distance > 92) {
    interaction.classList.add("hidden");
    return;
  }

  interaction.classList.remove("hidden");

  if (target.id === "finish") {
    if (game.completedCheckpoints.length === 5) {
      interaction.textContent = "🏆 Tekan E untuk ke PENAMAT";
    } else {
      interaction.textContent = "🔒 Selesaikan semua checkpoint dahulu!";
    }
    return;
  }

  const state = checkpointState(target.id);
  if (state === "locked") interaction.textContent = "🔒 Selesaikan checkpoint sebelumnya dahulu!";
  else if (state === "completed") interaction.textContent = `✓ ${target.label} telah selesai`;
  else interaction.textContent = `✨ ${target.label} — tekan E untuk masuk`;
}

function interact() {
  const { target, distance } = getNearestTarget();
  if (!target || distance > 92) return;

  if (target.id === "finish") {
    if (game.completedCheckpoints.length === 5) {
      alert(`🏆 Tahniah ${game.studentName}! Kamu telah sampai ke Penamat PeTaRa!`);
    }
    return;
  }

  if (checkpointState(target.id) !== "active") return;
  game.modalCheckpoint = target.id;
  modalTitle.textContent = `Misi ${target.id}`;
  modal.classList.remove("hidden");
  keys.clear();
}

document.querySelector("#closeModal").addEventListener("click", () => modal.classList.add("hidden"));

document.querySelector("#demoCompleteBtn").addEventListener("click", () => {
  const id = game.modalCheckpoint;
  if (!id || game.completedCheckpoints.includes(id)) return;
  game.completedCheckpoints.push(id);
  game.score += 10;
  game.currentCheckpoint = id < 5 ? id + 1 : 6;
  updateHUD();
  refreshCheckpointGraphics();
  modal.classList.add("hidden");
});

function setKey(key, down) {
  const allowed = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"];
  if (!allowed.includes(key)) return;
  down ? keys.add(key.toLowerCase()) : keys.delete(key.toLowerCase());
}

window.addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
  if ((e.key === "e" || e.key === "E") && modal.classList.contains("hidden")) interact();
  setKey(e.key, true);
});
window.addEventListener("keyup", e => setKey(e.key, false));

document.querySelectorAll("#dpad button").forEach(btn => {
  const key = btn.dataset.key.toLowerCase();
  const on = e => { e.preventDefault(); keys.add(key); btn.classList.add("pressed"); };
  const off = e => { e.preventDefault(); keys.delete(key); btn.classList.remove("pressed"); };
  btn.addEventListener("pointerdown", on);
  btn.addEventListener("pointerup", off);
  btn.addEventListener("pointercancel", off);
  btn.addEventListener("pointerleave", off);
});

function updatePlayer(time) {
  if (!modal.classList.contains("hidden")) return;

  let dx = 0, dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx--;
  if (keys.has("arrowright") || keys.has("d")) dx++;
  if (keys.has("arrowup") || keys.has("w")) dy--;
  if (keys.has("arrowdown") || keys.has("s")) dy++;

  game.player.moving = dx !== 0 || dy !== 0;
  if (dx && dy) { dx *= .707; dy *= .707; }

  if (dy > 0) game.player.direction = "down";
  else if (dy < 0) game.player.direction = "up";
  else if (dx < 0) game.player.direction = "left";
  else if (dx > 0) game.player.direction = "right";

  // Simple world bounds for Fasa 1.
  game.player.x = Math.max(70, Math.min(MAP_W - 70, game.player.x + dx * game.player.speed));
  game.player.y = Math.max(100, Math.min(MAP_H - 30, game.player.y + dy * game.player.speed));

  if (game.player.moving && time - lastAnim > 130) {
    game.player.frame = (game.player.frame % 4) + 1;
    lastAnim = time;
  }

  if (game.player.moving) {
    playerSprite.src = `assets/player/petara-${game.player.direction}-${game.player.frame || 1}.png`;
  } else {
    playerSprite.src = game.player.direction === "down"
      ? "assets/player/petara-idle.png"
      : `assets/player/petara-${game.player.direction}-1.png`;
  }

  player.style.left = game.player.x + "px";
  player.style.top = game.player.y + "px";
}

function updateCamera() {
  const viewport = document.querySelector("#worldViewport");
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;

  const scaledW = MAP_W * scale;
  const scaledH = MAP_H * scale;

  let tx = vw / 2 - game.player.x * scale;
  let ty = vh / 2 - game.player.y * scale;

  if (scaledW <= vw) tx = (vw - scaledW) / 2;
  else tx = Math.min(0, Math.max(vw - scaledW, tx));

  if (scaledH <= vh) ty = (vh - scaledH) / 2;
  else ty = Math.min(0, Math.max(vh - scaledH, ty));

  world.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
}

function resizeWorld() {
  const viewport = document.querySelector("#worldViewport");
  // Keep enough scale to cover the screen, while still allowing camera movement on smaller displays.
  const cover = Math.max(viewport.clientWidth / MAP_W, viewport.clientHeight / MAP_H);
  scale = Math.max(.72, cover);
  world.style.width = MAP_W + "px";
  world.style.height = MAP_H + "px";
  updateCamera();
}
window.addEventListener("resize", resizeWorld);

function loop(time) {
  updatePlayer(time);
  updateCamera();
  handleInteraction();
  requestAnimationFrame(loop);
}
