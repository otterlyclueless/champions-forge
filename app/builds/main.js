// #SECTION: BUILDS
// ═══════════════════════════════════════
// BUILDS
// Build list, detail, editor, stat allocation,
// save/update/delete, favourites, duplication, export.
// ═══════════════════════════════════════

var buildView='list',editBuildId=null,detailBuildId=null,spV={hp:0,atk:0,def:0,spa:0,spd:0,spe:0},selPkmnId='',SP_MAX=66;
// Editor state (mobile-first 2-step flow)
var editorStep='picker',pickerShinyAll=false,editorShiny=false,pickerObtainedOnly=false,pickerTypeFilter=null,pickerFormFilter=null,pickerSearchValue='';
var statCols={hp:'#ef4444',atk:'#f08030',def:'#f7d02c',spa:'#6390f0',spd:'#7ac74c',spe:'#f95587'};
var statNames={hp:'HP',atk:'ATTACK',def:'DEFENSE',spa:'SP. ATK',spd:'SP. DEF',spe:'SPEED'};

// ── Build Archetypes ──────────────────────────────────────
var BLD_ARCHETYPES=[
  {name:'Physical Sweeper',   cat:'Offense', icon:'ph-sword',                   color:'#f97316',desc:'Fast Pokémon that hits hard with physical moves. Pairs well with Swords Dance or Dragon Dance.'},
  {name:'Special Sweeper',    cat:'Offense', icon:'ph-sparkle',                 color:'#a78bfa',desc:'Fast Pokémon dealing heavy special damage. Often boosted by Nasty Plot or Calm Mind.'},
  {name:'Mixed Attacker',     cat:'Offense', icon:'ph-arrows-merge',            color:'#fb923c',desc:'Hits from both physical and special sides to beat specially or physically defensive cores.'},
  {name:'Wallbreaker',        cat:'Offense', icon:'ph-hammer',                  color:'#ef4444',desc:'Immense raw power to break through defensive cores, even at the cost of speed.'},
  {name:'Revenge Killer',     cat:'Offense', icon:'ph-crosshair',               color:'#ec4899',desc:'Outspeeds and finishes off weakened foes — often equipped with a Choice Scarf.'},
  {name:'Setup Sweeper',      cat:'Setup',   icon:'ph-trend-up',                color:'#f59e0b',desc:'Uses boosting moves (Dragon Dance, Swords Dance, Calm Mind) then sweeps the opposing team.'},
  {name:'Trick Room Abuser',  cat:'Setup',   icon:'ph-clock-counter-clockwise', color:'#7c3aed',desc:'Very slow but hits extremely hard — designed to thrive when Trick Room is active.'},
  {name:'Physical Wall',      cat:'Defense', icon:'ph-shield',                  color:'#3b82f6',desc:'High Defence and HP. Built to tank physical hits and support the team with utility moves.'},
  {name:'Special Wall',       cat:'Defense', icon:'ph-shield-star',             color:'#06b6d4',desc:'High Sp. Defence and HP. Absorbs special attacks reliably and recovers HP over time.'},
  {name:'Tank',               cat:'Defense', icon:'ph-anchor',                  color:'#64748b',desc:'Balanced bulk with offensive presence — takes hits and dishes them back without setup.'},
  {name:'Cleric',             cat:'Defense', icon:'ph-first-aid',               color:'#22c55e',desc:'Heals and cures the team via Wish, Heal Bell, Aromatherapy, or reliable recovery moves.'},
  {name:'Trick Room Setter',  cat:'Support', icon:'ph-clock-clockwise',         color:'#8b5cf6',desc:'Sets Trick Room to invert speed order and empower slow, powerful teammates.'},
  {name:'Hazard Setter',      cat:'Support', icon:'ph-warning',                 color:'#f97316',desc:'Lays Stealth Rock, Spikes, or Toxic Spikes to chip every switching opponent.'},
  {name:'Hazard Remover',     cat:'Support', icon:'ph-eraser',                  color:'#10b981',desc:'Clears entry hazards via Rapid Spin or Defog to protect the team from chip damage.'},
  {name:'Pivot',              cat:'Support', icon:'ph-arrows-left-right',       color:'#14b8a6',desc:'Gains free switches via U-turn, Volt Switch, or Flip Turn to maintain momentum.'},
  {name:'Screens Support',    cat:'Support', icon:'ph-rectangle',               color:'#60a5fa',desc:'Sets Light Screen and Reflect (or Aurora Veil) to halve incoming damage for the whole team.'},
  {name:'Weather Setter',     cat:'Support', icon:'ph-cloud',                   color:'#38bdf8',desc:'Activates sun, rain, sand, or snow to empower weather-boosted teammates and abilities.'},
  {name:'Terrain Setter',     cat:'Support', icon:'ph-map-trifold',             color:'#4ade80',desc:'Sets Electric, Grassy, Misty, or Psychic Terrain to power up terrain-reliant strategies.'},
  {name:'Support',            cat:'Support', icon:'ph-handshake',               color:'#94a3b8',desc:'Broad utility: status moves, chip damage, disruption, and generally enabling the team.'},
  {name:'Speed Control',      cat:'VGC',     icon:'ph-gauge',                   color:'#c084fc',desc:'Controls turn order via Tailwind, Trick Room, Icy Wind, or Electroweb (VGC staple).'},
  {name:'Redirection',        cat:'VGC',     icon:'ph-person-simple-run',       color:'#fb7185',desc:'Follow Me or Rage Powder to redirect attacks away from key teammates (VGC double battles).'},
  {name:'Fake Out Lead',      cat:'VGC',     icon:'ph-hand-pointing',           color:'#fbbf24',desc:'Opens with Fake Out to flinch an opponent and waste their turn in double battles.'}
];
function archColour(name){var a=BLD_ARCHETYPES.find(function(x){return x.name===name;});return a?a.color:'#94a3b8';}
var edSelArch='';

