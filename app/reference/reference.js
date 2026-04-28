// #SECTION: ABILITIES
// ═══════════════════════════════════════
// ABILITIES
// Load, filter, and render all 191 abilities.
// Drop G.1 — browse page only, no per-Pokémon mapping yet.
// ═══════════════════════════════════════

var allAbilities=[],ablCatFilter=null,ablSearchQ='';

// Category config — used for icon, colour, and filter pill rendering.
var ABL_CATS={
  weather:  {label:'Weather',  icon:'ph-cloud-sun',               c:'#7dd3fc',bg:'rgba(125,211,252,.12)'},
  offensive:{label:'Offensive',icon:'ph-sword',                   c:'#f97316',bg:'rgba(249,115,22,.12)'},
  defensive:{label:'Defensive',icon:'ph-shield',                  c:'#3b82f6',bg:'rgba(59,130,246,.12)'},
  speed:    {label:'Speed',    icon:'ph-wind',                    c:'#fb7185',bg:'rgba(251,113,133,.12)'},
  immunity: {label:'Immunity', icon:'ph-shield-check',            c:'#10b981',bg:'rgba(16,185,129,.12)'},
  support:  {label:'Support',  icon:'ph-arrows-counter-clockwise',c:'#f59e0b',bg:'rgba(245,158,11,.12)'},
  recovery: {label:'Recovery', icon:'ph-heart',                   c:'#a78bfa',bg:'rgba(167,139,250,.12)'},
};

// Hardcoded category lookup for known competitive abilities.
// Defaults to 'support' for any ability not listed.
var ABL_CAT_MAP={
  // Weather
  'Drought':'weather','Drizzle':'weather','Sand Stream':'weather','Snow Warning':'weather',
  'Cloud Nine':'weather','Air Lock':'weather','Sand Spit':'weather','Primordial Sea':'weather',
  'Desolate Land':'weather','Delta Stream':'weather',
  // Offensive
  'Adaptability':'offensive','Aerilate':'offensive','Beast Boost':'offensive',
  'Blaze':'offensive','Competitive':'offensive','Compound Eyes':'offensive',
  'Defiant':'offensive','Download':'offensive','Flower Gift':'offensive',
  'Galvanize':'offensive','Gorilla Tactics':'offensive','Hustle':'offensive',
  'Intrepid Sword':'offensive','Iron Fist':'offensive','Libero':'offensive',
  'Mega Launcher':'offensive','Mold Breaker':'offensive','Neuroforce':'offensive',
  'No Guard':'offensive','Normalize':'offensive','Overgrow':'offensive',
  'Parental Bond':'offensive','Pixilate':'offensive','Protean':'offensive',
  'Pure Power':'offensive','Huge Power':'offensive','Refrigerate':'offensive',
  'Reckless':'offensive','Sand Force':'offensive','Scrappy':'offensive',
  'Sheer Force':'offensive','Skill Link':'offensive','Sniper':'offensive',
  'Strong Jaw':'offensive','Technician':'offensive','Tinted Lens':'offensive',
  'Torrent':'offensive','Tough Claws':'offensive','Transistor':'offensive',
  'Turboblaze':'offensive','Teravolt':'offensive','Victory Star':'offensive',
  'Water Bubble':'offensive','Dragons Maw':'offensive','Steelworker':'offensive',
  'Stakeout':'offensive','Trace':'offensive',
  // Defensive
  'Aftermath':'defensive','Battle Armor':'defensive','Bulletproof':'defensive',
  'Cursed Body':'defensive','Dauntless Shield':'defensive','Disguise':'defensive',
  'Fluffy':'defensive','Fur Coat':'defensive','Heatproof':'defensive',
  'Ice Scales':'defensive','Innards Out':'defensive','Marvel Scale':'defensive',
  'Multiscale':'defensive','Overcoat':'defensive','Prism Armor':'defensive',
  'Rock Head':'defensive','Shadow Shield':'defensive','Shell Armor':'defensive',
  'Solid Rock':'defensive','Stamina':'defensive','Sturdy':'defensive',
  'Thick Fat':'defensive','Wonder Guard':'defensive','Filter':'defensive',
  'Full Metal Body':'defensive','Queenly Majesty':'defensive',
  // Speed
  'Chlorophyll':'speed','Motor Drive':'speed','Quick Feet':'speed',
  'Rattled':'speed','Sand Rush':'speed','Slush Rush':'speed',
  'Speed Boost':'speed','Swift Swim':'speed','Surge Surfer':'speed',
  'Unburden':'speed','Gale Wings':'speed',
  // Immunity
  'Dry Skin':'immunity','Earth Eater':'immunity','Flash Fire':'immunity',
  'Immunity':'immunity','Levitate':'immunity','Lightning Rod':'immunity',
  'Sap Sipper':'immunity','Storm Drain':'immunity','Volt Absorb':'immunity',
  'Water Absorb':'immunity','Wonder Skin':'immunity','Soundproof':'immunity',
  'Telepathy':'immunity',
  // Recovery
  'Magic Guard':'recovery','Natural Cure':'recovery','Poison Heal':'recovery',
  'Regenerator':'recovery','Shed Skin':'recovery',
  // Support (catch-all for utility/control abilities)
  'Intimidate':'support','Prankster':'support','Magic Bounce':'support',
  'Serene Grace':'support','Contrary':'support','Arena Trap':'support',
  'Shadow Tag':'support','Magnet Pull':'support','Moody':'support',
  'Corrosion':'support','Dark Aura':'support','Fairy Aura':'support',
  'Frisk':'support','Infiltrator':'support','Neutralizing Gas':'support',
  'Pressure':'support','Symbiosis':'support','Synchronize':'support',
  'Unnerve':'support','Tangling Hair':'support','Gooey':'support',
  'Cute Charm':'support','Aroma Veil':'support','Sweet Veil':'support',
  'Mummy':'support','Wandering Spirit':'support','Perish Body':'support',
};

