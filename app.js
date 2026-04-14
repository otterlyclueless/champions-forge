// #SECTION: APP CONFIG & GLOBAL STATE
// ═══════════════════════════════════════
// APP CONFIG & GLOBAL STATE
// Supabase config, auth state, global app data,
// filters, and shared runtime variables.
// ═══════════════════════════════════════

var API='https://hrxqhhjkhhlpafhfarbl.supabase.co',ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeHFoaGpraGhscGFmaGZhcmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDAzNjYsImV4cCI6MjA5MTY3NjM2Nn0.AALRUAOd3WVj1vmu42RvDV-RGHCpa8ymplkXsx_NSW0';
var tk=null,usr=null,allPkmn=[],allBuilds=[],allTeams=[],uDex={},uShinyDex={},activeType=null,activeForm=null,showShiny=false,obtFilter='all',shinyCards={};

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
function toast(m,t){var e=document.createElement('div');e.className='toast toast-'+(t||'ok');e.textContent=m;document.getElementById('toasts').appendChild(e);setTimeout(function(){e.remove()},3500)}
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
    if(tk&&usr){localStorage.setItem('champions_session',JSON.stringify({tk:tk,usr:usr}))}
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
    if(!s||!s.tk||!s.usr)return false;
    tk=s.tk;usr=s.usr;
    return true;
  }catch(e){
    localStorage.removeItem('champions_session');
    return false;
  }
}
async function q(t,p,a){var u=new URL(API+'/rest/v1/'+t);if(p)Object.entries(p).forEach(function(e){u.searchParams.set(e[0],e[1])});var r=await fetch(u.toString(),{headers:h(a)});if(!r.ok)throw new Error(t+': '+r.status);return r.json()}
async function ins(t,b,a){var r=await fetch(API+'/rest/v1/'+t,{method:'POST',headers:Object.assign(h(a),{'Prefer':'return=representation'}),body:JSON.stringify(b)});if(!r.ok){var e=await r.json().catch(function(){return{}});throw new Error(e.message||r.status)}return r.json()}
async function rm(t,m,a){var u=new URL(API+'/rest/v1/'+t);Object.entries(m).forEach(function(e){u.searchParams.set(e[0],e[1])});var r=await fetch(u.toString(),{method:'DELETE',headers:h(a)});if(!r.ok)throw new Error(r.status)}

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
document.querySelectorAll('.sb-item').forEach(function(i){i.addEventListener('click',function(){document.querySelectorAll('.sb-item').forEach(function(n){n.classList.remove('active')});i.classList.add('active');document.querySelectorAll('.page').forEach(function(p){p.classList.remove('show')});document.getElementById('pg-'+i.dataset.p).classList.add('show')})});

// #SECTION: AUTH
// ═══════════════════════════════════════
// AUTH
// Login, logout, and auth UI state.
// ═══════════════════════════════════════


