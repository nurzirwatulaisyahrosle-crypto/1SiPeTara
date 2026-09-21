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
const interactBtn = document.querySelector("#interactBtn");
const resultModal = document.querySelector("#resultModal");

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
    interactBtn.classList.add("hidden");
    return;
  }

  interaction.classList.remove("hidden");
  interactBtn.classList.remove("hidden");

  if (target.id === "finish") {
    if (game.completedCheckpoints.length === 5) {
      interaction.textContent = "🏆 Masuk ke PENAMAT";
      interactBtn.textContent = "🏆 PENAMAT";
    } else {
      interaction.textContent = "🔒 Selesaikan semua checkpoint dahulu!";
      interactBtn.classList.add("hidden");
    }
    return;
  }

  const state = checkpointState(target.id);
  if (state === "locked") {
    interaction.textContent = "🔒 Selesaikan checkpoint sebelumnya dahulu!";
    interactBtn.classList.add("hidden");
  } else if (state === "completed") {
    interaction.textContent = `✓ ${target.label} telah selesai`;
    interactBtn.classList.add("hidden");
  } else {
    interaction.textContent = `✨ ${target.label} — masuk misi`;
    interactBtn.textContent = "✨ MASUK MISI";
  }
}

function interact() {
  const { target, distance } = getNearestTarget();
  if (!target || distance > 92) return;

  if (target.id === "finish") {
    if (game.completedCheckpoints.length === 5) showResults();
    return;
  }

  if (checkpointState(target.id) !== "active") return;
  game.modalCheckpoint = target.id;
  modalTitle.textContent = `Misi ${target.id}`;
  modal.classList.remove("hidden");
  keys.clear();
  openCheckpoint(target.id);
}

document.querySelector("#closeModal").addEventListener("click", () => {
  stopSpeech(); stopRecognition(true); modal.classList.add("hidden");
});