function _ablCategory(name){return ABL_CAT_MAP[name]||'support'}

async function loadAbilities(){
  try{
    allAbilities=await q('abilities',{order:'name.asc',limit:'500'});
    var cnt=document.getElementById('ablCount');
    if(cnt)cnt.textContent=allAbilities.length;
    buildAblFilterPills();
    renderAbilities();
  }catch(e){}
}

function buildAblFilterPills(){
  var row=document.getElementById('ablFilterRow');
  if(!row)return;
  var html='<button class="ref-fpill active" id="rfp-all" onclick="setAblFilter(null)"><i class="ph-bold ph-squares-four"></i>All</button>';
  Object.keys(ABL_CATS).forEach(function(k){
    var c=ABL_CATS[k];
    html+='<button class="ref-fpill" id="rfp-'+k+'" style="color:'+c.c+'" onclick="setAblFilter(\''+k+'\')"><i class="ph-bold '+c.icon+'"></i>'+c.label+'</button>';
  });
  row.innerHTML=html;
}

function setAblFilter(cat){
  ablCatFilter=cat;
  var row=document.getElementById('ablFilterRow');
  if(!row)return;
  row.querySelectorAll('.ref-fpill').forEach(function(p){
    p.classList.remove('active');
    p.style.background='';p.style.borderColor='';
  });
  var active=document.getElementById('rfp-'+(cat||'all'));
  if(active){
    active.classList.add('active');
    var col=cat?ABL_CATS[cat].c:'var(--red)';
    active.style.background='color-mix(in srgb,'+col+' 13%,transparent)';
    active.style.borderColor='color-mix(in srgb,'+col+' 32%,transparent)';
  }
  renderAbilities();
}

function onAblSearch(v){ablSearchQ=v||'';renderAbilities()}

function renderAbilities(){
  var el=document.getElementById('ablList');
  if(!el)return;
  if(!allAbilities.length){el.innerHTML='<div class="empty"><div class="em">⏳</div>Loading…</div>';return}
  var q2=ablSearchQ.toLowerCase();
  var list=allAbilities.filter(function(a){
    if(ablCatFilter&&_ablCategory(a.name)!==ablCatFilter)return false;
    if(q2&&a.name.toLowerCase().indexOf(q2)===-1&&(a.short_description||'').toLowerCase().indexOf(q2)===-1)return false;
    return true;
  });
  if(!list.length){el.innerHTML='<div class="empty"><div class="em">🔍</div>No abilities match</div>';return}
  var html='';var lastLetter='';
  list.forEach(function(a){
    var letter=a.name[0].toUpperCase();
    if(letter!==lastLetter){html+='<div class="abl-alpha-hdr">'+letter+'</div>';lastLetter=letter;}
    var cat=_ablCategory(a.name);var c=ABL_CATS[cat];
    html+='<div class="abl-card" onclick="showAbilityDetail(\''+a.id+'\')">'+
      '<div class="abl-icon" style="background:'+c.bg+';color:'+c.c+'"><i class="ph-bold '+c.icon+'"></i></div>'+
      '<div class="abl-body">'+
        '<div class="abl-name">'+a.name+'</div>'+
        '<div class="abl-desc">'+(a.short_description||'')+'</div>'+
      '</div>'+
      '<div class="abl-right">'+
        '<span class="abl-cat-pill" style="background:'+c.bg+';color:'+c.c+'">'+c.label+'</span>'+
        '<span class="abl-chev"><i class="ph-bold ph-caret-right"></i></span>'+
      '</div>'+
    '</div>';
  });
  el.innerHTML=html;
}

