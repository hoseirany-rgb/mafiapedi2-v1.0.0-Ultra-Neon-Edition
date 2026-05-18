const STORAGE_KEY = "mafiapedi2_save_v3";
let state = {
  playerCount: 12,
  scenario: "classic",
  players: [],
  edges: [],
  notes: [],
  selectedNode: null,
  selectedSpeaker: 1,
  zoom: 1,
  panX: 0,
  panY: 0,
  nodePositions: {},
  day: 1,
  lastSavedAt: null
};

let dragNodeId = null;
let dragOffset = { x: 0, y: 0 };
let panning = false;
let panStart = { x: 0, y: 0 };
let panOrigin = { x: 0, y: 0 };
let autoSaveTimer = null;
let longPressTimer = null;

const $ = (id) => document.getElementById(id);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function colorForProbability(prob) {
  if (prob >= 70) return "#e74c3c";
  if (prob >= 40) return "#f1c40f";
  return "#2ecc71";
}

function scenariosData() {
  return window.__SCENARIOS__ || {};
}

function dialoguesData() {
  return window.__DIALOGUES__ || [];
}

function getRoleName(id) {
  const scenario = scenariosData()[state.scenario] || scenariosData().classic || { roles: [] };
  return scenario.roles[id - 1] || "Citizen";
}

function buildInitialPlayers(count) {
  const arr = [];
  for (let i = 1; i <= count; i++) {
    arr.push({ id: i, name: `Player ${i}`, alive: true, note: "", mafia: 0 });
  }
  return arr;
}

function ensurePositions() {
  const cx = 600, cy = 380, r = 250;
  const n = state.players.length || 1;
  state.players.forEach((p, idx) => {
    if (!state.nodePositions[p.id]) {
      const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
      state.nodePositions[p.id] = {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      };
    }
  });
}

function computeMafiaProbability(id) {
  const incoming = state.edges.filter(e => e.to === id).length;
  const outgoing = state.edges.filter(e => e.from === id).length;
  const uniqueTargets = new Set(state.edges.filter(e => e.from === id).map(e => e.to)).size;
  const score = (incoming * 18) + (outgoing * 6) + (Math.max(0, uniqueTargets - 1) * 7);
  return clamp(Math.round(score), 0, 95);
}

function updateProbabilities() {
  state.players.forEach(p => p.mafia = computeMafiaProbability(p.id));
}

function initGame() {
  state.playerCount = parseInt($("playerCount").value, 10);
  state.scenario = $("scenarioSelect").value;
  state.players = buildInitialPlayers(state.playerCount);
  state.edges = [];
  state.notes = [];
  state.selectedNode = null;
  state.selectedSpeaker = 1;
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  state.nodePositions = {};
  ensurePositions();
  updateSpeakerSelect();
  updateProbabilities();
  render();
  updateDialoguePanel();
  saveGame();
}

function updateSpeakerSelect() {
  const select = $("speakerSelect");
  select.innerHTML = "";
  state.players.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
  select.value = String(state.selectedSpeaker || 1);
}

function render() {
  renderGraph();
  renderPlayerCards();
  $("selectedPlayer").textContent = state.selectedNode ? `Player ${state.selectedNode}` : "—";
  $("modeLabel").textContent = "Tap → Tap";
  $("lastSaved").textContent = state.lastSavedAt ? new Date(state.lastSavedAt).toLocaleTimeString("fa-IR") : "—";
}

