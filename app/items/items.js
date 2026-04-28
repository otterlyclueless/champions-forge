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