// Move-list constants for auto-suggest
var _BA_SETUP=['Swords Dance','Dragon Dance','Calm Mind','Nasty Plot','Quiver Dance','Shell Smash','Bulk Up','Coil','Growth','Tail Glow','Geomancy','Shift Gear','Work Up','Hone Claws'];
var _BA_HAZARDS=['Stealth Rock','Spikes','Toxic Spikes','Sticky Web'];
var _BA_REMOVAL=['Rapid Spin','Defog'];
var _BA_PIVOT=['U-turn','Volt Switch','Flip Turn','Parting Shot'];
var _BA_SCREENS=['Light Screen','Reflect','Aurora Veil'];
var _BA_WEATHER=['Sunny Day','Rain Dance','Sandstorm','Hail','Snowscape','Snow'];
var _BA_TERRAIN=['Electric Terrain','Grassy Terrain','Misty Terrain','Psychic Terrain'];
var _BA_TR=['Trick Room'];
var _BA_FAKEOUT=['Fake Out'];
var _BA_REDIRECT=['Follow Me','Rage Powder'];
var _BA_SPEED=['Tailwind','Icy Wind','Electroweb','Thunder Wave'];
var _BA_HEAL=['Wish','Heal Bell','Aromatherapy','Soft-Boiled','Recover','Roost','Moonlight','Morning Sun','Synthesis','Slack Off','Shore Up','Milk Drink'];

