// #SECTION: ITEMS
// ═══════════════════════════════════════
// ITEMS
// Load, render, and toggle collected items.
// ═══════════════════════════════════════

var allItems=[],uItems={},activeItemCategory='all',activeItemStatus='all';
async function loadItems(){try{allItems=await q('items',{order:'name.asc',limit:'1000'});document.getElementById('nc3').textContent=allItems.length;renderItems()}catch(e){}}
async function loadUItems(){if(!tk)return;try{var rows=await q('user_items',{select:'item_id,obtained'},true);uItems={};rows.forEach(function(r){if(r.obtained)uItems[r.item_id]=true});renderItems()}catch(e){}}
async function togItem(iid){if(!usr){toast('Sign in first','err');return}
  try{if(uItems[iid]){await rm('user_items',{'user_id':'eq.'+usr.id,'item_id':'eq.'+iid},true);delete uItems[iid];toast('Removed')}
  else{var u=new URL(API+'/rest/v1/user_items');u.searchParams.set('on_conflict','user_id,item_id');
    var r=await authFetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation,resolution=merge-duplicates'}),body:JSON.stringify({user_id:usr.id,item_id:iid,obtained:true})},true);
    if(!r.ok)throw new Error((await r.json().catch(function(){return{}})).message||r.status);
    uItems[iid]=true;toast('Item obtained!')}renderItems()}catch(e){toast(e.message,'err')}}

// Switch the active category filter + re-render. Bound to the pill buttons.
function setItemCategory(cat){activeItemCategory=cat||'all';renderItems()}
function setItemStatus(st){activeItemStatus=st||'all';renderItems()}

// Shared predicate for filtering items by category + status + search.
function _itemMatchesFilters(i,s){
  if(s&&i.name.toLowerCase().indexOf(s)===-1)return false;
  if(activeItemCategory!=='all'&&i.category!==activeItemCategory)return false;
  if(activeItemStatus==='obtained'&&!uItems[i.id])return false;
  if(activeItemStatus==='unobtained'&&uItems[i.id])return false;
  if(activeItemStatus==='free'&&i.acquisition!=='base_game')return false;
  return true;
}

// Build the VP badge HTML shown on each item card.
function itemVpBadge(item){
  if(item.acquisition==='base_game')return '<div class="it-vp free"><i class="ph-bold ph-gift"></i>Free</div>';
  if(item.acquisition==='mega_tutorial')return '<div class="it-vp tutor"><i class="ph-bold ph-trophy"></i>Tutorial</div>';
  if(item.acquisition==='transfer_plza')return '<div class="it-vp transfer"><i class="ph-bold ph-arrows-clockwise"></i>Z-A Transfer</div>';
  if(item.acquisition==='shop'&&item.vp_cost)return '<div class="it-vp"><i class="ph-bold ph-shopping-cart"></i>'+item.vp_cost+' VP</div>';
  return '';
}