function renderGraph() {
  const edgeLayer = $("edgeLayer");
  const nodeLayer = $("nodeLayer");
  edgeLayer.innerHTML = "";
  nodeLayer.innerHTML = "";

  const transform = $("graphTransform");
  transform.setAttribute("transform", `translate(${state.panX}, ${state.panY}) scale(${state.zoom})`);

  state.edges.forEach((e, idx) => {
    const from = state.nodePositions[e.from];
    const to = state.nodePositions[e.to];
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const norm = 1 / dist;
    const offset = Math.min(80, dist * 0.18);
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const curveX = mx + (-dy * norm) * offset;
    const curveY = my + (dx * norm) * offset;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${from.x} ${from.y} Q ${curveX} ${curveY} ${to.x} ${to.y}`);
    path.setAttribute("marker-end", "url(#arrow)");
    if (state.edges.filter(x => x.from === e.from && x.to === e.to).length > 1) {
      path.classList.add("multi");
    }
    path.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      deleteEdge(idx);
    });
    path.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => deleteEdge(idx), 550);
    });
    path.addEventListener("pointerup", () => clearTimeout(longPressTimer));
    edgeLayer.appendChild(path);
  });

  state.players.forEach(player => {
    const pos = state.nodePositions[player.id];
    const prob = computeMafiaProbability(player.id);
    const color = colorForProbability(prob);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("node");
    if (state.selectedNode === player.id) g.classList.add("selected");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pos.x);
    circle.setAttribute("cy", pos.y);
    circle.setAttribute("r", 38);
    circle.setAttribute("fill", color);

    const t1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t1.setAttribute("x", pos.x);
    t1.setAttribute("y", pos.y - 12);
    t1.textContent = player.name;

    const t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t2.setAttribute("x", pos.x);
    t2.setAttribute("y", pos.y + 5);
    t2.setAttribute("class", "small");
    t2.textContent = `${prob}% Mafia`;

    const t3 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t3.setAttribute("x", pos.x);
    t3.setAttribute("y", pos.y + 20);
    t3.setAttribute("class", "small");
    t3.textContent = player.alive ? "Alive" : "Dead";

    g.appendChild(circle);
    g.appendChild(t1);
    g.appendChild(t2);
    g.appendChild(t3);

    g.addEventListener("click", (ev) => {
      ev.stopPropagation();
      handleNodeTap(player.id);
    });

    g.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      dragNodeId = player.id;
      const pt = screenToGraph(ev.clientX, ev.clientY);
      dragOffset.x = pos.x - pt.x;
      dragOffset.y = pos.y - pt.y;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => toggleAlive(player.id), 650);
    });

    g.addEventListener("pointermove", (ev) => {
      if (dragNodeId !== player.id) return;
      const pt = screenToGraph(ev.clientX, ev.clientY);
      state.nodePositions[player.id] = { x: pt.x + dragOffset.x, y: pt.y + dragOffset.y };
      renderGraph();
    });

    g.addEventListener("pointerup", () => {
      clearTimeout(longPressTimer);
      dragNodeId = null;
      saveStateLater();
    });

    nodeLayer.appendChild(g);
  });

  const svg = $("graphSvg");
  svg.onpointerdown = (ev) => {
    if (ev.target.closest && ev.target.closest(".node")) return;
    if (ev.target.tagName === "circle" || ev.target.tagName === "text") return;
    panning = true;
    panStart = { x: ev.clientX, y: ev.clientY };
    panOrigin = { x: state.panX, y: state.panY };
  };
  svg.onpointermove = (ev) => {
    if (!panning) return;
    state.panX = panOrigin.x + (ev.clientX - panStart.x);
    state.panY = panOrigin.y + (ev.clientY - panStart.y);
    renderGraph();
  };
  svg.onpointerup = () => panning = false;
  svg.onwheel = (ev) => {
    ev.preventDefault();
    state.zoom = clamp(state.zoom + (ev.deltaY < 0 ? 0.08 : -0.08), 0.65, 1.6);
    renderGraph();
    saveStateLater();
  };
}

function screenToGraph(clientX, clientY) {
  const svg = $("graphSvg");
  const rect = svg.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.panX) / state.zoom,
    y: (clientY - rect.top - state.panY) / state.zoom
  };
}

function handleNodeTap(id) {
  if (state.selectedNode == null) {
    state.selectedNode = id;
  } else if (state.selectedNode === id) {
    state.selectedNode = null;
  } else {
    state.edges.push({ from: state.selectedNode, to: id, createdAt: Date.now() });
    state.selectedNode = null;
    updateProbabilities();
  }
  $("selectedPlayer").textContent = state.selectedNode ? `Player ${state.selectedNode}` : "—";
  renderGraph();
  saveStateLater();
}

function deleteEdge(idx) {
  state.edges.splice(idx, 1);
  updateProbabilities();
  render();
  saveStateLater();
}

function toggleAlive(id) {
  const p = state.players.find(x => x.id === id);
  if (!p) return;
  p.alive = !p.alive;
  render();
  saveStateLater();
}

function renderPlayerCards() {
  const list = $("playersList");
  list.innerHTML = "";
  state.players.forEach(p => {
    const prob = computeMafiaProbability(p.id);
    const role = getRoleName(p.id);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="top">
        <div><b>${p.name}</b></div>
        <div class="badge ${p.alive ? "alive" : "dead"}">${p.alive ? "Alive" : "Dead"}</div>
      </div>
      <div class="meta">
        نقش احتمالی: ${role}<br>
        درصد مافیا: <b style="color:${colorForProbability(prob)}">${prob}%</b><br>
        یادداشت: ${p.note || "—"}
      </div>
    `;
    card.addEventListener("click", () => {
      state.selectedSpeaker = p.id;
      $("speakerSelect").value = String(p.id);
      saveStateLater();
    });
    list.appendChild(card);
  });
}