function selBldArch(val){
  edSelArch=val||'';
  var el=document.getElementById('edArch');if(el)el.value=edSelArch;
  _refreshEdArchBtn();
}
function _refreshEdArchBtn(){
  var btn=document.getElementById('edArchBtn');if(!btn)return;
  var preset=edSelArch?BLD_ARCHETYPES.find(function(a){return a.name===edSelArch;}):null;
  var isCustom=edSelArch&&!preset;
  if(preset){
    btn.className='ed-arch-btn';
    btn.innerHTML='<i class="ph-bold '+preset.icon+'" style="font-size:.9rem;color:'+preset.color+'"></i><span style="flex:1">'+preset.name+'</span><i class="ph-bold ph-caret-right"></i>';
  }else if(isCustom){
    btn.className='ed-arch-btn';
    btn.innerHTML='<i class="ph-bold ph-pencil" style="font-size:.9rem;opacity:.7"></i><span style="flex:1">'+edSelArch+'</span><i class="ph-bold ph-caret-right"></i>';
  }else{
    btn.className='ed-arch-btn empty';
    btn.innerHTML='<span style="flex:1">Select archetype…</span><i class="ph-bold ph-caret-right"></i>';
  }
}
function _edArchBtnHtml(){
  var preset=edSelArch?BLD_ARCHETYPES.find(function(a){return a.name===edSelArch;}):null;
  var isCustom=edSelArch&&!preset;
  var inner='';
  if(preset)inner='<i class="ph-bold '+preset.icon+'" style="font-size:.9rem;color:'+preset.color+'"></i><span style="flex:1">'+preset.name+'</span><i class="ph-bold ph-caret-right"></i>';
  else if(isCustom)inner='<i class="ph-bold ph-pencil" style="font-size:.9rem;opacity:.7"></i><span style="flex:1">'+edSelArch+'</span><i class="ph-bold ph-caret-right"></i>';
  else inner='<span style="flex:1">Select archetype…</span><i class="ph-bold ph-caret-right"></i>';
  return '<button type="button" class="ed-arch-btn'+(edSelArch?'':' empty')+'" id="edArchBtn" onclick="openArchPicker()">'+inner+'</button>';
}
function suggestBuildArchetype(){
  var moves=[document.getElementById('edM1'),document.getElementById('edM2'),document.getElementById('edM3'),document.getElementById('edM4')].map(function(el){return el?el.value||'':''}).filter(Boolean);
  var poke=selPkmnId?allPkmn.find(function(p){return p.id===selPkmnId}):null;
  var moveMeta=moves.map(function(m){return allMoveIndex[m]||null}).filter(Boolean);
  var cats={physical:0,special:0,status:0};
  moveMeta.forEach(function(m){if(m.category==='Physical')cats.physical++;else if(m.category==='Special')cats.special++;else cats.status++;});
  var has=function(arr){return moves.some(function(m){return arr.indexOf(m)!==-1});};
  if(has(_BA_FAKEOUT))return 'Fake Out Lead';
  if(has(_BA_REDIRECT))return 'Redirection';
  if(has(_BA_TR))return 'Trick Room Setter';
  if(has(_BA_HAZARDS))return 'Hazard Setter';
  if(has(_BA_REMOVAL))return 'Hazard Remover';
  if(has(_BA_SCREENS))return 'Screens Support';
  if(has(_BA_WEATHER))return 'Weather Setter';
  if(has(_BA_TERRAIN))return 'Terrain Setter';
  if(has(_BA_SPEED))return 'Speed Control';
  if(has(_BA_HEAL)&&cats.status>=1)return 'Cleric';
  if(has(_BA_PIVOT))return 'Pivot';
  if(has(_BA_SETUP))return 'Setup Sweeper';
  if(!poke)return null;
  var spd=poke.base_spe||0,atk=poke.base_atk||0,spa=poke.base_spa||0,def=poke.base_def||0,spdef=poke.base_spd||0,hp=poke.base_hp||0;
  if(spd<=55&&(atk>=100||spa>=100))return 'Trick Room Abuser';
  if(def>=100&&hp>=80&&cats.physical===0&&cats.special===0)return 'Physical Wall';
  if(spdef>=100&&hp>=80&&cats.physical===0&&cats.special===0)return 'Special Wall';
  if(hp>=80&&def>=80&&spdef>=80&&(cats.physical+cats.special)>=2)return 'Tank';
  if(cats.physical>=1&&cats.special>=1&&(cats.physical+cats.special)>=3)return 'Mixed Attacker';
  var isPhys=cats.physical>=cats.special;
  var natEl=document.getElementById('edNat');var nat=natEl?natEl.value:'';
  var hasSpeedNat=(nat==='Jolly'||nat==='Timid'||nat==='Naive'||nat==='Hasty');
  if(spd<75&&((isPhys&&atk>=120)||(!isPhys&&spa>=120)))return 'Wallbreaker';
  if(spd>=90||hasSpeedNat){if(isPhys&&cats.physical>=1)return 'Physical Sweeper';if(cats.special>=1)return 'Special Sweeper';}
  if(cats.physical>=2)return 'Physical Sweeper';
  if(cats.special>=2)return 'Special Sweeper';
  return null;
}
function onSuggestArch(){
  var s=suggestBuildArchetype();
  if(!s){toast('Add more moves to get a suggestion','info');return;}
  selBldArch(s);toast('Suggested: '+s);
}

async function upd(t,m,b,a){var u=new URL(API+'/rest/v1/'+t);Object.entries(m).forEach(function(e){u.searchParams.set(e[0],e[1])});var r=await authFetch(u.toString(),{method:'PATCH',headers:Object.assign(h(a),{'Prefer':'return=representation'}),body:JSON.stringify(b)},a);if(!r.ok){var e=await r.json().catch(function(){return{}});throw new Error(e.message||r.status)}return r.json()}

function showBuildList(){buildView='list';renderBuilds()}
function showBuildBack(){
  if(typeof appNavContext!=='undefined'&&appNavContext.buildSource==='home'){
    appNavContext.buildSource='list';if(typeof dashNav==='function')dashNav('dash');return;
  }
  if(typeof appNavContext!=='undefined'&&appNavContext.buildSource==='profile'){
    appNavContext.buildSource='list';if(typeof dashNav==='function')dashNav('profile');return;
  }
  if(typeof appNavContext!=='undefined'&&appNavContext.buildSource==='team'){
    appNavContext.buildSource='list';
    document.querySelectorAll('.sb-item').forEach(function(n){n.classList.toggle('active',n.dataset.p==='teams')});
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('show')});
    var tp=document.getElementById('pg-teams');if(tp)tp.classList.add('show');
    if(typeof renderTeams==='function')renderTeams();
    return;
  }
  showBuildList();
}
function showBuildDetail(id,source){detailBuildId=id;buildView='detail';
  if(typeof appNavContext!=='undefined')appNavContext.buildSource=source||'list';
  // Ensure builds page is active
  document.querySelectorAll('.sb-item').forEach(function(n){n.classList.toggle('active',n.dataset.p==='builds')});
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('show')});
  document.getElementById('pg-builds').classList.add('show');
  renderBuilds()}
