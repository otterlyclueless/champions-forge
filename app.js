// #SECTION: APP CONFIG & GLOBAL STATE
// ═══════════════════════════════════════
// APP CONFIG & GLOBAL STATE
// Supabase config, auth state, global app data,
// filters, and shared runtime variables.
// ═══════════════════════════════════════

var API='https://hrxqhhjkhhlpafhfarbl.supabase.co',ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeHFoaGpraGhscGFmaGZhcmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDAzNjYsImV4cCI6MjA5MTY3NjM2Nn0.AALRUAOd3WVj1vmu42RvDV-RGHCpa8ymplkXsx_NSW0';
var tk=null,refreshTk=null,sessionExp=0,usr=null,allPkmn=[],allBuilds=[],allTeams=[],uDex={},uShinyDex={},activeType=null,activeForm=null,showShiny=false,obtFilter='all',shinyCards={},authMode='login';

// #SECTION: POKÉMON TYPE CONSTANTS & MATCHUP DATA
// ═══════════════════════════════════════
// POKÉMON TYPE CONSTANTS & MATCHUP DATA
// Type colours, type list, and effectiveness chart.
// Used for badges, gradients, matchups, and coverage.
// ═══════════════════════════════════════

var TC={Normal:{m:'#A8A77A',l:'#D3D3B8',d:'#6D6D4E'},Fire:{m:'#EE8130',l:'#F5AC78',d:'#9C531F'},Water:{m:'#6390F0',l:'#9DB7F5',d:'#445E9C'},Electric:{m:'#F7D02C',l:'#FAE078',d:'#A1871F'},Grass:{m:'#7AC74C',l:'#A7DB8D',d:'#4E8234'},Ice:{m:'#96D9D6',l:'#BCE6E6',d:'#638D8D'},Fighting:{m:'#C22E28',l:'#D67873',d:'#7D1F1A'},Poison:{m:'#A33EA1',l:'#C183C1',d:'#6B2A6B'},Ground:{m:'#E2BF65',l:'#EBD69D',d:'#927D44'},Flying:{m:'#A98FF3',l:'#C6B7F5',d:'#6D5E9C'},Psychic:{m:'#F95587',l:'#FA92B2',d:'#A13959'},Bug:{m:'#A6B91A',l:'#C6D16E',d:'#6D7815'},Rock:{m:'#B6A136',l:'#D1C17D',d:'#786824'},Ghost:{m:'#735797',l:'#A292BC',d:'#4C3A65'},Dragon:{m:'#6F35FC',l:'#A27DFA',d:'#4924A1'},Dark:{m:'#705746',l:'#A29288',d:'#49392F'},Steel:{m:'#B7B7CE',l:'#D1D1E0',d:'#787887'},Fairy:{m:'#D685AD',l:'#F4BDC9',d:'#9B6470'}};
var ALL_T=Object.keys(TC);
var TCHART={Normal:{Rock:.5,Ghost:0,Steel:.5},Fire:{Fire:.5,Water:.5,Grass:2,Ice:2,Bug:2,Rock:.5,Dragon:.5,Steel:2},Water:{Fire:2,Water:.5,Grass:.5,Ground:2,Rock:2,Dragon:.5},Electric:{Water:2,Electric:.5,Grass:.5,Ground:0,Flying:2,Dragon:.5},Grass:{Fire:.5,Water:2,Grass:.5,Poison:.5,Ground:2,Flying:.5,Bug:.5,Rock:2,Dragon:.5,Steel:.5},Ice:{Fire:.5,Water:.5,Grass:2,Ice:.5,Ground:2,Flying:2,Dragon:2,Steel:.5},Fighting:{Normal:2,Ice:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:.5},Poison:{Grass:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Fairy:2},Ground:{Fire:2,Electric:2,Grass:.5,Poison:2,Flying:0,Bug:.5,Rock:2,Steel:2},Flying:{Electric:.5,Grass:2,Fighting:2,Bug:2,Rock:.5,Steel:.5},Psychic:{Fighting:2,Poison:2,Psychic:.5,Dark:0,Steel:.5},Bug:{Fire:.5,Grass:2,Fighting:.5,Poison:.5,Flying:.5,Psychic:2,Ghost:.5,Dark:2,Steel:.5,Fairy:.5},Rock:{Fire:2,Ice:2,Fighting:.5,Ground:.5,Flying:2,Bug:2,Steel:.5},Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},Dragon:{Dragon:2,Steel:.5,Fairy:0},Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5}};

// #SECTION: SHARED HELPERS
// ═══════════════════════════════════════
// SHARED HELPERS
// Reusable utility functions for icons, toasts,
// DOM helpers, API requests, inserts, deletes, etc.
// ═══════════════════════════════════════

function pb(s){return'<svg width="'+s+'" height="'+s+'" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#EF4444"/><path d="M5 50A45 45 0 0 0 95 50Z" fill="white"/><circle cx="50" cy="50" r="45" fill="none" stroke="#1E293B" stroke-width="4"/><line x1="5" y1="50" x2="95" y2="50" stroke="#1E293B" stroke-width="4"/><circle cx="50" cy="50" r="12" fill="white" stroke="#1E293B" stroke-width="4"/><circle cx="50" cy="50" r="5" fill="#1E293B"/></svg>'}
function toast(m,t){
  var host=document.getElementById('toasts');
  if(!host)return;

  var kind=t||'ok';
  var icon=kind==='err'?'⚠️':kind==='info'?'ℹ️':'✅';
  var card=document.createElement('div');
  card.className='toast toast-'+kind;
  card.setAttribute('role','status');
  card.setAttribute('aria-live','polite');
  card.style.display='flex';
  card.style.alignItems='flex-start';
  card.style.gap='.65rem';
  card.style.padding='.75rem .85rem';
  card.style.borderRadius='12px';
  card.style.maxWidth='340px';
  card.style.lineHeight='1.35';

  var iconEl=document.createElement('div');
  iconEl.textContent=icon;
  iconEl.style.fontSize='1rem';
  iconEl.style.lineHeight='1';
  iconEl.style.marginTop='.05rem';
  iconEl.style.flexShrink='0';

  var msgEl=document.createElement('div');
  msgEl.textContent=m;
  msgEl.style.flex='1';
  msgEl.style.fontSize='.82rem';
  msgEl.style.fontWeight='700';

  var closeBtn=document.createElement('button');
  closeBtn.type='button';
  closeBtn.innerHTML='✕';
  closeBtn.setAttribute('aria-label','Dismiss notification');
  closeBtn.style.border='none';
  closeBtn.style.background='transparent';
  closeBtn.style.color='inherit';
  closeBtn.style.cursor='pointer';
  closeBtn.style.opacity='.7';
  closeBtn.style.fontSize='.78rem';
  closeBtn.style.lineHeight='1';
  closeBtn.style.padding='0';
  closeBtn.style.marginTop='.1rem';
  closeBtn.style.flexShrink='0';

  closeBtn.onmouseenter=function(){closeBtn.style.opacity='1'};
  closeBtn.onmouseleave=function(){closeBtn.style.opacity='.7'};

  var removed=false;
  function dismiss(){
    if(removed)return;
    removed=true;
    card.style.transition='opacity .18s ease, transform .18s ease';
    card.style.opacity='0';
    card.style.transform='translateY(-4px)';
    setTimeout(function(){if(card.parentNode)card.parentNode.removeChild(card)},180);
  }

  closeBtn.onclick=dismiss;

  card.appendChild(iconEl);
  card.appendChild(msgEl);
  card.appendChild(closeBtn);
  host.appendChild(card);

  while(host.children.length>4){
    host.removeChild(host.children[0]);
  }

  var timer=setTimeout(dismiss,4200);
  card.onmouseenter=function(){clearTimeout(timer)};
  card.onmouseleave=function(){timer=setTimeout(dismiss,2200)};
}
function h(a){return{'apikey':ANON,'Content-Type':'application/json','Authorization':'Bearer '+(a&&tk?tk:ANON)}}

// #SECTION: DEV SESSION PERSISTENCE
// ═══════════════════════════════════════
// DEV ONLY: Persist the signed-in session in localStorage so the app
// stays logged in across refreshes during development.
// This is convenient for local testing, but it is not a production-
// grade auth/session approach.
// ═══════════════════════════════════════

function saveSession(){
  try{
    if(tk&&refreshTk&&usr){localStorage.setItem('champions_session',JSON.stringify({tk:tk,refreshTk:refreshTk,sessionExp:sessionExp,usr:usr}))}
    else{localStorage.removeItem('champions_session')}
  }catch(e){}
}

// DEV ONLY: Restore the locally saved development session on page load.
// This should be revisited later if the app moves to a more secure
// production auth flow.


function restoreSession(){
  try{
    var raw=localStorage.getItem('champions_session');
    if(!raw)return false;
    var s=JSON.parse(raw);
    if(!s||!s.tk||!s.refreshTk||!s.usr)return false;
    tk=s.tk;
    refreshTk=s.refreshTk;
    sessionExp=s.sessionExp||0;
    usr=s.usr;
    return true;
  }catch(e){
    localStorage.removeItem('champions_session');
    return false;
  }
}
function clearSessionState(){
  tk=null;
  refreshTk=null;
  sessionExp=0;
  usr=null;
}

function setSessionFromAuth(d){
  tk=d.access_token||null;
  refreshTk=d.refresh_token||refreshTk||null;
  usr=d.user||usr||null;
  sessionExp=Date.now()+Math.max(((d.expires_in||3600)-30)*1000,30000);
  saveSession();
}

function sessionLooksExpired(){
  return !tk||!sessionExp||Date.now()>=sessionExp;
}

async function refreshSession(){
  if(!refreshTk)throw new Error('No refresh token available');
  var r=await fetch(API+'/auth/v1/token?grant_type=refresh_token',{
    method:'POST',
    headers:{'apikey':ANON,'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:refreshTk})
  });
  var d=await r.json().catch(function(){return{}});
  if(!r.ok)throw new Error(d.error_description||d.msg||'Session refresh failed');
  setSessionFromAuth(d);
  return true;
}

async function ensureSession(){
  if(!usr)return false;
  if(!sessionLooksExpired())return true;
  try{
    await refreshSession();
    return true;
  }catch(e){
    handleAuthExpired();
    throw e;
  }
}

function handleAuthExpired(){
  clearSessionState();
  saveSession();
  updAuth();
  renderDash();
  renderDex();
  renderItems();
  renderBuilds();
  renderTeams();
  renderProfile();
  updProfileNavIcon();
  authMode='login';
  showLoginModal('Your session expired. Please sign in again.');
  toast('Session expired. Please sign in again.','err');
}

async function authFetch(url,options,needsAuth){
  if(needsAuth)await ensureSession();
  var opts=options||{};
  opts.headers=opts.headers||{};
  var res=await fetch(url,opts);

  if(res.status===401&&needsAuth){
    try{
      await refreshSession();
      opts.headers=Object.assign({},opts.headers,h(true));
      res=await fetch(url,opts);
    }catch(e){
      handleAuthExpired();
      throw e;
    }
    if(res.status===401){
      handleAuthExpired();
      throw new Error('Session expired');
    }
  }

  return res;
}
async function q(t,p,a){var u=new URL(API+'/rest/v1/'+t);if(p)Object.entries(p).forEach(function(e){u.searchParams.set(e[0],e[1])});var r=await authFetch(u.toString(),{headers:h(a)},a);if(!r.ok)throw new Error(t+': '+r.status);return r.json()}
async function ins(t,b,a){var r=await authFetch(API+'/rest/v1/'+t,{method:'POST',headers:Object.assign(h(a),{'Prefer':'return=representation'}),body:JSON.stringify(b)},a);if(!r.ok){var e=await r.json().catch(function(){return{}});throw new Error(e.message||r.status)}return r.json()}
async function rm(t,m,a){var u=new URL(API+'/rest/v1/'+t);Object.entries(m).forEach(function(e){u.searchParams.set(e[0],e[1])});var r=await authFetch(u.toString(),{method:'DELETE',headers:h(a)},a);if(!r.ok)throw new Error(r.status)}

// #SECTION: THEME
// ═══════════════════════════════════════
// THEME
// Light / dark mode handling.
// ═══════════════════════════════════════


function setTheme(t){document.documentElement.setAttribute('data-theme',t);document.getElementById('tbLight').classList.toggle('active',t==='light');document.getElementById('tbDark').classList.toggle('active',t==='dark')}

// #SECTION: SIDEBAR & PAGE NAVIGATION
// ═══════════════════════════════════════
// SIDEBAR & PAGE NAVIGATION
// Sidebar collapse/expand and switching between pages.
// ═══════════════════════════════════════


var sbC=false;
function togSb(){sbC=!sbC;document.getElementById('sb').classList.toggle('c',sbC);document.getElementById('sbTog').textContent=sbC?'▶':'◀'}
document.querySelectorAll('.sb-item').forEach(function(i){
  i.addEventListener('click',function(){
    var target=i.dataset.p;

    if(!usr&&['builds','teams'].indexOf(target)!==-1){
  showLoginModal('Sign in to view your saved builds, teams, and collection progress.');
  return;
}

    document.querySelectorAll('.sb-item').forEach(function(n){n.classList.remove('active')});
    i.classList.add('active');
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('show')});
    document.getElementById('pg-'+target).classList.add('show');
  })
});

// #SECTION: AUTH
// ═══════════════════════════════════════
// AUTH
// Login, logout, and auth UI state.
// ═══════════════════════════════════════


