// #SECTION: POKÉDEX
// ═══════════════════════════════════════
// POKÉDEX
// Filters, obtained/shiny toggles, card rendering,
// detail panel, and Pokédex interactions.
// ═══════════════════════════════════════

var typeDropdownOpen=false;

function renderTypeF(){
  // Build the dropdown grid of 18 types (3×6)
  var dd=document.getElementById('typeDropdown');
  if(!dd)return;
  dd.innerHTML=ALL_T.sort().map(function(t){
    var col=TC[t]?TC[t].m:'#888';
    return '<button class="dex-type-pill'+(activeType===t?' active':'')+'" style="--tc:'+col+'" onclick="togType(\''+t+'\')">'+t+'</button>';
  }).join('');
}
function renderFormF(){/* Forms are now inline in the filter strip — no separate render needed */}

function togTypeDropdown(){
  typeDropdownOpen=!typeDropdownOpen;
  var dd=document.getElementById('typeDropdown');
  var btn=document.getElementById('typeToggle');
  if(dd)dd.classList.toggle('open',typeDropdownOpen);
  if(btn){btn.classList.toggle('active',typeDropdownOpen||!!activeType);btn.textContent=activeType?activeType+' ✕':'Type ▾'}
}
function togType(t){
  activeType=activeType===t?null:t;
  var btn=document.getElementById('typeToggle');
  if(btn){btn.textContent=activeType?activeType+' ✕':'Type ▾';btn.classList.toggle('active',!!activeType)}
  document.querySelectorAll('.dex-type-pill').forEach(function(b){b.classList.toggle('active',b.textContent===activeType)});
  renderDex();
}
function togForm(f){
  activeForm=activeForm===f?null:f;
  document.querySelectorAll('[data-form]').forEach(function(b){
    var isAll=b.dataset.form==='all';
    b.classList.toggle('active',isAll?!activeForm:b.dataset.form===activeForm);
  });
  renderDex();
}
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
  // Progress bar in header
  var progEl=document.getElementById('dexProgress');
  var progFill=document.getElementById('dexProgFill');
  var progText=document.getElementById('dexProgText');
  if(usr&&progEl){
    var obtCount=Object.keys(uDex).length,totalCount=allPkmn.length||258;
    progEl.style.display='flex';
    if(progFill)progFill.style.width=(obtCount/totalCount*100)+'%';
    if(progText)progText.textContent=obtCount+' / '+totalCount+' · ✦ '+Object.keys(uShinyDex).length;
  }else if(progEl){progEl.style.display='none'}

  var s=document.getElementById('dexSearch').value.toLowerCase();
  var f=allPkmn.filter(function(p){if(s&&p.name.toLowerCase().indexOf(s)===-1&&String(p.dex_number).indexOf(s)===-1)return false;if(activeType&&p.type_1!==activeType&&p.type_2!==activeType)return false;if(activeForm&&p.form!==activeForm)return false;if(usr&&obtFilter==='yes'&&!uDex[p.id])return false;if(usr&&obtFilter==='no'&&uDex[p.id])return false;return true});
  var g=document.getElementById('dexGrid');
  if(!f.length){g.innerHTML='<div class="empty"><div class="em">🔍</div>No Pokémon match</div>';return}

  // 3-column gallery mode
  g.innerHTML=f.map(function(p){
    var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;
    var obt=!!uDex[p.id];var isU=usr&&!obt;
    var hasS=!!p.shiny_url;var shObt=!!uShinyDex[p.id];
    var sS=(showShiny||(shinyCards[p.id])||shObt)&&hasS;
    var img=sS?p.shiny_url:(p.image_url||'');
    var cls='pb-card'+(isU?' unobt':'')+(shObt?' shiny-holo':'');

    return '<div class="'+cls+'" onclick="openDet(\''+p.id+'\')">'+
      (usr&&obt?'<div class="pb-card-obt on">✓</div>':'')+
      '<div class="pb-card-art" style="background:'+grad(p)+'">'+
        (img?'<img src="'+img+'" onerror="this.style.opacity=\'0.2\'" loading="lazy">':'')+
      '</div>'+
      '<div class="pb-card-name">'+p.name+'</div>'+
      '<div class="pb-card-dex">#'+String(p.dex_number).padStart(4,'0')+
        (p.form==='Mega'?' · <span style="color:var(--purple)">MEGA</span>':'')+
        (p.form==='Regional'?' · <span style="color:var(--teal)">REGIONAL</span>':'')+
      '</div>'+
      '<div class="pb-card-types">'+
        '<span class="type-pill" style="background:'+t1.m+'">'+p.type_1+'</span>'+
        (t2?'<span class="type-pill" style="background:'+t2.m+'">'+p.type_2+'</span>':'')+
      '</div>'+
    '</div>';
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

// Drop G.2c: Ability pills — cache + async loader
var dexAblCache={};
async function loadDexAbilities(pokemonId){
  var el=document.getElementById('dexAblPills');
  if(!el)return;
  if(!dexAblCache[pokemonId]){
    try{
      var rows=await q('pokemon_abilities',{'pokemon_id':'eq.'+pokemonId,select:'slot,ability_id',order:'slot.asc'});
      dexAblCache[pokemonId]=rows.map(function(row){
        var abl=(window.allAbilities||[]).find(function(a){return a.id===row.ability_id});
        return{slot:row.slot,id:row.ability_id,name:abl?abl.name:'?'};
      });
    }catch(e){dexAblCache[pokemonId]=[];}
  }
  var opts=dexAblCache[pokemonId];
  var LABELS={'1':'Ability 1','2':'Ability 2','hidden':'Hidden'};
  var CLS={'1':'slot-1','2':'slot-2','hidden':'slot-h'};
  if(!opts.length){
    el.innerHTML='<div class="dex-abl-label">Abilities</div><div style="font-size:.75rem;color:var(--muted)">No ability data for this Pokémon yet.</div>';
    return;
  }
  el.innerHTML='<div class="dex-abl-label">Abilities</div>'+
    '<div class="dex-abl-pills">'+
    opts.map(function(opt){
      return '<div class="dex-abl-pill '+(CLS[opt.slot]||'')+'" onclick="if(typeof showAbilityDetail===\'function\')showAbilityDetail(\''+opt.id+'\')">'+
        '<span class="dex-abl-slot">'+(LABELS[opt.slot]||opt.slot)+'</span>'+
        '<span class="dex-abl-name">'+opt.name+'</span>'+
      '</div>';
    }).join('')+
    '</div>';
}

function openDet(pid){
  var p=allPkmn.find(function(x){return x.id===pid});if(!p)return;
  var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;
  var gd=t2?'linear-gradient(135deg,'+t1.m+'DD,'+t2.m+'DD)':'linear-gradient(135deg,'+t1.m+'CC,'+t1.d+'DD)';
  var obt=!!uDex[p.id];var hasS=!!p.shiny_url;
  var mH=renderMatchupHtml(p.type_1,p.type_2);
  var bsH=bsBuildSection(p);
  // Hero card — matches .bd-hero pattern
  var html='<div class="panel-art" id="panelArt" style="background:'+gd+'">'+
    '<div class="panel-art-dex">#'+String(p.dex_number).padStart(4,'0')+'</div>'+
    '<button class="p-close" onclick="closeDet()">✕</button>'+
    (p.image_url?'<img id="dImg" src="'+p.image_url+'" alt="'+p.name+'">':'')+
    '<div class="panel-art-types"><span class="type-pill" style="background:'+t1.m+'">'+p.type_1+'</span>'+(t2?'<span class="type-pill" style="background:'+t2.m+'">'+p.type_2+'</span>':'')+'</div>'+
    '<div class="bd-shiny-badge" id="dShinyBadge" style="display:none">✦ Shiny Variant</div>'+
    (hasS?'<div class="sw-bar"><button class="sw-on" id="swN" onclick="dSwap(false,\''+p.id+'\')">Standard</button><button class="sw-off" id="swS" onclick="dSwap(true,\''+p.id+'\')">✦ Shiny</button></div>':'')+
  '</div>';
  html+='<div class="p-header"><h2>'+p.name+'</h2><div class="p-meta">'+(p.form&&p.form!=='Base'?'<span class="form-pill '+(p.form==='Mega'?'form-mega':'form-regional')+'">'+p.form+'</span>':'')+'<span style="font-size:.72rem;color:var(--muted);font-weight:600">#'+String(p.dex_number).padStart(4,'0')+'</span></div>'+(usr?'<button class="obt-tog '+(obt?'on':'off')+'" onclick="togObt(event,\''+p.id+'\');openDet(\''+p.id+'\')"><div class="obt-box '+(obt?'on':'off')+'">'+(obt?'✓':'')+'</div>'+(obt?'Obtained':'Not Obtained')+'</button>':'')+'</div>';
  // Drop G.2c: Ability pills — placeholder filled asynchronously
  html+='<div class="dex-abl-section" id="dexAblPills"><div class="dex-abl-label">Abilities</div><div style="font-size:.75rem;color:var(--muted);padding:.1rem 0">Loading…</div></div>';
  if(bsH){html+='<button class="sec-tog" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\';if(b.style.display!==\'none\')bsRefresh()"><div class="sl"><span>📊</span><span>Stats & Calculator</span></div><span>▾</span></button><div class="sec-body">'+bsH+'</div>';}
  html+='<button class="sec-tog" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\'"><div class="sl"><span>⚡</span><span>Type Effectiveness</span></div><span>▾</span></button><div class="sec-body">'+mH+'</div>';
  document.getElementById('detInner').innerHTML=html;
  document.getElementById('detP').classList.add('open');
  loadDexAbilities(p.id);
  requestAnimationFrame(function(){requestAnimationFrame(function(){bsRefresh()})});
}
function closeDet(){document.getElementById('detP').classList.remove('open')}
function dSwap(s,pid){
  var p=allPkmn.find(function(x){return x.id===pid});if(!p)return;
  var img=document.getElementById('dImg');if(!img)return;
  img.src=s?p.shiny_url:p.image_url;
  document.getElementById('swN').className=s?'sw-off':'sw-on';
  document.getElementById('swS').className=s?'sw-on':'sw-off';
  // Toggle shiny holo effect on hero card
  var art=document.getElementById('panelArt');
  if(art){if(s){art.classList.add('shiny-holo')}else{art.classList.remove('shiny-holo')}}
  // Toggle shiny badge
  var badge=document.getElementById('dShinyBadge');
  if(badge){badge.style.display=s?'inline-flex':'none'}
}

// Late-bind via wrapper — renderDex/renderItems live in later-loaded modules (profile.js).
// Direct function references resolve to `undefined` at this module's load time and silently no-op.
document.getElementById('dexSearch').addEventListener('input',function(){renderDex()});
document.getElementById('itemSearch').addEventListener('input',function(){renderItems()});