function renderItems(){
  var s=document.getElementById('itemSearch').value.toLowerCase();
  var f=allItems.filter(function(i){return _itemMatchesFilters(i,s)});
  // Category pill counts respect search + status (but not category) so tabs stay accurate.
  var catCounts={all:0,hold:0,berry:0,mega_stone:0};
  allItems.forEach(function(i){
    if(s&&i.name.toLowerCase().indexOf(s)===-1)return;
    if(activeItemStatus==='obtained'&&!uItems[i.id])return;
    if(activeItemStatus==='unobtained'&&uItems[i.id])return;
    if(activeItemStatus==='free'&&i.acquisition!=='base_game')return;
    catCounts.all++;
    if(catCounts[i.category]!==undefined)catCounts[i.category]++;
  });
  // Status pill counts respect search + category (but not status).
  var statCounts={all:0,obtained:0,unobtained:0,free:0};
  allItems.forEach(function(i){
    if(s&&i.name.toLowerCase().indexOf(s)===-1)return;
    if(activeItemCategory!=='all'&&i.category!==activeItemCategory)return;
    statCounts.all++;
    if(uItems[i.id])statCounts.obtained++;else statCounts.unobtained++;
    if(i.acquisition==='base_game')statCounts.free++;
  });
  var catPills='<div class="it-filter">'+
    ['all','hold','berry','mega_stone'].map(function(cat){
      var label={all:'All',hold:'Hold',berry:'Berries',mega_stone:'Mega Stones'}[cat];
      return '<button class="it-pill'+(activeItemCategory===cat?' active':'')+'" onclick="setItemCategory(\''+cat+'\')">'+label+'<span class="count">'+catCounts[cat]+'</span></button>';
    }).join('')+'</div>';
  var statPills='<div class="it-filter">'+
    ['all','obtained','unobtained','free'].map(function(st){
      var label={all:'Any status',obtained:'Obtained',unobtained:'Missing',free:'Free'}[st];
      return '<button class="it-pill'+(activeItemStatus===st?' active':'')+'" onclick="setItemStatus(\''+st+'\')">'+label+'<span class="count">'+statCounts[st]+'</span></button>';
    }).join('')+'</div>';
  var pills=catPills+statPills;
  var body=f.map(function(i){
    var on=uItems[i.id];
    var sprite=i.sprite_url?'<img src="'+i.sprite_url+'" alt="" onerror="this.style.display=\'none\'">':'';
    var desc=i.short_description||i.description||'';
    var vp=itemVpBadge(i);
    return '<div class="it-card" onclick="showItemDetail(\''+i.id+'\')">'+
      '<div class="it-sprite">'+sprite+'</div>'+
      '<div class="it-info">'+
        '<div class="it-name-row"><div class="it-name">'+i.name+'</div>'+vp+'</div>'+
        (desc?'<div class="it-desc">'+desc+'</div>':'')+
      '</div>'+
      '<button class="it-chk'+(on?' on':'')+'" onclick="event.stopPropagation();togItem(\''+i.id+'\')" aria-label="'+(on?'Obtained':'Mark obtained')+'">'+(on?'✓':'·')+'</button>'+
    '</div>';
  }).join('')||'<div class="empty"><div class="em">🔍</div>No items match</div>';
  document.getElementById('itemsGrid').innerHTML=pills+body;
}