function showAbilityDetail(idOrName,opts){
  opts=opts||{};
  var a=allAbilities.find(function(x){return x.id===idOrName||x.name===idOrName});
  if(!a)return;
  var cat=_ablCategory(a.name);var c=ABL_CATS[cat];
  // "Used in N builds" — count from allBuilds (loaded at boot)
  var usedCount=(window.allBuilds||[]).filter(function(b){return(b.ability||'').toLowerCase()===a.name.toLowerCase()}).length;
  var det=document.getElementById('refDetInner');
  if(!det)return;
  det.innerHTML=
    '<div class="abl-det-hero">'+
      '<div class="abl-det-icon" style="background:'+c.bg+';color:'+c.c+'"><i class="ph-bold '+c.icon+'"></i></div>'+
      '<div>'+
        '<div class="abl-det-name">'+a.name+'</div>'+
        '<span class="abl-det-tag" style="background:'+c.bg+';color:'+c.c+'">'+c.label+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="p-header" style="padding:.3rem 1.2rem .7rem;border-bottom:1px solid var(--border)">'+
      '<div style="font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem">Description</div>'+
      '<div style="font-size:.83rem;color:var(--text2);line-height:1.6">'+(a.description||a.short_description||'No description available.')+'</div>'+
      (a.champions_note?'<div style="margin-top:.55rem;padding:.5rem .7rem;background:var(--gold-bg);border-radius:10px;border-left:2px solid var(--gold);font-size:.74rem;color:var(--gold);line-height:1.4">⭐ '+a.champions_note+'</div>':'')+
    '</div>'+
    '<div class="p-header" style="padding:.7rem 1.2rem .8rem">'+
      '<div style="font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem">Usage</div>'+
      (usedCount>0
        ?'<span style="display:inline-flex;align-items:center;gap:.3rem;padding:.28rem .65rem;border-radius:8px;font-size:.71rem;font-weight:700;background:var(--red-bg);color:var(--red)"><i class="ph-bold ph-sword"></i> Used in '+usedCount+' build'+(usedCount!==1?'s':'')+'</span>'
        :'<span style="display:inline-flex;padding:.28rem .65rem;border-radius:8px;font-size:.71rem;font-weight:700;background:var(--surface);color:var(--muted)">Not used in any builds yet</span>')+
    '</div>'+
_ablDetPkmnSection(a,opts.collapsePokemon);
  document.getElementById('refDetOv').classList.add('open');
}