const activityArea=document.querySelector("#activityArea");
let activityIndex=0, recognition=null, isRecording=false, finalTranscript="", interimTranscript="";
const CP={
1:[
{audio:"Mimi membela seekor arnab. Arnab Mimi suka makan lobak. Apakah makanan arnab Mimi?",options:["🥕","🍎","🌽"],correct:"🥕"},
{audio:"Ravi membawa pensel ke sekolah. Dia menggunakan pensel itu untuk menulis. Apakah yang digunakan oleh Ravi untuk menulis?",options:["✏️","📏","✂️"],correct:"✏️"}],
2:[
{audio:"Gunakan pisau untuk memotong ikan.",items:[["🔪","pisau"],["🥄","sudu"],["🍴","garpu"]],target:["🐟","ikan"],correct:"pisau"},
{audio:"Masukkan garam ke dalam mangkuk.",items:[["🧂","garam"],["🥄","sudu"],["🔪","pisau"]],target:["🥣","mangkuk"],correct:"garam"}],
3:[
{audio:"Siti membeli tiga biji epal. Dia memasukkan epal itu ke dalam bakul. Berapakah epal yang dibeli oleh Siti?",keywords:["tiga","3"]},
{audio:"Aiman mempunyai sebuah beg biru. Dia membawa beg itu ke sekolah. Apakah warna beg Aiman?",keywords:["biru"]}],
4:[
{audio:"Selamat datang! Boleh kamu bantu saya?",any:["ya","boleh","bantu"]},
{audio:"Belikan saya tiga barang ini di kedai runcit Pak Ali. Barang itu ialah cuka, kicap dan garam.",any:["baik","boleh","beli"]},
{audio:"Boleh kamu ulang semula apakah barang yang saya perlukan tadi?",all:["cuka","kicap","garam"]}],
5:[
{audio:"Saya suka membaca buku.",all:["saya","suka","membaca","buku"]},
{audio:"Kami bermain bola di padang.",all:["kami","bermain","bola","di","padang"]}]
};
function openCheckpoint(id){activityIndex=0;renderActivity(id)}
function shell(t,n,b){activityArea.innerHTML=`<div class="activity-head">${t} • ${activityIndex+1}/${n}</div>${b}<div id="feedback" class="feedback"></div>`}
function renderActivity(id){stopSpeech();stopRecognition(true);let d=CP[id][activityIndex],n=CP[id].length;if(id===1)return cp1(d,n);if(id===2)return cp2(d,n);renderVoice(d,n,id===3?"Dengar dan jawab dengan suara":id===4?"Misi Kedai Runcit Pak Ali":"Dengar dan ulang",id===4,id===5)}
function speak(t){stopSpeech();if(!("speechSynthesis"in window)){fb("🔊 Audio tidak dapat dimainkan pada peranti ini.",0);return}let u=new SpeechSynthesisUtterance(t);u.lang="ms-MY";u.rate=.8;let v=speechSynthesis.getVoices(),m=v.find(x=>/^ms(-|_)/i.test(x.lang))||v.find(x=>/Malay/i.test(x.name));if(m)u.voice=m;speechSynthesis.speak(u)}
function stopSpeech(){if("speechSynthesis"in window)speechSynthesis.cancel()}
function fb(t,g){let e=document.querySelector("#feedback");if(e){e.textContent=t;e.className=`feedback ${g?"good":"bad"}`}}
function good(){let a=["⭐ Hebat! Jawapan kamu betul!","🎉 Tahniah! Kamu berjaya!","🌟 Bagus! Teruskan!","🏆 Syabas! Jawapan tepat!"];return a[Math.floor(Math.random()*a.length)]}
function bad(){let a=["💪 Hampir betul. Cuba sekali lagi!","👂 Dengar semula dengan teliti.","🌱 Cuba lagi. Kamu pasti boleh!","🔊 Mari dengar sekali lagi."];return a[Math.floor(Math.random()*a.length)]}
function cp1(d,n){shell("Dengar dan pilih gambar",n,`<div class="activity-actions"><button class="audio-btn" id="listenBtn">🔊 DENGAR</button></div><div class="picture-options">${d.options.map(x=>`<button class="picture-option" data-a="${x}">${x}</button>`).join("")}</div>`);listenBtn.onclick=()=>speak(d.audio);document.querySelectorAll(".picture-option").forEach(b=>b.onclick=()=>{if(b.dataset.a===d.correct){fb(good(),1);advance()}else{fb(bad(),0);speak(d.audio)}});setTimeout(()=>speak(d.audio),250)}
function cp2(d,n){shell("Dengar dan lakukan",n,`<div class="activity-actions"><button class="audio-btn" id="listenBtn">🔊 DENGAR</button></div><div class="kitchen"><div class="drag-zone">${d.items.map(x=>`<div class="drag-item" draggable="true" data-i="${x[1]}">${x[0]}</div>`).join("")}</div><div class="drop-zone" id="dropZone">${d.target[0]}</div></div>`);listenBtn.onclick=()=>speak(d.audio);let sel="";document.querySelectorAll(".drag-item").forEach(e=>{e.ondragstart=x=>x.dataTransfer.setData("text/plain",e.dataset.i);e.onclick=()=>sel=e.dataset.i});dropZone.ondragover=e=>e.preventDefault();dropZone.ondrop=e=>{e.preventDefault();dropCheck(e.dataTransfer.getData("text/plain"),d)};dropZone.onclick=()=>sel&&dropCheck(sel,d);setTimeout(()=>speak(d.audio),250)}
function dropCheck(x,d){if(x===d.correct){fb("⭐ Bagus! Kamu mengikut arahan dengan betul!",1);advance()}else{fb("👂 Cuba dengar arahan sekali lagi.",0);speak(d.audio)}}
function norm(s){return(s||"").toLowerCase().replace(/[.,!?;:]/g," ").replace(/\s+/g," ").trim()}
function any(t,w){t=norm(t);return w.some(x=>t.includes(norm(x)))}
function all(t,w){t=" "+norm(t)+" ";return w.every(x=>t.includes(" "+norm(x)+" "))}
function renderVoice(d,n,title,dialog=false,repeat=false){shell(title,n,`<div class="activity-actions"><button class="audio-btn" id="listenBtn">🔊 ${repeat?"DENGAR AYAT":"DENGAR"}</button><button class="record-btn" id="recordBtn">🎙️ RAKAM SUARA</button></div><div id="recordStatus" class="status-line"></div><div class="transcript" id="transcript">${repeat?"Perkataan kamu akan muncul di sini...":"Jawapan suara akan muncul di sini."}</div>${dialog&&activityIndex===2?'<div class="goods">🍶 🧴 🧂</div>':""}`);listenBtn.onclick=()=>speak(d.audio);recordBtn.onclick=()=>toggleRec(d,repeat);setTimeout(()=>speak(d.audio),250)}
function newRec(){let SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;let r=new SR();r.lang="ms-MY";r.continuous=true;r.interimResults=true;r.onresult=e=>{let it="";for(let i=e.resultIndex;i<e.results.length;i++){let t=e.results[i][0].transcript;if(e.results[i].isFinal)finalTranscript+=" "+t;else it+=" "+t}interimTranscript=it;let b=document.querySelector("#transcript");if(b)b.textContent=(finalTranscript+" "+it).trim()||"🎙️ Sedang mendengar..."};r.onend=()=>{if(isRecording)try{r.start()}catch(e){}};return r}
function toggleRec(d,repeat){if(!isRecording){recognition=newRec();if(!recognition){fb("🎙️ Rakaman suara tidak disokong oleh pelayar ini.",0);return}finalTranscript="";interimTranscript="";isRecording=true;recBtn();try{recognition.start()}catch(e){}}else{isRecording=false;try{recognition.stop()}catch(e){}recBtn();setTimeout(()=>evalVoice(d,repeat),180)}}
function recBtn(){let b=document.querySelector("#recordBtn"),s=document.querySelector("#recordStatus");if(!b)return;b.textContent=isRecording?"⏹️ SELESAI RAKAM":"🎙️ RAKAM SUARA";b.classList.toggle("recording",isRecording);if(s)s.textContent=isRecording?"🎙️ Sedang mendengar...":""}
function stopRecognition(clear=false){isRecording=false;if(recognition){recognition.onend=null;try{recognition.stop()}catch(e){}}recognition=null;if(clear){finalTranscript="";interimTranscript=""}}
function evalVoice(d,repeat){let a=norm(finalTranscript+" "+interimTranscript),ok=d.keywords?any(a,d.keywords):d.any?any(a,d.any):d.all?all(a,d.all):false;let b=document.querySelector("#transcript");if(b)b.textContent=a||"Tiada suara dikesan.";if(ok){fb(repeat?"🌟 Hebat! Sebutan kamu lengkap!":good(),1);advance()}else{let m=repeat?"👂 Ada perkataan yang belum lengkap. Dengar dan cuba sekali lagi.":bad();if(game.modalCheckpoint===4&&activityIndex===2)m="👂 Hampir betul. Cuba ingat semua barang tadi.";fb(m,0)}}
function advance(){let cp=game.modalCheckpoint;if(cp!==4)game.score+=10;updateHUD();setTimeout(()=>{activityIndex++;if(activityIndex<CP[cp].length)renderActivity(cp);else completeCP(cp)},750)}
function completeCP(id){if(game.completedCheckpoints.includes(id))return;if(id===4)game.score+=10;game.completedCheckpoints.push(id);game.currentCheckpoint=id<5?id+1:6;updateHUD();refreshCheckpointGraphics();stopSpeech();stopRecognition(true);activityArea.innerHTML=`<div class="activity-head">🎉 CHECKPOINT ${id} SELESAI!</div><p>Syabas, ${game.studentName}! Laluan seterusnya telah dibuka.</p><button class="next-btn" id="backWorldBtn">➡️ KEMBALI KE DUNIA</button>`;backWorldBtn.onclick=()=>modal.classList.add("hidden")}