// Open the item detail panel (reuses the shared .panel-ov#detP overlay).
function showItemDetail(id){
  var item=allItems.find(function(i){return i.id===id});
  if(!item)return;
  var on=uItems[id];
  var render=item.render_url||item.sprite_url||'';
  var sprite=item.sprite_url||'';
  // If render fails, fall back to the pixel sprite (still better than nothing).
  var onErr=' onerror="if(this.dataset.fallback!==\'1\'){this.dataset.fallback=\'1\';this.src=\''+sprite+'\';this.style.imageRendering=\'pixelated\';}else{this.style.display=\'none\';}"';
  var renderImg=render?'<img src="'+render+'" alt=""'+onErr+'>':'';
  var descHtml='';
  if(item.description||item.short_description){
    descHtml='<div class="panel-section">'+
      '<div class="panel-section-label">Description</div>'+
      '<div class="panel-desc">'+(item.description||item.short_description)+'</div>'+
    '</div>';
  }
  // How to Get — acquisition info row
  var acqHtml='';
  if(item.acquisition){
    var cfg={
      shop:{cls:'shop',icon:'shopping-cart',where:'Available from Shop',cost:item.vp_cost?item.vp_cost+' VP':'VP cost varies'},
      base_game:{cls:'free',icon:'gift',where:'Available from the start',cost:'Included in base game'},
      mega_tutorial:{cls:'tutor',icon:'trophy',where:'Mega Evolution Tutorial',cost:'Complete the tutorial to unlock'},
      transfer_plza:{cls:'transfer',icon:'arrows-clockwise',where:'Transfer from Pokémon Legends: Z-A',cost:'Deposit via the transfer app'}
    }[item.acquisition];
    if(cfg){
      acqHtml='<div class="panel-section">'+
        '<div class="panel-section-label">How to Get</div>'+
        '<div class="acq-row">'+
          '<div class="acq-icon '+cfg.cls+'"><i class="ph-bold ph-'+cfg.icon+'"></i></div>'+
          '<div class="acq-lines">'+
            '<div class="acq-where">'+cfg.where+'</div>'+
            '<div class="acq-cost">'+cfg.cost+'</div>'+
          '</div>'+
        '</div>'+
      '</div>';
    }
  }
  var noteHtml='';
  if(item.champions_note){
    noteHtml='<div class="panel-section">'+
      '<div class="panel-note">'+
        '<div class="panel-note-label"><span>⚡</span><span>Champions Note</span></div>'+
        item.champions_note+
      '</div>'+
    '</div>';
  }
  var actionHtml='<div class="panel-actions">'+
    '<button class="panel-btn '+(on?'active':'primary')+'" onclick="togItem(\''+id+'\');closeItemDetail()">'+
      '<i class="ph-bold ph-'+(on?'x-circle':'check')+'"></i>'+
      (on?'Remove from collection':'Mark as obtained')+
    '</button>'+
  '</div>';
  var html='<div class="panel-handle"></div>'+
    '<button class="panel-close" onclick="closeItemDetail()" aria-label="Close">✕</button>'+
    '<div class="panel-hero">'+
      '<div class="it-panel-render">'+renderImg+'</div>'+
      '<div class="panel-name">'+item.name+'</div>'+
      '<div class="panel-tag">'+(on?'✓ Obtained':'Not obtained')+'</div>'+
    '</div>'+
    '<div class="panel-body">'+
      descHtml+
      acqHtml+
      noteHtml+
      actionHtml+
    '</div>';
  document.getElementById('detInner').innerHTML=html;
  document.getElementById('detP').classList.add('open');
}
function closeItemDetail(){document.getElementById('detP').classList.remove('open')}

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

function showAbilityDetail(idOrName){
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
    '</div>';
  document.getElementById('refDetOv').classList.add('open');
}

function closeRefDet(){document.getElementById('refDetOv').classList.remove('open')}

function switchRefTab(tab){
  document.querySelectorAll('#refTabBar .ref-tab').forEach(function(t){
    t.classList.toggle('active',t.dataset.tab===tab);
  });
  var ap=document.getElementById('refAbilitiesPane');
  var np=document.getElementById('refNaturesPane');
  if(ap)ap.style.display=tab==='abilities'?'':'none';
  if(np)np.style.display=tab==='natures'?'':'none';
}

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