async function login(){var e=document.getElementById('eIn').value,p=document.getElementById('pIn').value;if(!e||!p)return;try{var r=await fetch(API+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':ANON,'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p})});var d=await r.json();if(!r.ok)throw new Error(d.error_description||d.msg||'Failed');tk=d.access_token;usr=d.user;saveSession();updAuth();loadUser();toast('Welcome back!')}catch(x){toast(x.message,'err')}}
function logout(){tk=null;usr=null;allBuilds=[];allTeams=[];uDex={};uShinyDex={};uItems={};saveSession();updAuth();renderDash();renderDex();renderItems();renderBuilds();renderTeams();renderProfile();toast('Signed out')}
function updAuth(){var el=document.getElementById('authEl');if(usr){el.innerHTML='<div class="user-p"><div class="user-av">⚡</div><span style="overflow:hidden;text-overflow:ellipsis;flex:1;font-weight:500">'+usr.email+'</span></div><button class="ab ab-ghost" onclick="logout()" style="margin-top:3px">Sign Out</button>'}else{el.innerHTML='<div class="auth-c"><input type="email" id="eIn" placeholder="Email"></div><div class="auth-c" style="margin-top:3px"><input type="password" id="pIn" placeholder="Password"><button class="ab ab-red" onclick="login()">Go</button></div>'}}

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
  if(!usr){rb.innerHTML='<div class="card" style="padding:1.5rem;text-align:center;max-width:400px"><div style="margin-bottom:.5rem"><img src="icons/logo.png" style="width:64px;height:64px;object-fit:contain"></div><h3 style="font-size:1rem;font-weight:700;margin-bottom:.3rem">Sign In to Get Started</h3><p style="font-size:.82rem;color:var(--muted);margin-bottom:1rem">Track your Pokédex, create builds, and assemble teams</p><div style="display:flex;flex-direction:column;gap:.4rem;max-width:280px;margin:0 auto"><input type="email" id="dashEmail" placeholder="Email" style="padding:.5rem .7rem;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit;font-size:.85rem"><input type="password" id="dashPass" placeholder="Password" style="padding:.5rem .7rem;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit;font-size:.85rem"><button class="btn btn-red" style="width:100%;justify-content:center" onclick="var e=document.getElementById(\'dashEmail\').value,p=document.getElementById(\'dashPass\').value;if(e&&p){document.getElementById(\'eIn\')&&(document.getElementById(\'eIn\').value=e);document.getElementById(\'pIn\')&&(document.getElementById(\'pIn\').value=p);login()}">Sign In</button></div></div>';return}
  if(!allBuilds.length){rb.innerHTML='<div style="color:var(--muted);font-size:.85rem">No builds yet</div>';return}
  rb.innerHTML=allBuilds.slice(0,5).map(function(b){
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
    var r=await fetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,pokemon_id:pid,obtained:uDex[pid]||false,shiny_obtained:newVal})});
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
    var r=await fetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,pokemon_id:pid,obtained:true})});
    if(!r.ok)throw new Error((await r.json().catch(function(){return{}})).message||r.status);
    uDex[pid]=true;toast('Obtained!')
  }renderDex();renderDash()}catch(e){toast(e.message,'err')}}

function grad(p){var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;return t2?'linear-gradient(135deg,'+t1.m+'55,'+t2.m+'55)':'linear-gradient(135deg,'+t1.l+'80,'+t1.m+'40)'}

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
  var html='<div class="panel-art" style="background:'+gd+'"><div class="wm">'+pb(200)+'</div><button class="p-close" onclick="closeDet()">✕</button><span class="p-dex">#'+String(p.dex_number).padStart(4,'0')+'</span>'+(p.image_url?'<img id="dImg" src="'+p.image_url+'" alt="'+p.name+'">':'')+(hasS?'<div class="sw-bar"><button class="sw-on" id="swN" onclick="dSwap(false,\''+p.id+'\')">Standard</button><button class="sw-off" id="swS" onclick="dSwap(true,\''+p.id+'\')">✦ Shiny</button></div>':'')+'</div>';
  html+='<div class="p-header"><h2>'+p.name+'</h2><div class="p-meta"><span class="type-pill" style="background:'+t1.m+'">'+p.type_1+'</span>'+(p.type_2?'<span class="type-pill" style="background:'+(TC[p.type_2]||TC.Normal).m+'">'+p.type_2+'</span>':'')+(p.form&&p.form!=='Base'?'<span class="form-pill '+(p.form==='Mega'?'form-mega':'form-regional')+'">'+p.form+'</span>':'')+'</div>'+(usr?'<button class="obt-tog '+(obt?'on':'off')+'" onclick="togObt(event,\''+p.id+'\');openDet(\''+p.id+'\')"><div class="obt-box '+(obt?'on':'off')+'">'+(obt?'✓':'')+'</div>'+(obt?'Obtained':'Not Obtained')+'</button>':'')+'</div>';
  html+='<button class="sec-tog" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\'"><div class="sl"><span>⚡</span><span>Type Effectiveness</span></div><span>▾</span></button><div class="sec-body">'+mH+'</div>';
  document.getElementById('detInner').innerHTML=html;
  document.getElementById('detP').classList.add('open')
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
    var r=await fetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,item_id:iid,obtained:true})});
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

