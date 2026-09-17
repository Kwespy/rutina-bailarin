
const STORAGE = "rutina-bailarin-progress-v2";
let routine = null;
let state = null;

const tabs = document.getElementById("tabs");
const panel = document.getElementById("panel");
const bar = document.getElementById("bar");
const count = document.getElementById("count");
const cycle = document.getElementById("cycle");
const banner = document.getElementById("banner");
const updateStatus = document.getElementById("update-status");
const refreshBtn = document.getElementById("refresh-routine");

function gimg(q){ return "https://www.google.com/search?tbm=isch&q="+encodeURIComponent(q); }

function loadSaved(){
  try { return JSON.parse(localStorage.getItem(STORAGE)) || null; }
  catch(e){ return null; }
}
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }

function buildFreshState(){
  return {cycle:1, activeDayId:routine.days[0]?.id || null, days:{}};
}

function reconcileState(saved){
  const next = saved && typeof saved === "object" ? saved : buildFreshState();
  next.cycle = Number.isFinite(next.cycle) ? next.cycle : 1;
  next.days = next.days || {};
  const validDayIds = new Set(routine.days.map(d=>d.id));
  if(!validDayIds.has(next.activeDayId)) next.activeDayId = routine.days[0]?.id || null;

  for(const day of routine.days){
    const old = next.days[day.id] || {};
    const oldChecks = old.checks || {};
    const checks = {};
    for(const ex of day.exercises) checks[ex.id] = Boolean(oldChecks[ex.id]);
    next.days[day.id] = {complete:Boolean(old.complete), checks};
  }
  // remove days no longer in routine, so stale completion cannot affect progress
  for(const id of Object.keys(next.days)){
    if(!validDayIds.has(id)) delete next.days[id];
  }
  return next;
}

async function fetchRoutine(showStatus=true){
  if(showStatus){
    updateStatus.textContent = "Buscando cambios…";
    updateStatus.classList.remove("error");
  }
  const url = "./routine.json?v="+Date.now();
  try{
    const resp = await fetch(url,{cache:"no-store"});
    if(!resp.ok) throw new Error("HTTP "+resp.status);
    const incoming = await resp.json();
    if(!incoming.days || !Array.isArray(incoming.days)) throw new Error("routine.json inválido");

    const previousVersion = routine?.version;
    routine = incoming;
    state = reconcileState(loadSaved());
    save();
    renderAll();

    if(showStatus){
      updateStatus.textContent = previousVersion && previousVersion !== routine.version
        ? "Rutina actualizada ✓"
        : "Ya tienes la última versión ✓";
      setTimeout(()=>{ updateStatus.textContent=""; },2600);
    }
  }catch(err){
    if(!routine){
      updateStatus.textContent = "No pude cargar la rutina. Revisa internet.";
      updateStatus.classList.add("error");
      panel.innerHTML = "<p>No se pudo cargar routine.json.</p>";
      return;
    }
    if(showStatus){
      updateStatus.textContent = "Sin conexión: usando la rutina guardada.";
      setTimeout(()=>{ updateStatus.textContent=""; },3000);
    }
  }
}