// Drop G.3: "Pokémon with this ability" section rendered in the ability detail tray.
// Reads allPkmnAbilities (loaded at boot) + allPkmn. Groups by slot: 1, 2, hidden.
function _ablDetPkmnSection(a,collapsed){  var rows=(window.allPkmnAbilities||[]).filter(function(pa){return pa.ability_id===a.id;});
  if(!rows.length)return '';
  var bySlot={'1':[],'2':[],'hidden':[]};
  rows.forEach(function(pa){
    var poke=(window.allPkmn||[]).find(function(p){return p.id===pa.pokemon_id;});
    if(!poke)return;
    var sl=String(pa.slot);
    if(bySlot[sl])bySlot[sl].push(poke);
  });
  ['1','2','hidden'].forEach(function(sl){
    bySlot[sl].sort(function(a,b){return (a.dex_number||0)-(b.dex_number||0);});
  });
  var slotMeta={'1':{lbl:'Slot 1',c:'#a78bfa',bg:'rgba(167,139,250,.12)'},'2':{lbl:'Slot 2',c:'#3b82f6',bg:'rgba(59,130,246,.12)'},'hidden':{lbl:'Hidden',c:'#f59e0b',bg:'rgba(245,158,11,.12)'}};
var html='<div class="p-header" style="padding:.7rem 1.2rem 1.2rem;border-top:1px solid var(--border)">'+
  '<details class="abl-pkmn-details" '+(collapsed?'':'open')+'>'+
    '<summary class="abl-pkmn-summary">'+
      '<span>Pok\u00e9mon with this ability</span>'+
      '<span class="abl-pkmn-count">('+rows.length+')</span>'+
    '</summary>'+
    '<div class="abl-pkmn-detail-body">';
  ['1','2','hidden'].forEach(function(sl){
    var pokes=bySlot[sl];if(!pokes||!pokes.length)return;
    var m=slotMeta[sl];
    html+='<div style="margin-bottom:.65rem">'+
      '<div style="margin-bottom:.4rem">'+
        '<span style="padding:.2rem .55rem;border-radius:6px;font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;background:'+m.bg+';color:'+m.c+'">'+m.lbl+'</span>'+
        ' <span style="font-size:.62rem;color:var(--muted);font-weight:600">'+pokes.length+'</span>'+
      '</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:.3rem">'+
      pokes.map(function(p){
        var img=p.image_url||'';
        return '<div style="display:inline-flex;align-items:center;gap:.28rem;padding:.22rem .5rem .22rem .28rem;border-radius:8px;background:var(--surface);font-size:.72rem;font-weight:600;color:var(--text2);white-space:nowrap">'+
          (img?'<img src="'+img+'" style="width:22px;height:22px;object-fit:contain;flex-shrink:0" onerror="this.style.display=\'none\'">':'')+
          p.name+
        '</div>';
      }).join('')+
      '</div>'+
    '</div>';
  });
html+='</div></details></div>';
  return html;
}

function closeRefDet(){document.getElementById('refDetOv').classList.remove('open')}

function switchRefTab(tab){
  document.querySelectorAll('#refTabBar .ref-tab').forEach(function(t){
    t.classList.toggle('active',t.dataset.tab===tab);
  });
  var ap=document.getElementById('refAbilitiesPane');
  var np=document.getElementById('refNaturesPane');
  var acp=document.getElementById('refArchetypesPane');
  if(ap)ap.style.display=tab==='abilities'?'':'none';
  if(np)np.style.display=tab==='natures'?'':'none';
  if(acp)acp.style.display=tab==='archetypes'?'':'none';
  if(tab==='archetypes')renderArchetypesRef('');
}

// ── Archetypes Reference ───────────────────────────────────
function renderArchetypesRef(q){
  var el=document.getElementById('archRefGrid');if(!el)return;
  var list=typeof BLD_ARCHETYPES!=='undefined'?BLD_ARCHETYPES:[];
  var catIcons={Offense:'ph-sword',Setup:'ph-trend-up',Defense:'ph-shield',Support:'ph-gear',VGC:'ph-trophy'};
  var catOrder=['Offense','Setup','Defense','Support','VGC'];
  var lq=(q||'').toLowerCase();
  var filtered=lq?list.filter(function(a){return a.name.toLowerCase().indexOf(lq)!==-1||a.cat.toLowerCase().indexOf(lq)!==-1||a.desc.toLowerCase().indexOf(lq)!==-1}):list;
  if(!filtered.length){el.innerHTML='<div class="empty"><div class="em">🔍</div>No archetypes found</div>';return;}
  var cats={};
  filtered.forEach(function(a){if(!cats[a.cat])cats[a.cat]=[];cats[a.cat].push(a);});
  var html='';
  catOrder.forEach(function(cat){
    if(!cats[cat])return;
    html+='<div class="ref-arch-cat"><i class="ph-bold '+catIcons[cat]+'"></i>'+cat+'</div>';
    cats[cat].forEach(function(a){
      html+=
        '<div class="ref-arch-card" style="--ac:'+a.color+'">'+
          '<div class="ref-arch-card-head">'+
            '<div class="ref-arch-icon"><i class="ph-bold '+a.icon+'"></i></div>'+
            '<div class="ref-arch-name">'+a.name+'</div>'+
          '</div>'+
          '<div class="ref-arch-desc">'+a.desc+'</div>'+
        '</div>';
    });
  });
  el.innerHTML=html;
}
function onArchRefSearch(q){renderArchetypesRef(q);}

