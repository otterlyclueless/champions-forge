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

// #SECTION: NATURES
// ═══════════════════════════════════════
// NATURES
// Load and render nature data.
// ═══════════════════════════════════════

var allNatures=[];
async function loadNatures(){try{allNatures=await q('natures',{order:'name.asc'});renderNatures()}catch(e){}}
function renderNatures(){var sL={hp:'HP',attack:'Attack',defense:'Defense',sp_attack:'Sp.Atk',sp_defense:'Sp.Def',speed:'Speed'};document.getElementById('natGrid').innerHTML=allNatures.map(function(n){var d=n.increased_stat?'<span class="nat-up">▲ '+sL[n.increased_stat]+'</span> <span class="nat-down">▼ '+sL[n.decreased_stat]+'</span>':'<span class="nat-neutral">Neutral</span>';return'<div class="nat-card"><div class="nat-name">'+n.name+'</div><div class="nat-stat">'+d+'</div></div>'}).join('')}

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
  if(inp){inp.value='';inp.className='un-input';}
  if(hint){hint.className='un-hint';hint.textContent='';}
  if(btn){btn.disabled=true;btn.textContent='Set username';}
  mod.classList.add('open');
  setTimeout(function(){if(inp)inp.focus();},120);
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
      var rows=await q('user_profiles',{'username':'ilike.'+v.toLowerCase(),select:'id'},false);
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