function showBuildEditor(id){
  editBuildId=id||null;
  buildView='editor';
pickerSearchValue='';pickerTypeFilter=null;pickerFormFilter=null;pickerShinyAll=false;pickerObtainedOnly=false;
  if(id){
    var b=allBuilds.find(function(x){return x.id===id});
    if(b){
      selPkmnId='';
      var pk=allPkmn.find(function(p){return p.name===b.pokemon_name&&p.dex_number===b.dex_number});
      if(pk)selPkmnId=pk.id;
      spV={hp:b.hp_sp||0,atk:b.atk_sp||0,def:b.def_sp||0,spa:b.spa_sp||0,spd:b.spd_sp||0,spe:b.spe_sp||0};
      editorShiny=!!b.is_shiny;
      edSelArch=b.archetype||'';
      editorStep='form'; // Existing build → jump straight to form
    }
  } else {
    selPkmnId='';
    spV={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};
    editorShiny=false;
    edSelArch='';
    editorStep='picker'; // New build → start at Pokémon picker
  }
  renderBuilds();
}

// Step transitions
function editorBackToPicker(){editorStep='picker';renderBuilds()}
function togglePickerShiny(){pickerShinyAll=!pickerShinyAll;renderBuilds()}
function togglePickerObtained(){pickerObtainedOnly=!pickerObtainedOnly;renderBuilds()}
function togglePickerType(t){pickerTypeFilter=pickerTypeFilter===t?null:t;renderBuilds()}
function togglePickerForm(f){pickerFormFilter=pickerFormFilter===f?null:f;renderBuilds()}
function toggleBuildShiny(){editorShiny=!editorShiny;renderBuilds()}

function closeAllBldOms(){document.querySelectorAll('[id^="bldOm-"]').forEach(function(m){m.classList.remove('open')})}
function toggleBldOm(id){var m=document.getElementById('bldOm-'+id);if(!m)return;var wasOpen=m.classList.contains('open');closeAllBldOms();if(!wasOpen)m.classList.add('open')}
function bldMenuDelete(ev,id){
  if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation()}
  var b=allBuilds.find(function(x){return x.id===id});
  if(!b){toast('Build not found','err');return false}
  closeAllBldOms();
  setTimeout(function(){confirmDelBuild(id,b.build_name||'this build')},0);
  return false;
}
function bindBuildListMenuActions(){
  if(window.__buildListDeleteBound)return;
  window.__buildListDeleteBound=true;

  document.addEventListener('click',function(ev){
    var delBtn=ev.target.closest&&ev.target.closest('.bld-list-delete');
    if(!delBtn)return;

    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();

    closeAllBldOms();

    var id=delBtn.getAttribute('data-build-id');
    var b=allBuilds.find(function(x){return x.id===id});

    if(!b){
      toast('Build not found','err');
      return false;
    }

    confirmDelBuild(id,b.build_name||'this build');
    return false;
  },true);
}