// #SECTION: BUILDS
// ═══════════════════════════════════════
// BUILDS
// Build list, detail, editor, stat allocation,
// save/update/delete, favourites, duplication, export.
// ═══════════════════════════════════════

var buildView='list',editBuildId=null,detailBuildId=null,spV={hp:0,atk:0,def:0,spa:0,spd:0,spe:0},selPkmnId='',SP_MAX=66;
var statCols={hp:'#ef4444',atk:'#f08030',def:'#f7d02c',spa:'#6390f0',spd:'#7ac74c',spe:'#f95587'};
var statNames={hp:'HP',atk:'ATTACK',def:'DEFENSE',spa:'SP. ATK',spd:'SP. DEF',spe:'SPEED'};

async function upd(t,m,b,a){var u=new URL(API+'/rest/v1/'+t);Object.entries(m).forEach(function(e){u.searchParams.set(e[0],e[1])});var r=await fetch(u.toString(),{method:'PATCH',headers:Object.assign(h(a),{'Prefer':'return=representation'}),body:JSON.stringify(b)});if(!r.ok){var e=await r.json().catch(function(){return{}});throw new Error(e.message||r.status)}return r.json()}

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
  if(id){var b=allBuilds.find(function(x){return x.id===id});if(b){selPkmnId='';var pk=allPkmn.find(function(p){return p.name===b.pokemon_name&&p.dex_number===b.dex_number});if(pk)selPkmnId=pk.id;spV={hp:b.hp_sp||0,atk:b.atk_sp||0,def:b.def_sp||0,spa:b.spa_sp||0,spd:b.spd_sp||0,spe:b.spe_sp||0}}}
  else{selPkmnId='';spV={hp:0,atk:0,def:0,spa:0,spd:0,spe:0}}
  renderBuilds()
}

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