async function login(){
  var emailEl=document.getElementById('loginEmail')||document.getElementById('profileEmail')||document.getElementById('eIn');
  var passEl=document.getElementById('loginPass')||document.getElementById('profilePass')||document.getElementById('pIn');
  var e=emailEl?emailEl.value:'';
  var p=passEl?passEl.value:'';
  if(!e||!p){toast('Enter your email and password','err');return}
  try{
    var r=await fetch(API+'/auth/v1/token?grant_type=password',{
      method:'POST',
      headers:{'apikey':ANON,'Content-Type':'application/json'},
      body:JSON.stringify({email:e,password:p})
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error_description||d.msg||'Failed');
    setSessionFromAuth(d);updAuth();
    closeCm();
    await loadUser();
    renderDash();renderDex();renderItems();renderBuilds();renderTeams();renderProfile();
    toast('Welcome back!');
  }catch(x){toast(x.message,'err')}
}

async function signup(){
  var emailEl=document.getElementById('loginEmail')||document.getElementById('profileEmail')||document.getElementById('eIn');
  var passEl=document.getElementById('loginPass')||document.getElementById('profilePass')||document.getElementById('pIn');
  var e=emailEl?emailEl.value.trim():'';
  var p=passEl?passEl.value:'';
  if(!e||!p){toast('Enter your email and password','err');return}
  try{
    var r=await fetch(API+'/auth/v1/signup',{
      method:'POST',
      headers:{'apikey':ANON,'Content-Type':'application/json'},
      body:JSON.stringify({email:e,password:p})
    });
    var d=await r.json().catch(function(){return{}});
    if(!r.ok)throw new Error(d.error_description||d.msg||'Failed to sign up');
    if(d.access_token&&d.user){
      setSessionFromAuth(d);
      updAuth();
      closeCm();
      await loadUser();
      renderDash();renderDex();renderItems();renderBuilds();renderTeams();renderProfile();
      toast('Account created!');
    }else{
      authMode='login';
      toast('Account created. Check your email to confirm, then sign in.');
      showLoginModal('Account created. Check your email to confirm, then sign in.');
    }
  }catch(x){toast(x.message,'err')}
}
function logout(){
  clearSessionState();allBuilds=[];allTeams=[];uDex={};uShinyDex={};uItems={};userProfile=null;
  saveSession();
  updAuth();renderDash();renderDex();renderItems();renderBuilds();renderTeams();renderProfile();updProfileNavIcon();
  toast('Signed out');
}
function updProfileNavIcon(){
  var el=document.getElementById('profileNavIcon');
  if(!el)return;
  var avatar=userProfile&&userProfile.avatar_url?userProfile.avatar_url:'';
  if(avatar){
    el.innerHTML='<img src="'+avatar+'" alt="Profile" onerror="this.parentNode.innerHTML=\'<div class=&quot;sb-profile-fallback&quot;>⚡</div>\'">';
  }else{
    el.innerHTML='<div class="sb-profile-fallback">⚡</div>';
  }
}
function updAuth(){
  var el=document.getElementById('authEl');
  if(usr){
    el.innerHTML='<div class="user-p"><div class="user-av">⚡</div><span style="overflow:hidden;text-overflow:ellipsis;flex:1;font-weight:500">'+usr.email+'</span></div><button class="ab ab-ghost" onclick="logout()" style="margin-top:3px">Sign Out</button>';
  }else{
    el.innerHTML='<div style="display:flex;flex-direction:column;gap:.35rem"><button class="ab ab-red" onclick="authMode=\'login\';showLoginModal()" style="width:100%">Sign In</button><button class="ab ab-ghost" onclick="authMode=\'signup\';showLoginModal()" style="width:100%">Sign Up</button></div>';
  }
  updProfileNavIcon();
}

// #SECTION: CORE DATA LOADING
// ═══════════════════════════════════════
// CORE DATA LOADING
// Load user data, Pokémon, builds, teams, and Pokédex progress.
// ═══════════════════════════════════════

async function loadUser(){await Promise.all([loadBuilds(),loadTeams(),loadUDex()]);renderDash();renderDex()}
async function loadPkmn(){try{allPkmn=await q('pokemon',{order:'dex_number.asc,form.asc',limit:'1000'});document.getElementById('nc0').textContent=allPkmn.length;renderTypeF();renderFormF();renderDex();renderDash()}catch(e){document.getElementById('dexGrid').innerHTML='<div class="empty"><div class="em">⚠️</div>'+e.message+'</div>'}}
async function loadBuilds(){if(!tk)return;try{allBuilds=await q('build_details',{order:'created_at.desc',limit:'200'},true);document.getElementById('nc1').textContent=allBuilds.length;renderDash()}catch(e){}}
async function loadTeams(){if(!tk)return;try{allTeams=await q('teams',{order:'created_at.desc'},true);document.getElementById('nc2').textContent=allTeams.length;renderDash()}catch(e){}}
async function loadUDex(){if(!tk)return;try{var rows=await q('user_pokedex',{select:'pokemon_id,obtained,shiny_obtained'},true);uDex={};uShinyDex={};rows.forEach(function(r){if(r.obtained)uDex[r.pokemon_id]=true;if(r.shiny_obtained)uShinyDex[r.pokemon_id]=true});renderDex();renderDash()}catch(e){}}

// #SECTION: DASHBOARD
// ═══════════════════════════════════════
// DASHBOARD
// Dashboard stats and recent builds rendering.
// ═══════════════════════════════════════

function renderDash(){
  var obt=Object.keys(uDex).length,total=allPkmn.length;
  document.getElementById('dashStats').innerHTML=
    '<div class="dash-stat"><div class="ds-label">Collection</div><div class="ds-val" style="color:var(--green)">'+obt+'<span style="font-size:.9rem;color:var(--muted);font-weight:500"> / '+total+'</span></div><div class="ds-wm">📋</div></div>'+
    '<div class="dash-stat"><div class="ds-label">Active Builds</div><div class="ds-val" style="color:var(--blue)">'+allBuilds.length+'</div><div class="ds-wm">⚔️</div></div>'+
    '<div class="dash-stat"><div class="ds-label">Teams</div><div class="ds-val" style="color:var(--purple)">'+allTeams.length+'</div><div class="ds-wm">🏆</div></div>'+
    '<div class="dash-stat"><div class="ds-label">Shiny Dex</div><div class="ds-val" style="color:var(--purple)">'+Object.keys(uShinyDex).length+'</div><div class="ds-wm">✦</div></div>';
  // Recent builds
  var rb=document.getElementById('recentBuilds');
  var isMobile=window.innerWidth<=768;
if(!usr){
  if(isMobile){
    rb.innerHTML='<div class="card" style="padding:1.3rem;text-align:center;max-width:420px"><div style="margin-bottom:.5rem;font-size:1.8rem">🔐</div><h3 style="font-size:1rem;font-weight:700;margin-bottom:.3rem">Save your progress</h3><p style="font-size:.82rem;color:var(--muted);line-height:1.5">Sign in or create an account to save your builds, teams, items, and Pokédex progress.</p><div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.9rem"><button class="btn btn-red" onclick="authMode=\'login\';showLoginModal()">Sign In</button><button class="btn btn-ghost" onclick="authMode=\'signup\';showLoginModal()">Sign Up</button></div></div>';
  }else{
    rb.innerHTML='<div style="color:var(--muted);font-size:.85rem">Sign in from the side panel to save your builds, teams, items, and collection progress.</div>';
  }
  return;
}
  if(!allBuilds.length){rb.innerHTML=(isMobile?'<div style="display:flex;justify-content:flex-end;margin-bottom:.6rem"><button class="btn btn-ghost" onclick="logout()">Sign Out</button></div>':'')+'<div style="color:var(--muted);font-size:.85rem">No builds yet</div>';return}
  var mobileSignOut=isMobile?'<div style="display:flex;justify-content:flex-end;margin-bottom:.6rem"><button class="btn btn-ghost" onclick="logout()">Sign Out</button></div>':'';
  rb.innerHTML=mobileSignOut+allBuilds.slice(0,5).map(function(b){
    var sc={hp:'#ef4444',atk:'#f08030',def:'#f7d02c',spa:'#6390f0',spd:'#7ac74c',spe:'#f95587'};
    var max=b.max_sp||66;
    var bars='<div class="mini-bars">'+['hp_sp','atk_sp','def_sp','spa_sp','spd_sp','spe_sp'].map(function(k,i){var v=b[k]||0;var c=Object.values(sc)[i];return'<div class="mini-bar" style="background:'+c+';opacity:'+(v>0?1:.15)+'"></div>'}).join('')+'</div>';
    var rImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
    return'<div class="recent-item"><img src="'+rImg+'" onerror="this.style.opacity=\'0.2\'"><div><div class="ri-name">'+(b.pokemon_name||'?')+(b.is_shiny?' <span style="color:var(--purple);font-size:.65rem">✦</span>':'')+'</div><div class="ri-meta">'+b.build_name+' · '+(b.battle_format||'')+'</div></div><div class="ri-sp">'+(b.total_sp||0)+' SP'+bars+'</div></div>'
  }).join('')
}

// #SECTION: POKÉDEX
// ═══════════════════════════════════════
// POKÉDEX
// Filters, obtained/shiny toggles, card rendering,
// detail panel, and Pokédex interactions.
// ═══════════════════════════════════════

function renderTypeF(){var ts={};allPkmn.forEach(function(p){ts[p.type_1]=1;if(p.type_2)ts[p.type_2]=1});document.getElementById('typeFilters').innerHTML='<span class="flabel">Type</span>'+Object.keys(ts).sort().map(function(t){return'<button class="fpill" data-type="'+t+'" onclick="togType(\''+t+'\')">'+t+'</button>'}).join('')}
function renderFormF(){document.getElementById('formFilters').innerHTML='<button class="fpill" data-form="Base" onclick="togForm(\'Base\')">Base</button><button class="fpill" data-form="Mega" onclick="togForm(\'Mega\')">Mega</button><button class="fpill" data-form="Regional" onclick="togForm(\'Regional\')">Regional</button>'}
function togType(t){activeType=activeType===t?null:t;document.querySelectorAll('[data-type]').forEach(function(b){b.classList.toggle('active',b.dataset.type===activeType)});renderDex()}
function togForm(f){activeForm=activeForm===f?null:f;document.querySelectorAll('[data-form]').forEach(function(b){b.classList.toggle('active',b.dataset.form===activeForm)});renderDex()}
function togShinyAll(){showShiny=!showShiny;document.getElementById('shinyAll').classList.toggle('active',showShiny);renderDex()}
async function togShinyObt(ev,pid){ev.stopPropagation();if(!usr){toast('Sign in first','err');return}
  try{var newVal=!uShinyDex[pid];
    var u=new URL(API+'/rest/v1/user_pokedex');u.searchParams.set('on_conflict','user_id,pokemon_id');
    var r=await authFetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,pokemon_id:pid,obtained:uDex[pid]||false,shiny_obtained:newVal})},true);
    if(!r.ok)throw new Error((await r.json().catch(function(){return{}})).message||r.status);
    if(newVal){uShinyDex[pid]=true}else{delete uShinyDex[pid]}
    toast(newVal?'Shiny obtained!':'Shiny removed');renderDex();renderDash()
  }catch(e){toast(e.message,'err')}}
function togCardShiny(pid){shinyCards[pid]=!shinyCards[pid];renderDex()}
function togObtFilter(v){obtFilter=v;document.querySelectorAll('[data-obt]').forEach(function(b){b.classList.toggle('active',b.dataset.obt===v)});renderDex()}

async function togObt(ev,pid){ev.stopPropagation();if(!usr){toast('Sign in first','err');return}
  try{if(uDex[pid]){
    await rm('user_pokedex',{'user_id':'eq.'+usr.id,'pokemon_id':'eq.'+pid},true);delete uDex[pid];toast('Removed')
  }else{
    // Use upsert to avoid duplicate key errors
    var u=new URL(API+'/rest/v1/user_pokedex');u.searchParams.set('on_conflict','user_id,pokemon_id');
    var r=await authFetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,pokemon_id:pid,obtained:true})},true);
    if(!r.ok)throw new Error((await r.json().catch(function(){return{}})).message||r.status);
    uDex[pid]=true;toast('Obtained!')
  }renderDex();renderDash()}catch(e){toast(e.message,'err')}}

function grad(p){var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;return t2?'linear-gradient(135deg,'+t1.m+'55,'+t2.m+'55)':'linear-gradient(135deg,'+t1.l+'80,'+t1.m+'40)'}

// Mobile-first pass helpers
var MEGA_STONE_URL='icons/mega-stone.png';
function displayName(p){if(p&&p.form==='Mega'&&p.name&&p.name.indexOf('Mega ')===0)return p.name.substring(5);return p?p.name:''}
function megaBadge(size){
  var s=parseInt(size,10)||24;
  return '<span class="mega-stone" aria-label="Mega Evolution" style="display:inline-flex;align-items:center;justify-content:center;width:'+s+'px;height:'+s+'px;vertical-align:middle;flex-shrink:0"><img src="'+MEGA_STONE_URL+'" alt="" style="display:block;width:100%;height:100%;object-fit:contain" onerror="this.parentNode.style.display=\'none\'"></span>'
}
function toggleOverflow(e){e.stopPropagation();var m=document.getElementById('bdOmMenu');if(m)m.classList.toggle('open')}
document.addEventListener('click',function(e){var m=document.getElementById('bdOmMenu');if(m&&m.classList.contains('open')&&!m.contains(e.target)&&!e.target.closest('.om-wrap'))m.classList.remove('open')});

function renderDex(){
  // Progress badge
  if(usr){document.getElementById('progBadge').style.display='flex';document.getElementById('progVal').innerHTML=Object.keys(uDex).length+' / '+allPkmn.length+'<span style="font-size:.7rem;color:var(--purple);margin-left:.5rem">✦ '+Object.keys(uShinyDex).length+'</span>'}else{document.getElementById('progBadge').style.display='none'}
  var s=document.getElementById('dexSearch').value.toLowerCase();
  var f=allPkmn.filter(function(p){if(s&&p.name.toLowerCase().indexOf(s)===-1&&String(p.dex_number).indexOf(s)===-1)return false;if(activeType&&p.type_1!==activeType&&p.type_2!==activeType)return false;if(activeForm&&p.form!==activeForm)return false;if(usr&&obtFilter==='yes'&&!uDex[p.id])return false;if(usr&&obtFilter==='no'&&uDex[p.id])return false;return true});
  var g=document.getElementById('dexGrid');
  if(!f.length){g.innerHTML='<div class="empty"><div class="em">🔍</div>No Pokémon match</div>';return}
  g.innerHTML=f.map(function(p){
    var dex='#'+String(p.dex_number).padStart(4,'0');
    var t1=TC[p.type_1]||TC.Normal;
    var obt=!!uDex[p.id];var isU=usr&&!obt;
    var hasS=!!p.shiny_url;var isCardShiny=shinyCards[p.id]||false;
    var shObt=!!uShinyDex[p.id];
    // If shiny obtained, default to shiny art
    var sS=(showShiny||isCardShiny||shObt)&&hasS;
    var img=sS?p.shiny_url:(p.image_url||'');
    var cls='pk-card'+(isU?' unobt':'')+(shObt?' shiny-holo':'');
    var glow=obt&&!shObt?' style="--glow:'+t1.m+'40;--glow-s:'+t1.m+'25"':'';
    var obtH=usr?'<button class="obt-c '+(obt?'on pulse-a':'off')+'" onclick="togObt(event,\''+p.id+'\')">'+(obt?'✓':'')+'</button>':'';
    var shObtH=usr&&hasS?'<button class="shiny-c'+(shObt?' on':'')+'" onclick="togShinyObt(event,\''+p.id+'\')" title="'+(shObt?'Shiny obtained':'Mark shiny obtained')+'">✦</button>':'';
    var shViewH=hasS&&!usr?'<div class="shiny-c" onclick="event.stopPropagation();togCardShiny(\''+p.id+'\')">✦</div>':'';
    var t2h=p.type_2?'<span class="type-pill" style="background:'+(TC[p.type_2]||TC.Normal).m+'">'+p.type_2+'</span>':'';
    var fP='';if(p.form==='Mega')fP='<span class="form-pill form-mega">Mega</span>';if(p.form==='Regional')fP='<span class="form-pill form-regional">Regional</span>';
    return'<div class="'+cls+'"'+(obt?' '+glow:'')+' onclick="openDet(\''+p.id+'\')"><div class="pk-top"><div class="pk-top-left"><div class="pk-dex">'+dex+'</div><div class="pk-name">'+p.name+'</div></div><div class="pk-btns">'+(usr?shObtH:shViewH)+obtH+'</div></div><div class="pk-art" style="background:'+grad(p)+'"><div class="wm">'+pb(100)+'</div>'+(img?'<img src="'+img+'" onerror="this.style.opacity=\'0.2\'" loading="lazy">':'<div style="width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;position:relative;z-index:1">'+pb(48)+'</div>')+'</div><div class="pk-bot"><span class="type-pill" style="background:'+t1.m+'">'+p.type_1+'</span>'+t2h+fP+'</div></div>'
  }).join('')
}

// #SECTION: STAT CALCULATOR
// ═══════════════════════════════════════
// STAT CALCULATOR
// Shared stat calc functions for the Pokédex detail panel.
// Bars/Hex toggle, SP sliders, nature dropdown, live Lv50 calc.
// ═══════════════════════════════════════