// ═══════════════════════════════════════
// ABILITY MODE TOGGLE (Abilities | By Pokémon) — Drop G.2
// ═══════════════════════════════════════
var refAblMode='abilities';
var ablPkmnCache={};        // pokemonId → [{slot,id,name,desc}]
var refPkmnSelectedId=null;
var refPkmnSelectedName='';
var refPkmnSearchQ='';

function switchAblMode(mode){
  refAblMode=mode;
  refPkmnSelectedId=null;
  refPkmnSearchQ='';
  // Update toggle buttons
  document.querySelectorAll('.ref-mode-btn').forEach(function(b){
    b.classList.toggle('active',b.dataset.mode===mode);
  });
  // Show/hide search blocks
  var aSb=document.getElementById('ablSearchBlock');
  var pSb=document.getElementById('ablPkmnBlock');
  if(aSb)aSb.style.display=mode==='abilities'?'':'none';
  if(pSb)pSb.style.display=mode==='pkmn'?'':'none';
  // Clear Pokémon search input
  var pIn=document.getElementById('ablPkmnSearch');
  if(pIn)pIn.value='';
  if(mode==='abilities'){
    renderAbilities();
  } else {
    renderPkmnAblPrompt();
  }
}

function renderPkmnAblPrompt(){
  var el=document.getElementById('ablList');
  if(!el)return;
  el.innerHTML='<div class="abl-pkmn-prompt"><i class="ph-bold ph-paw-print"></i>Search a Pokémon name to see its legal abilities</div>';
}

function onPkmnAblSearch(v){
  refPkmnSearchQ=v||'';
  refPkmnSelectedId=null;
  renderPkmnAblSearch(refPkmnSearchQ);
}