// ═══════════════════════════════════════
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
  var unDisplay=userProfile&&userProfile.username
    ?'<div class="tc-username"><span class="tc-un-at">@</span>'+userProfile.username+'<button class="tc-un-edit" onclick="showUsernameModal(null)" title="Change username">✏️</button></div>'
    :'<button class="tc-un-set" onclick="showUsernameModal(null)">Set username →</button>';
  var card='<input type="file" id="avatarInput" accept="image/*" style="display:none" onchange="handleAvatarFile(this)"><div class="trainer-card"><div class="tc-wm">'+pb(200)+'</div><div class="tc-top"><div class="tc-avatar" onclick="triggerAvatarUpload()">'+avHtml+'<div class="av-overlay">📷 Change</div></div><div class="tc-info"><div class="tc-label">Trainer</div><h2>'+dn+'</h2><div class="tc-email">'+usr.email+'</div><div class="name-edit"><input id="dnInput" value="'+dn+'" placeholder="Display name"><button onclick="saveDisplayName()">Save</button></div>'+unDisplay+'</div></div><div class="tc-stats"><div class="tc-stat"><div class="tc-sv" style="color:#22c55e">'+obtC+'</div><div class="tc-sl">Obtained</div></div><div class="tc-stat"><div class="tc-sv" style="color:#8b5cf6">'+shC+'</div><div class="tc-sl">Shinies</div></div><div class="tc-stat"><div class="tc-sv" style="color:#3b82f6">'+blC+'</div><div class="tc-sl">Builds</div></div><div class="tc-stat"><div class="tc-sv" style="color:#f59e0b">'+tmC+'</div><div class="tc-sl">Teams</div></div><div class="tc-stat"><div class="tc-sv" style="color:#ef4444">'+achUnlocked+'<span style="font-size:.8rem;opacity:.5">/'+allAch.length+'</span></div><div class="tc-sl">Achievements</div></div></div></div>';
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
  var accountHtml=
    '<div class="prof-account-section">'+
      '<h3 style="font-size:1.05rem;font-weight:700;margin-top:1.5rem;margin-bottom:.75rem;display:flex;align-items:center;gap:.4rem">⚙️ Account</h3>'+
      '<div class="prof-account-btns">'+
        '<button class="btn btn-ghost prof-signout-btn" onclick="logout()"><i class="ph-bold ph-sign-out"></i> Sign Out</button>'+
        '<button class="btn prof-delete-btn" onclick="confirmDeleteAccount()"><i class="ph-bold ph-trash"></i> Delete Account</button>'+
      '</div>'+
      '<p class="prof-delete-hint">Deleting your account permanently removes all your builds, teams, and Pokédex progress.</p>'+
    '</div>';
  c.innerHTML=card+achHtml+actHtml+accountHtml;
updProfileNavIcon()
}

// #SECTION: ACCOUNT ACTIONS (Drop F.3)
// ═══════════════════════════════════════

function confirmDeleteAccount(){
  resetConfirmMod();
  document.getElementById('cmEmoji').textContent='⚠️';
  document.getElementById('cmTitle').textContent='Delete Account?';
  document.getElementById('cmMsg').textContent='This permanently deletes your account, all builds, teams, and Pokédex progress. This cannot be undone.';
  var btn=document.getElementById('cmBtn');
  btn.textContent='Yes, delete everything';
  btn.className='btn btn-red';
  btn.onclick=function(){deleteAccount();};
  document.getElementById('confirmMod').classList.add('open');
}

async function deleteAccount(){
  closeCm();
  toast('Deleting account…','info');
  try{
    var uid=usr.id;
    // Delete all user data — order matters: junction tables first, then owned rows.
    // build_likes / team_likes cascade from builds/teams but we delete explicitly to be safe.
    // team_builds rows for this user's teams are handled by the teams DELETE cascade.
    await Promise.allSettled([
      rm('build_likes',{'user_id':'eq.'+uid},true),
      rm('team_likes',{'user_id':'eq.'+uid},true),
      rm('user_achievements',{'user_id':'eq.'+uid},true),
      rm('user_pokedex',{'user_id':'eq.'+uid},true),
      rm('user_items',{'user_id':'eq.'+uid},true)
    ]);
    // Builds and teams next (their cascade deletes handle remaining likes + team_builds)
    await Promise.allSettled([
      rm('builds',{'user_id':'eq.'+uid},true),
      rm('teams',{'user_id':'eq.'+uid},true)
    ]);
    // Profile last
    await rm('user_profiles',{'user_id':'eq.'+uid},true).catch(function(){});
    // Revoke server-side session
    await fetch(API+'/auth/v1/logout',{
      method:'POST',
      headers:{'apikey':ANON,'Authorization':'Bearer '+tk}
    }).catch(function(){});
    // Clear local state
    clearSessionState();
    allBuilds=[];allTeams=[];uDex={};uShinyDex={};uItems={};userProfile=null;
    saveSession();
    updAuth();renderDash();renderDex();renderItems();renderBuilds();renderTeams();renderProfile();updProfileNavIcon();
    toast('Account data deleted. Sorry to see you go.');
  }catch(e){
    toast(e.message||'Could not delete account','err');
  }
}

// #SECTION: USERNAME MODAL (Drop F.3)
// ═══════════════════════════════════════
// Bottom-sheet modal for setting a username.
// Triggered by edToggleShare / tmToggleShare when usr has no username.
// onSuccess callback is called after a successful save.
// ═══════════════════════════════════════