interactBtn.addEventListener("pointerup", e => { e.preventDefault(); interact(); });

function showResults(){
  document.querySelector("#resultText").textContent =
    `${game.studentName} telah berjaya menamatkan Kembara Si PeTaRa!`;
  document.querySelector("#resultScore").textContent = game.score;
  resultModal.classList.remove("hidden");
}
document.querySelector("#restartBtn").addEventListener("click", () => location.reload());
document.querySelector("#homeBtn").addEventListener("click", () => location.reload());

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
  if (!modal.classList.contains("hidden") || !resultModal.classList.contains("hidden")) return;

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
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const cover = Math.max(vw / MAP_W, vh / MAP_H);
  const portrait = vh > vw;

  // Portrait: keep the map natural and let the camera follow the player.
  // Landscape/desktop: show more of the world while still filling the viewport.
  const minimum = portrait ? 0.78 : (vh <= 600 ? 0.68 : 0.72);
  scale = Math.max(minimum, cover);

  world.style.width = MAP_W + "px";
  world.style.height = MAP_H + "px";
  updateCamera();
}
window.addEventListener("resize", resizeWorld);
window.addEventListener("orientationchange", () => setTimeout(resizeWorld, 180));

function loop(time) {
  updatePlayer(time);
  updateCamera();
  handleInteraction();
  requestAnimationFrame(loop);
}