var BSC={hp:'#a78bfa',atk:'#f97316',spa:'#fdba74',def:'#3b82f6',spd:'#7dd3fc',spe:'#fb7185'};
var BSN={hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'};
var BSK=['hp','atk','def','spa','spd','spe'];
var BSDB={hp:'base_hp',atk:'base_atk',def:'base_def',spa:'base_spa',spd:'base_spd',spe:'base_spe'};
var BSNATMAP={hp:'hp',attack:'atk',defense:'def',sp_attack:'spa',sp_defense:'spd',speed:'spe'};
var BSNATNAMES={hp:'HP',attack:'Atk',defense:'Def',sp_attack:'SpA',sp_defense:'SpD',speed:'Spe'};
var BSCALC_MAX=300;
var dexSP={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};
var dexNature=null,dexPoke=null;

function bsCalcStat(key,base,spVal){
  var m=1;if(dexNature){if(BSNATMAP[dexNature.increased_stat]===key)m=1.1;if(BSNATMAP[dexNature.decreased_stat]===key)m=0.9}
  if(key==='hp')return Math.floor((2*base+31)*50/100)+60+spVal;
  return Math.floor((Math.floor((2*base+31)*50/100)+5)*m)+spVal;
}
function bsGetCalcStats(){
  return BSK.map(function(k){
    var base=dexPoke[BSDB[k]]||0,spVal=dexSP[k]||0,m=1;
    if(dexNature){if(BSNATMAP[dexNature.increased_stat]===k)m=1.1;if(BSNATMAP[dexNature.decreased_stat]===k)m=0.9}
    return{key:k,base:base,sp:spVal,calc:bsCalcStat(k,base,spVal),natMod:m};
  });
}
function bsBuildBars(){
  return '<div class="bs-grid">'+BSK.map(function(k){
    return '<div class="bs-row"><span class="bs-label">'+BSN[k]+'</span><div class="bs-track"><div class="bs-fill" id="bf-'+k+'" style="background:'+BSC[k]+'"></div></div><span class="bs-val" style="color:'+BSC[k]+'" id="bv-'+k+'">0</span><span class="bs-nat-ind" id="bi-'+k+'"></span></div>';
  }).join('')+'</div>';
}
function bsUpdateBars(){
  bsGetCalcStats().forEach(function(st){
    var f=document.getElementById('bf-'+st.key),v=document.getElementById('bv-'+st.key),i=document.getElementById('bi-'+st.key);
    if(f)f.style.width=Math.min(st.calc/BSCALC_MAX*100,100)+'%';
    if(v)v.textContent=st.calc;
    if(i)i.innerHTML=st.natMod>1?'<span style="color:var(--green)">▲</span>':st.natMod<1?'<span style="color:var(--red)">▼</span>':'';
  });
}
function bsBuildHex(){
  var typeCol=(TC[dexPoke.type_1]||TC.Normal).m;
  var cx=190,cy=185,r=85,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
  function polar(a,rd){var d=a*Math.PI/180;return{x:cx+rd*Math.cos(d),y:cy+rd*Math.sin(d)}}
  var outerPts=angles.map(function(a){var p=polar(a,r);return p.x+','+p.y}).join(' ');
  var g75=angles.map(function(a){var p=polar(a,r*.75);return p.x+','+p.y}).join(' ');
  var g50=angles.map(function(a){var p=polar(a,r*.5);return p.x+','+p.y}).join(' ');
  var g25=angles.map(function(a){var p=polar(a,r*.25);return p.x+','+p.y}).join(' ');
  var spokes=angles.map(function(a){var p=polar(a,r);return'<line x1="'+cx+'" y1="'+cy+'" x2="'+p.x+'" y2="'+p.y+'" stroke="var(--border)" stroke-width="1"/>'}).join('');
  var labels='';
  for(var i=0;i<6;i++){
    var si=order[i],k=BSK[si],pt=polar(angles[i],r+28);
    var anchor='middle';if(angles[i]===-30||angles[i]===30)anchor='start';if(angles[i]===150||angles[i]===210)anchor='end';
    var isTop=angles[i]===-90,isBot=angles[i]===90;
    if(isTop){labels+='<text x="'+pt.x+'" y="'+(pt.y-10)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+5)+'" text-anchor="middle" id="hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text>'}
    else if(isBot){labels+='<text x="'+pt.x+'" y="'+(pt.y+4)+'" text-anchor="middle" id="hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text><text x="'+pt.x+'" y="'+(pt.y+18)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text>'}
    else{labels+='<text x="'+pt.x+'" y="'+(pt.y-4)+'" text-anchor="'+anchor+'" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+12)+'" text-anchor="'+anchor+'" id="hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text>'}
  }
  return '<div class="bs-hex-wrap"><svg class="bs-hex-svg" viewBox="0 0 380 380"><polygon points="'+outerPts+'" fill="none" stroke="var(--border)" stroke-width="1.5"/><polygon points="'+g75+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g50+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g25+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/>'+spokes+'<polygon id="hexPoly" points="'+cx+','+cy+'" fill="'+typeCol+'25" stroke="'+typeCol+'" stroke-width="2.5" stroke-linejoin="round" style="transition:all .3s ease"/>'+labels+'</svg></div>';
}
function bsUpdateHex(){
  var stats=bsGetCalcStats(),cx=190,cy=185,r=85,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
  function polar(a,rd){var d=a*Math.PI/180;return{x:cx+rd*Math.cos(d),y:cy+rd*Math.sin(d)}}
  var pts=[];for(var i=0;i<6;i++){var si=order[i];var pct=Math.min(stats[si].calc/BSCALC_MAX,1);var pt=polar(angles[i],r*Math.max(pct,0.05));pts.push(pt.x+','+pt.y)}
  var poly=document.getElementById('hexPoly');if(poly)poly.setAttribute('points',pts.join(' '));
  for(var i=0;i<6;i++){var si=order[i],st=stats[si],el=document.getElementById('hv-'+st.key);if(el){el.textContent=st.calc+(st.natMod>1?' ▲':st.natMod<1?' ▼':'');el.style.fill=st.natMod>1?'var(--green)':st.natMod<1?'var(--red)':BSC[st.key]}}
}
function bsUpdateBST(){var stats=bsGetCalcStats(),total=stats.reduce(function(s,st){return s+st.calc},0);var cls=total>=600?'bst-elite':total>=500?'bst-high':total>=400?'bst-mid':'bst-low';var el=document.getElementById('bstVal');if(el){el.textContent=total;el.className='bs-total-val '+cls}}
function bsBuildSP(){
  var rows=BSK.map(function(k){var col=BSC[k];return '<div class="dsp-row"><span class="dsp-name" style="color:'+col+'">'+BSN[k]+'</span><button class="dsp-pm" onpointerdown="dspAdj(\''+k+'\',-1)">−</button><div class="dsp-slider-wrap"><div class="dsp-slider-track"><div class="dsp-slider-fill" id="sf-'+k+'" style="background:'+col+'"></div></div><input type="range" class="dsp-slider" id="sr-'+k+'" min="0" max="32" value="0" style="--thumb-col:'+col+'" oninput="dspSlide(\''+k+'\',this.value)"></div><button class="dsp-pm" onpointerdown="dspAdj(\''+k+'\',1)">+</button><input class="dsp-val-box" id="sv-'+k+'" type="number" min="0" max="32" value="0" style="color:'+col+'" onchange="dspSet(\''+k+'\',this.value)"></div>'}).join('');
  return '<div class="dsp-section"><div class="dsp-header"><span class="dsp-title">SP Allocation</span><div class="dsp-remain-wrap"><div class="dsp-remain-num ok" id="dspRemainNum">'+SP_MAX+'</div><div class="dsp-remain-label">remaining of '+SP_MAX+'</div></div></div><div class="dsp-grid">'+rows+'</div></div>';
}
function bsUpdateSP(){
  var total=BSK.reduce(function(s,k){return s+dexSP[k]},0),remain=SP_MAX-total;
  var el=document.getElementById('dspRemainNum');if(el){el.textContent=remain;el.className='dsp-remain-num '+(remain<0?'over':remain<=5?'warn':'ok')}
  BSK.forEach(function(k){var fill=document.getElementById('sf-'+k);var val=document.getElementById('sv-'+k);var range=document.getElementById('sr-'+k);if(fill)fill.style.width=(dexSP[k]/32*100)+'%';if(range)range.value=dexSP[k];if(val&&document.activeElement!==val)val.value=dexSP[k]});
}
function bsRefresh(){bsUpdateBars();bsUpdateHex();bsUpdateBST();bsUpdateSP()}
function dspSet(key,val){
  var requested=Math.max(0,Math.min(32,parseInt(val)||0));
  var other=BSK.reduce(function(s,k){return s+(k===key?0:dexSP[k])},0);
  var maxAllowed=Math.max(0,SP_MAX-other);
  dexSP[key]=Math.min(requested,maxAllowed);
  bsRefresh();
}
function dspSlide(key,val){dspSet(key,val)}
function dspAdj(key,delta){dspSet(key,dexSP[key]+delta)}
function bsNatureChange(val){
  if(!val)dexNature=null;else{var n=allNatures.find(function(x){return x.id===val});dexNature=n&&n.increased_stat?n:null}
  var h=document.getElementById('bsNatHint');if(h){if(dexNature)h.innerHTML='<span style="color:var(--green);font-weight:700">▲ '+BSNATNAMES[dexNature.increased_stat]+' (+10%)</span> &nbsp; <span style="color:var(--red);font-weight:700">▼ '+BSNATNAMES[dexNature.decreased_stat]+' (−10%)</span>';else h.textContent='No stat modification'}
  bsRefresh();
}
function bsSwitchView(view){
  document.querySelectorAll('.bs-view-btn').forEach(function(b){b.classList.toggle('active',b.dataset.view===view)});
  document.getElementById('bsBarsView').classList.toggle('active',view==='bars');document.getElementById('bsHexView').classList.toggle('active',view==='hex');bsRefresh();
}
function bsBuildSection(p){
  dexPoke=p;dexSP={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};dexNature=null;
  var stats=bsGetCalcStats();if(stats.reduce(function(s,st){return s+st.calc},0)===0)return '';
  var html='<select class="bs-nat-select" onchange="bsNatureChange(this.value)"><option value="">Nature — Neutral</option>';
  allNatures.forEach(function(n){if(!n.increased_stat)return;html+='<option value="'+n.id+'">'+n.name+' (+'+BSNATNAMES[n.increased_stat]+' / −'+BSNATNAMES[n.decreased_stat]+')</option>'});
  html+='</select><div class="bs-nat-hint" id="bsNatHint">No stat modification</div>';
  html+='<div class="bs-view-toggle"><button class="bs-view-btn active" data-view="bars" onclick="bsSwitchView(\'bars\')">Bars</button><button class="bs-view-btn" data-view="hex" onclick="bsSwitchView(\'hex\')">Hex</button></div>';
  html+='<div class="bs-view active" id="bsBarsView">'+bsBuildBars()+'</div><div class="bs-view" id="bsHexView">'+bsBuildHex()+'</div>';
  html+='<div class="bs-total"><span class="bs-total-label">Lv50 Stat Total</span><span class="bs-total-val" id="bstVal">0</span></div>';
  html+=bsBuildSP();
  html+='<div class="bs-formula">All stats at Lv50 · IVs max (31) · <code>1 SP = +1 stat</code></div>';
  return html;
}

// #SECTION: POKÉDEX DETAIL PANEL
// ───────────────────────────────────────
// POKÉDEX DETAIL PANEL
// Slide-over detail view for a single Pokémon.
// ───────────────────────────────────────

function openDet(pid){
  var p=allPkmn.find(function(x){return x.id===pid});if(!p)return;
  var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;
  var gd=t2?'linear-gradient(135deg,'+t1.m+'DD,'+t2.m+'DD)':'linear-gradient(135deg,'+t1.m+'CC,'+t1.d+'DD)';
  var obt=!!uDex[p.id];var hasS=!!p.shiny_url;
  var mH=renderMatchupHtml(p.type_1,p.type_2);
  var bsH=bsBuildSection(p);
  var html='<div class="panel-art" style="background:'+gd+'"><div class="wm">'+pb(200)+'</div><button class="p-close" onclick="closeDet()">✕</button><span class="p-dex">#'+String(p.dex_number).padStart(4,'0')+'</span>'+(p.image_url?'<img id="dImg" src="'+p.image_url+'" alt="'+p.name+'">':'')+(hasS?'<div class="sw-bar"><button class="sw-on" id="swN" onclick="dSwap(false,\''+p.id+'\')">Standard</button><button class="sw-off" id="swS" onclick="dSwap(true,\''+p.id+'\')">✦ Shiny</button></div>':'')+'</div>';
  html+='<div class="p-header"><h2>'+p.name+'</h2><div class="p-meta"><span class="type-pill" style="background:'+t1.m+'">'+p.type_1+'</span>'+(p.type_2?'<span class="type-pill" style="background:'+(TC[p.type_2]||TC.Normal).m+'">'+p.type_2+'</span>':'')+(p.form&&p.form!=='Base'?'<span class="form-pill '+(p.form==='Mega'?'form-mega':'form-regional')+'">'+p.form+'</span>':'')+'</div>'+(usr?'<button class="obt-tog '+(obt?'on':'off')+'" onclick="togObt(event,\''+p.id+'\');openDet(\''+p.id+'\')"><div class="obt-box '+(obt?'on':'off')+'">'+(obt?'✓':'')+'</div>'+(obt?'Obtained':'Not Obtained')+'</button>':'')+'</div>';
  if(bsH){html+='<button class="sec-tog" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\';if(b.style.display!==\'none\')bsRefresh()"><div class="sl"><span>📊</span><span>Stats & Calculator</span></div><span>▾</span></button><div class="sec-body">'+bsH+'</div>';}
  html+='<button class="sec-tog" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\'"><div class="sl"><span>⚡</span><span>Type Effectiveness</span></div><span>▾</span></button><div class="sec-body">'+mH+'</div>';
  document.getElementById('detInner').innerHTML=html;
  document.getElementById('detP').classList.add('open');
  requestAnimationFrame(function(){requestAnimationFrame(function(){bsRefresh()})});
}
function closeDet(){document.getElementById('detP').classList.remove('open')}
function dSwap(s,pid){var p=allPkmn.find(function(x){return x.id===pid});if(!p)return;var img=document.getElementById('dImg');if(!img)return;img.src=s?p.shiny_url:p.image_url;document.getElementById('swN').className=s?'sw-off':'sw-on';document.getElementById('swS').className=s?'sw-on':'sw-off'}

document.getElementById('dexSearch').addEventListener('input',renderDex);
document.getElementById('itemSearch').addEventListener('input',renderItems);

// #SECTION: ITEMS
// ═══════════════════════════════════════
// ITEMS
// Load, render, and toggle collected items.
// ═══════════════════════════════════════

var allItems=[],uItems={};
async function loadItems(){try{allItems=await q('items',{order:'name.asc',limit:'1000'});document.getElementById('nc3').textContent=allItems.length;renderItems()}catch(e){}}
async function loadUItems(){if(!tk)return;try{var rows=await q('user_items',{select:'item_id,obtained'},true);uItems={};rows.forEach(function(r){if(r.obtained)uItems[r.item_id]=true});renderItems()}catch(e){}}
async function togItem(iid){if(!usr){toast('Sign in first','err');return}
  try{if(uItems[iid]){await rm('user_items',{'user_id':'eq.'+usr.id,'item_id':'eq.'+iid},true);delete uItems[iid];toast('Removed')}
  else{var u=new URL(API+'/rest/v1/user_items');u.searchParams.set('on_conflict','user_id,item_id');
    var r=await authFetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,item_id:iid,obtained:true})},true);
    if(!r.ok)throw new Error((await r.json().catch(function(){return{}})).message||r.status);
    uItems[iid]=true;toast('Item obtained!')}renderItems()}catch(e){toast(e.message,'err')}}
function renderItems(){var s=document.getElementById('itemSearch').value.toLowerCase();var f=allItems.filter(function(i){return!s||i.name.toLowerCase().indexOf(s)!==-1});document.getElementById('itemsGrid').innerHTML=f.map(function(i){var on=uItems[i.id];return'<div class="it-card" onclick="togItem(\''+i.id+'\')"><span class="it-name">'+i.name+'</span><div class="it-chk'+(on?' on':'')+'\">'+(on?'✓':'')+'</div></div>'}).join('')||'<div class="empty"><div class="em">🔍</div>No items match</div>'}

// #SECTION: NATURES
// ═══════════════════════════════════════
// NATURES
// Load and render nature data.
// ═══════════════════════════════════════

var allNatures=[];
async function loadNatures(){try{allNatures=await q('natures',{order:'name.asc'});renderNatures()}catch(e){}}
function renderNatures(){var sL={hp:'HP',attack:'Attack',defense:'Defense',sp_attack:'Sp.Atk',sp_defense:'Sp.Def',speed:'Speed'};document.getElementById('natGrid').innerHTML=allNatures.map(function(n){var d=n.increased_stat?'<span class="nat-up">▲ '+sL[n.increased_stat]+'</span> <span class="nat-down">▼ '+sL[n.decreased_stat]+'</span>':'<span class="nat-neutral">Neutral</span>';return'<div class="nat-card"><div class="nat-name">'+n.name+'</div><div class="nat-stat">'+d+'</div></div>'}).join('')}

// ═══════════════════════════════════════
// PURE STAT CALC HELPERS (shared by dex detail + build editor)
// ═══════════════════════════════════════
function bsCalcStatFor(key,base,spVal,nature){
  var m=1;
  if(nature){
    if(BSNATMAP[nature.increased_stat]===key)m=1.1;
    if(BSNATMAP[nature.decreased_stat]===key)m=0.9;
  }
  if(key==='hp')return Math.floor((2*base+31)*50/100)+60+spVal;
  return Math.floor((Math.floor((2*base+31)*50/100)+5)*m)+spVal;
}
function bsGetCalcStatsFor(poke,sp,nature){
  if(!poke)return BSK.map(function(k){return{key:k,base:0,sp:0,calc:0,natMod:1}});
  return BSK.map(function(k){
    var base=poke[BSDB[k]]||0,spVal=sp[k]||0,m=1;
    if(nature){
      if(BSNATMAP[nature.increased_stat]===k)m=1.1;
      if(BSNATMAP[nature.decreased_stat]===k)m=0.9;
    }
    return{key:k,base:base,sp:spVal,calc:bsCalcStatFor(k,base,spVal,nature),natMod:m};
  });
}

// ═══════════════════════════════════════
// BUILD EDITOR STAT PREVIEW (bars + hex + SP sliders)
// DOM IDs prefixed ed-* to avoid clash with dex detail panel
// ═══════════════════════════════════════
var edView='bars';

function edGetPoke(){return allPkmn.find(function(x){return x.id===selPkmnId})}
function edGetNature(){
  var sel=document.getElementById('edNat');
  if(!sel||!sel.value)return null;
  var n=allNatures.find(function(x){return x.id===sel.value});
  return n&&n.increased_stat?n:null;
}

function edBuildBars(){
  return '<div class="bs-grid">'+BSK.map(function(k){
    return '<div class="bs-row"><span class="bs-label">'+BSN[k]+'</span><div class="bs-track"><div class="bs-fill" id="ed-bf-'+k+'" style="background:'+BSC[k]+'"></div></div><span class="bs-val" style="color:'+BSC[k]+'" id="ed-bv-'+k+'">0</span><span class="bs-nat-ind" id="ed-bi-'+k+'"></span></div>';
  }).join('')+'</div>';
}
function edUpdateBars(stats){
  stats.forEach(function(st){
    var f=document.getElementById('ed-bf-'+st.key),v=document.getElementById('ed-bv-'+st.key),i=document.getElementById('ed-bi-'+st.key);
    if(f)f.style.width=Math.min(st.calc/300*100,100)+'%';
    if(v)v.textContent=st.calc;
    if(i)i.innerHTML=st.natMod>1?'<span style="color:var(--green)">▲</span>':st.natMod<1?'<span style="color:var(--red)">▼</span>':'';
  });
}