function renderPkmnAblSearch(q){
  var el=document.getElementById('ablList');
  if(!el)return;
  if(!q){renderPkmnAblPrompt();return;}
  var q2=q.toLowerCase();
  var matches=(allPkmn||[]).filter(function(p){return p.name.toLowerCase().indexOf(q2)!==-1}).slice(0,20);
  if(!matches.length){el.innerHTML='<div class="abl-pkmn-prompt">No Pokémon found for "'+q+'"</div>';return;}
  el.innerHTML=matches.map(function(p){
    return '<div class="abl-pkmn-result" onclick="selectAblPkmn(\''+p.id+'\',\''+p.name.replace(/'/g,"\\'")+'\')">'+
      '<img class="abl-pkmn-sprite" src="'+p.image_url+'" alt="" onerror="this.style.display=\'none\'">'+
      '<span class="abl-pkmn-name">'+p.name+'</span>'+
      '<i class="ph-bold ph-caret-right" style="color:var(--muted);font-size:.75rem"></i>'+
    '</div>';
  }).join('');
}

async function selectAblPkmn(pokemonId,pokemonName){
  refPkmnSelectedId=pokemonId;
  refPkmnSelectedName=pokemonName;
  var el=document.getElementById('ablList');
  if(!el)return;
  el.innerHTML='<div class="abl-pkmn-prompt">Loading…</div>';
  if(!ablPkmnCache[pokemonId]){
    try{
      var rows=await q('pokemon_abilities',{'pokemon_id':'eq.'+pokemonId,select:'slot,ability_id',order:'slot.asc'});
      ablPkmnCache[pokemonId]=rows.map(function(row){
        var abl=allAbilities.find(function(a){return a.id===row.ability_id});
        return{slot:row.slot,id:row.ability_id,name:abl?abl.name:'?',desc:abl?abl.short_description||'':''};
      });
    }catch(e){ablPkmnCache[pokemonId]=[];}
  }
  renderPkmnAblSelected(pokemonId,pokemonName);
}

function backToAblPkmnSearch(){
  refPkmnSelectedId=null;
  renderPkmnAblSearch(refPkmnSearchQ);
}

function renderPkmnAblSelected(pokemonId,pokemonName){
  var el=document.getElementById('ablList');
  if(!el)return;
  var options=ablPkmnCache[pokemonId]||[];
  var SLOT_LABELS={'1':'Ability 1','2':'Ability 2','hidden':'Hidden Ability'};
  var SLOT_CLS={'1':'abl-slot-1','2':'abl-slot-2','hidden':'abl-slot-h'};
  var CAT_MAP={};
  (Object.keys(ABL_CATS)||[]).forEach(function(k){CAT_MAP[k]=ABL_CATS[k]});
  var backHdr='<div class="abl-pkmn-back-hdr">'+
    '<button class="abl-pkmn-back-btn" onclick="backToAblPkmnSearch()"><i class="ph-bold ph-caret-left"></i> Back</button>'+
    '<span class="abl-pkmn-who">'+pokemonName+'</span>'+
  '</div>';
  var cards='';
  if(!options.length){
    cards='<div style="padding:1.5rem 1rem;color:var(--muted);font-size:.82rem;text-align:center">No ability data for this Pokémon yet.<br>Use the admin panel to add entries.</div>';
  } else {
    cards=options.map(function(opt){
      var cat=_ablCategory(opt.name);
      var c=ABL_CATS[cat]||ABL_CATS.support;
      var slotCls=SLOT_CLS[opt.slot]||'abl-slot-1';
      var slotLabel=SLOT_LABELS[opt.slot]||opt.slot;
      return '<div class="abl-card" onclick="showAbilityDetail(\''+opt.id+'\')">'+
        '<div class="abl-icon" style="background:'+c.bg+';color:'+c.c+'"><i class="ph-bold '+c.icon+'"></i></div>'+
        '<div class="abl-body">'+
          '<div class="abl-name">'+opt.name+'</div>'+
          '<div class="abl-desc">'+opt.desc+'</div>'+
        '</div>'+
        '<div class="abl-right">'+
          '<span class="abl-cat-pill '+slotCls+'">'+slotLabel+'</span>'+
          '<span class="abl-chev"><i class="ph-bold ph-caret-right"></i></span>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  el.innerHTML=backHdr+cards;
}

// #SECTION: NATURES
// ═══════════════════════════════════════
// NATURES
// Load and render nature data — Drop G redesign: hybrid EQ bars + archetype tag.
// ═══════════════════════════════════════

var allNatures=[],natSearchQ='';

// Stat display config (EQ bars + detail panel colours)
var NAT_SC={
  attack:    {c:'#f97316',bg:'rgba(249,115,22,.14)', s:'Atk', label:'Attack'},
  sp_attack: {c:'#fdba74',bg:'rgba(253,186,116,.14)',s:'SpA', label:'Sp. Atk'},
  defense:   {c:'#3b82f6',bg:'rgba(59,130,246,.14)', s:'Def', label:'Defense'},
  sp_defense:{c:'#7dd3fc',bg:'rgba(125,211,252,.14)',s:'SpD', label:'Sp. Def'},
  speed:     {c:'#fb7185',bg:'rgba(251,113,133,.14)',s:'Spe', label:'Speed'},
};
var NAT_SK=['attack','sp_attack','defense','sp_defense','speed'];
var NAT_SS=['Atk','SpA','Def','SpD','Spe'];

// Deterministic archetype lookup — derived purely from which stat is boosted/lowered.
var NAT_ARCH={
  Adamant:'Physical Sweeper',  Bold:'Physical Wall',     Brave:'TR Physical Atk',
  Calm:'Special Wall',         Careful:'Cleric Wall',    Gentle:'Sp. Def Pivot',
  Hasty:'Mixed Fast Atk',      Impish:'Physical Wall',   Jolly:'Fast Physical Atk',
  Lax:'One-Sided Tank',        Lonely:'Glass Cannon',    Mild:'Mixed Sp. Atk',
  Modest:'Special Sweeper',    Naive:'Fast Mixed Atk',   Naughty:'Phys + Coverage',
  Quiet:'TR Special Atk',      Rash:'Reckless Sp. Atk',  Relaxed:'TR Physical Wall',
  Sassy:'TR Special Wall',     Timid:'Fast Special Atk',
  Bashful:'All-Rounder',       Docile:'All-Rounder',     Hardy:'All-Rounder',
  Quirky:'All-Rounder',        Serious:'All-Rounder',
};

async function loadNatures(){try{allNatures=await q('natures',{order:'name.asc'});renderNatures()}catch(e){}}

function onNatSearch(v){natSearchQ=v||'';renderNatures()}

function _natEqBars(n){
  var bars='<div class="eq-bars">';
  NAT_SK.forEach(function(k,j){
    var isUp=n.increased_stat===k, isDown=n.decreased_stat===k;
    var sc=NAT_SC[k];
    var h=isUp?'90%':isDown?'12%':'48%';
    var op=isUp?'.95':isDown?'.9':'.22';
    var trackOp=isDown?'opacity:.28;':'';
    bars+='<div class="eq-col">'+
      '<div class="eq-track" style="height:28px;background:var(--surface2);'+trackOp+'">'+
        '<div class="eq-fill" style="height:'+h+';background:'+sc.c+';opacity:'+op+'"></div>'+
      '</div>'+
      '<div class="eq-lbl" style="'+(isUp?'color:'+sc.c+';font-weight:900;':isDown?'opacity:.3;':'')+'">'+NAT_SS[j]+'</div>'+
    '</div>';
  });
  return bars+'</div>';
}

function renderNatures(){
  var el=document.getElementById('natHybridGrid');
  if(!el)return;
  var q2=natSearchQ.toLowerCase();
  var list=allNatures.filter(function(n){return!q2||n.name.toLowerCase().indexOf(q2)!==-1});
  if(!list.length){el.innerHTML='<div class="empty"><div class="em">🔍</div>No natures match</div>';return}
  el.innerHTML=list.map(function(n,i){
    var arch=NAT_ARCH[n.name]||'—';
    var upC=n.increased_stat?NAT_SC[n.increased_stat].c:'var(--muted)';
    var upBg=n.increased_stat?NAT_SC[n.increased_stat].bg:'var(--surface)';
    return '<div class="nat-hybrid" onclick="showNatureDetail(\''+n.name+'\')">'+
      '<div class="nat-hybrid-name">'+n.name+'</div>'+
      _natEqBars(n)+
    '</div>';
  }).join('');
}

function showNatureDetail(name){
  var n=allNatures.find(function(x){return x.name===name});
  if(!n)return;
  var arch=NAT_ARCH[n.name]||'—';
  var upC=n.increased_stat?NAT_SC[n.increased_stat].c:'var(--muted)';
  var upBg=n.increased_stat?NAT_SC[n.increased_stat].bg:'var(--surface)';
  var usedCount=(window.allBuilds||[]).filter(function(b){return(b.nature||'').toLowerCase()===n.name.toLowerCase()}).length;
  var mods='';
  if(n.increased_stat){
    var u=NAT_SC[n.increased_stat],d=NAT_SC[n.decreased_stat];
    mods='<div class="nat-det-mods">'+
      '<div class="nat-det-row" style="background:'+u.bg+'">'+
        '<span class="nat-det-arrow" style="color:'+u.c+'">▲</span>'+
        '<span class="nat-det-stat" style="color:'+u.c+'">'+u.label+'</span>'+
        '<span class="nat-det-pct" style="color:'+u.c+'">+10%</span>'+
      '</div>'+
      '<div class="nat-det-row" style="background:'+d.bg+';opacity:.75">'+
        '<span class="nat-det-arrow" style="color:'+d.c+'">▼</span>'+
        '<span class="nat-det-stat" style="color:'+d.c+'">'+d.label+'</span>'+
        '<span class="nat-det-pct" style="color:'+d.c+'">−10%</span>'+
      '</div>'+
    '</div>';
  } else {
    mods='<div style="color:var(--muted);font-size:.82rem;padding:.2rem 0">No stat changes — all multipliers at 1.0×</div>';
  }
  var det=document.getElementById('refDetInner');
  if(!det)return;
  det.innerHTML=
    '<div class="nat-det-hero">'+
      '<div class="nat-det-icon" style="background:'+upBg+';color:'+upC+'"><i class="ph-bold ph-dna"></i></div>'+
      '<div>'+
        '<div class="nat-det-name">'+n.name+'</div>'+
        '<span class="nat-det-tag" style="background:'+upBg+';color:'+upC+'">'+arch+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="p-header" style="padding:.3rem 1.2rem .7rem;border-bottom:1px solid var(--border)">'+
      '<div style="font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem">Stat Modifiers</div>'+
      mods+
    '</div>'+
    '<div class="p-header" style="padding:.7rem 1.2rem .8rem">'+
      '<div style="font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem">Usage</div>'+
      (usedCount>0
        ?'<span style="display:inline-flex;align-items:center;gap:.3rem;padding:.28rem .65rem;border-radius:8px;font-size:.71rem;font-weight:700;background:var(--red-bg);color:var(--red)"><i class="ph-bold ph-sword"></i> Used in '+usedCount+' build'+(usedCount!==1?'s':'')+'</span>'
        :'<span style="display:inline-flex;padding:.28rem .65rem;border-radius:8px;font-size:.71rem;font-weight:700;background:var(--surface);color:var(--muted)">Not used in any builds yet</span>')+
    '</div>';
  document.getElementById('refDetOv').classList.add('open');
}