function renderBuildEditor(c){
  var b=editBuildId?allBuilds.find(function(x){return x.id===editBuildId}):null;
  var total=Object.values(spV).reduce(function(a,v){return a+v},0);
  var remain=SP_MAX-total;
  var hdr='<div class="ph"><div class="ph-top"><div><div class="ph-title" style="cursor:pointer" onclick="showBuildList()">← '+(b?'Edit Build':'New Build')+'</div><div class="ph-sub">Configure your Pokémon\'s competitive stats and moves.</div></div><button class="btn btn-red" onclick="saveBuild()">💾 Save Build</button></div></div>';
  // Pokemon picker
  var isEdShiny=b&&b.is_shiny;
  var pkSearch='<label class="ed-label">Pokémon</label><input class="ed-input" id="pkSrch" placeholder="Search Pokémon..." oninput="filterPkPicker()"><div style="display:flex;gap:3px;flex-wrap:wrap;margin:.4rem 0"><span class="flabel">Type</span><select class="ed-select" id="pkTypeF" onchange="filterPkPicker()" style="width:auto;padding:2px 6px;font-size:.7rem"><option value="">All Types</option>'+Object.keys(TC).sort().map(function(t){return'<option value="'+t+'">'+t+'</option>'}).join('')+'</select><span class="flabel" style="margin-left:.3rem">Form</span><select class="ed-select" id="pkFormF" onchange="filterPkPicker()" style="width:auto;padding:2px 6px;font-size:.7rem"><option value="">All Forms</option><option>Base</option><option>Mega</option><option>Regional</option></select></div>';
  var pkGrid='<div class="pk-picker" id="pkPicker">'+allPkmn.slice(0,100).map(function(p){var sel=p.id===selPkmnId?'selected':'';var pImg=isEdShiny&&p.shiny_url?p.shiny_url:(p.image_url||'');return'<div class="pk-pick '+sel+'" onclick="pickPk(\''+p.id+'\')"><img src="'+pImg+'" onerror="this.style.opacity=\'0.2\'"><span>'+p.name+'</span></div>'}).join('')+'</div>';
  // Stat sliders
  var STAT_CAP=32;var sliders=Object.keys(spV).map(function(s){return'<div class="sp-row"><span class="sp-name">'+statNames[s]+'</span><input type="range" class="sp-slider" min="0" max="'+STAT_CAP+'" value="'+spV[s]+'" oninput="setSp(\''+s+'\',this.value)" style="accent-color:'+statCols[s]+'"><button class="sp-pm" onclick="adjSp(\''+s+'\',-1)">−</button><input class="sp-val" id="spv_'+s+'" type="number" min="0" max="32" value="'+spV[s]+'" onchange="setSp(\''+s+'\',this.value)"><button class="sp-pm" onclick="adjSp(\''+s+'\',1)">+</button></div>'}).join('');
  c.innerHTML=hdr+'<div class="editor"><div class="ed-grid"><div>'+
    '<div class="ed-card"><h3>Pokémon & Info</h3>'+pkSearch+pkGrid+
    '<label class="ed-label">Build Name</label><input class="ed-input" id="edName" value="'+(b?b.build_name:'')+'" placeholder="e.g. Sweeper Dragonite">'+
    '<div class="ed-row"><div><label class="ed-label">Format</label><select class="ed-select" id="edFmt"><option value="Singles"'+(b&&b.battle_format==='Singles'?' selected':'')+'>Singles</option><option value="Doubles"'+(b&&b.battle_format==='Doubles'?' selected':'')+'>Doubles</option></select></div><div><label class="ed-label">Archetype</label><input class="ed-input" id="edArch" list="archList" value="'+(b?b.archetype||'':'')+'" placeholder="Select or type custom..."><datalist id="archList"><option value="Setup Sweeper"><option value="Sweeper"><option value="Wallbreaker"><option value="Wall Breaker"><option value="Tank"><option value="Support"><option value="Pivot"><option value="Utility"><option value="Disruption"><option value="Stall"><option value="Glass Cannon"><option value="Special Breaker"><option value="Physical Breaker"><option value="Bulky Attacker"><option value="Lead"><option value="Revenge Killer"></datalist></div></div>'+
    '<label class="ed-label" style="margin-top:.6rem">Shiny Variant</label><div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem"><button type="button" class="fpill'+(b&&b.is_shiny?' active':'')+'" id="edShiny" onclick="var el=this;el.classList.toggle(\'active\')" style="cursor:pointer">✦ Using Shiny</button><span style="font-size:.72rem;color:var(--muted)">Toggle if this build uses the shiny artwork</span></div>'+
    '</div></div><div>'+
    '<div class="ed-card"><h3>Stat Allocation</h3><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem"><span style="font-size:.78rem;color:var(--muted)">Distribute up to '+SP_MAX+' points</span><div><span style="font-size:.65rem;color:var(--muted)">REMAINING</span><div class="sp-remain'+(remain<0?' sp-over':'')+'" id="spRemain">'+remain+'</div></div></div>'+sliders+'</div>'+
    '<div class="ed-card" style="margin-top:1rem"><h3>Moves & Ability</h3>'+
    '<div class="ed-row"><div><label class="ed-label">Ability</label><input class="ed-input" id="edAbi" value="'+(b?b.ability||'':'')+'" placeholder="e.g. Multiscale"></div><div><label class="ed-label">Item</label><select class="ed-select" id="edItem"><option value="">— None —</option>'+allItems.map(function(i){var sel=b&&b.item_name===i.name?' selected':'';return'<option value="'+i.id+'"'+sel+'>'+i.name+'</option>'}).join('')+'</select></div></div>'+
    '<div class="ed-row"><div><label class="ed-label">Nature</label><select class="ed-select" id="edNat"><option value="">— None —</option>'+allNatures.map(function(n){var sl={hp:'HP',attack:'Atk',defense:'Def',sp_attack:'SpA',sp_defense:'SpD',speed:'Spe'};var hint=n.increased_stat?' (+'+sl[n.increased_stat]+' -'+sl[n.decreased_stat]+')':' (Neutral)';var sel=b&&b.nature_name===n.name?' selected':'';return'<option value="'+n.id+'"'+sel+'>'+n.name+hint+'</option>'}).join('')+'</select></div></div>'+
    '<div class="ed-row"><div><label class="ed-label">Move 1</label><input class="ed-input" id="edM1" value="'+(b?b.move_1||'':'')+'"></div><div><label class="ed-label">Move 2</label><input class="ed-input" id="edM2" value="'+(b?b.move_2||'':'')+'"></div></div>'+
    '<div class="ed-row"><div><label class="ed-label">Move 3</label><input class="ed-input" id="edM3" value="'+(b?b.move_3||'':'')+'"></div><div><label class="ed-label">Move 4</label><input class="ed-input" id="edM4" value="'+(b?b.move_4||'':'')+'"></div></div>'+
    '</div></div></div>'+
    '<div class="ed-card" style="margin-top:1rem"><h3>Strategy</h3><div class="ed-row"><div><label class="ed-label">Win Condition</label><textarea class="ed-textarea" id="edWin">'+(b?b.win_condition||'':'')+'</textarea></div></div><div class="ed-row"><div><label class="ed-label">Strengths</label><textarea class="ed-textarea" id="edStr">'+(b?b.strengths||'':'')+'</textarea></div><div><label class="ed-label">Weaknesses</label><textarea class="ed-textarea" id="edWeak">'+(b?b.weaknesses||'':'')+'</textarea></div></div></div>'+
    '</div>'
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

function renderBuildDetail(c){
  var b=allBuilds.find(function(x){return x.id===detailBuildId});
  if(!b){showBuildList();return}
  var bImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
  var t1=TC[b.type_1]||TC.Normal;var t2=b.type_2?TC[b.type_2]:null;
  var grad=t2?'linear-gradient(135deg,'+t1.m+'88,'+t2.m+'88)':'linear-gradient(135deg,'+t1.m+'66,'+t1.d+'88)';
  var max=b.max_sp||66;var SMAX=32;
  var statBars=['hp','atk','def','spa','spd','spe'].map(function(s){var v=b[s+'_sp']||0;var pct=Math.min(v/SMAX*100,100);return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:55px;font-size:.72rem;font-weight:600;color:var(--muted);text-align:right">'+statNames[s]+'</span><div style="flex:1;height:8px;background:var(--surface2);border-radius:4px;overflow:hidden"><div style="width:'+pct+'%;height:100%;border-radius:4px;background:'+statCols[s]+'"></div></div><span style="width:28px;font-size:.82rem;font-weight:700;text-align:right">'+v+'</span></div>'}).join('');
  var sL={hp:'HP',attack:'Attack',defense:'Defense',sp_attack:'Sp.Atk',sp_defense:'Sp.Def',speed:'Speed'};
  var natDetail=b.nature_name||'—';if(b.increased_stat)natDetail+=' <span style="color:var(--green);font-size:.72rem">▲'+sL[b.increased_stat]+'</span> <span style="color:var(--red);font-size:.72rem">▼'+sL[b.decreased_stat]+'</span>';

  c.innerHTML='<div class="ph"><div class="ph-top"><div><div class="ph-title" style="cursor:pointer" onclick="showBuildList()">← '+(b.pokemon_name||'?')+' <span style="font-weight:500;color:var(--muted);font-size:.9rem">· '+(b.battle_format||'')+'</span></div><div class="ph-sub">'+b.build_name+(b.is_shiny?' <span style="color:var(--purple)">✦ Shiny Variant</span>':'')+'</div></div><div class="action-bar" style="display:flex;gap:.4rem;flex-wrap:wrap"><button class="btn btn-ghost" onclick="togFav(null,\''+b.id+'\')">'+(b.is_favourite?'⭐':'☆')+'</button><button class="btn btn-ghost" onclick="dupBuild(\''+b.id+'\')">🔄</button><button class="btn btn-ghost" onclick="exportShowdown(\''+b.id+'\')">📤</button><button class="btn btn-ghost" onclick="showBuildEditor(\''+b.id+'\')">✏️</button><button class="btn btn-ghost" style="color:var(--red)" onclick="confirmDelBuild(\''+b.id+'\',\''+b.build_name.replace(/'/g,"\\'")+'\')">🗑</button></div></div></div>'+
  '<div class="detail-grid" style="padding:1.2rem 2rem;display:grid;grid-template-columns:1fr 1fr;gap:1.2rem">'+
    // Left column: Art + Stats + Matchups
    '<div>'+
      '<div class="card" style="text-align:center;padding:2rem 1.5rem;margin-bottom:1rem;background:'+grad+';position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:-10px;right:-10px;font-size:7rem;font-weight:900;opacity:.07;pointer-events:none;line-height:1;font-family:monospace">#'+String(b.dex_number||0).padStart(4,'0')+'</div>'+
        '<div style="opacity:.04;position:absolute;bottom:-20px;left:-20px;pointer-events:none">'+pb(180)+'</div>'+
        '<img src="'+bImg+'" style="width:180px;height:180px;object-fit:contain;filter:drop-shadow(0 6px 16px rgba(0,0,0,.3));position:relative;z-index:1" onerror="this.style.opacity=\'0.2\'">'+
        '<div style="margin-top:.8rem;display:flex;gap:5px;justify-content:center;position:relative;z-index:1"><span class="type-pill" style="background:'+t1.m+';font-size:11px;padding:3px 10px">'+b.type_1+'</span>'+(b.type_2?'<span class="type-pill" style="background:'+(TC[b.type_2]||TC.Normal).m+';font-size:11px;padding:3px 10px">'+b.type_2+'</span>':'')+'</div>'+
      '</div>'+
      '<div class="card" style="margin-bottom:1rem"><h3 style="font-size:.9rem;font-weight:700;margin-bottom:.8rem">Stat Points <span style="float:right;font-size:.78rem;color:var(--muted);font-weight:500">'+(b.total_sp||0)+' / '+max+' SP</span></h3>'+statBars+'</div>'+
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

// Keep the editor picker lightweight by combining search/form filters and only rendering the first 100 matches.
function filterPkPicker(){var s=document.getElementById('pkSrch').value.toLowerCase();var tf=document.getElementById('pkTypeF')?document.getElementById('pkTypeF').value:'';var ff=document.getElementById('pkFormF')?document.getElementById('pkFormF').value:'';var isShinyEd=document.getElementById('edShiny')&&document.getElementById('edShiny').classList.contains('active');var f=allPkmn.filter(function(p){if(s&&p.name.toLowerCase().indexOf(s)===-1&&String(p.dex_number).indexOf(s)===-1)return false;if(tf&&p.type_1!==tf&&p.type_2!==tf)return false;if(ff&&p.form!==ff)return false;return true}).slice(0,100);document.getElementById('pkPicker').innerHTML=f.map(function(p){var sel=p.id===selPkmnId?'selected':'';var pImg=isShinyEd&&p.shiny_url?p.shiny_url:(p.image_url||'');return'<div class="pk-pick '+sel+'" onclick="pickPk(\''+p.id+'\')"><img src="'+pImg+'" onerror="this.style.opacity=\'0.2\'"><span>'+p.name+'</span></div>'}).join('')}
function pickPk(id){selPkmnId=id;filterPkPicker()}
// Clamp per-stat values and enforce the shared SP budget before syncing the slider + number input.
function setSp(s,v){v=parseInt(v)||0;if(v<0)v=0;if(v>32)v=32;var others=Object.keys(spV).filter(function(k){return k!==s}).reduce(function(a,k){return a+spV[k]},0);if(v+others>SP_MAX)v=SP_MAX-others;if(v<0)v=0;if(v>32)v=32;spV[s]=v;var inp=document.getElementById('spv_'+s);if(inp)inp.value=v;var sl=document.querySelector('input[type="range"][oninput*="\''+s+'\'"]');if(sl)sl.value=v;var total=Object.values(spV).reduce(function(a,x){return a+x},0);var rem=SP_MAX-total;var el=document.getElementById('spRemain');el.textContent=rem;el.className='sp-remain'+(rem<0?' sp-over':'')}
function adjSp(s,d){setSp(s,spV[s]+d);var sl=document.querySelector('input[oninput*="'+s+'"]');if(sl)sl.value=spV[s]}

async function saveBuild(){
  if(!selPkmnId){toast('Select a Pokémon','err');return}
  var name=document.getElementById('edName').value.trim();if(!name){toast('Enter a build name','err');return}
  var isShiny=document.getElementById('edShiny')&&document.getElementById('edShiny').classList.contains('active');
  // Mirror the editor fields into the flat Supabase row shape used by the `builds` table.
  var body={user_id:usr.id,pokemon_id:selPkmnId,name:name,battle_format:document.getElementById('edFmt').value,archetype:document.getElementById('edArch').value||null,item_id:document.getElementById('edItem').value||null,nature_id:document.getElementById('edNat').value||null,ability:document.getElementById('edAbi').value||null,move_1:document.getElementById('edM1').value||null,move_2:document.getElementById('edM2').value||null,move_3:document.getElementById('edM3').value||null,move_4:document.getElementById('edM4').value||null,hp_sp:spV.hp,atk_sp:spV.atk,def_sp:spV.def,spa_sp:spV.spa,spd_sp:spV.spd,spe_sp:spV.spe,is_shiny:isShiny,win_condition:document.getElementById('edWin').value||null,strengths:document.getElementById('edStr').value||null,weaknesses:document.getElementById('edWeak').value||null,status:'Testing'};
  try{if(editBuildId){await upd('builds',{'id':'eq.'+editBuildId},body,true);toast('Build updated!')}else{await ins('builds',body,true);toast('Build created!')}await loadBuilds();showBuildList()}catch(e){toast(e.message,'err')}
}
function confirmDelBuild(id,name){document.getElementById('cmEmoji').textContent='⚔️';document.getElementById('cmTitle').textContent='Delete Build?';document.getElementById('cmMsg').textContent='Delete "'+name+'"? This cannot be undone.';document.getElementById('cmBtn').onclick=function(){delBuild(id)};document.getElementById('confirmMod').classList.add('open')}
async function delBuild(id){try{await rm('builds',{'id':'eq.'+id},true);closeCm();toast('Build deleted');await loadBuilds();renderBuilds();renderDash()}catch(e){toast(e.message,'err')}}
function closeCm(){document.getElementById('confirmMod').classList.remove('open')}

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
    return'<div class="card" style="padding:1rem;cursor:pointer" onclick="showBuildDetail(\''+m.build_id+'\')">'+
      '<div style="display:flex;gap:1rem;align-items:flex-start">'+
        '<div style="text-align:center"><img src="'+mImg+'" style="width:80px;height:80px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.15))" onerror="this.style.opacity=\'0.2\'"><div style="margin-top:.3rem;display:flex;gap:3px;justify-content:center"><span class="type-pill" style="background:'+t1.m+'">'+(m.type_1||b.type_1||'?')+'</span>'+(m.type_2||b.type_2?'<span class="type-pill" style="background:'+(TC[m.type_2||b.type_2]||TC.Normal).m+'">'+(m.type_2||b.type_2)+'</span>':'')+'</div></div>'+
        '<div style="flex:1"><div style="font-weight:700;font-size:.92rem">'+(m.pokemon_name||'?')+(b.is_shiny?' <span style="color:var(--purple);font-size:.7rem">✦</span>':'')+'</div><div style="font-size:.78rem;color:var(--muted);margin-bottom:.4rem">'+(m.build_name||b.build_name||'')+'</div>'+
          '<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.5rem">'+
            (m.archetype||b.archetype?'<span class="btag btag-arch">'+(m.archetype||b.archetype)+'</span>':'')+
            (b.item_name||m.item_name?'<span class="btag btag-item">'+(b.item_name||m.item_name)+'</span>':'')+
            (b.nature_name?'<span class="btag btag-nat">'+b.nature_name+'</span>':'')+
            (b.ability?'<span class="btag btag-abi">'+b.ability+'</span>':'')+
          '</div>'+
          '<div style="display:flex;gap:4px;margin-bottom:.5rem">'+[b.move_1||m.move_1,b.move_2||m.move_2,b.move_3||m.move_3,b.move_4||m.move_4].filter(Boolean).map(function(mv){return'<span class="bmove">'+mv+'</span>'}).join('')+'</div>'+
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
function confirmDelTeam(id,name){document.getElementById('cmEmoji').textContent='🏆';document.getElementById('cmTitle').textContent='Delete Team?';document.getElementById('cmMsg').textContent='Delete "'+name+'"? This cannot be undone.';document.getElementById('cmBtn').onclick=function(){delTeam(id)};document.getElementById('confirmMod').classList.add('open')}
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
  try{await upd('user_profiles',{'user_id':'eq.'+usr.id},{avatar_url:dataUrl},true);
  userProfile.avatar_url=dataUrl;toast('Avatar updated!');renderProfile()}catch(e){toast(e.message,'err')}
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
  if(!usr){c.innerHTML='<div class="empty"><div class="em">🔒</div>Sign in to view your profile</div>';return}
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
  c.innerHTML=card+achHtml+actHtml
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
  // Count both offensive pressure and shared defensive weaknesses across the full 18-type chart.
  members.forEach(function(m){var t1=m.type_1,t2=m.type_2;
    ALL_T.forEach(function(dt){var mult=TCHART[t1]&&TCHART[t1][dt]!==undefined?TCHART[t1][dt]:1;if(mult>=2)offHits[dt]++;if(t2){var m2=TCHART[t2]&&TCHART[t2][dt]!==undefined?TCHART[t2][dt]:1;if(m2>=2)offHits[dt]++}});
    ALL_T.forEach(function(at){var mult=TCHART[at]&&TCHART[at][t1]!==undefined?TCHART[at][t1]:1;if(t2)mult*=(TCHART[at]&&TCHART[at][t2]!==undefined?TCHART[at][t2]:1);if(mult>=2)defWeaks[at]++})
  });
  // Full 18-type grid
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
      '</div></div>'
  });
  html+='</div>';
  // Summary
  var uncov=ALL_T.filter(function(t){return offHits[t]===0});
  var danger=ALL_T.filter(function(t){return defWeaks[t]>=2}).sort(function(a,b){return defWeaks[b]-defWeaks[a]});
  var strong=ALL_T.filter(function(t){return offHits[t]>=3}).sort(function(a,b){return offHits[b]-offHits[a]});
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem">';
  // Strong
  html+='<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--green);margin-bottom:.4rem">⚔️ STRONG ('+strong.length+')</div>';
  html+=strong.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+strong.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--muted)">—</span>';
  html+='</div>';
  // Uncovered
  html+='<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--red);margin-bottom:.4rem">❌ NO COVERAGE ('+uncov.length+')</div>';
  html+=uncov.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+uncov.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--green)">Full coverage! ✓</span>';
  html+='</div>';
  // Dangerous
  html+='<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--red);margin-bottom:.4rem">⚠️ WEAK TO ('+danger.length+')</div>';
  html+=danger.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+danger.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+' ×'+defWeaks[t]+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--green)">Solid! ✓</span>';
  html+='</div></div>';
  // Legend
  html+='<div style="margin-top:.6rem;font-size:.6rem;color:var(--muted);display:flex;gap:1rem"><span>⚔ = team members that can hit SE</span><span>🛡 = team members threatened by this type</span><span style="color:var(--green)">Green = strong coverage</span><span style="color:var(--red)">Red border = dangerous</span></div>';
  return html
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
updAuth();
if(restoreSession()){updAuth();loadUser()}
loadPkmn();loadItems();loadNatures();loadAchievements();

// ═══════════════════════════════════════
// PWA / SERVICE WORKER
// Register service worker for installable app behavior.
// ═══════════════════════════════════════
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(function(){console.log('SW registered')}).catch(function(e){console.log('SW failed:',e)})}