function edBuildHex(poke){
  var typeCol=(TC[poke.type_1]||TC.Normal).m;
  var cx=180,cy=175,r=78,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
  function polar(a,rd){var d=a*Math.PI/180;return{x:cx+rd*Math.cos(d),y:cy+rd*Math.sin(d)}}
  var outerPts=angles.map(function(a){var p=polar(a,r);return p.x+','+p.y}).join(' ');
  var g75=angles.map(function(a){var p=polar(a,r*.75);return p.x+','+p.y}).join(' ');
  var g50=angles.map(function(a){var p=polar(a,r*.5);return p.x+','+p.y}).join(' ');
  var g25=angles.map(function(a){var p=polar(a,r*.25);return p.x+','+p.y}).join(' ');
  var spokes=angles.map(function(a){var p=polar(a,r);return'<line x1="'+cx+'" y1="'+cy+'" x2="'+p.x+'" y2="'+p.y+'" stroke="var(--border)" stroke-width="1"/>'}).join('');
  var labels='';
  for(var i=0;i<6;i++){
    var si=order[i],k=BSK[si],pt=polar(angles[i],r+26);
    var anchor='middle';if(angles[i]===-30||angles[i]===30)anchor='start';if(angles[i]===150||angles[i]===210)anchor='end';
    var isTop=angles[i]===-90,isBot=angles[i]===90;
    if(isTop){labels+='<text x="'+pt.x+'" y="'+(pt.y-10)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+5)+'" text-anchor="middle" id="ed-hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text>'}
    else if(isBot){labels+='<text x="'+pt.x+'" y="'+(pt.y+4)+'" text-anchor="middle" id="ed-hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text><text x="'+pt.x+'" y="'+(pt.y+18)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text>'}
    else{labels+='<text x="'+pt.x+'" y="'+(pt.y-4)+'" text-anchor="'+anchor+'" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+12)+'" text-anchor="'+anchor+'" id="ed-hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text>'}
  }
  return '<div class="bs-hex-wrap"><svg class="bs-hex-svg" viewBox="0 0 360 360"><polygon points="'+outerPts+'" fill="none" stroke="var(--border)" stroke-width="1.5"/><polygon points="'+g75+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g50+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g25+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/>'+spokes+'<polygon id="ed-hexPoly" points="'+cx+','+cy+'" fill="'+typeCol+'25" stroke="'+typeCol+'" stroke-width="2.5" stroke-linejoin="round" style="transition:all .3s ease"/>'+labels+'</svg></div>';
}
function edUpdateHex(stats){
  var cx=180,cy=175,r=78,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
  function polar(a,rd){var d=a*Math.PI/180;return{x:cx+rd*Math.cos(d),y:cy+rd*Math.sin(d)}}
  var pts=[];for(var i=0;i<6;i++){var si=order[i];var pct=Math.min(stats[si].calc/300,1);var pt=polar(angles[i],r*Math.max(pct,0.05));pts.push(pt.x+','+pt.y)}
  var poly=document.getElementById('ed-hexPoly');if(poly)poly.setAttribute('points',pts.join(' '));
  for(var i=0;i<6;i++){var si=order[i],st=stats[si],el=document.getElementById('ed-hv-'+st.key);if(el){el.textContent=st.calc+(st.natMod>1?' ▲':st.natMod<1?' ▼':'');el.style.fill=st.natMod>1?'var(--green)':st.natMod<1?'var(--red)':BSC[st.key]}}
}

function edBuildSP(){
  var rows=BSK.map(function(k){
    var col=BSC[k];
    return '<div class="dsp-row">'+
      '<span class="dsp-name" style="color:'+col+'">'+BSN[k]+'</span>'+
      '<button class="dsp-pm" onpointerdown="edAdj(\''+k+'\',-1)">−</button>'+
      '<div class="dsp-slider-wrap">'+
        '<div class="dsp-slider-track"><div class="dsp-slider-fill" id="ed-sf-'+k+'" style="background:'+col+'"></div></div>'+
        '<input type="range" class="dsp-slider" id="ed-sr-'+k+'" min="0" max="32" value="'+spV[k]+'" style="--thumb-col:'+col+'" oninput="edSlide(\''+k+'\',this.value)">'+
      '</div>'+
      '<button class="dsp-pm" onpointerdown="edAdj(\''+k+'\',1)">+</button>'+
      '<input class="dsp-val-box" id="ed-sv-'+k+'" type="number" min="0" max="32" value="'+spV[k]+'" style="color:'+col+'" onchange="edSet(\''+k+'\',this.value)">'+
    '</div>';
  }).join('');
  return '<div class="dsp-section"><div class="dsp-header"><span class="dsp-title">SP Allocation</span><div class="dsp-remain-wrap"><div class="dsp-remain-num ok" id="ed-remainNum">'+SP_MAX+'</div><div class="dsp-remain-label">remaining of '+SP_MAX+'</div></div></div><div class="dsp-grid">'+rows+'</div></div>';
}
function edUpdateSP(){
  var total=BSK.reduce(function(s,k){return s+spV[k]},0),remain=SP_MAX-total;
  var el=document.getElementById('ed-remainNum');if(el){el.textContent=remain;el.className='dsp-remain-num '+(remain<0?'over':remain<=5?'warn':'ok')}
  BSK.forEach(function(k){
    var fill=document.getElementById('ed-sf-'+k),val=document.getElementById('ed-sv-'+k),range=document.getElementById('ed-sr-'+k);
    if(fill)fill.style.width=(spV[k]/32*100)+'%';
    if(range)range.value=spV[k];
    if(val&&document.activeElement!==val)val.value=spV[k];
  });
}
function edUpdateBST(stats){
  var total=stats.reduce(function(s,st){return s+st.calc},0);
  var cls=total>=600?'bst-elite':total>=500?'bst-high':total>=400?'bst-mid':'bst-low';
  var el=document.getElementById('ed-bstVal');if(el){el.textContent=total;el.className='bs-total-val '+cls}
}

function edRefresh(){
  var p=edGetPoke();
  if(!p)return;
  var nature=edGetNature();
  var stats=bsGetCalcStatsFor(p,spV,nature);
  edUpdateBars(stats);
  edUpdateHex(stats);
  edUpdateBST(stats);
  edUpdateSP();
}

function edSwitchView(view){
  edView=view;
  document.querySelectorAll('#statSection .bs-view-btn').forEach(function(b){b.classList.toggle('active',b.dataset.view===view)});
  var b=document.getElementById('ed-barsView'),h=document.getElementById('ed-hexView');
  if(b)b.classList.toggle('active',view==='bars');
  if(h)h.classList.toggle('active',view==='hex');
  edRefresh();
}

// SP controls (respects 66-cap)
function edSet(key,val){
  var requested=Math.max(0,Math.min(32,parseInt(val)||0));
  var other=BSK.reduce(function(s,k){return s+(k===key?0:spV[k])},0);
  var maxAllowed=Math.max(0,SP_MAX-other);
  spV[key]=Math.min(requested,maxAllowed);
  edRefresh();
}
function edSlide(key,val){edSet(key,val)}
function edAdj(key,delta){edSet(key,spV[key]+delta)}

// Render the full stat section (called from renderBuildEditor and pickPk)
function edBuildStatSection(){
  var p=edGetPoke();
  if(!p)return '<div style="color:var(--muted);font-size:.82rem;padding:.5rem 0">Select a Pokémon to configure stats</div>';
  var t1=(TC[p.type_1]||TC.Normal).m,t2=p.type_2?(TC[p.type_2]||TC.Normal).m:null;
  var html='';
html+='<div style="display:flex;align-items:center;gap:.65rem;padding:.6rem .7rem;background:var(--surface);border-radius:10px;margin-bottom:.8rem"><img src="'+((editorShiny&&p.shiny_url)?p.shiny_url:(p.image_url||''))+'" onerror="this.style.opacity=0.2" style="width:42px;height:42px;object-fit:contain"><div><div style="display:flex;align-items:center;justify-content:flex-start;gap:8px;flex-wrap:nowrap;font-weight:800;font-size:.88rem"><span>'+p.name+'</span>'+(p.form==="Mega"?'<img src="'+MEGA_STONE_URL+'" alt="Mega" style="width:18px;height:18px;object-fit:contain;display:block;flex-shrink:0" onerror="this.style.display=\'none\'">':'')+'</div><div style="display:flex;gap:4px;margin-top:2px"><span class="type-pill" style="background:'+t1+'">'+p.type_1+'</span>'+(p.type_2?'<span class="type-pill" style="background:'+t2+'">'+p.type_2+'</span>':'')+'</div></div></div>';
  html+='<div class="bs-view-toggle"><button class="bs-view-btn'+(edView==='bars'?' active':'')+'" data-view="bars" onclick="edSwitchView(\'bars\')">Bars</button><button class="bs-view-btn'+(edView==='hex'?' active':'')+'" data-view="hex" onclick="edSwitchView(\'hex\')">Hex</button></div>';
  html+='<div class="bs-view'+(edView==='bars'?' active':'')+'" id="ed-barsView">'+edBuildBars()+'</div>';
  html+='<div class="bs-view'+(edView==='hex'?' active':'')+'" id="ed-hexView">'+edBuildHex(p)+'</div>';
  html+='<div class="bs-total"><span class="bs-total-label">Lv50 Stat Total</span><span class="bs-total-val" id="ed-bstVal">0</span></div>';
  html+=edBuildSP();
  html+='<div class="bs-formula">Lv50 · IVs max (31) · <code>1 SP = +1 stat</code></div>';
  return html;
}

// #SECTION: BUILDS
// ═══════════════════════════════════════
// BUILDS
// Build list, detail, editor, stat allocation,
// save/update/delete, favourites, duplication, export.
// ═══════════════════════════════════════

var buildView='list',editBuildId=null,detailBuildId=null,spV={hp:0,atk:0,def:0,spa:0,spd:0,spe:0},selPkmnId='',SP_MAX=66;
// Editor state (mobile-first 2-step flow)
var editorStep='picker',pickerShinyAll=false,editorShiny=false,pickerTypeFilter=null,pickerFormFilter=null,pickerSearchValue='';
var statCols={hp:'#ef4444',atk:'#f08030',def:'#f7d02c',spa:'#6390f0',spd:'#7ac74c',spe:'#f95587'};
var statNames={hp:'HP',atk:'ATTACK',def:'DEFENSE',spa:'SP. ATK',spd:'SP. DEF',spe:'SPEED'};

async function upd(t,m,b,a){var u=new URL(API+'/rest/v1/'+t);Object.entries(m).forEach(function(e){u.searchParams.set(e[0],e[1])});var r=await authFetch(u.toString(),{method:'PATCH',headers:Object.assign(h(a),{'Prefer':'return=representation'}),body:JSON.stringify(b)},a);if(!r.ok){var e=await r.json().catch(function(){return{}});throw new Error(e.message||r.status)}return r.json()}

function showBuildList(){buildView='list';renderBuilds()}
function showBuildDetail(id){detailBuildId=id;buildView='detail';
  // Ensure builds page is active
  document.querySelectorAll('.sb-item').forEach(function(n){n.classList.toggle('active',n.dataset.p==='builds')});
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('show')});
  document.getElementById('pg-builds').classList.add('show');
  renderBuilds()}
function showBuildEditor(id){
  editBuildId=id||null;
  buildView='editor';
  pickerSearchValue='';pickerTypeFilter=null;pickerFormFilter=null;pickerShinyAll=false;
  if(id){
    var b=allBuilds.find(function(x){return x.id===id});
    if(b){
      selPkmnId='';
      var pk=allPkmn.find(function(p){return p.name===b.pokemon_name&&p.dex_number===b.dex_number});
      if(pk)selPkmnId=pk.id;
      spV={hp:b.hp_sp||0,atk:b.atk_sp||0,def:b.def_sp||0,spa:b.spa_sp||0,spd:b.spd_sp||0,spe:b.spe_sp||0};
      editorShiny=!!b.is_shiny;
      editorStep='form'; // Existing build → jump straight to form
    }
  } else {
    selPkmnId='';
    spV={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};
    editorShiny=false;
    editorStep='picker'; // New build → start at Pokémon picker
  }
  renderBuilds();
}

// Step transitions
function editorBackToPicker(){editorStep='picker';renderBuilds()}
function togglePickerShiny(){pickerShinyAll=!pickerShinyAll;renderBuilds()}
function togglePickerType(t){pickerTypeFilter=pickerTypeFilter===t?null:t;renderBuilds()}
function togglePickerForm(f){pickerFormFilter=pickerFormFilter===f?null:f;renderBuilds()}
function toggleBuildShiny(){editorShiny=!editorShiny;renderBuilds()}