function renderBuilds(){
  var c=document.getElementById('buildsView');
  if(!tk){c.innerHTML='<div class="pg-head"><div class="pg-title">⚔️ Builds</div><div class="pg-sub">Sign in to manage your builds</div></div><div class="empty"><div class="em">🔒</div>Sign in to see builds</div>';return}
  if(buildView==='editor'){renderBuildEditor(c);return}
  if(buildView==='detail'){renderBuildDetail(c);return}
  // List view — standardised header with .vh-* classes
  var hdr='<div class="pg-head vh-list-header"><div class="pg-top"><div><div class="pg-title">⚔️ Builds</div><div class="pg-sub">Your competitive Pokémon configurations</div></div><div class="vh-actions"><button class="vh-btn vh-btn-md vh-btn-new" onclick="showBuildEditor()">+</button></div></div></div>';
  if(!allBuilds.length){c.innerHTML=hdr+'<div class="empty"><div class="em">⚔️</div>No builds yet. Create your first!</div>';return}
  var sortedBuilds=allBuilds.slice().sort(function(a,b){return(b.is_favourite?1:0)-(a.is_favourite?1:0)});
  var t1,t2,bImg,safeName;
  c.innerHTML=hdr+'<div class="bld-stack">'+sortedBuilds.map(function(b){
    bImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
    t1=TC[b.type_1]||TC.Normal;t2=b.type_2?TC[b.type_2]:null;
    safeName=(b.build_name||'this build').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var _dex=String(b.dex_number||0).padStart(4,'0');
    var _heroGrad=t2?'linear-gradient(150deg,'+t1.m+'88,'+t2.m+'88)':'linear-gradient(150deg,'+t1.m+'66,'+t1.d+'88)';
    // Mini stat bars — use full Lv50 calc for accuracy
    var _bldPoke=allPkmn.find(function(x){return x.id===b.pokemon_id});
    var _bldNat=b.nature_name?allNatures.find(function(n){return n.name===b.nature_name}):null;
    var _bldSP={hp:b.hp_sp||0,atk:b.atk_sp||0,def:b.def_sp||0,spa:b.spa_sp||0,spd:b.spd_sp||0,spe:b.spe_sp||0};
    var _bldStats=bsGetCalcStatsFor(_bldPoke,_bldSP,_bldNat);
    var _miniStats='<div class="bld-mini-stats">'+_bldStats.map(function(st){var pct=Math.min(st.calc/280*100,100);return'<div class="bld-stat-row"><div class="bld-stat-lbl">'+BSN[st.key]+'</div><div class="bld-stat-track"><div class="bld-stat-fill" style="width:'+pct+'%;background:'+BSC[st.key]+'"></div></div><div class="bld-stat-val" style="color:'+BSC[st.key]+'">'+st.calc+'</div></div>'}).join('')+'</div>';
    // Type-coloured move pills (desktop only)
    var _movePills='<div class="bld-move-pills">'+[b.move_1,b.move_2,b.move_3,b.move_4].filter(Boolean).map(function(m){var mi=allMoveIndex[m];var tc=mi&&TC[mi.type]?TC[mi.type].m:'var(--surface2)';return'<span class="bld-move-pill" style="background:'+tc+'">'+m+'</span>';}).join('')+'</div>';
    return '<div class="bld-card'+(b.is_favourite?' fav-card':'')+'" onclick="showBuildDetail(\''+b.id+'\')">'+
      // Art header — desktop only, hidden on mobile via CSS
      '<div class="bld-art" style="background:'+_heroGrad+'">'+
        '<div class="bld-art-dex">#'+_dex+'</div>'+
        '<div class="bld-art-badges">'+
          (b.is_favourite?'<span class="bld-art-fav">⭐</span>':'')+
          (b.is_shiny?'<span class="bld-art-shiny">✦ Shiny</span>':'')+
        '</div>'+
        '<img class="bld-art-sprite" src="'+bImg+'" onerror="this.style.opacity=\'0.2\'">'+
        '<div class="bld-art-types">'+
          '<span class="type-pill" style="background:'+t1.m+'">'+b.type_1+'</span>'+
          (t2?'<span class="type-pill" style="background:'+t2.m+'">'+b.type_2+'</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="bld-head">'+
        '<div class="bld-head-left">'+
          '<img class="bld-head-img" src="'+bImg+'" onerror="this.style.opacity=\'0.2\'">'+
          '<div class="bld-head-text">'+
            '<div class="bld-name">'+(b.is_favourite?'<span class="fav-star">⭐</span> ':'')+b.build_name+(b.is_shiny?' <span style="color:var(--purple);font-size:.68rem">✦</span>':'')+'</div>'+
            '<div class="bld-pkmn">'+(b.pokemon_name||'?')+' · #'+_dex+
              ' <span class="type-pill" style="background:'+t1.m+'">'+b.type_1+'</span>'+(t2?' <span class="type-pill" style="background:'+t2.m+'">'+b.type_2+'</span>':'')+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="vh-actions" onclick="event.stopPropagation()">'+
          '<button class="vh-btn vh-btn-md vh-btn-edit" onclick="showBuildEditor(\''+b.id+'\')" aria-label="Edit build">✏️</button>'+
          '<div class="om-wrap">'+
            '<button class="vh-btn vh-btn-md vh-btn-more" onclick="toggleBldOm(\''+b.id+'\')" aria-label="More">⋮</button>'+
            '<div class="om-menu" id="bldOm-'+b.id+'">'+
              '<button class="om-item" onclick="event.stopPropagation();closeAllBldOms();togFav(null,\''+b.id+'\')"><span class="om-item-icon">'+(b.is_favourite?'⭐':'☆')+'</span>'+(b.is_favourite?'Remove favourite':'Add to favourites')+'</button>'+
              '<button class="om-item" onclick="event.stopPropagation();closeAllBldOms();dupBuild(\''+b.id+'\')"><span class="om-item-icon">🔄</span>Duplicate build</button>'+
              (b.is_public&&b.share_code?'<button class="om-item" onclick="event.stopPropagation();closeAllBldOms();shareImage(\'build\',\''+b.id+'\')"><span class="om-item-icon">🔗</span>Share build</button>':'')+
              '<button class="om-item" onclick="event.stopPropagation();closeAllBldOms();exportShowdown(\''+b.id+'\')"><span class="om-item-icon">📤</span>Export to Showdown</button>'+
              '<div class="om-sep"></div>'+
              '<button class="om-item destructive" type="button" onpointerup="return bldMenuDelete(event,\''+b.id+'\')" onclick="return false"><span class="om-item-icon">🗑</span>Delete build</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="bld-tags">'+(b.battle_format?'<span class="btag btag-fmt">'+b.battle_format+'</span>':'')+(b.archetype?'<span class="btag btag-arch" style="--ac:'+archColour(b.archetype)+'">'+b.archetype+'</span>':'')+(b.item_name?'<span class="btag btag-item">'+b.item_name+'</span>':'')+(b.nature_name?'<span class="btag btag-nat">'+b.nature_name+'</span>':'')+(b.ability?'<span class="btag btag-abi">'+b.ability+'</span>':'')+bldMoveWarnPill(b)+bldAbiWarnPill(b)+'</div>'+
      _miniStats+
      _movePills+
    '</div>';
  }).join('')+'</div>';
}

// Drop E: Unified move-card font size. Takes the longest name across a build's
// 4 slots and returns a shared rem value so every card in the grid renders at
// the same scale — long names shrink together, short names don't bloat. This
// keeps the moveset grid visually uniform no matter the mix.
function movesetFontSize(names){
  var maxLen=0;
  for(var i=0;i<names.length;i++){var n=names[i];if(n&&n.length>maxLen)maxLen=n.length}
  if(maxLen<=9)return '.96rem';
  if(maxLen<=12)return '.86rem';
  if(maxLen<=15)return '.76rem';
  if(maxLen<=18)return '.66rem';
  if(maxLen<=22)return '.58rem';
  return '.52rem';
}

// Drop G.3: Quick list-level ability flag. Uses allPkmnAbilities (loaded at boot)
// so no async needed. Returns a btag-warn pill when ability is provably illegal.
function bldAbiWarnPill(b){
  if(!b.ability)return '';
  var st=abilityLegalityState(b.ability,b.pokemon_id);
  if(st==='illegal')return '<span class="btag btag-warn" title="\''+b.ability+'\' is not a valid ability for this Pok\u00e9mon"><i class="ph-fill ph-warning"></i> ability</span>';
  return '';
}

// Drop E: Quick list-level flag. Counts slots where the move name isn't in
// allMoveIndex (typo or not-in-champions). Doesn't trigger a learnset load,
// so it stays fast for lists. A build may also have illegal-but-known moves
// — those only surface in the detail view where a learnset check is cheap.
function bldMoveWarnPill(b){
  var moves=[b.move_1,b.move_2,b.move_3,b.move_4];
  var unknown=0;
  for(var i=0;i<moves.length;i++){
    var n=moves[i];
    if(n&&!allMoveIndex[n])unknown++;
  }
  if(!unknown)return '';
  return '<span class="btag btag-warn" title="'+unknown+' slot'+(unknown>1?'s':'')+' with unknown move names — open build to review"><i class="ph-fill ph-warning"></i>'+unknown+' to review</span>';
}

// Mobile-first 2-step build editor
function renderBuildEditor(c){
  if(editorStep==='picker'||!selPkmnId){renderEditorPicker(c);return}
  renderEditorForm(c);
}

// STEP 1: Pokémon picker (full-screen)
function renderEditorPicker(c){
  var hdr='<div class="pg-head"><div class="pg-top"><div><div class="pg-title" style="cursor:pointer" onclick="showBuildList()">← '+(editBuildId?'Edit Build':'New Build')+'</div><div class="pg-sub">Choose your Pokémon</div></div></div></div>';
  var search='<input class="ed-input" id="pkSrch" placeholder="🔍 Search by name or number" type="search" value="'+pickerSearchValue.replace(/"/g,'&quot;')+'" oninput="pickerSearchValue=this.value;filterPkPicker()">';
  var typeRow='<div class="epc-filter-row" style="margin-top:.5rem"><span class="epc-filter-lbl">Type</span><div class="epc-filter-scroll">'+Object.keys(TC).sort().map(function(t){return '<button class="epc-filter'+(pickerTypeFilter===t?' active':'')+'" onclick="togglePickerType(\''+t+'\')">'+t+'</button>'}).join('')+'</div></div>';
  var formRow='<div class="epc-filter-row" style="margin-top:.4rem;justify-content:space-between"><div style="display:flex;align-items:center;gap:.35rem;min-width:0"><span class="epc-filter-lbl">Form</span>'+['Base','Mega','Regional'].map(function(f){return '<button class="epc-filter'+(pickerFormFilter===f?' active':'')+'" onclick="togglePickerForm(\''+f+'\')">'+f+'</button>'}).join('')+'</div><div class="epc-picker-toggles"><button class="shiny-btn'+(pickerObtainedOnly?' active':'')+'" onclick="togglePickerObtained()">✓ Owned</button><button class="shiny-btn'+(pickerShinyAll?' active':'')+'" onclick="togglePickerShiny()">✦ Shiny</button></div></div>';
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

  var hdr='<div class="pg-head"><div class="pg-top"><div><div class="pg-title" style="cursor:pointer" onclick="showBuildList()">← '+(b?'Edit Build':'New Build')+'</div><div class="pg-sub">'+dName+(isMega?' (Mega)':'')+'</div></div></div></div>';

  // Nature picker button (Drop H) — replaces native <select> with a bottom-sheet picker.
  // Hidden input preserves saveBuild() / edGetNature() read contract unchanged.
  var sL={hp:'HP',attack:'Atk',defense:'Def',sp_attack:'SpA',sp_defense:'SpD',speed:'Spe'};
  var curNatObj=b&&b.nature_name?allNatures.find(function(n){return n.name===b.nature_name}):null;
  var _natChipsHtml='';
  if(curNatObj&&curNatObj.increased_stat){
    var _u=NAT_SC[curNatObj.increased_stat],_d=NAT_SC[curNatObj.decreased_stat];
    _natChipsHtml='<span class="ed-nat-btn-chip" style="background:'+_u.bg+';color:'+_u.c+'">▲ '+_u.s+'</span>'+
      '<span class="ed-nat-btn-chip" style="background:'+_d.bg+';color:'+_d.c+'">▼ '+_d.s+'</span>';
  }

  // Item picker — replaces native <select> with a clickable button that opens a bottom sheet.
  // Hidden input keeps the form-compatible edItem.value = item_id.
  var curItem=null;
  if(b){
    if(b.item_id)curItem=allItems.find(function(i){return i.id===b.item_id});
    if(!curItem&&b.item_name)curItem=allItems.find(function(i){return i.name===b.item_name});
  }
  var itemFieldHtml='<input type="hidden" id="edItem" value="'+(curItem?curItem.id:'')+'">'+
    '<button type="button" class="be-select" id="edItemBtn" onclick="openItemPicker()">'+
      (curItem
        ?'<div class="be-select-chosen">'+(curItem.sprite_url?'<img src="'+curItem.sprite_url+'" alt="">':'')+'<span>'+curItem.name+'</span></div>'
        :'<span class="placeholder">— None —</span>'
      )+
      '<i class="ph-bold ph-caret-down" style="color:var(--muted)"></i>'+
    '</button>';

  // Stat calculator section (bars/hex + SP sliders + BST total)
  var statSectionHtml=edBuildStatSection();

  c.innerHTML=hdr+'<div class="editor" style="padding-bottom:5rem">'+
    selectedCard+
    '<div class="ed-desktop-layout">'+
    '<div class="ed-left-col">'+
    '<div class="ed-card"><h3 style="display:flex;align-items:center;gap:8px">Stat Allocation'+(isMega?'<img src="'+MEGA_STONE_URL+'" alt="Mega" style="width:20px;height:20px;object-fit:contain;display:block;flex-shrink:0" onerror="this.style.display=\'none\'">':'')+'</h3><div id="statSection">'+statSectionHtml+'</div></div>'+
    '</div>'+
    '<div class="ed-right-col">'+
    '<div class="ed-card"><label class="ed-label" style="margin-top:0">Build Name</label><input class="ed-input" id="edName" value="'+(b?b.build_name:'').replace(/"/g,'&quot;')+'" placeholder="e.g. Sweeper '+dName+'">'+
      '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Format</label><select class="ed-select" id="edFmt"><option value="Singles"'+(b&&b.battle_format==='Singles'?' selected':'')+'>Singles</option><option value="Doubles"'+(b&&b.battle_format==='Doubles'?' selected':'')+'>Doubles</option></select></div></div>'+
      '<div style="margin-top:.55rem"><label class="ed-label" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.3rem">Archetype<button class="btn btn-ghost" style="font-size:.62rem;padding:.18rem .5rem;min-height:auto;line-height:1.3;font-family:inherit" onclick="onSuggestArch()" type="button">✨ Suggest</button></label>'+_edArchBtnHtml()+'<input type="hidden" id="edArch" value="'+edSelArch+'"></div>'+
    '</div>'+
    '<div class="ed-card" style="margin-top:1rem"><h3>Moves & Ability</h3>'+
      (function(){var curAbi=b?b.ability||'':'';return'<div class="ed-row">'+
  '<div><label class="ed-label">Ability</label>'+
    '<input type="hidden" id="edAbi" value="'+curAbi.replace(/"/g,'&quot;')+'">'+
    '<button type="button" id="edAbiBtn" class="ed-abl-btn'+(curAbi?'':' empty')+'" onclick="openAbilityPicker()">'+
      '<span id="edAbiLabel">'+(curAbi||'Select ability…')+'</span>'+
      '<span id="edAbiWarn" class="ed-abl-warn-icon" style="display:'+(abilityLegalityState(curAbi,selPkmnId)==='illegal'?'inline':'none')+'"><i class="ph-fill ph-warning"></i></span>'+
      '<i class="ph-bold ph-caret-right"></i>'+
    '</button>'+
  '</div>'+
  '<div><label class="ed-label">Item</label>'+itemFieldHtml+'</div>'+
'</div>';})()  +
      '<div style="margin-top:.5rem"><label class="ed-label">Nature</label>'+
        '<input type="hidden" id="edNat" value="'+(curNatObj?curNatObj.id:'')+'">'+
        '<button type="button" class="ed-nat-btn'+(curNatObj?'':' empty')+'" id="edNatBtn" onclick="openNaturePicker()">'+
          '<div class="ed-nat-btn-left">'+
            '<span class="ed-nat-btn-name" id="edNatLabel">'+(curNatObj?curNatObj.name:'Select nature…')+'</span>'+
            '<span class="ed-nat-btn-chips" id="edNatChips" style="'+(curNatObj&&curNatObj.increased_stat?'display:flex':'display:none')+'">'+_natChipsHtml+'</span>'+
          '</div>'+
          '<i class="ph-bold ph-caret-right"></i>'+
        '</button>'+
      '</div>'+
      // Drop E: Move slots — buttons open legal-move picker; hidden inputs preserve saveBuild() contract.
      // Shared font size across all 4 so long names don't bloat and short names don't over-scale.
      (function(){
        var ms=b?[b.move_1,b.move_2,b.move_3,b.move_4]:['','','',''];
        var fs=movesetFontSize(ms);
        return '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Move 1</label>'+msSlotField(1,ms[0],fs)+'</div><div><label class="ed-label">Move 2</label>'+msSlotField(2,ms[1],fs)+'</div></div>'+
        '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Move 3</label>'+msSlotField(3,ms[2],fs)+'</div><div><label class="ed-label">Move 4</label>'+msSlotField(4,ms[3],fs)+'</div></div>';
      })()+
    '</div>'+
    '<details class="ed-card" style="margin-top:1rem"><summary style="font-size:.9rem;font-weight:700;cursor:pointer;list-style:none;display:flex;align-items:center;gap:.4rem" onclick="return _edStrategyClick(event)">Strategy <span style="color:var(--muted);font-size:.72rem;font-weight:500;flex:1">optional</span><i class="ph-bold ph-caret-right ed-strat-caret"></i></summary>'+
      '<div style="margin-top:.7rem"><label class="ed-label">Win Condition</label><textarea class="ed-textarea" id="edWin">'+(b?b.win_condition||'':'')+'</textarea></div>'+
      '<div class="ed-row" style="margin-top:.5rem"><div><label class="ed-label">Strengths</label><textarea class="ed-textarea" id="edStr">'+(b?b.strengths||'':'')+'</textarea></div><div><label class="ed-label">Weaknesses</label><textarea class="ed-textarea" id="edWeak">'+(b?b.weaknesses||'':'')+'</textarea></div></div>'+
    '</details>'+
    '</div>'+ // close .ed-right-col
    '<div class="ed-picker-col" id="edPickerCol"></div>'+ // third panel — desktop picker slides in here
    '</div>'+ // close .ed-desktop-layout
    // Hidden shiny button — editorShiny state already lives in JS, but saveBuild reads #edShiny.active so we keep a hidden mirror
    '<button type="button" class="fpill'+(editorShiny?' active':'')+'" id="edShiny" style="display:none"></button>'+
    // Drop F.2a: Share toggle — only renders when editing an existing build.
    // Lives inside the .editor wrapper so it scrolls with the rest of the form,
    // positioned AFTER Strategy (the last content card) and BEFORE the sticky save-bar.
    edShareSectionHtml()+
    '</div>'+
    '<div class="save-bar"><button class="btn btn-ghost" onclick="showBuildList()">Cancel</button><button class="btn btn-red" id="saveBuildBtn" onclick="saveBuild()">💾 Save Build</button></div>';
  // Paint bars/hex after DOM is attached
  requestAnimationFrame(function(){requestAnimationFrame(edRefresh)});
  // Drop E: kick off learnset load in background so legality flags on the 4
  // slot buttons flip from 'pending' to 'legal' / 'illegal' once data arrives.
  if(selPkmnId&&!learnsetCache[selPkmnId]){
    loadLearnset(selPkmnId).then(msRefreshSlots);
  }
}