var _unSuccessCb=null,_unTimer=null;

function showUsernameModal(onSuccess){
  _unSuccessCb=onSuccess||null;
  var mod=document.getElementById('usernameMod');if(!mod)return;
  var inp=document.getElementById('unInput');
  var hint=document.getElementById('unHint');
  var btn=document.getElementById('unSaveBtn');
  var titleEl=mod.querySelector('.un-sheet-title');
  var descEl=mod.querySelector('.un-sheet-desc');
  var existing=userProfile&&userProfile.username?userProfile.username:'';
  // Pre-fill for "change" flow
  if(inp){inp.value=existing;inp.className='un-input'+(existing?' un-ok':'');}
  if(hint){hint.className='un-hint'+(existing?' ok':'');hint.textContent=existing?'@'+existing+' — current username':'';}
  if(btn){btn.disabled=true;btn.textContent='Set username';}
  if(titleEl)titleEl.textContent=existing?'Change your username':'Choose your username';
  if(descEl)descEl.textContent=existing?'Pick a new username. Your current links will continue to work.':'You need a username before sharing publicly. This is how other trainers will see you across Champions Forge.';
  mod.classList.add('open');
  setTimeout(function(){if(inp){inp.focus();inp.select();}},120);
}

function closeUsernameModal(){
  var mod=document.getElementById('usernameMod');
  if(mod)mod.classList.remove('open');
  _unSuccessCb=null;
  if(_unTimer){clearTimeout(_unTimer);_unTimer=null;}
}

function unCheckAvailability(el){
  if(_unTimer)clearTimeout(_unTimer);
  var v=el.value.trim();
  var hint=document.getElementById('unHint');
  var btn=document.getElementById('unSaveBtn');
  el.classList.remove('un-ok','un-err');
  if(hint){hint.className='un-hint';hint.textContent='';}
  if(btn)btn.disabled=true;
  if(!v)return;
  if(!/^[a-zA-Z0-9_-]{3,20}$/.test(v)){
    el.classList.add('un-err');
    if(hint){hint.className='un-hint err';hint.textContent='3–20 characters, letters numbers _ -';}
    return;
  }
  if(hint){hint.className='un-hint neutral';hint.textContent='Checking…';}
  _unTimer=setTimeout(async function(){
    try{
      // Exclude current user so editing back to their own username shows "available"
      var qParams={'username':'ilike.'+v.toLowerCase(),select:'id'};
      if(usr)qParams['user_id']='neq.'+usr.id;
      var rows=await q('user_profiles',qParams,false);
      if(rows&&rows.length>0){
        el.classList.add('un-err');
        if(hint){hint.className='un-hint err';hint.textContent='@'+v+' is taken';}
      }else{
        el.classList.add('un-ok');
        if(hint){hint.className='un-hint ok';hint.textContent='@'+v+' is available';}
        if(btn)btn.disabled=false;
      }
    }catch(e){
      if(hint){hint.className='un-hint neutral';hint.textContent='Could not check availability';}
    }
  },450);
}

async function unSave(){
  var inp=document.getElementById('unInput');
  var btn=document.getElementById('unSaveBtn');
  if(!inp||!usr||!userProfile)return;
  var v=inp.value.trim().toLowerCase();
  if(!v||!/^[a-zA-Z0-9_-]{3,20}$/.test(v))return;
  btn.disabled=true;btn.textContent='Saving…';
  try{
    await upd('user_profiles',{'user_id':'eq.'+usr.id},{username:v},true);
    userProfile.username=v;
    toast('Username set to @'+v+' ✨');
    closeUsernameModal();
    if(_unSuccessCb){var cb=_unSuccessCb;_unSuccessCb=null;cb();}
  }catch(e){
    toast(e.message||'Failed to save username','err');
    btn.disabled=false;btn.textContent='Set username';
  }
}