function renderBuilds(){
  var c=document.getElementById('buildsView');
  if(!tk){c.innerHTML='<div class="ph"><div class="ph-title">⚔️ Builds</div><div class="ph-sub">Sign in to manage your builds</div></div><div class="empty"><div class="em">🔒</div>Sign in to see builds</div>';return}
  if(buildView==='editor'){renderBuildEditor(c);return}
  if(buildView==='detail'){renderBuildDetail(c);return}
  // List view
  var hdr='<div class="ph"><div class="ph-top"><div><div class="ph-title">⚔️ Builds</div><div class="ph-sub">Your competitive Pokémon configurations</div></div><button class="btn btn-red" onclick="showBuildEditor()">+ New Build</button></div></div>';
  if(!allBuilds.length){c.innerHTML=hdr+'<div class="empty"><div class="em">⚔️</div>No builds yet. Create your first!</div>';return}
  var sortedBuilds=allBuilds.slice().sort(function(a,b){return(b.is_favourite?1:0)-(a.is_favourite?1:0)});
  c.innerHTML=hdr+'<div class="builds-grid">'+sortedBuilds.map(function(b){
    var max=b.max_sp||66;
    var STAT_MAX=32;var stats=['hp','atk','def','spa','spd','spe'].map(function(s){var v=b[s+'_sp']||0;var pct=Math.min(v/STAT_MAX*100,100);return'<div class="bstat"><span class="bstat-l">'+s.toUpperCase()+'</span><div class="bstat-bg"><div class="bstat-fill" style="width:'+pct+'%;background:'+statCols[s]+'"></div></div><span class="bstat-v">'+v+'</span></div>'}).join('');
    var bImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
    return'<div class="bld-card" onclick="showBuildDetail(\''+b.id+'\')" style="cursor:pointer;'+(b.is_favourite?'border-color:var(--gold);':'')+'"><div class="bld-top"><img src="'+bImg+'" onerror="this.style.opacity=\'0.2\'"><div><div class="bld-name">'+(b.is_favourite?'⭐ ':'')+b.build_name+(b.is_shiny?' <span style="color:var(--purple);font-size:.7rem">✦ Shiny</span>':'')+'</div><div class="bld-pkmn">'+(b.pokemon_name||'?')+' · #'+String(b.dex_number||0).padStart(4,'0')+'</div></div></div>'+
      '<div class="bld-tags">'+(b.battle_format?'<span class="btag btag-fmt">'+b.battle_format+'</span>':'')+(b.archetype?'<span class="btag btag-arch">'+b.archetype+'</span>':'')+(b.item_name?'<span class="btag btag-item">'+b.item_name+'</span>':'')+(b.nature_name?'<span class="btag btag-nat">'+b.nature_name+'</span>':'')+(b.ability?'<span class="btag btag-abi">'+b.ability+'</span>':'')+'</div>'+
      '<div class="bld-moves"><div class="bmove">'+(b.move_1||'—')+'</div><div class="bmove">'+(b.move_2||'—')+'</div><div class="bmove">'+(b.move_3||'—')+'</div><div class="bmove">'+(b.move_4||'—')+'</div></div>'+
      '<div class="bld-stats">'+stats+'</div><div class="bld-sp">'+(b.total_sp||0)+'/'+max+' SP</div>'+
      '<div class="bld-actions"><button onclick="event.stopPropagation();togFav(event,\''+b.id+'\')">'+(b.is_favourite?'⭐':'☆')+' Fav</button><button onclick="event.stopPropagation();dupBuild(\''+b.id+'\')">🔄 Copy</button><button onclick="event.stopPropagation();exportShowdown(\''+b.id+'\')">📤 Export</button><button onclick="event.stopPropagation();showBuildEditor(\''+b.id+'\')">✏️ Edit</button><button onclick="event.stopPropagation();confirmDelBuild(\''+b.id+'\',\''+b.build_name.replace(/'/g,"\\'")+'\')">🗑</button></div></div>'
  }).join('')+'</div>'
}

// Mobile-first 2-step build editor
function renderBuildEditor(c){
  if(editorStep==='picker'||!selPkmnId){renderEditorPicker(c);return}
  renderEditorForm(c);
}

// STEP 1: Pokémon picker (full-screen)
function renderEditorPicker(c){
  var hdr='<div class="ph"><div class="ph-top"><div><div class="ph-title" style="cursor:pointer" onclick="showBuildList()">← '+(editBuildId?'Edit Build':'New Build')+'</div><div class="ph-sub">Choose your Pokémon</div></div></div></div>';
  var search='<input class="ed-input" id="pkSrch" placeholder="🔍 Search by name or number" type="search" value="'+pickerSearchValue.replace(/"/g,'&quot;')+'" oninput="pickerSearchValue=this.value;filterPkPicker()">';
  var typeRow='<div class="epc-filter-row" style="margin-top:.5rem"><span class="epc-filter-lbl">Type</span><div class="epc-filter-scroll">'+Object.keys(TC).sort().map(function(t){return '<button class="epc-filter'+(pickerTypeFilter===t?' active':'')+'" onclick="togglePickerType(\''+t+'\')">'+t+'</button>'}).join('')+'</div></div>';
  var formRow='<div class="epc-filter-row" style="margin-top:.4rem;justify-content:space-between"><div style="display:flex;align-items:center;gap:.35rem"><span class="epc-filter-lbl">Form</span>'+['Base','Mega','Regional'].map(function(f){return '<button class="epc-filter'+(pickerFormFilter===f?' active':'')+'" onclick="togglePickerForm(\''+f+'\')">'+f+'</button>'}).join('')+'</div><button class="shiny-btn'+(pickerShinyAll?' active':'')+'" onclick="togglePickerShiny()">✦ Shiny</button></div>';
  c.innerHTML=hdr+'<div style="padding:.9rem 1rem 1.5rem">'+search+typeRow+formRow+'<div class="epc-grid" id="pkPicker"></div></div>';
  filterPkPicker();
}

// STEP 2: Form view (compact selected card + stats + moves + strategy + sticky save)
function renderEditorForm(c){
  var b=editBuildId?allBuilds.find(function(x){return x.id===editBuildId}):null;
  var p=allPkmn.find(function(x){return x.id===selPkmnId});
  if(!p){editorStep='picker';renderBuildEditor(c);return}

  var dName=displayName(p);
  var isMega=p.form==='Mega';
  var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;
  var bg=t2?'linear-gradient(135deg,'+t1.m+','+t2.m+')':'linear-gradient(135deg,'+t1.m+','+t1.d+')';
  var img=(editorShiny&&p.shiny_url)?p.shiny_url:(p.image_url||'');
  var hasShiny=!!p.shiny_url;

  // Selected Pokémon compact card
  var selectedCard='<div class="sel-card'+(editorShiny?' shiny-holo':'')+'">'+
    '<div class="sel-bg" style="background:'+bg+'"></div>'+
    '<div class="sel-content">'+
      '<img class="sel-img" src="'+img+'" onerror="this.style.opacity=\'0.2\'">'+
      '<div class="sel-info">'+
'<div class="sel-name" style="display:flex;align-items:center;justify-content:flex-start;gap:8px;flex-wrap:nowrap;font-weight:800;font-size:1.05rem"><span>'+dName+'</span>'+(isMega?'<img src="'+MEGA_STONE_URL+'" alt="Mega" style="width:20px;height:20px;object-fit:contain;display:block;flex-shrink:0" onerror="this.style.display=\'none\'">':'')+'</div>'+        '<div class="sel-dex">#'+String(p.dex_number||0).padStart(4,'0')+'</div>'+
        '<div class="sel-types"><span class="type-pill" style="background:'+t1.m+'">'+p.type_1+'</span>'+(t2?'<span class="type-pill" style="background:'+t2.m+'">'+p.type_2+'</span>':'')+'</div>'+
      '</div>'+
      '<div class="sel-actions">'+
        '<button class="sel-btn" onclick="editorBackToPicker()">Change</button>'+
        (hasShiny?'<button class="sel-btn'+(editorShiny?' shiny-on':'')+'" onclick="toggleBuildShiny()" title="Using shiny">✦</button>':'')+
      '</div>'+
    '</div>'+
  '</div>';

  var hdr='<div class="ph"><div class="ph-top"><div><div class="ph-title" style="cursor:pointer" onclick="showBuildList()">← '+(b?'Edit Build':'New Build')+'</div><div class="ph-sub">'+dName+(isMega?' (Mega)':'')+'</div></div></div></div>';

  // Nature dropdown
  var sL={hp:'HP',attack:'Atk',defense:'Def',sp_attack:'SpA',sp_defense:'SpD',speed:'Spe'};
  var natOptions=allNatures.map(function(n){
    var hint=n.increased_stat?' (+'+sL[n.increased_stat]+' -'+sL[n.decreased_stat]+')':' (Neutral)';
    var sel=b&&b.nature_name===n.name?' selected':'';
    return '<option value="'+n.id+'"'+sel+'>'+n.name+hint+'</option>';
  }).join('');

  // Items dropdown
  var itemOptions=allItems.map(function(i){var sel=b&&b.item_name===i.name?' selected':'';return '<option value="'+i.id+'"'+sel+'>'+i.name+'</option>'}).join('');

  // Stat calculator section (bars/hex + SP sliders + BST total)
  var statSectionHtml=edBuildStatSection();

  c.innerHTML=hdr+'<div class="editor" style="padding-bottom:5rem">'+
    selectedCard+
    '<div class="ed-card" style="margin-top:1rem"><label class="ed-label" style="margin-top:0">Build Name</label><input class="ed-input" id="edName" value="'+(b?b.build_name:'').replace(/"/g,'&quot;')+'" placeholder="e.g. Sweeper '+dName+'">'+
      '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Format</label><select class="ed-select" id="edFmt"><option value="Singles"'+(b&&b.battle_format==='Singles'?' selected':'')+'>Singles</option><option value="Doubles"'+(b&&b.battle_format==='Doubles'?' selected':'')+'>Doubles</option></select></div><div><label class="ed-label">Archetype</label><input class="ed-input" id="edArch" list="archList" value="'+(b?b.archetype||'':'').replace(/"/g,'&quot;')+'" placeholder="Sweeper"><datalist id="archList"><option value="Setup Sweeper"><option value="Sweeper"><option value="Wallbreaker"><option value="Tank"><option value="Support"><option value="Pivot"><option value="Utility"><option value="Disruption"><option value="Stall"><option value="Glass Cannon"><option value="Special Breaker"><option value="Physical Breaker"><option value="Bulky Attacker"><option value="Lead"><option value="Revenge Killer"></datalist></div></div>'+
    '</div>'+
    '<div class="ed-card" style="margin-top:1rem"><h3 style="display:flex;align-items:center;gap:8px">Stat Allocation'+(isMega?'<img src="'+MEGA_STONE_URL+'" alt="Mega" style="width:20px;height:20px;object-fit:contain;display:block;flex-shrink:0" onerror="this.style.display=\'none\'">':'')+'</h3><div id="statSection">'+statSectionHtml+'</div></div>'+
    '<div class="ed-card" style="margin-top:1rem"><h3>Moves & Ability</h3>'+
      '<div class="ed-row"><div><label class="ed-label">Ability</label><input class="ed-input" id="edAbi" value="'+(b?b.ability||'':'').replace(/"/g,'&quot;')+'" placeholder="e.g. Multiscale"></div><div><label class="ed-label">Item</label><select class="ed-select" id="edItem"><option value="">— None —</option>'+itemOptions+'</select></div></div>'+
      '<div class="ed-row" style="margin-top:.5rem"><div style="grid-column:1 / -1"><label class="ed-label">Nature</label><select class="ed-select" id="edNat" onchange="edRefresh()"><option value="">— None —</option>'+natOptions+'</select></div></div>'+
      '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Move 1</label><input class="ed-input" id="edM1" value="'+(b?b.move_1||'':'').replace(/"/g,'&quot;')+'"></div><div><label class="ed-label">Move 2</label><input class="ed-input" id="edM2" value="'+(b?b.move_2||'':'').replace(/"/g,'&quot;')+'"></div></div>'+
      '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Move 3</label><input class="ed-input" id="edM3" value="'+(b?b.move_3||'':'').replace(/"/g,'&quot;')+'"></div><div><label class="ed-label">Move 4</label><input class="ed-input" id="edM4" value="'+(b?b.move_4||'':'').replace(/"/g,'&quot;')+'"></div></div>'+
    '</div>'+
    '<details class="ed-card" style="margin-top:1rem"><summary style="font-size:.9rem;font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center">Strategy <span style="color:var(--muted);font-size:.72rem;font-weight:500">optional</span></summary>'+
      '<div style="margin-top:.7rem"><label class="ed-label">Win Condition</label><textarea class="ed-textarea" id="edWin">'+(b?b.win_condition||'':'')+'</textarea></div>'+
      '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Strengths</label><textarea class="ed-textarea" id="edStr">'+(b?b.strengths||'':'')+'</textarea></div><div><label class="ed-label">Weaknesses</label><textarea class="ed-textarea" id="edWeak">'+(b?b.weaknesses||'':'')+'</textarea></div></div>'+
    '</details>'+
    // Hidden shiny button — editorShiny state already lives in JS, but saveBuild reads #edShiny.active so we keep a hidden mirror
    '<button type="button" class="fpill'+(editorShiny?' active':'')+'" id="edShiny" style="display:none"></button>'+
    '</div>'+
    '<div class="save-bar"><button class="btn btn-ghost" onclick="showBuildList()">Cancel</button><button class="btn btn-red" onclick="saveBuild()">💾 Save Build</button></div>';
  // Paint bars/hex after DOM is attached
  requestAnimationFrame(function(){requestAnimationFrame(edRefresh)});
}

// #SECTION: MATCHUP & COVERAGE HELPERS
// ═══════════════════════════════════════
// MATCHUP & COVERAGE HELPERS
// Shared type matchup and team coverage helpers.
// ═══════════════════════════════════════

function getMatchups(type1,type2){var gr={'4':[],'2':[],'0.5':[],'0.25':[],'0':[]};ALL_T.forEach(function(at){var mult=TCHART[at]&&TCHART[at][type1]!==undefined?TCHART[at][type1]:1;if(type2){mult*=(TCHART[at]&&TCHART[at][type2]!==undefined?TCHART[at][type2]:1)}if(mult===4)gr['4'].push(at);else if(mult===2)gr['2'].push(at);else if(mult===.5)gr['0.5'].push(at);else if(mult===.25)gr['0.25'].push(at);else if(mult===0)gr['0'].push(at)});return gr}
function renderMatchupHtml(type1,type2){
  var gr=getMatchups(type1,type2);
  var secs=[{l:'4× Weak',k:'4',c:'#DC2626',bg:'rgba(220,38,38,.08)',icon:'⚠️'},{l:'2× Weak',k:'2',c:'#F97316',bg:'rgba(249,115,22,.08)',icon:'🔥'},{l:'½× Resist',k:'0.5',c:'#2563EB',bg:'rgba(37,99,235,.08)',icon:'🛡️'},{l:'¼× Resist',k:'0.25',c:'#7C3AED',bg:'rgba(124,58,237,.08)',icon:'🛡️'},{l:'Immune',k:'0',c:'#059669',bg:'rgba(5,150,105,.08)',icon:'✨'}];
  var html=secs.filter(function(s){return gr[s.k].length>0}).map(function(s){
    return'<div style="background:'+s.bg+';border:1px solid '+s.c+'22;border-radius:10px;padding:.6rem .8rem;margin-bottom:.5rem">'+
      '<div style="display:flex;align-items:center;gap:5px;margin-bottom:.4rem"><span style="font-size:.8rem">'+s.icon+'</span><span style="font-size:.72rem;font-weight:700;color:'+s.c+';text-transform:uppercase;letter-spacing:.04em">'+s.l+'</span><span style="font-size:.65rem;color:var(--muted);margin-left:auto">'+gr[s.k].length+' type'+(gr[s.k].length>1?'s':'')+'</span></div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:4px">'+gr[s.k].map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:9px;padding:3px 8px">'+t+'</span>'}).join('')+'</div></div>'
  }).join('');
  return html||'<p style="color:var(--muted);font-size:.85rem;font-style:italic">No notable type interactions</p>'
}

// #SECTION: BUILD DETAIL VIEW
// ───────────────────────────────────────
// BUILD DETAIL VIEW
// Detailed single-build screen layout and rendering.
// ───────────────────────────────────────

// Build detail stat section (read-only calculated stats)
// Uses bd-* DOM IDs to avoid clashing with dex detail / build editor
var bdView='bars';
function bdSwitchView(view){bdView=view;renderBuilds()}

function bdBuildHex(poke,stats){
  var typeCol=(TC[poke.type_1]||TC.Normal).m;
  var cx=180,cy=175,r=78,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
  function polar(a,rd){var d=a*Math.PI/180;return{x:cx+rd*Math.cos(d),y:cy+rd*Math.sin(d)}}
  var outerPts=angles.map(function(a){var p=polar(a,r);return p.x+','+p.y}).join(' ');
  var g75=angles.map(function(a){var p=polar(a,r*.75);return p.x+','+p.y}).join(' ');
  var g50=angles.map(function(a){var p=polar(a,r*.5);return p.x+','+p.y}).join(' ');
  var g25=angles.map(function(a){var p=polar(a,r*.25);return p.x+','+p.y}).join(' ');
  var spokes=angles.map(function(a){var p=polar(a,r);return'<line x1="'+cx+'" y1="'+cy+'" x2="'+p.x+'" y2="'+p.y+'" stroke="var(--border)" stroke-width="1"/>'}).join('');
  var statPts=[];
  for(var i=0;i<6;i++){var si=order[i];var pct=Math.min(stats[si].calc/300,1);var pt=polar(angles[i],r*Math.max(pct,0.05));statPts.push(pt.x+','+pt.y)}
  var labels='';
  for(var i=0;i<6;i++){
    var si=order[i],k=BSK[si],st=stats[si],pt=polar(angles[i],r+26);
    var anchor='middle';if(angles[i]===-30||angles[i]===30)anchor='start';if(angles[i]===150||angles[i]===210)anchor='end';
    var isTop=angles[i]===-90,isBot=angles[i]===90;
    var natInd=st.natMod>1?' ▲':st.natMod<1?' ▼':'';
    var natCol=st.natMod>1?'var(--green)':st.natMod<1?'var(--red)':BSC[k];
    if(isTop){labels+='<text x="'+pt.x+'" y="'+(pt.y-10)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+5)+'" text-anchor="middle" fill="'+natCol+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">'+st.calc+natInd+'</text>'}
    else if(isBot){labels+='<text x="'+pt.x+'" y="'+(pt.y+4)+'" text-anchor="middle" fill="'+natCol+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">'+st.calc+natInd+'</text><text x="'+pt.x+'" y="'+(pt.y+18)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text>'}
    else{labels+='<text x="'+pt.x+'" y="'+(pt.y-4)+'" text-anchor="'+anchor+'" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+12)+'" text-anchor="'+anchor+'" fill="'+natCol+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">'+st.calc+natInd+'</text>'}
  }
  return '<div class="bs-hex-wrap"><svg class="bs-hex-svg" viewBox="0 0 360 360"><polygon points="'+outerPts+'" fill="none" stroke="var(--border)" stroke-width="1.5"/><polygon points="'+g75+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g50+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g25+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/>'+spokes+'<polygon points="'+statPts.join(' ')+'" fill="'+typeCol+'25" stroke="'+typeCol+'" stroke-width="2.5" stroke-linejoin="round"/>'+labels+'</svg></div>';
}

function bdBuildStatCard(b){
  var poke=allPkmn.find(function(x){return x.id===b.pokemon_id});
  if(!poke)return '<div class="card" style="margin-bottom:1rem"><h3 style="font-size:.9rem;font-weight:700;margin-bottom:.8rem">Stats</h3><div style="color:var(--muted);font-size:.82rem">Pokémon data unavailable</div></div>';
  var sp={hp:b.hp_sp||0,atk:b.atk_sp||0,def:b.def_sp||0,spa:b.spa_sp||0,spd:b.spd_sp||0,spe:b.spe_sp||0};
  var nature=b.increased_stat?{increased_stat:b.increased_stat,decreased_stat:b.decreased_stat}:null;
  var stats=bsGetCalcStatsFor(poke,sp,nature);
  var bst=stats.reduce(function(s,st){return s+st.calc},0);
  var bstCls=bst>=600?'bst-elite':bst>=500?'bst-high':bst>=400?'bst-mid':'bst-low';

  // Bars HTML
  var bars='<div class="bs-grid">'+stats.map(function(st){
    var pct=Math.min(st.calc/300*100,100);
    var natInd=st.natMod>1?' <span style="color:var(--green);font-size:.6rem">▲</span>':st.natMod<1?' <span style="color:var(--red);font-size:.6rem">▼</span>':'';
    var natCol=st.natMod>1?'var(--green)':st.natMod<1?'var(--red)':BSC[st.key];
    return '<div class="bs-row">'+
      '<span class="bs-label">'+BSN[st.key]+'</span>'+
      '<div class="bs-track"><div class="bs-fill" style="width:'+pct+'%;background:'+BSC[st.key]+'"></div></div>'+
      '<span class="bs-val" style="color:'+natCol+'">'+st.calc+'</span>'+
      '<span class="bs-nat-ind">'+natInd+'</span>'+
    '</div>';
  }).join('')+'</div>';

  // SP footer — shows raw allocation
  var totalSp=BSK.reduce(function(s,k){return s+sp[k]},0);
  var maxSp=b.max_sp||66;
  var spFooter='<div style="display:flex;align-items:center;gap:8px;padding-top:8px;margin-top:8px;border-top:1px solid var(--border);font-size:.68rem;color:var(--muted);font-weight:600">'+
    '<span>SP</span>'+
    BSK.map(function(k){return '<span style="color:'+BSC[k]+';font-weight:800">'+sp[k]+'</span>'}).join('<span style="color:var(--muted2)">·</span>')+
    '<span style="margin-left:auto;color:var(--muted)">'+totalSp+' / '+maxSp+'</span>'+
  '</div>';

  return '<div class="card" style="margin-bottom:1rem">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem">'+
      '<h3 style="font-size:.9rem;font-weight:700">Stats at Lv50</h3>'+
      '<div class="bs-view-toggle" style="width:auto;margin:0">'+
        '<button class="bs-view-btn'+(bdView==='bars'?' active':'')+'" onclick="bdSwitchView(\'bars\')" style="padding:4px 12px">Bars</button>'+
        '<button class="bs-view-btn'+(bdView==='hex'?' active':'')+'" onclick="bdSwitchView(\'hex\')" style="padding:4px 12px">Hex</button>'+
      '</div>'+
    '</div>'+
    (bdView==='hex'?bdBuildHex(poke,stats):bars)+
    '<div class="bs-total"><span class="bs-total-label">Stat Total</span><span class="bs-total-val '+bstCls+'">'+bst+'</span></div>'+
    spFooter+
  '</div>';
}

function renderBuildDetail(c){
  var b=allBuilds.find(function(x){return x.id===detailBuildId});
  if(!b){showBuildList();return}
  var bImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
  var t1=TC[b.type_1]||TC.Normal;var t2=b.type_2?TC[b.type_2]:null;
  var grad=t2?'linear-gradient(135deg,'+t1.m+'88,'+t2.m+'88)':'linear-gradient(135deg,'+t1.m+'66,'+t1.d+'88)';
  var sL={hp:'HP',attack:'Attack',defense:'Defense',sp_attack:'Sp.Atk',sp_defense:'Sp.Def',speed:'Speed'};
  var natDetail=b.nature_name||'—';if(b.increased_stat)natDetail+=' <span style="color:var(--green);font-size:.72rem">▲'+sL[b.increased_stat]+'</span> <span style="color:var(--red);font-size:.72rem">▼'+sL[b.decreased_stat]+'</span>';

  var favLabel=b.is_favourite?'Remove from favourites':'Add to favourites';
  var favIcon=b.is_favourite?'⭐':'☆';
  var safeName=b.build_name.replace(/'/g,"\\'");
  c.innerHTML='<div class="ph"><div class="ph-top"><div><div class="ph-title" style="cursor:pointer" onclick="showBuildList()">← '+(b.pokemon_name||'?')+' <span style="font-weight:500;color:var(--muted);font-size:.9rem">· '+(b.battle_format||'')+'</span></div><div class="ph-sub">'+b.build_name+(b.is_shiny?' <span style="color:var(--purple)">✦ Shiny Variant</span>':'')+'</div></div><div class="action-bar" style="display:flex;gap:.4rem;align-items:flex-start;flex-shrink:0"><button class="btn btn-red" onclick="showBuildEditor(\''+b.id+'\')">✏️ Edit</button><div class="om-wrap"><button class="btn btn-ghost" style="width:44px;padding:0" onclick="toggleOverflow(event)" aria-label="More actions">⋮</button><div class="om-menu" id="bdOmMenu"><button class="om-item" onclick="togFav(null,\''+b.id+'\');document.getElementById(\'bdOmMenu\').classList.remove(\'open\')"><span class="om-item-icon">'+favIcon+'</span>'+favLabel+'</button><button class="om-item" onclick="dupBuild(\''+b.id+'\');document.getElementById(\'bdOmMenu\').classList.remove(\'open\')"><span class="om-item-icon">🔄</span>Duplicate build</button><button class="om-item" onclick="exportShowdown(\''+b.id+'\');document.getElementById(\'bdOmMenu\').classList.remove(\'open\')"><span class="om-item-icon">📤</span>Export to Showdown</button><div class="om-sep"></div><button class="om-item destructive" onclick="document.getElementById(\'bdOmMenu\').classList.remove(\'open\');confirmDelBuild(\''+b.id+'\',\''+safeName+'\')"><span class="om-item-icon">🗑</span>Delete build</button></div></div></div></div></div>'+
  '<div class="detail-grid" style="padding:1.2rem 2rem;display:grid;grid-template-columns:1fr 1fr;gap:1.2rem">'+
    // Left column: Art + Stats + Matchups
    '<div>'+
      '<div class="card" style="text-align:center;padding:2rem 1.5rem;margin-bottom:1rem;background:'+grad+';position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:-10px;right:-10px;font-size:7rem;font-weight:900;opacity:.07;pointer-events:none;line-height:1;font-family:monospace">#'+String(b.dex_number||0).padStart(4,'0')+'</div>'+
        '<div style="opacity:.04;position:absolute;bottom:-20px;left:-20px;pointer-events:none">'+pb(180)+'</div>'+
        '<img src="'+bImg+'" style="width:180px;height:180px;object-fit:contain;filter:drop-shadow(0 6px 16px rgba(0,0,0,.3));position:relative;z-index:1" onerror="this.style.opacity=\'0.2\'">'+
        '<div style="margin-top:.8rem;display:flex;gap:5px;justify-content:center;position:relative;z-index:1"><span class="type-pill" style="background:'+t1.m+';font-size:11px;padding:3px 10px">'+b.type_1+'</span>'+(b.type_2?'<span class="type-pill" style="background:'+(TC[b.type_2]||TC.Normal).m+';font-size:11px;padding:3px 10px">'+b.type_2+'</span>':'')+'</div>'+
      '</div>'+
      bdBuildStatCard(b)+
      '<div class="card"><h3 style="font-size:.9rem;font-weight:700;margin-bottom:.8rem">⚡ Type Effectiveness</h3>'+renderMatchupHtml(b.type_1,b.type_2)+'</div>'+
    '</div>'+
    // Right column: Config + Moves + Strategy
    '<div>'+
      '<div class="card" style="margin-bottom:1rem"><h3 style="font-size:.9rem;font-weight:700;margin-bottom:.8rem">Configuration</h3>'+
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:.85rem">'+
          '<span style="color:var(--muted);font-weight:600">Ability</span><span style="font-weight:600">'+(b.ability||'—')+'</span>'+
          '<span style="color:var(--muted);font-weight:600">Item</span><span style="font-weight:600">'+(b.item_name||'—')+'</span>'+
          '<span style="color:var(--muted);font-weight:600">Nature</span><span style="font-weight:600">'+natDetail+'</span>'+
          '<span style="color:var(--muted);font-weight:600">Archetype</span><span style="font-weight:600">'+(b.archetype||'—')+'</span>'+
        '</div></div>'+
      '<div class="card" style="margin-bottom:1rem"><h3 style="font-size:.9rem;font-weight:700;margin-bottom:.8rem">Moveset</h3>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
          [b.move_1,b.move_2,b.move_3,b.move_4].map(function(m){return'<div style="padding:8px 12px;border-radius:8px;background:var(--surface);font-size:.85rem;font-weight:500">'+(m||'—')+'</div>'}).join('')+
        '</div></div>'+
      '<div class="card"><h3 style="font-size:.9rem;font-weight:700;margin-bottom:.8rem">Strategy</h3>'+
        (b.win_condition?'<div style="margin-bottom:.8rem"><span style="font-size:.68rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.05em">Win Condition</span><p style="font-size:.85rem;color:var(--text2);margin-top:.2rem;line-height:1.5">'+b.win_condition+'</p></div>':'')+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">'+
          (b.strengths?'<div><span style="font-size:.68rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.05em">Strengths</span><p style="font-size:.82rem;color:var(--text2);margin-top:.2rem;line-height:1.5">'+b.strengths.replace(/\n/g,'<br>')+'</p></div>':'')+
          (b.weaknesses?'<div><span style="font-size:.68rem;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.05em">Weaknesses</span><p style="font-size:.82rem;color:var(--text2);margin-top:.2rem;line-height:1.5">'+b.weaknesses.replace(/\n/g,'<br>')+'</p></div>':'')+
        '</div></div>'+
    '</div>'+
  '</div>'
}

// Mobile-first rich picker: gradient bg, Mega badge, types, shiny toggle
function filterPkPicker(){
  var inp=document.getElementById('pkSrch');
  var s=(inp?inp.value:pickerSearchValue).toLowerCase();
  pickerSearchValue=s;
  var f=allPkmn.filter(function(p){
    if(s&&p.name.toLowerCase().indexOf(s)===-1&&String(p.dex_number).indexOf(s)===-1)return false;
    if(pickerTypeFilter&&p.type_1!==pickerTypeFilter&&p.type_2!==pickerTypeFilter)return false;
    if(pickerFormFilter&&p.form!==pickerFormFilter)return false;
    return true;
  });
  var grid=document.getElementById('pkPicker');
  if(!grid)return;
  if(!f.length){grid.innerHTML='<div style="grid-column:1/-1;color:var(--muted);text-align:center;padding:2rem;font-size:.85rem">No Pokémon match</div>';return}
  grid.innerHTML=f.slice(0,150).map(function(p){
    var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;
    var showShiny=pickerShinyAll&&p.shiny_url;
    var img=showShiny?p.shiny_url:(p.image_url||'');
    var cls='epc-card'+(p.id===selPkmnId?' selected':'')+(showShiny?' shiny-holo':'');
    var isMega=p.form==='Mega';
    return '<div class="'+cls+'" onclick="pickPk(\''+p.id+'\')">'+
      '<div class="epc-top"><div><div class="epc-dex">#'+String(p.dex_number).padStart(4,'0')+'</div><div class="epc-name">'+displayName(p)+'</div></div></div>'+
      '<div class="epc-art" style="background:'+grad(p)+'">'+(isMega?megaBadge():'')+'<div class="wm">'+pb(60)+'</div>'+(img?'<img src="'+img+'" onerror="this.style.opacity=\'0.2\'" loading="lazy">':'')+'</div>'+
      '<div class="epc-bot"><span class="type-pill" style="background:'+t1.m+'">'+p.type_1+'</span>'+(t2?'<span class="type-pill" style="background:'+t2.m+'">'+p.type_2+'</span>':'')+'</div>'+
    '</div>';
  }).join('');
}
function pickPk(id){
  selPkmnId=id;
  var p=allPkmn.find(function(x){return x.id===id});
  // Carry shiny selection from picker into build
  if(editorStep==='picker'&&pickerShinyAll&&p&&p.shiny_url)editorShiny=true;
  editorStep='form';
  renderBuilds();
}
// Clamp per-stat values and enforce the shared SP budget before syncing the slider + number input.
// Legacy setSp/adjSp kept for backward compat (no-ops that route to edSet)
function setSp(s,v){edSet(s,v)}
function adjSp(s,d){edAdj(s,d)}

async function saveBuild(){
  if(!selPkmnId){toast('Select a Pokémon','err');return}
  var name=document.getElementById('edName').value.trim();if(!name){toast('Enter a build name','err');return}
  // Read shiny from JS state (mobile pass) with fallback to legacy #edShiny button
  var isShiny=editorShiny||(document.getElementById('edShiny')&&document.getElementById('edShiny').classList.contains('active'));
  // Mirror the editor fields into the flat Supabase row shape used by the `builds` table.
  var body={user_id:usr.id,pokemon_id:selPkmnId,name:name,battle_format:document.getElementById('edFmt').value,archetype:document.getElementById('edArch').value||null,item_id:document.getElementById('edItem').value||null,nature_id:document.getElementById('edNat').value||null,ability:document.getElementById('edAbi').value||null,move_1:document.getElementById('edM1').value||null,move_2:document.getElementById('edM2').value||null,move_3:document.getElementById('edM3').value||null,move_4:document.getElementById('edM4').value||null,hp_sp:spV.hp,atk_sp:spV.atk,def_sp:spV.def,spa_sp:spV.spa,spd_sp:spV.spd,spe_sp:spV.spe,is_shiny:isShiny,win_condition:document.getElementById('edWin').value||null,strengths:document.getElementById('edStr').value||null,weaknesses:document.getElementById('edWeak').value||null,status:'Testing'};
  try{if(editBuildId){await upd('builds',{'id':'eq.'+editBuildId},body,true);toast('Build updated!')}else{await ins('builds',body,true);toast('Build created!')}await loadBuilds();showBuildList()}catch(e){toast(e.message,'err')}
}
// Reset the shared confirmMod to its default delete-style state.
// Called before opening as a delete confirmation so stale login-modal text doesn't leak through.
function resetConfirmMod(){
  var btn=document.getElementById('cmBtn');
  btn.textContent='Delete';
  btn.className='btn btn-red';
  btn.onclick=null;
  var cancel=document.querySelector('#confirmMod .btn.btn-ghost');
  if(cancel)cancel.textContent='Cancel';
}
function confirmDelBuild(id,name){
  resetConfirmMod();
  document.getElementById('cmEmoji').textContent='⚔️';
  document.getElementById('cmTitle').textContent='Delete Build?';
  document.getElementById('cmMsg').textContent='Delete "'+name+'"? This cannot be undone.';
  document.getElementById('cmBtn').onclick=function(){delBuild(id)};
  document.getElementById('confirmMod').classList.add('open');
}
async function delBuild(id){try{await rm('builds',{'id':'eq.'+id},true);closeCm();toast('Build deleted');await loadBuilds();renderBuilds();renderDash()}catch(e){toast(e.message,'err')}}
function closeCm(){authMode='login';document.getElementById('confirmMod').classList.remove('open');resetConfirmMod()}
function showLoginModal(msg){
  var isSignup=authMode==='signup';
  document.getElementById('cmEmoji').textContent=isSignup?'✨':'🔐';
  document.getElementById('cmTitle').textContent=isSignup?'Create Account':'Sign In';
  document.getElementById('cmMsg').innerHTML=(msg?'<div style="font-size:.84rem;color:var(--muted);margin-bottom:.9rem;line-height:1.5">'+msg+'</div>':'')+
    '<div style="display:flex;flex-direction:column;gap:.65rem;text-align:left">'+
      '<input type="email" id="loginEmail" placeholder="Email" class="ed-input">'+
      '<input type="password" id="loginPass" placeholder="Password" class="ed-input">'+
      '<div style="font-size:.72rem;color:var(--muted)">'+(isSignup?'Create an account to save your builds, teams, items, and Pokédex progress.':'Sign in to access your saved builds, teams, items, and collection progress.')+'</div>'+
    '</div>';
  document.getElementById('cmBtn').textContent=isSignup?'Create Account':'Sign In';
  document.getElementById('cmBtn').className='btn btn-red';
  document.querySelector('#confirmMod .btn.btn-ghost').textContent='Close';
  document.getElementById('cmBtn').onclick=function(){if(authMode==='signup')signup();else login()};
  document.getElementById('confirmMod').classList.add('open');
  setTimeout(function(){var el=document.getElementById('loginEmail');if(el)el.focus()},0);
}

function maybeShowInitialAuthPrompt(){}

// #SECTION: TEAMS
// ═══════════════════════════════════════
// TEAMS
// Team list, detail, editor, roster selection,
// save/update/delete, and team composition logic.
// ═══════════════════════════════════════

var teamView='list',editTeamId=null,detailTeamId=null,selBuildIds=[];

function showTeamList(){teamView='list';renderTeams()}
function showTeamDetail(id){detailTeamId=id;teamView='detail';renderTeams()}
function showTeamEditor(id){
  editTeamId=id||null;teamView='editor';
  if(id){var t=allTeams.find(function(x){return x.id===id});if(t&&t.members)selBuildIds=t.members.map(function(m){return m.build_id})}else{selBuildIds=[]}
  renderTeams()
}

async function loadTeamRoster(){
  if(!tk)return;
  // Pull the base teams plus their flattened roster rows, then stitch members onto each team client-side.
  try{var teams=await q('teams',{order:'created_at.desc'},true);var roster=[];try{roster=await q('team_roster',{order:'team_id.asc,slot_position.asc'},true)}catch(e){}allTeams=teams.map(function(t){t.members=(roster||[]).filter(function(r){return r.team_id===t.id});return t});document.getElementById('nc2').textContent=allTeams.length}catch(e){}
}

function renderTeams(){
  var c=document.getElementById('teamsView');
  if(!tk){c.innerHTML='<div class="ph"><div class="ph-title">🏆 Teams</div><div class="ph-sub">Sign in to manage teams</div></div><div class="empty"><div class="em">🔒</div>Sign in to see teams</div>';return}
  if(teamView==='editor'){renderTeamEditor(c);return}
  if(teamView==='detail'){renderTeamDetail(c);return}
  var hdr='<div class="ph"><div class="ph-top"><div><div class="ph-title">🏆 Teams</div><div class="ph-sub">Your competitive team compositions</div></div><button class="btn btn-red" onclick="showTeamEditor()">+ New Team</button></div></div>';
  if(!allTeams.length){c.innerHTML=hdr+'<div class="empty"><div class="em">🏆</div>No teams yet</div>';return}
  c.innerHTML=hdr+'<div class="teams-grid">'+allTeams.map(function(t){
    var fc=t.format==='Singles'?'fmt-s':'fmt-d';
    var mems=(t.members||[]).map(function(m){var mImg=m.is_shiny&&m.shiny_url?m.shiny_url:(m.image_url||'');return'<div class="tm-mem"><img src="'+mImg+'" onerror="this.style.opacity=\'0.2\'"><div><div class="tm-mem-name">'+(m.pokemon_name||'?')+(m.is_shiny?' <span style="color:var(--purple);font-size:.6rem">✦</span>':'')+'</div><div class="tm-mem-role">'+(m.archetype||'')+'</div></div></div>'}).join('');
    return'<div class="tm-card" onclick="showTeamDetail(\''+t.id+'\')" style="cursor:pointer"><div class="tm-top"><span class="tm-name">'+t.name+'</span><div style="display:flex;gap:.3rem;align-items:center"><span class="tm-fmt '+fc+'">'+(t.format||'?')+'</span></div></div><div class="tm-members">'+(mems||'<span style="color:var(--muted);font-size:.82rem">No builds assigned</span>')+'</div><div class="bld-actions" style="margin-top:.5rem"><button onclick="event.stopPropagation();showTeamEditor(\''+t.id+'\')">✏️ Edit</button><button onclick="event.stopPropagation();confirmDelTeam(\''+t.id+'\',\''+t.name.replace(/'/g,"\\'")+'\')">🗑 Delete</button></div></div>'
  }).join('')+'</div>'
}

function renderTeamEditor(c){
  var t=editTeamId?allTeams.find(function(x){return x.id===editTeamId}):null;
  var hdr='<div class="ph"><div class="ph-top"><div><div class="ph-title" style="cursor:pointer" onclick="showTeamList()">← '+(t?'Edit Team':'New Team')+'</div><div class="ph-sub">Assemble your builds into a competitive roster.</div></div><button class="btn btn-red" onclick="saveTeam()">💾 Save Team</button></div></div>';
  // Roster slots
  var slots='';for(var i=0;i<6;i++){
    var bid=selBuildIds[i];var b=bid?allBuilds.find(function(x){return x.id===bid}):null;
    if(b){var slImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');slots+='<div class="te-slot filled"><img src="'+slImg+'" onerror="this.style.opacity=\'0.2\'"><span>'+(b.pokemon_name||'?')+(b.is_shiny?' ✦':'')+'</span><span class="te-rm" onclick="rmSlot('+i+')">✕ Remove</span></div>'}
    else{slots+='<div class="te-slot"><span style="font-size:1.2rem;color:var(--muted2)">+</span><span style="font-size:.6rem;color:var(--muted2)">Slot '+(i+1)+'</span></div>'}
  }
  // Build picker
  var bpicker=allBuilds.map(function(b){var picked=selBuildIds.indexOf(b.id)!==-1;
    var details=(b.archetype?b.archetype:'')+(b.item_name?' · '+b.item_name:'')+(b.nature_name?' · '+b.nature_name:'');
    var moves=[b.move_1,b.move_2,b.move_3,b.move_4].filter(Boolean).join(', ');
    var bpImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
    return'<div class="te-bld'+(picked?' picked':'')+'" onclick="togBldPick(\''+b.id+'\')"><img src="'+bpImg+'" onerror="this.style.opacity=\'0.2\'"><div><div class="te-bld-info">'+(b.pokemon_name||'?')+(b.is_shiny?' ✦':'')+' — '+b.build_name+'</div><div class="te-bld-meta">'+(b.battle_format||'')+' · '+(b.total_sp||0)+' SP</div>'+(details?'<div class="te-bld-meta">'+details+'</div>':'')+(moves?'<div class="te-bld-meta" style="font-style:italic">'+moves+'</div>':'')+'</div></div>'}).join('');
  c.innerHTML=hdr+'<div class="editor"><div class="ed-grid"><div><div class="ed-card"><h3>Team Info</h3>'+
    '<label class="ed-label">Team Name</label><input class="ed-input" id="tmName" value="'+(t?t.name:'')+'" placeholder="e.g. Storm Surge Protocol">'+
    '<div class="ed-row"><div><label class="ed-label">Format</label><select class="ed-select" id="tmFmt"><option value="Singles"'+(t&&t.format==='Singles'?' selected':'')+'>Singles</option><option value="Doubles"'+(t&&t.format==='Doubles'?' selected':'')+'>Doubles</option></select></div></div>'+
    '<label class="ed-label">Notes</label><textarea class="ed-textarea" id="tmNotes">'+(t?t.notes||'':'')+'</textarea>'+
    '</div><div class="ed-card" style="margin-top:1rem"><h3>Roster <span style="font-size:.75rem;color:var(--muted);font-weight:500">'+selBuildIds.length+' / 6</span></h3><div class="te-roster">'+slots+'</div></div></div>'+
    '<div><div class="ed-card"><h3>Select Builds</h3>'+(allBuilds.length?'<div class="te-builds">'+bpicker+'</div>':'<p style="color:var(--muted);font-size:.82rem">Create builds first</p>')+'</div></div></div></div>'
}

// #SECTION: TEAM DETAIL VIEW
// ───────────────────────────────────────
// TEAM DETAIL VIEW
// Detailed single-team screen layout and rendering.
// ───────────────────────────────────────

function renderTeamDetail(c){
  var t=allTeams.find(function(x){return x.id===detailTeamId});
  if(!t){showTeamList();return}
  var fc=t.format==='Singles'?'fmt-s':'fmt-d';
  var members=(t.members||[]).map(function(m){
    // Find the full build data
    var b=allBuilds.find(function(x){return x.id===m.build_id})||m;
    var mImg=b.is_shiny&&b.shiny_url?b.shiny_url:(m.image_url||b.image_url||'');
    var t1=TC[m.type_1||b.type_1]||TC.Normal;
    var SMAX=32;var max=b.max_sp||66;
    var statMini=['hp','atk','def','spa','spd','spe'].map(function(s){var v=b[s+'_sp']||0;var pct=Math.min(v/SMAX*100,100);return'<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px"><span style="width:28px;font-size:.6rem;font-weight:600;color:var(--muted);text-align:right">'+s.toUpperCase()+'</span><div style="flex:1;height:4px;background:var(--surface2);border-radius:2px;overflow:hidden"><div style="width:'+pct+'%;height:100%;border-radius:2px;background:'+statCols[s]+'"></div></div><span style="width:18px;font-size:.6rem;font-weight:600;text-align:right">'+v+'</span></div>'}).join('');
    return'<div class="card team-member-card" style="padding:1rem;cursor:pointer" onclick="showBuildDetail(\''+m.build_id+'\')">'+
      '<div class="team-member-main" style="display:flex;gap:1rem;align-items:flex-start">'+
        '<div class="team-member-left" style="text-align:center"><img class="team-member-art" src="'+mImg+'" style="width:80px;height:80px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.15))" onerror="this.style.opacity=\'0.2\'"><div class="team-member-types" style="margin-top:.3rem;display:flex;gap:3px;justify-content:center"><span class="type-pill" style="background:'+t1.m+'">'+(m.type_1||b.type_1||'?')+'</span>'+(m.type_2||b.type_2?'<span class="type-pill" style="background:'+(TC[m.type_2||b.type_2]||TC.Normal).m+'">'+(m.type_2||b.type_2)+'</span>':'')+'</div></div>'+
        '<div class="team-member-right" style="flex:1"><div class="team-member-name" style="font-weight:700;font-size:.92rem">'+(m.pokemon_name||'?')+(b.is_shiny?' <span style="color:var(--purple);font-size:.7rem">✦</span>':'')+'</div><div class="team-member-build" style="font-size:.78rem;color:var(--muted);margin-bottom:.4rem">'+(m.build_name||b.build_name||'')+'</div>'+
          '<div class="team-member-tags" style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.5rem">'+
            (m.archetype||b.archetype?'<span class="btag btag-arch">'+(m.archetype||b.archetype)+'</span>':'')+
            (b.item_name||m.item_name?'<span class="btag btag-item">'+(b.item_name||m.item_name)+'</span>':'')+
            (b.nature_name?'<span class="btag btag-nat">'+b.nature_name+'</span>':'')+
            (b.ability?'<span class="btag btag-abi">'+b.ability+'</span>':'')+
          '</div>'+
          '<div class="team-member-moves" style="display:flex;gap:4px;margin-bottom:.5rem;flex-wrap:wrap">'+[b.move_1||m.move_1,b.move_2||m.move_2,b.move_3||m.move_3,b.move_4||m.move_4].filter(Boolean).map(function(mv){return'<span class="bmove">'+mv+'</span>'}).join('')+'</div>'+
          statMini+
        '</div>'+
      '</div></div>'
  }).join('');
  var emptySlots='';if((t.members||[]).length<6){for(var i=(t.members||[]).length;i<6;i++){emptySlots+='<div class="card" style="padding:1.5rem;text-align:center;border-style:dashed"><span style="color:var(--muted2);font-size:.85rem">Empty Slot '+(i+1)+'</span></div>'}}

  c.innerHTML='<div class="ph"><div class="ph-top"><div><div class="ph-title" style="cursor:pointer" onclick="showTeamList()">← '+t.name+'</div><div class="ph-sub">'+(t.format||'')+' · '+(t.members||[]).length+'/6 members'+(t.notes?' · '+t.notes:'')+'</div></div><div style="display:flex;gap:.5rem"><button class="btn btn-ghost" onclick="showTeamEditor(\''+t.id+'\')">✏️ Edit Team</button><button class="btn btn-ghost" style="color:var(--red)" onclick="confirmDelTeam(\''+t.id+'\',\''+t.name.replace(/'/g,"\\'")+'\')">🗑 Delete</button></div></div></div>'+
  '<div style="padding:1.2rem 2rem"><div style="display:flex;align-items:center;gap:.5rem;margin-bottom:1rem"><span class="tm-fmt '+fc+'" style="font-size:.82rem">'+(t.format||'?')+'</span><span style="font-size:.85rem;color:var(--muted)">'+(t.members||[]).length+' / 6 Roster</span></div>'+
  '<div class="team-detail-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">'+members+emptySlots+'</div>'+
  // Type Coverage
  '<div class="card" style="margin-top:1.2rem"><h3 style="font-size:.95rem;font-weight:700;margin-bottom:.8rem">🎯 Team Type Coverage</h3>'+teamCoverageHtml(t.members||[])+'</div>'+
  // Battle Log
  '<div class="card" style="margin-top:1.2rem"><h3 style="font-size:.95rem;font-weight:700;margin-bottom:.8rem">📈 Battle Log '+function(){var r=getTeamRecord(t.id);return r.total?'<span style="font-size:.78rem;font-weight:500;color:var(--muted)">'+r.w+'W '+r.l+'L '+r.d+'D · <span style="color:'+(r.rate>=50?'var(--green)':'var(--red)')+'">'+r.rate+'% WR</span></span>':''}()+'</h3>'+
  '<div style="display:flex;gap:.4rem;margin-bottom:.8rem"><button class="btn btn-ghost" style="color:var(--green)" onclick="logBattle(\''+t.id+'\',\'win\')">🏆 Win</button><button class="btn btn-ghost" style="color:var(--red)" onclick="logBattle(\''+t.id+'\',\'loss\')">💀 Loss</button><button class="btn btn-ghost" onclick="logBattle(\''+t.id+'\',\'draw\')">🤝 Draw</button></div>'+
  function(){var logs=allBattles.filter(function(b){return b.team_id===t.id}).slice(0,10);if(!logs.length)return'<p style="color:var(--muted);font-size:.82rem">No battles logged yet</p>';return logs.map(function(l){var icon=l.result==='win'?'🏆':l.result==='loss'?'💀':'🤝';var col=l.result==='win'?'var(--green)':l.result==='loss'?'var(--red)':'var(--muted)';var d=new Date(l.battle_date);var ds=d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});return'<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem .6rem;border-radius:8px;background:var(--surface);margin-bottom:.3rem"><span style="font-size:1rem">'+icon+'</span><span style="font-size:.82rem;font-weight:600;color:'+col+'">'+l.result.charAt(0).toUpperCase()+l.result.slice(1)+'</span>'+(l.opponent_notes?'<span style="font-size:.78rem;color:var(--muted);flex:1">'+l.opponent_notes+'</span>':'<span style="flex:1"></span>')+'<span style="font-size:.68rem;color:var(--muted)">'+ds+'</span><button style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:.7rem" onclick="event.stopPropagation();delBattle(\''+l.id+'\')">✕</button></div>'}).join('')}()+
  '</div></div>'
}

function togBldPick(id){var idx=selBuildIds.indexOf(id);if(idx!==-1)selBuildIds.splice(idx,1);else if(selBuildIds.length<6)selBuildIds.push(id);renderTeams()}
function rmSlot(i){selBuildIds.splice(i,1);renderTeams()}

async function saveTeam(){
  var name=document.getElementById('tmName').value.trim();if(!name){toast('Enter a team name','err');return}
  var body={user_id:usr.id,name:name,format:document.getElementById('tmFmt').value,notes:document.getElementById('tmNotes').value||null,status:'Testing'};
  try{var tid;
  // On edit we replace the roster links so slot order stays in sync with the current picker state.
  if(editTeamId){await upd('teams',{'id':'eq.'+editTeamId},body,true);tid=editTeamId;await rm('team_builds',{'team_id':'eq.'+tid},true)}
  else{var res=await ins('teams',body,true);tid=res[0].id}
  for(var i=0;i<selBuildIds.length;i++){await ins('team_builds',{team_id:tid,build_id:selBuildIds[i],slot_position:i+1},true)}
  toast(editTeamId?'Team updated!':'Team created!');await loadTeamRoster();showTeamList();renderDash()}catch(e){toast(e.message,'err')}
}
function confirmDelTeam(id,name){
  resetConfirmMod();
  document.getElementById('cmEmoji').textContent='🏆';
  document.getElementById('cmTitle').textContent='Delete Team?';
  document.getElementById('cmMsg').textContent='Delete "'+name+'"? This cannot be undone.';
  document.getElementById('cmBtn').onclick=function(){delTeam(id)};
  document.getElementById('confirmMod').classList.add('open');
}
async function delTeam(id){try{await rm('teams',{'id':'eq.'+id},true);closeCm();toast('Team deleted');await loadTeamRoster();renderTeams();renderDash()}catch(e){toast(e.message,'err')}}

// #SECTION: PROFILE & ACHIEVEMENTS
// ═══════════════════════════════════════
// PROFILE & ACHIEVEMENTS
// Trainer profile, avatar, display name,
// achievements, and activity history.
// ═══════════════════════════════════════

var allAch=[],userAch={},userProfile=null;

async function loadAchievements(){try{allAch=await q('achievements',{order:'sort_order.asc'});return allAch}catch(e){return[]}}
async function loadUserAch(){if(!tk)return;try{var rows=await q('user_achievements',{select:'achievement_id,unlocked_at'},true);userAch={};rows.forEach(function(r){userAch[r.achievement_id]=r.unlocked_at})}catch(e){}}
async function loadProfile(){if(!tk)return;try{var rows=await q('user_profiles',{user_id:'eq.'+usr.id},true);if(rows.length)userProfile=rows[0];else{await ins('user_profiles',{user_id:usr.id,display_name:usr.email.split('@')[0]},true);var rows2=await q('user_profiles',{user_id:'eq.'+usr.id},true);userProfile=rows2[0]||null}}catch(e){}}
function triggerAvatarUpload(){document.getElementById('avatarInput').click()}
function handleAvatarFile(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  if(!file.type.startsWith('image/')){toast('Please select an image','err');return}
  var reader=new FileReader();
  reader.onload=function(e){
    // Resize to 128x128 using canvas
    var img=new Image();
    img.onload=function(){
      var canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
      var ctx=canvas.getContext('2d');
      var size=Math.min(img.width,img.height);
      var sx=(img.width-size)/2,sy=(img.height-size)/2;
      ctx.drawImage(img,sx,sy,size,size,0,0,128,128);
      var dataUrl=canvas.toDataURL('image/jpeg',0.8);
      saveAvatar(dataUrl)
    };img.src=e.target.result
  };reader.readAsDataURL(file)
}
async function saveAvatar(dataUrl){
  if(!userProfile)return;
  try{
    await upd('user_profiles',{'user_id':'eq.'+usr.id},{avatar_url:dataUrl},true);
    userProfile.avatar_url=dataUrl;
    updProfileNavIcon();
    toast('Avatar updated!');
    renderProfile();
  }catch(e){toast(e.message,'err')}
}
async function saveDisplayName(){var inp=document.getElementById('dnInput');if(!inp||!userProfile)return;var name=inp.value.trim();if(!name)return;try{await upd('user_profiles',{'user_id':'eq.'+usr.id},{display_name:name},true);userProfile.display_name=name;toast('Name updated!');renderProfile()}catch(e){toast(e.message,'err')}}

async function checkAchievements(){
  if(!tk||!allAch.length)return;
  var obtC=Object.keys(uDex).length,shC=Object.keys(uShinyDex).length,blC=allBuilds.length,tmC=allTeams.length,itC=Object.keys(uItems).length;
  var hasFull=allTeams.some(function(t){return(t.members||[]).length>=6});
  var hasMax=allBuilds.some(function(b){return b.hp_sp>=32||b.atk_sp>=32||b.def_sp>=32||b.spa_sp>=32||b.spd_sp>=32||b.spe_sp>=32});
  var hasFullSp=allBuilds.some(function(b){return(b.total_sp||0)>=66});
  var newUnlocks=[];
  // Achievement rules are data-driven: each row supplies a `check_type` and threshold to evaluate here.
  for(var i=0;i<allAch.length;i++){
    var a=allAch[i];if(userAch[a.id])continue;
    var earned=false;
    if(a.check_type==='obtained_count')earned=obtC>=a.threshold;
    else if(a.check_type==='shiny_count')earned=shC>=a.threshold;
    else if(a.check_type==='builds_count')earned=blC>=a.threshold;
    else if(a.check_type==='teams_count')earned=tmC>=a.threshold;
    else if(a.check_type==='items_count')earned=itC>=a.threshold;
    else if(a.check_type==='full_team')earned=hasFull;
    else if(a.check_type==='max_stat')earned=hasMax;
    else if(a.check_type==='full_sp')earned=hasFullSp;
    if(earned){
      try{var u2=new URL(API+'/rest/v1/user_achievements');u2.searchParams.set('on_conflict','user_id,achievement_id');
        await fetch(u2.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,achievement_id:a.id})});
        userAch[a.id]=new Date().toISOString();newUnlocks.push(a)}catch(e){}
    }
  }
  if(newUnlocks.length){newUnlocks.forEach(function(a){toast('🏆 Achievement: '+a.name+'!')});renderProfile()}
}

function renderProfile(){
  var c=document.getElementById('profileContent');
if(!usr){
  c.innerHTML='<div class="card" style="max-width:420px;margin:0 auto;text-align:center"><div style="font-size:2rem;margin-bottom:.35rem">🔐</div><h3 style="font-size:1rem;font-weight:700;margin-bottom:.3rem">Login to view your profile</h3><p style="font-size:.84rem;color:var(--muted);line-height:1.5">Sign in to access your saved profile, achievements, teams, and build history.</p><button class="btn btn-red" style="margin-top:.9rem" onclick="showLoginModal(\'Sign in to view your trainer profile and saved progress.\')">Login</button></div>';
  updProfileNavIcon();
  return
}
  var dn=userProfile?userProfile.display_name||usr.email.split('@')[0]:usr.email.split('@')[0];
  var obtC=Object.keys(uDex).length,shC=Object.keys(uShinyDex).length,blC=allBuilds.length,tmC=allTeams.length;
  var achUnlocked=allAch.filter(function(a){return userAch[a.id]}).length;
  // Trainer Card
  var avHtml=userProfile&&userProfile.avatar_url?'<img src="'+userProfile.avatar_url+'" alt="Avatar">':'<img src="icons/logo.png" alt="PC" style="padding:4px">';
  var card='<input type="file" id="avatarInput" accept="image/*" style="display:none" onchange="handleAvatarFile(this)"><div class="trainer-card"><div class="tc-wm">'+pb(200)+'</div><div class="tc-top"><div class="tc-avatar" onclick="triggerAvatarUpload()">'+avHtml+'<div class="av-overlay">📷 Change</div></div><div class="tc-info"><div class="tc-label">Trainer</div><h2>'+dn+'</h2><div class="tc-email">'+usr.email+'</div><div class="name-edit"><input id="dnInput" value="'+dn+'" placeholder="Display name"><button onclick="saveDisplayName()">Save</button></div></div></div><div class="tc-stats"><div class="tc-stat"><div class="tc-sv" style="color:#22c55e">'+obtC+'</div><div class="tc-sl">Obtained</div></div><div class="tc-stat"><div class="tc-sv" style="color:#8b5cf6">'+shC+'</div><div class="tc-sl">Shinies</div></div><div class="tc-stat"><div class="tc-sv" style="color:#3b82f6">'+blC+'</div><div class="tc-sl">Builds</div></div><div class="tc-stat"><div class="tc-sv" style="color:#f59e0b">'+tmC+'</div><div class="tc-sl">Teams</div></div><div class="tc-stat"><div class="tc-sv" style="color:#ef4444">'+achUnlocked+'<span style="font-size:.8rem;opacity:.5">/'+allAch.length+'</span></div><div class="tc-sl">Achievements</div></div></div></div>';
  // Achievements
  var achHtml='<h3 style="font-size:1.05rem;font-weight:700;margin-top:1.5rem;display:flex;align-items:center;gap:.4rem">🏆 Achievements <span style="font-size:.78rem;color:var(--muted);font-weight:500">'+achUnlocked+' / '+allAch.length+' unlocked</span></h3>';
  var catOrder=['collection','shiny','builds','teams','items'];
  var catLabels={collection:'Collection',shiny:'Shiny',builds:'Builds',teams:'Teams',items:'Items'};
  achHtml+=catOrder.map(function(cat){
    var items=allAch.filter(function(a){return a.category===cat});if(!items.length)return'';
    return'<div style="margin-top:1rem"><span style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">'+catLabels[cat]+'</span><div class="ach-grid">'+items.map(function(a){
      var unlocked=!!userAch[a.id];var dt=unlocked?new Date(userAch[a.id]):null;
      var dateStr=dt?dt.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
      return'<div class="ach-card '+(unlocked?'unlocked':'locked')+'"><div class="ach-icon">'+a.icon+'</div><div class="ach-info"><div class="ach-name">'+a.name+'</div><div class="ach-desc">'+a.description+'</div>'+(unlocked?'<div class="ach-date">Unlocked '+dateStr+'</div>':'')+'</div></div>'
    }).join('')+'</div></div>'
  }).join('');
  // Recent Activity
  var actHtml='<h3 style="font-size:1.05rem;font-weight:700;margin-top:1.5rem;display:flex;align-items:center;gap:.4rem">📝 Recent Activity</h3><div class="activity-list">';
  var acts=allBuilds.slice(0,5).map(function(b){var bImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');return{img:bImg,text:'Created build: '+b.build_name,time:b.created_at}});
  allTeams.slice(0,3).forEach(function(t){acts.push({img:'',text:'Created team: '+t.name,time:t.created_at})});
  acts.sort(function(a,b){return new Date(b.time)-new Date(a.time)});
  actHtml+=acts.slice(0,8).map(function(a){var d=new Date(a.time);var ds=d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});return'<div class="act-item">'+(a.img?'<img src="'+a.img+'" onerror="this.style.display=\'none\'">':'<div style="width:36px;height:36px;border-radius:8px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">🏆</div>')+'<span class="act-text">'+a.text+'</span><span class="act-time">'+ds+'</span></div>'}).join('')||'<div style="color:var(--muted);font-size:.85rem">No activity yet</div>';
  actHtml+='</div>';
  c.innerHTML=card+achHtml+actHtml;
updProfileNavIcon()
}

// #SECTION: BUILD UTILITIES
// ═══════════════════════════════════════
// BUILD UTILITIES
// Duplicate builds, favourites, export, and related helpers.
// ═══════════════════════════════════════

async function dupBuild(id){
  var b=allBuilds.find(function(x){return x.id===id});if(!b)return;
  var body={user_id:usr.id,pokemon_id:b.pokemon_id,name:b.build_name+' (Copy)',battle_format:b.battle_format,archetype:b.archetype,item_id:b.item_id||null,nature_id:b.nature_id||null,ability:b.ability,move_1:b.move_1,move_2:b.move_2,move_3:b.move_3,move_4:b.move_4,hp_sp:b.hp_sp,atk_sp:b.atk_sp,def_sp:b.def_sp,spa_sp:b.spa_sp,spd_sp:b.spd_sp,spe_sp:b.spe_sp,is_shiny:b.is_shiny||false,win_condition:b.win_condition,strengths:b.strengths,weaknesses:b.weaknesses,status:'Testing'};
  try{await ins('builds',body,true);toast('Build duplicated!');await loadBuilds();renderBuilds();renderDash()}catch(e){toast(e.message,'err')}
}

async function togFav(ev,id){
  if(ev)ev.stopPropagation();var b=allBuilds.find(function(x){return x.id===id});if(!b)return;
  try{await upd('builds',{'id':'eq.'+id},{is_favourite:!b.is_favourite},true);
  b.is_favourite=!b.is_favourite;toast(b.is_favourite?'⭐ Favourited!':'Unfavourited');renderBuilds()}catch(e){toast(e.message,'err')}
}

// #SECTION: TEAM COVERAGE ANALYZER
// ═══════════════════════════════════════
// TEAM COVERAGE ANALYZER
// Analyse offensive coverage and defensive weaknesses.
// ═══════════════════════════════════════

function teamCoverageHtml(members){
  if(!members||!members.length)return'<p style="color:var(--muted);font-size:.85rem">Add members to see coverage</p>';
  var offHits={},defWeaks={};
  ALL_T.forEach(function(t){offHits[t]=0;defWeaks[t]=0});
  members.forEach(function(m){
    var t1=m.type_1,t2=m.type_2;
    ALL_T.forEach(function(dt){
      var mult=TCHART[t1]&&TCHART[t1][dt]!==undefined?TCHART[t1][dt]:1;
      if(mult>=2)offHits[dt]++;
      if(t2){
        var m2=TCHART[t2]&&TCHART[t2][dt]!==undefined?TCHART[t2][dt]:1;
        if(m2>=2)offHits[dt]++;
      }
    });
    ALL_T.forEach(function(at){
      var mult=TCHART[at]&&TCHART[at][t1]!==undefined?TCHART[at][t1]:1;
      if(t2)mult*=(TCHART[at]&&TCHART[at][t2]!==undefined?TCHART[at][t2]:1);
      if(mult>=2)defWeaks[at]++;
    });
  });

  var uncov=ALL_T.filter(function(t){return offHits[t]===0});
  var danger=ALL_T.filter(function(t){return defWeaks[t]>=2}).sort(function(a,b){return defWeaks[b]-defWeaks[a]});
  var strong=ALL_T.filter(function(t){return offHits[t]>=3}).sort(function(a,b){return offHits[b]-offHits[a]});
  var isMobile=window.innerWidth<=768;

  if(isMobile){
    var riskRows=ALL_T.filter(function(t){return offHits[t]===0||defWeaks[t]>=2}).sort(function(a,b){
      var aScore=(defWeaks[a]>=2?100+defWeaks[a]:0)+(offHits[a]===0?10:0);
      var bScore=(defWeaks[b]>=2?100+defWeaks[b]:0)+(offHits[b]===0?10:0);
      return bScore-aScore;
    });

    var html='';
    html+='<div style="display:grid;grid-template-columns:1fr;gap:.75rem">';
    html+='<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:12px;padding:.85rem">'+
      '<div style="font-size:.72rem;font-weight:800;color:var(--green);margin-bottom:.45rem;letter-spacing:.02em">⚔ Strong coverage</div>'+
      (strong.length?'<div style="display:flex;flex-wrap:wrap;gap:5px">'+strong.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:9px;padding:3px 8px">'+t+'</span>'}).join('')+'</div>':'<div style="font-size:.78rem;color:var(--muted)">No standout offensive clusters yet.</div>')+
    '</div>';

    html+='<div style="background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.14);border-radius:12px;padding:.85rem">'+
      '<div style="font-size:.72rem;font-weight:800;color:var(--red);margin-bottom:.55rem;letter-spacing:.02em">⚠ Watch-outs</div>'+
      (riskRows.length?'<div style="display:flex;flex-direction:column;gap:.45rem">'+riskRows.map(function(t){
        var notes=[];
        if(offHits[t]===0)notes.push('no coverage');
        if(defWeaks[t]>=2)notes.push('weak ×'+defWeaks[t]);
        return'<div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.5rem .6rem;border-radius:10px;background:var(--surface);border:1px solid var(--border)">'+
          '<div style="display:flex;align-items:center;gap:.45rem;min-width:0"><span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:9px;padding:3px 8px">'+t+'</span></div>'+
          '<span style="font-size:.72rem;color:var(--muted);text-align:right">'+notes.join(' · ')+'</span>'+
        '</div>';
      }).join('')+'</div>':'<div style="font-size:.78rem;color:var(--green)">No major risk clusters. ✓</div>')+
    '</div>';

    html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:.85rem">'+
      '<div style="font-size:.72rem;font-weight:800;color:var(--text);margin-bottom:.55rem;letter-spacing:.02em">18-type snapshot</div>'+
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem">'+ALL_T.map(function(t){
        var tone=defWeaks[t]>=2?'rgba(239,68,68,.08)':offHits[t]>=2?'rgba(34,197,94,.08)':'var(--surface2)';
        var bd=defWeaks[t]>=2?'1px solid rgba(239,68,68,.25)':offHits[t]>=2?'1px solid rgba(34,197,94,.22)':'1px solid var(--border)';
        return'<div style="border-radius:10px;padding:.45rem .5rem;background:'+tone+';border:'+bd+'">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:.35rem;margin-bottom:.25rem"><span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px;padding:2px 6px">'+t+'</span><span style="font-size:.65rem;color:var(--muted)">⚔ '+offHits[t]+' · 🛡 '+defWeaks[t]+'</span></div>'+
        '</div>';
      }).join('')+'</div>'+
    '</div>';

    html+='</div>';
    return html;
  }

  var html='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:1.2rem">';
  ALL_T.forEach(function(t){
    var off=offHits[t],def=defWeaks[t];
    var bg=off>=2?'rgba(34,197,94,.15)':off===0?'rgba(239,68,68,.08)':'var(--surface)';
    var border=def>=2?'2px solid var(--red)':off===0?'1.5px dashed var(--border)':'1px solid var(--border)';
    html+='<div style="border-radius:8px;padding:6px 4px;text-align:center;background:'+bg+';border:'+border+'">'+
      '<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px;padding:1px 5px">'+t+'</span>'+
      '<div style="display:flex;justify-content:center;gap:6px;margin-top:4px;font-size:.6rem;font-weight:600">'+
        '<span style="color:var(--green)" title="Can hit SE">⚔'+off+'</span>'+
        '<span style="color:'+(def>=2?'var(--red)':'var(--muted2)')+'" title="Threatens team">🛡'+def+'</span>'+
      '</div></div>';
  });
  html+='</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem">';
  html+='<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--green);margin-bottom:.4rem">⚔️ STRONG ('+strong.length+')</div>';
  html+=strong.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+strong.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--muted)">—</span>';
  html+='</div>';
  html+='<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--red);margin-bottom:.4rem">❌ NO COVERAGE ('+uncov.length+')</div>';
  html+=uncov.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+uncov.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--green)">Full coverage! ✓</span>';
  html+='</div>';
  html+='<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--red);margin-bottom:.4rem">⚠️ WEAK TO ('+danger.length+')</div>';
  html+=danger.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+danger.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+' ×'+defWeaks[t]+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--green)">Solid! ✓</span>';
  html+='</div></div>';
  html+='<div style="margin-top:.6rem;font-size:.6rem;color:var(--muted);display:flex;gap:1rem"><span>⚔ = team members that can hit SE</span><span>🛡 = team members threatened by this type</span><span style="color:var(--green)">Green = strong coverage</span><span style="color:var(--red)">Red border = dangerous</span></div>';
  return html;
}