function completedCount(){
  return routine.days.filter(d=>state.days[d.id]?.complete).length;
}
function resetCycle(){
  const active = state.activeDayId;
  state = buildFreshState();
  state.cycle = (Number(localStorage.getItem("dummy")) || 0); // overwritten below
  state.activeDayId = active && routine.days.some(d=>d.id===active) ? active : routine.days[0]?.id;
}
function renderTabs(){
  tabs.innerHTML = routine.days.map(day=>{
    const s = state.days[day.id];
    return `<button type="button" data-day-id="${day.id}" class="${state.activeDayId===day.id?'active ':''}${s.complete?'done':''}">
      <span class="name">${day.label}</span><span class="checkmark">✓</span></button>`;
  }).join("");
  tabs.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    state.activeDayId=b.dataset.dayId; save(); renderAll();
  }));
}
function renderProgress(){
  const n=completedCount(), total=routine.days.length;
  count.textContent=`${n}/${total} sesiones`;
  bar.style.width=`${total ? (n/total)*100 : 0}%`;
  cycle.textContent=`Vuelta ${state.cycle}`;
}
function activeDay(){
  return routine.days.find(d=>d.id===state.activeDayId) || routine.days[0];
}
function renderPanel(){
  const day = activeDay();
  if(!day){ panel.innerHTML="<p>No hay sesiones.</p>"; return; }
  const s=state.days[day.id];

  panel.innerHTML = `
    <div class="daytitle">
      <div><h2>${day.label} — ${day.title}</h2><div class="muted small">${day.note || ""}</div></div>
      <span class="badge">${s.complete?'Hecho ✓':'Pendiente'}</span>
    </div>
    <div>
      ${day.exercises.map((ex,i)=>`
        <div class="exercise ${s.checks[ex.id]?'done':''}">
          <input type="checkbox" data-ex-id="${ex.id}" ${s.checks[ex.id]?'checked':''} aria-label="Completar ${ex.name}">
          <div>
            <a href="${gimg(ex.query || ex.name)}" target="_blank" rel="noopener">${i+1}. ${ex.name} ↗</a>
            <div class="meta">${ex.sets} · descanso ${ex.rest}</div>
          </div>
        </div>`).join("")}
    </div>
    <div class="actions">
      <button type="button" id="clear">Limpiar checks</button>
      <button type="button" id="complete" class="${s.complete?'':'primary'}">${s.complete?'Desmarcar sesión':'Marcar hecha ✓'}</button>
    </div>`;

  panel.querySelectorAll('input[type=checkbox]').forEach(c=>c.addEventListener("change",()=>{
    s.checks[c.dataset.exId]=c.checked; save(); renderPanel();
  }));
  document.getElementById("clear").addEventListener("click",()=>{
    for(const ex of day.exercises) s.checks[ex.id]=false;
    save(); renderPanel();
  });
  document.getElementById("complete").addEventListener("click",()=>{
    s.complete=!s.complete;
    save();
    renderAll();
    if(s.complete && completedCount()===routine.days.length){
      banner.classList.add("show");
      const oldCycle = state.cycle;
      setTimeout(()=>{
        const active=state.activeDayId;
        state=buildFreshState();
        state.cycle=oldCycle+1;
        state.activeDayId=active;
        state=reconcileState(state);
        save();
        banner.classList.remove("show");
        renderAll();
      },2200);
    }
  });
}
function renderMobility(){
  const m=document.getElementById("mobility");
  m.innerHTML=(routine.mobility||[]).map(item=>
    `<p><a target="_blank" rel="noopener" href="${gimg(item.query || item.name)}">${item.name} ↗</a> — ${item.prescription}</p>`
  ).join("") + `<p class="muted small">Si el dead hang molesta la muñeca, omítelo.</p>`;
}
function renderHeader(){
  document.getElementById("app-title").textContent=routine.title || "Rutina bailarín";
  document.getElementById("app-subtitle").textContent=routine.subtitle || "";
  document.getElementById("routine-version").textContent=`Rutina ${routine.version || ""}${routine.updated ? " · "+routine.updated : ""}`;
}
function renderAll(){
  if(!routine || !state) return;
  renderHeader(); renderTabs(); renderProgress(); renderPanel(); renderMobility();
}

refreshBtn.addEventListener("click",()=>fetchRoutine(true));

async function init(){
  // Try a cached routine first for instant offline boot, then refresh from network.
  try{
    const cached = await caches.match("./routine.json");
    if(cached){
      routine = await cached.json();
      state = reconcileState(loadSaved());
      renderAll();
    }
  }catch(e){}
  await fetchRoutine(false);
}
init();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