function updateDialoguePanel() {
  const box = $("dialogueBox");
  box.innerHTML = "";
  const pool = dialoguesData();
  const selected = [];
  while (selected.length < Math.min(8, pool.length)) {
    const item = pool[Math.floor(Math.random() * pool.length)];
    if (!selected.includes(item)) selected.push(item);
  }
  selected.forEach(text => {
    const div = document.createElement("div");
    div.className = "dialogueItem";
    div.textContent = text;
    box.appendChild(div);
  });
}

function startSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("تشخیص گفتار در این مرورگر در دسترس نیست. می‌توانی متن را دستی در کادر بنویسی.");
    return;
  }
  const rec = new SpeechRecognition();
  rec.lang = "fa-IR";
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (event) => {
    let txt = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      txt += event.results[i][0].transcript;
    }
    $("speechText").value = `گوینده: Player ${$("speakerSelect").value}\n\n${txt}`;
  };
  rec.onerror = (e) => {
    $("speechText").value = `خطا: ${e.error}`;
  };
  rec.start();
}

function addNote() {
  const text = $("noteText").value.trim();
  if (!text) return;
  const speaker = parseInt($("speakerSelect").value, 10) || 1;
  const p = state.players.find(x => x.id === speaker);
  if (p) p.note = text;
  state.notes.push({ day: state.day, speakerId: speaker, text, createdAt: Date.now() });
  $("noteText").value = "";
  render();
  saveStateLater();
}

function saveGame() {
  state.lastSavedAt = Date.now();
  const payload = {
    playerCount: state.playerCount,
    scenario: state.scenario,
    players: state.players,
    edges: state.edges,
    notes: state.notes,
    selectedSpeaker: parseInt($("speakerSelect").value, 10) || 1,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    nodePositions: state.nodePositions,
    day: state.day,
    lastSavedAt: state.lastSavedAt
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  $("lastSaved").textContent = new Date(state.lastSavedAt).toLocaleTimeString("fa-IR");
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    alert("ذخیره‌ای پیدا نشد.");
    return;
  }
  const payload = JSON.parse(raw);
  state.playerCount = payload.playerCount || 12;
  state.scenario = payload.scenario || "classic";
  state.players = payload.players || buildInitialPlayers(state.playerCount);
  state.edges = payload.edges || [];
  state.notes = payload.notes || [];
  state.selectedSpeaker = payload.selectedSpeaker || 1;
  state.zoom = payload.zoom || 1;
  state.panX = payload.panX || 0;
  state.panY = payload.panY || 0;
  state.nodePositions = payload.nodePositions || {};
  state.day = payload.day || 1;
  state.lastSavedAt = payload.lastSavedAt || Date.now();

  $("playerCount").value = String(state.playerCount);
  $("scenarioSelect").value = state.scenario;
  updateSpeakerSelect();
  $("speakerSelect").value = String(state.selectedSpeaker);
  ensurePositions();
  updateProbabilities();
  render();
}

function resetEdges() {
  state.edges = [];
  updateProbabilities();
  render();
  saveStateLater();
}

function saveStateLater() {
  clearTimeout(window.__saveDebounce);
  window.__saveDebounce = setTimeout(saveGame, 250);
}

function bootstrap() {
  $("btnNew").addEventListener("click", initGame);
  $("btnSave").addEventListener("click", saveGame);
  $("btnLoad").addEventListener("click", loadGame);
  $("btnSpeak").addEventListener("click", startSpeech);
  $("btnAddNote").addEventListener("click", addNote);
  $("btnResetEdges").addEventListener("click", resetEdges);
  $("speakerSelect").addEventListener("change", () => {
    state.selectedSpeaker = parseInt($("speakerSelect").value, 10) || 1;
    saveStateLater();
  });
  $("scenarioSelect").addEventListener("change", () => {
    state.scenario = $("scenarioSelect").value;
    updateProbabilities();
    render();
    saveStateLater();
  });
  $("playerCount").addEventListener("change", initGame);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  fetch("dialogues.json").then(r => r.json()).then(d => { window.__DIALOGUES__ = d; updateDialoguePanel(); }).catch(() => {});
  fetch("scenarios.json").then(r => r.json()).then(d => { window.__SCENARIOS__ = d; updateProbabilities(); render(); }).catch(() => {});

  initGame();
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(saveGame, 30000);
}
const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();

recognition.lang = "fa-IR";

recognition.continuous = true;

recognition.interimResults = true;

recognition.onresult = (event) => {

  let text = "";

  for (
    let i = event.resultIndex;
    i < event.results.length;
    i++
  ) {

    text += event.results[i][0].transcript;
  }

  console.log(text);

  document.getElementById("speechText").innerText =
    text;
};

recognition.onerror = (e) => {
  console.log(e);
};

function startVoice() {
  recognition.start();
}
document.addEventListener("DOMContentLoaded", bootstrap);