// #SECTION: BATTLE LOG
// ═══════════════════════════════════════
// BATTLE LOG
// Record wins/losses/draws and calculate team records.
// ═══════════════════════════════════════

var allBattles=[];
async function loadBattles(){if(!tk)return;try{allBattles=await q('battle_log',{order:'battle_date.desc',limit:'200'},true)}catch(e){}}
async function logBattle(teamId,result,notes){
  try{await ins('battle_log',{user_id:usr.id,team_id:teamId,result:result,opponent_notes:notes||null},true);
  toast(result==='win'?'🏆 Victory logged!':result==='loss'?'💀 Loss logged':'📊 Draw logged');
  await loadBattles();renderTeams()}catch(e){toast(e.message,'err')}
}
async function delBattle(bid){try{await rm('battle_log',{'id':'eq.'+bid},true);toast('Removed');await loadBattles();renderTeams()}catch(e){toast(e.message,'err')}}
function getTeamRecord(teamId){var w=0,l=0,d=0;allBattles.forEach(function(b){if(b.team_id===teamId){if(b.result==='win')w++;else if(b.result==='loss')l++;else d++}});return{w:w,l:l,d:d,total:w+l+d,rate:w+l+d>0?Math.round(w/(w+l+d)*100):0}}

// #SECTION: SHOWDOWN EXPORT
// ───────────────────────────────────────
// SHOWDOWN EXPORT
// Build a Showdown-friendly plaintext export.
// ───────────────────────────────────────

function exportShowdown(id){
  var b=allBuilds.find(function(x){return x.id===id});if(!b)return;
  var lines=[];
  var itemStr=b.item_name?' @ '+b.item_name:'';
  // Build a Showdown-friendly plaintext export from the saved build fields.
  lines.push((b.pokemon_name||'Unknown')+itemStr);
  if(b.ability)lines.push('Ability: '+b.ability);
  if(b.nature_name)lines.push(b.nature_name+' Nature');
  // EVs (map SP to EVs — SP×8 is a rough approximation)
  var evs=[];
  if(b.hp_sp)evs.push(b.hp_sp*8+' HP');if(b.atk_sp)evs.push(b.atk_sp*8+' Atk');
  if(b.def_sp)evs.push(b.def_sp*8+' Def');if(b.spa_sp)evs.push(b.spa_sp*8+' SpA');
  if(b.spd_sp)evs.push(b.spd_sp*8+' SpD');if(b.spe_sp)evs.push(b.spe_sp*8+' Spe');
  if(evs.length)lines.push('EVs: '+evs.join(' / '));
  if(b.move_1)lines.push('- '+b.move_1);if(b.move_2)lines.push('- '+b.move_2);
  if(b.move_3)lines.push('- '+b.move_3);if(b.move_4)lines.push('- '+b.move_4);
  var text=lines.join('\n');
  // Show in modal for easy copy (clipboard API blocked in sandbox)
  var mod=document.getElementById('confirmMod');
  document.getElementById('cmEmoji').textContent='📤';
  document.getElementById('cmTitle').textContent='Showdown Export';
  document.getElementById('cmMsg').innerHTML='<textarea style="width:100%;min-height:140px;padding:.6rem;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:monospace;font-size:.82rem;resize:vertical;margin-top:.5rem" onclick="this.select()" readonly>'+text.replace(/</g,'&lt;')+'</textarea><div style="font-size:.72rem;color:var(--muted);margin-top:.4rem">Click the text → Ctrl+C / Cmd+C to copy</div>';
  document.getElementById('cmBtn').textContent='Done';
  document.getElementById('cmBtn').onclick=closeCm;
  document.getElementById('cmBtn').className='btn btn-ghost';
  mod.classList.add('open');
}

// ═══════════════════════════════════════
// LOADUSER BOOTSTRAP OVERRIDE
// Expand the signed-in bootstrap so all dashboard,
// profile, team, and battle data loads together.
// ═══════════════════════════════════════
var origLoadUser=loadUser;
loadUser=async function(){await Promise.all([loadBuilds(),loadTeamRoster(),loadUDex(),loadUItems(),loadProfile(),loadUserAch(),loadBattles()]);renderDash();renderDex();renderBuilds();renderTeams();renderItems();renderProfile();checkAchievements()};

// ═══════════════════════════════════════
// APP INITIALIZATION
// Initial data loading and startup behavior.
// ═══════════════════════════════════════
restoreSession();updAuth();loadPkmn();loadItems();loadNatures();loadAchievements();if(usr){loadUser()}else{maybeShowInitialAuthPrompt()}

// ═══════════════════════════════════════
// PWA / SERVICE WORKER
// Register service worker for installable app behavior.
// ═══════════════════════════════════════
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(function(){console.log('SW registered')}).catch(function(e){console.log('SW failed:',e)})}