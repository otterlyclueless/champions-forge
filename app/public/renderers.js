// #SECTION: PUBLIC RENDERERS (Drop F.2 — full detail)
// ═══════════════════════════════════════
// PUBLIC RENDERERS
// Full read-only detail layout with share_fields customisation support.
// Each renderer fetches exactly what it needs (doesn't rely on allPkmn being
// loaded), because the router can fire before reference data is ready.
// ═══════════════════════════════════════

function pubEscape(s){
  if(s==null)return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Build a "by @handle" byline. If no username, show Unknown trainer.
function pubByline(author){
  if(author&&author.username){
    var u=pubEscape(author.username);
    return 'by <a href="#/u/'+u+'">@'+u+'</a>';
  }
  return 'by <span style="opacity:.7">Unknown trainer</span>';
}

// Build type-chip HTML from a pokemon row. Uses TC (type colour) table.
function pubTypeChips(p){
  if(!p||!p.type_1)return '';
  var types=[p.type_1];if(p.type_2)types.push(p.type_2);
  var html='<div class="pub-types">';
  types.forEach(function(t){
    var col=TC[t];if(!col)return;
    html+='<span class="pub-type-chip" style="background:linear-gradient(135deg,'+col.m+','+col.d+')">'+pubEscape(t)+'</span>';
  });
  html+='</div>';
  return html;
}

// Compute radial glow style from a Pokémon's types. For shiny variants,
// callers substitute a gold→red gradient via CSS .shiny modifier.
function pubGlowStyle(p){
  if(!p||!p.type_1||!TC[p.type_1])return '';
  var c1=TC[p.type_1];
  var c2=p.type_2&&TC[p.type_2]?TC[p.type_2]:c1;
  function hexToRgb(hex){
    var h=hex.replace('#','');
    if(h.length===3)h=h.split('').map(function(ch){return ch+ch}).join('');
    return[parseInt(h.substring(0,2),16),parseInt(h.substring(2,4),16),parseInt(h.substring(4,6),16)];
  }
  var rgb1=hexToRgb(c1.m),rgb2=hexToRgb(c2.m);
  return 'background:radial-gradient(circle,rgba('+rgb1.join(',')+',.35) 0%,rgba('+rgb2.join(',')+',.18) 40%,transparent 70%);';
}

// Read share_fields JSONB with safe defaults. NULL = all visible. For builds,
// {moves,ability,stats,item} default to true when key absent. For teams,
// {type_coverage} defaults to false.
function pubGetShareFields(raw,kind){
  if(kind==='team'){
    var t={type_coverage:false};
    if(raw&&typeof raw==='object'){
      if(raw.type_coverage===true)t.type_coverage=true;
    }
    return t;
  }
  // build
  var b={moves:true,ability:true,stats:true,item:true};
  if(raw&&typeof raw==='object'){
    if(raw.moves===false)b.moves=false;
    if(raw.ability===false)b.ability=false;
    if(raw.stats===false)b.stats=false;
    if(raw.item===false)b.item=false;
  }
  return b;
}

// Nature-mod stat name map (app-core DB uses 'attack','defense','sp_attack','sp_defense','speed','hp')
var PUB_NAT_MAP={hp:'hp',attack:'atk',defense:'def',sp_attack:'spa',sp_defense:'spd',speed:'spe'};

// Level 50 Champions stat calc (mirrors bsCalcStatFor). Kept local so the
// renderer doesn't depend on app-builds being loaded first.
function pubCalcStat(key,base,spVal,natureRow){
  var m=1;
  if(natureRow){
    if(PUB_NAT_MAP[natureRow.increased_stat]===key)m=1.1;
    if(PUB_NAT_MAP[natureRow.decreased_stat]===key)m=0.9;
  }
  if(key==='hp')return Math.floor((2*base+31)*50/100)+60+spVal;
  return Math.floor((Math.floor((2*base+31)*50/100)+5)*m)+spVal;
}

// Pretty-print stat names for nature chip
function pubStatShort(dbName){
  var map={attack:'Atk',defense:'Def',sp_attack:'SpA',sp_defense:'SpD',speed:'Spe',hp:'HP'};
  return map[dbName]||dbName;
}

// Render an info card (label + value + optional sub) for the 2-col grid
function pubInfoCard(label,val,subHtml){
  return (
    '<div class="pub-info-card">'+
      '<div class="label">'+pubEscape(label)+'</div>'+
      '<div class="val">'+pubEscape(val)+'</div>'+
      (subHtml?'<div class="val-sub">'+subHtml+'</div>':'')+
    '</div>'
  );
}

// Render the nature card with ▲ / ▼ stat chips
function pubNatureCard(nature){
  if(!nature)return pubInfoCard('Nature','—','');
  var upHtml='',downHtml='';
  if(nature.increased_stat&&nature.increased_stat!==nature.decreased_stat){
    upHtml='<span class="nat-up">▲ '+pubStatShort(nature.increased_stat)+'</span>';
  }
  if(nature.decreased_stat&&nature.increased_stat!==nature.decreased_stat){
    downHtml='<span class="nat-down">▼ '+pubStatShort(nature.decreased_stat)+'</span>';
  }
  var sub=upHtml+' '+downHtml;
  if(!upHtml&&!downHtml)sub='Neutral';
  return pubInfoCard('Nature',nature.name||'—',sub);
}

// Render the held item row (full-width with sprite + description)
function pubItemRow(item){
  if(!item||!item.name){
    return '<div class="pub-info-row empty"><div class="val">— None —</div></div>';
  }
  var img=item.sprite_url?'<img class="item-img" src="'+pubEscape(item.sprite_url)+'" alt="">':'<span class="item-img" style="display:inline-flex;align-items:center;justify-content:center;font-size:1rem">🎒</span>';
  var desc=item.short_description||item.description||'';
  return (
    '<div class="pub-info-row">'+
      img+
      '<div class="item-text">'+
        '<div class="name">'+pubEscape(item.name)+'</div>'+
        (desc?'<div class="desc">'+pubEscape(desc)+'</div>':'')+
      '</div>'+
    '</div>'
  );
}

// Drop F.2.1: Full stat section — Bars/Hex toggle + per-stat SP tags, matching
// the in-app build detail. Reuses the `.bs-*` classes already styled for the
// editor + detail view and the globally-defined helpers `bsGetCalcStatsFor`
// (app-builds.js) and `bdBuildHex` (app-builds.js). BST total and SP-used bar
// intentionally omitted — user wanted just the stat spread visible.
var pubStatView='bars'; // 'bars' | 'hex'

function pubToggleStatView(view){
  if(view!=='bars'&&view!=='hex')return;
  pubStatView=view;
  // Toggle active class on the two view containers + buttons
  var bars=document.getElementById('pub-barsView');
  var hex=document.getElementById('pub-hexView');
  if(bars)bars.classList.toggle('active',view==='bars');
  if(hex)hex.classList.toggle('active',view==='hex');
  document.querySelectorAll('.pub-stats-section .bs-view-btn').forEach(function(btn){
    btn.classList.toggle('active',btn.getAttribute('data-view')===view);
  });
}

function pubStatsSection(pk,sp,nature){
  if(!pk)return '';
  // Map our spObj to the shape bsGetCalcStatsFor expects: {hp,atk,def,spa,spd,spe}
  var spObj={
    hp:(sp&&sp.hp_sp)||0,
    atk:(sp&&sp.atk_sp)||0,
    def:(sp&&sp.def_sp)||0,
    spa:(sp&&sp.spa_sp)||0,
    spd:(sp&&sp.spd_sp)||0,
    spe:(sp&&sp.spe_sp)||0
  };
  var stats;
  // Prefer the shared helper (consistent math with editor + in-app detail).
  if(typeof bsGetCalcStatsFor==='function'){
    stats=bsGetCalcStatsFor(pk,spObj,nature);
  }else{
    // Defensive fallback — shouldn't hit since app-builds loads first.
    stats=['hp','atk','def','spa','spd','spe'].map(function(k){
      var dbCol={hp:'base_hp',atk:'base_atk',def:'base_def',spa:'base_spa',spd:'base_spd',spe:'base_spe'}[k];
      var base=pk[dbCol]||0;var spVal=spObj[k]||0;
      return{key:k,base:base,sp:spVal,calc:pubCalcStat(k,base,spVal,nature),natMod:1};
    });
  }

  // Fallback to our own colour/name maps if the globals haven't loaded (shouldn't happen)
  var BSCm=(typeof BSC!=='undefined')?BSC:{hp:'#a78bfa',atk:'#f97316',def:'#3b82f6',spa:'#fdba74',spd:'#7dd3fc',spe:'#fb7185'};
  var BSNm=(typeof BSN!=='undefined')?BSN:{hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'};

  // Bars HTML — mirrors renderBuildDetail's bars exactly so visuals match.
  var barsHtml='<div class="bs-grid">'+stats.map(function(st){
    var spVal=spObj[st.key]||0;
    var pct=Math.min(st.calc/300*100,100);
    var natInd=st.natMod>1?'<span style="color:var(--green)">▲</span>':st.natMod<1?'<span style="color:var(--red)">▼</span>':'';
    return (
      '<div class="bs-row">'+
        '<span class="bs-label">'+BSNm[st.key]+'</span>'+
        '<div class="bs-track"><div class="bs-fill" style="width:'+pct+'%;background:'+BSCm[st.key]+'"></div></div>'+
        '<span class="bs-val" style="color:'+BSCm[st.key]+'">'+st.calc+'</span>'+
        '<span class="bs-sp-tag'+(spVal>0?' has-sp':'')+'">+'+spVal+'</span>'+
        '<span class="bs-nat-ind">'+natInd+'</span>'+
      '</div>'
    );
  }).join('')+'</div>';

  // Hex — use the existing helper from app-builds.js for consistency
  var hexHtml=(typeof bdBuildHex==='function')?bdBuildHex(pk,stats):'<div style="padding:1rem;color:var(--muted);font-size:.78rem;text-align:center">Hex view unavailable</div>';

  return (
    '<div class="pub-stats-section">'+
      '<div class="bs-view-toggle">'+
        '<button class="bs-view-btn'+(pubStatView==='bars'?' active':'')+'" data-view="bars" onclick="pubToggleStatView(\'bars\')">📊 Bars</button>'+
        '<button class="bs-view-btn'+(pubStatView==='hex'?' active':'')+'" data-view="hex" onclick="pubToggleStatView(\'hex\')">⬢ Hex</button>'+
      '</div>'+
      '<div class="bs-view'+(pubStatView==='bars'?' active':'')+'" id="pub-barsView">'+barsHtml+'</div>'+
      '<div class="bs-view'+(pubStatView==='hex'?' active':'')+'" id="pub-hexView">'+hexHtml+'</div>'+
    '</div>'
  );
}

// Render a 2x2 move card grid. `movesMeta` is a map from name → row from the
// moves table. Missing metadata (typo'd move names, non-in_champions) falls
// back to a muted card.
function pubMoveCards(moveNames,movesMeta){
  var names=(moveNames||[]).filter(function(m){return m&&m.trim()});
  if(!names.length){
    return '<div class="pub-empty-moves">No moves set</div>';
  }
  var html='<div class="pub-moves">';
  names.forEach(function(name){
    var meta=movesMeta[name]||null;
    var type=meta?meta.type:'Normal';
    var cat=meta?meta.category:'—';
    var power=meta?(meta.champions_power!=null?meta.champions_power:meta.power):null;
    var priority=meta?meta.priority:0;
    var catShort=(cat||'').toLowerCase()==='physical'?'PHY':(cat||'').toLowerCase()==='special'?'SPC':(cat||'').toLowerCase()==='status'?'STATUS':'—';
    // Footer varies by move type: status shows description snippet or "+Atk/Spe"-style; damage shows BP + priority
    var footRight='';
    if(catShort==='STATUS'){
      // Use description if available; try to summarise for known stat-boost moves
      var desc=meta?(meta.short_description||meta.description||''):'';
      // Quick pattern for Dragon Dance / Swords Dance / etc: "Raises the user's X and Y by 1"
      var sm=desc.match(/Raises? the user's ([A-Za-z]+)(?:\s+and\s+([A-Za-z]+))?/i);
      if(sm){
        var s1=sm[1];var s2=sm[2];
        footRight='+'+s1.substring(0,3)+(s2?'/'+s2.substring(0,3):'');
      }else if(desc.length>0){
        footRight=desc.length>20?desc.substring(0,18)+'…':desc;
      }else{
        footRight='—';
      }
    }else{
      if(power&&power>0){
        footRight=power+' BP';
        if(priority&&priority>0)footRight+=' · +'+priority+' prio';
        else if(priority&&priority<0)footRight+=' · '+priority+' prio';
      }else{
        footRight=priority&&priority!==0?(priority>0?'+':'')+priority+' prio':'—';
      }
    }
    var typeClass='t-'+pubEscape(type);
    html+=(
      '<div class="pub-move '+typeClass+'">'+
        '<div class="pub-move-name">'+pubEscape(name)+'</div>'+
        '<div class="pub-move-foot"><span class="pub-move-cat">'+catShort+'</span><span class="pub-move-power">'+pubEscape(footRight)+'</span></div>'+
      '</div>'
    );
  });
  html+='</div>';
  return html;
}

// Team type coverage: for each of 18 attacking types, multiply effectiveness
// across all 6 members' defensive types. Return grouped by bucket.
function pubTeamCoverage(members){
  if(!members||!members.length||typeof TCHART!=='object')return null;
  var buckets={weak:[],resist:[]};
  // For each attacking type, compute the team's aggregate multiplier average
  // Simpler: count how many members are weak / resist to each type, show strongest
  ALL_T.forEach(function(attackType){
    var weakCount=0,resistCount=0,immuneCount=0;
    members.forEach(function(m){
      if(!m.type_1)return;
      var mult=1;
      var vs1=TCHART[attackType]&&TCHART[attackType][m.type_1];
      if(vs1!==undefined)mult=vs1;
      if(m.type_2){
        var vs2=TCHART[attackType]&&TCHART[attackType][m.type_2];
        if(vs2!==undefined)mult*=vs2;
      }
      if(mult>=2)weakCount++;
      else if(mult>0&&mult<=0.5)resistCount++;
      else if(mult===0)immuneCount++;
    });
    // Team is "weak to X" if majority of members are weak (3+)
    if(weakCount>=3)buckets.weak.push(attackType);
    // Team "resists X" if majority resist or are immune (3+)
    if(resistCount+immuneCount>=3)buckets.resist.push(attackType);
  });
  return buckets;
}

function pubTeamCoverageHtml(members){
  var cov=pubTeamCoverage(members);if(!cov)return '';
  function pillList(types){
    if(!types.length)return '<span class="pt-cov-none">—</span>';
    return types.map(function(t){
      var col=TC[t];if(!col)return '';
      // Ice/Steel/Fairy light backgrounds need dark text for contrast
      var textCol=(t==='Ice'||t==='Steel'||t==='Fairy')?'color:#1e293b':'color:#fff';
      return '<span class="pt-cov-pill" style="background:linear-gradient(135deg,'+col.m+','+col.d+');'+textCol+'">'+pubEscape(t)+'</span>';
    }).join('');
  }
  return (
    '<div class="pub-section">'+
      '<div class="pub-section-head"><span>Type Coverage</span></div>'+
      '<div class="pt-coverage">'+
        '<div class="pt-cov-row"><span class="pt-cov-label">Resists</span><div class="pt-cov-bar">'+pillList(cov.resist)+'</div></div>'+
        '<div class="pt-cov-row"><span class="pt-cov-label">Weak to</span><div class="pt-cov-bar">'+pillList(cov.weak)+'</div></div>'+
      '</div>'+
    '</div>'
  );
}

async function renderPublicBuild(code){
  var host=document.getElementById('pg-public');if(!host)return;
  host.innerHTML=
    '<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
    '<div class="pub-wrap"><div class="pub-card"><div class="pub-loading">⏳ Loading build…</div></div></div>';

  try{
    // Anon path uses apikey-only headers; authenticated users get authFetch.
    var needsAuth=!!tk;
    // Full fetch — one round trip. Uses the builds table (not build_details view)
    // for predictable column names.
    var rows=await q('builds',{
      share_code:'eq.'+code,
      is_public:'eq.true',
      select:'id,name,user_id,pokemon_id,is_shiny,battle_format,archetype,ability,item_id,nature_id,move_1,move_2,move_3,move_4,hp_sp,atk_sp,def_sp,spa_sp,spd_sp,spe_sp,share_fields,created_at'
    },needsAuth);

    if(!rows||!rows.length){host.innerHTML=pubNotFoundHtml('build');return}
    var b=rows[0];
    var sf=pubGetShareFields(b.share_fields,'build');

    // Parallel fetch: author profile, pokemon, item (if set), nature (if set), moves
    var profilesP=q('user_profiles',{user_id:'eq.'+b.user_id,select:'username,display_name'},needsAuth).catch(function(){return[]});
    var pkP=q('pokemon',{id:'eq.'+b.pokemon_id,select:'id,name,type_1,type_2,image_url,shiny_url,is_mega,base_hp,base_atk,base_def,base_spa,base_spd,base_spe'},needsAuth).catch(function(){return[]});
    var itemP=b.item_id?q('items',{id:'eq.'+b.item_id,select:'name,sprite_url,short_description,description'},needsAuth).catch(function(){return[]}):Promise.resolve([]);
    var natureP=b.nature_id?q('natures',{id:'eq.'+b.nature_id,select:'name,increased_stat,decreased_stat'},needsAuth).catch(function(){return[]}):Promise.resolve([]);
    var moveNames=[b.move_1,b.move_2,b.move_3,b.move_4].filter(function(m){return m&&m.trim()});
    var movesP=moveNames.length?q('moves',{
      name:'in.('+moveNames.map(function(n){return '"'+n.replace(/"/g,'\\"')+'"'}).join(',')+')',
      select:'name,type,category,power,accuracy,pp,priority,short_description,champions_power,champions_accuracy,champions_pp'
    },needsAuth).catch(function(){return[]}):Promise.resolve([]);

    // Likes — always fetch (anon can read likes on public content per RLS)
    var likesP=q('build_likes',{build_id:'eq.'+b.id,select:'user_id'},false).catch(function(){return[]});

    var results=await Promise.all([profilesP,pkP,itemP,natureP,movesP,likesP]);
    var author=results[0]&&results[0][0]?results[0][0]:{};
    var pk=results[1]&&results[1][0]?results[1][0]:null;
    var item=results[2]&&results[2][0]?results[2][0]:null;
    var nature=results[3]&&results[3][0]?results[3][0]:null;
    var movesMeta={};(results[4]||[]).forEach(function(m){movesMeta[m.name]=m});
    var likeRows=results[5]||[];
    var likeData={id:b.id,ownerId:b.user_id,count:likeRows.length,liked:!!(usr&&likeRows.some(function(r){return r.user_id===usr.id}))};

    host.innerHTML=pubBuildFullHtml(b,author,pk,item,nature,movesMeta,sf,likeData);
  }catch(e){
    console.log('renderPublicBuild failed:',e);
    host.innerHTML=pubErrorHtml('build',e.message||'Unknown error');
  }
}

async function renderPublicTeam(code){
  var host=document.getElementById('pg-public');if(!host)return;
  host.innerHTML=
    '<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
    '<div class="pub-wrap"><div class="pub-card"><div class="pub-loading">⏳ Loading team…</div></div></div>';

  try{
    var needsAuth=!!tk;
    var rows=await q('teams',{
      share_code:'eq.'+code,
      is_public:'eq.true',
      select:'id,name,user_id,format,share_fields,roster_size,created_at'
    },needsAuth);
    if(!rows||!rows.length){host.innerHTML=pubNotFoundHtml('team');return}
    var t=rows[0];
    var sf=pubGetShareFields(t.share_fields,'team');

    // Parallel: author profile + team_builds join to get all member builds
    // team_builds RLS lets anon read when parent team is public — then we
    // nested-select the build + pokemon in one round trip.
    var profilesP=q('user_profiles',{user_id:'eq.'+t.user_id,select:'username,display_name'},needsAuth).catch(function(){return[]});
    var membersP=q('team_builds',{
      team_id:'eq.'+t.id,
      select:'slot_position,builds(id,name,is_public,share_code,is_shiny,pokemon_id,pokemon(id,name,type_1,type_2,image_url,shiny_url,is_mega))',
      order:'slot_position.asc'
    },needsAuth).catch(function(){return[]});

    var likesP=q('team_likes',{team_id:'eq.'+t.id,select:'user_id'},false).catch(function(){return[]});

    var results=await Promise.all([profilesP,membersP,likesP]);
    var author=results[0]&&results[0][0]?results[0][0]:{};
    var memberRows=results[1]||[];
    var likeRows=results[2]||[];
    var likeData={id:t.id,ownerId:t.user_id,count:likeRows.length,liked:!!(usr&&likeRows.some(function(r){return r.user_id===usr.id}))};

    // Flatten the nested structure for the renderer
    var members=memberRows.map(function(row){
      var build=row.builds||{};
      var pk=build.pokemon||{};
      return {
        slot:row.slot_position,
        build_id:build.id,
        build_name:build.name,
        build_is_public:!!build.is_public,
        build_share_code:build.share_code||null,
        is_shiny:!!build.is_shiny,
        pk_id:pk.id,
        pk_name:pk.name,
        type_1:pk.type_1,
        type_2:pk.type_2,
        image_url:pk.image_url,
        shiny_url:pk.shiny_url
      };
    }).filter(function(m){return m.pk_id});

    host.innerHTML=pubTeamFullHtml(t,author,members,sf,likeData);
  }catch(e){
    console.log('renderPublicTeam failed:',e);
    host.innerHTML=pubErrorHtml('team',e.message||'Unknown error');
  }
}

async function renderPublicProfile(username){
  var host=document.getElementById('pg-public');if(!host)return;
  host.innerHTML='<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
    '<div class="pub-wrap"><div class="pub-loading">Loading @'+pubEscape(username)+'…</div></div>'+pubCtaHtml();
  try{
    var profiles=await fetch(API+'/rest/v1/user_profiles?username=eq.'+encodeURIComponent(username)+'&select=user_id,display_name,username,avatar_url',{headers:{'apikey':ANON}}).then(function(r){return r.json()});
    if(!profiles||!profiles.length){
      host.innerHTML='<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
        '<div class="pub-wrap"><div class="pub-card"><div class="pub-404">👤</div><div class="pub-name">@'+pubEscape(username)+'</div><div class="pub-author">Trainer not found</div></div></div>'+pubCtaHtml();
      return;
    }
    var profile=profiles[0];var uid=profile.user_id;
    var builds=await fetch(API+'/rest/v1/build_details?user_id=eq.'+uid+'&is_public=eq.true&order=created_at.desc&limit=10',{headers:{'apikey':ANON}}).then(function(r){return r.json()}).catch(function(){return[];});
    if(!Array.isArray(builds))builds=[];
    var fs=typeof getFriendStatus==='function'&&usr?getFriendStatus(uid):{status:'none',rowId:null,iAmReq:false};
    var isOwn=usr&&usr.id===uid;
    var av=profile.avatar_url?'<img src="'+pubEscape(profile.avatar_url)+'" style="width:52px;height:52px;border-radius:14px;object-fit:cover" onerror="this.style.display=\'none\'">':'<span style="font-size:1.5rem">👤</span>';
    var afBtn='';
    if(usr&&!isOwn){
      var afCls=fs.status==='accepted'?'pub-add-friend-btn friends':fs.status==='pending'?'pub-add-friend-btn pending':'pub-add-friend-btn';
      var afTxt=fs.status==='accepted'?'✓ Friends':fs.status==='pending'&&fs.iAmReq?'⏳ Request Sent':fs.status==='pending'&&!fs.iAmReq?'Accept →':'Add Friend';
      var afClick=fs.status==='accepted'?'':fs.status==='pending'&&!fs.iAmReq?'pubAcceptFriend(\''+fs.rowId+'\')':'pubSendFriendRequest(\''+uid+'\')';
      afBtn='<button class="'+afCls+'" id="pubAfBtn" onclick="'+afClick+'">'+afTxt+'</button>';
    }
    var buildsHtml='';
    if(builds.length){
      buildsHtml='<div class="pub-section"><div class="pub-section-head">Public Builds</div>'+
        builds.map(function(b){
          var img=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
          return'<div class="pub-build-row" onclick="location.hash=\'#/b/'+pubEscape(b.share_code||'')+'\'">'+
            (img?'<img class="pub-build-thumb" src="'+pubEscape(img)+'" onerror="this.style.opacity=.2">':'<div class="pub-build-thumb"></div>')+
            '<div class="pub-build-info"><div class="pub-build-name">'+pubEscape(b.build_name||'Unnamed')+'</div><div class="pub-build-sub">'+pubEscape(b.type_1||'')+(b.type_2?' · '+pubEscape(b.type_2):'')+' · '+(b.battle_format||'Singles')+'</div></div>'+
            '<span class="pub-chevron">›</span>'+
          '</div>';
        }).join('')+
      '</div>';
    }else{buildsHtml='<div class="pub-section" style="text-align:center;padding:1.5rem 0;color:var(--muted);font-size:.82rem">No public builds yet</div>';}
    host.innerHTML=
      '<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
      '<div class="pub-wrap">'+
        '<div class="pub-profile-header">'+
          '<div class="pub-av-wrap">'+av+'</div>'+
          '<div class="pub-profile-info">'+
            '<div class="pub-name">'+pubEscape(profile.display_name||'Trainer')+'</div>'+
            '<div class="pub-un-row">@'+pubEscape(profile.username||username)+'</div>'+
            '<div style="font-size:.72rem;color:var(--muted);margin-top:3px">'+builds.length+' public build'+(builds.length!==1?'s':'')+'</div>'+
          '</div>'+
        '</div>'+
        (afBtn?'<div class="pub-af-row">'+afBtn+'</div>':'')+
        buildsHtml+
      '</div>'+
      pubCtaHtml();
  }catch(e){
    host.innerHTML='<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
      '<div class="pub-wrap"><div class="pub-card"><div class="pub-404">⚠️</div><div class="pub-author">Failed to load profile</div></div></div>'+pubCtaHtml();
  }
}
async function pubSendFriendRequest(toId){
  if(!usr){showLoginModal('Sign in to add friends');return;}
  if(!userProfile||!userProfile.username){
    if(typeof showUsernameModal==='function')showUsernameModal(function(){pubSendFriendRequest(toId);});
    return;
  }
  var btn=document.getElementById('pubAfBtn');if(!btn)return;
  btn.disabled=true;btn.textContent='Sending…';
  try{
    await authFetch(API+'/rest/v1/friends',{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=representation'}),body:JSON.stringify({requester_id:usr.id,addressee_id:toId,status:'pending'})});
    btn.className='pub-add-friend-btn pending';btn.textContent='⏳ Request Sent';btn.disabled=true;
    if(typeof allFriends!=='undefined'&&!allFriends.find(function(f){return f.friend_id===toId;}))
      allFriends.push({id:'local-'+Date.now(),friend_id:toId,status:'pending',i_am_requester:true,display_name:'',username:'',avatar_url:''});
    toast('Friend request sent! 👥');
  }catch(e){btn.disabled=false;btn.textContent='Add Friend';toast('Failed to send request','err');}
}
async function pubAcceptFriend(rowId){
  if(!usr)return;
  var btn=document.getElementById('pubAfBtn');if(!btn)return;
  btn.disabled=true;
  try{
    await authFetch(API+'/rest/v1/friends?id=eq.'+rowId,{method:'PATCH',headers:Object.assign(h(true),{'Prefer':'return=minimal'}),body:JSON.stringify({status:'accepted'})});
    var f=typeof allFriends!=='undefined'?allFriends.find(function(x){return x.id===rowId;}):null;
    if(f)f.status='accepted';
    btn.className='pub-add-friend-btn friends';btn.textContent='✓ Friends';
    toast('Friend added! 👥');
    if(typeof updProfileNavBadge==='function')updProfileNavBadge();
  }catch(e){btn.disabled=false;toast('Could not accept','err');}
}

// ═══════════════════════════════════════
// HTML BUILDERS — FULL PUBLIC DETAIL
// ═══════════════════════════════════════

function pubBuildFullHtml(b,author,pk,item,nature,movesMeta,sf,likeData){
  var name=b.name||(pk?pk.name:'Unnamed build');
  var isShiny=!!b.is_shiny;
  var spriteUrl=pk?(isShiny&&pk.shiny_url?pk.shiny_url:pk.image_url):'';
  var spriteHtml=spriteUrl?'<img class="pub-sprite" src="'+pubEscape(spriteUrl)+'" alt="'+pubEscape(pk.name||'')+'">':'';
  var shinyBadge=isShiny?'<div class="pub-shiny-badge"><span class="star">✦</span><span>SHINY</span></div>':'';
  var glow=pubGlowStyle(pk);
  var cardClass='pub-card'+(isShiny?' shiny':'');

  // Meta chips row: format + archetype (both always-shared)
  var metaChips='';
  if(b.battle_format)metaChips+='<span class="pub-meta-chip"><strong>'+pubEscape(b.battle_format)+'</strong></span>';
  if(b.archetype)metaChips+='<span class="pub-meta-chip">'+pubEscape(b.archetype)+'</span>';

  // Ability + Nature in 2-col grid
  var abilityCard='';
  if(sf.ability){
    var abilityVal=b.ability&&b.ability.trim()?b.ability.trim():'—';
    abilityCard=pubInfoCard('Ability',abilityVal,'');
  }
  var natureCard=pubNatureCard(nature); // Nature always shared

  var infoGridHtml='';
  if(sf.ability){
    infoGridHtml='<div class="pub-section"><div class="pub-2col">'+abilityCard+natureCard+'</div></div>';
  }else{
    // Just nature, full-width
    infoGridHtml='<div class="pub-section"><div class="pub-section-head">Nature</div><div class="pub-info-row" style="display:flex;flex-direction:column;gap:.15rem;align-items:flex-start"><div class="val" style="font-size:.88rem;color:var(--text);font-weight:700">'+pubEscape(nature?nature.name:'—')+'</div>'+(nature?'<div class="val-sub" style="display:flex;gap:.35rem;font-size:.66rem">'+(nature.increased_stat!==nature.decreased_stat?'<span class="nat-up" style="color:var(--green);font-weight:800">▲ '+pubStatShort(nature.increased_stat)+'</span> <span class="nat-down" style="color:#fb7185;font-weight:800">▼ '+pubStatShort(nature.decreased_stat)+'</span>':'<span>Neutral</span>')+'</div>':'')+'</div></div>';
  }

  // Item row (if toggle on)
  var itemSectionHtml='';
  if(sf.item){
    itemSectionHtml=
      '<div class="pub-section">'+
        '<div class="pub-section-head">Held Item</div>'+
        pubItemRow(item)+
      '</div>';
  }

  // Stats section — full parity with in-app: bars/hex toggle + per-stat SP tags
  var statsSectionHtml='';
  if(sf.stats){
    var sp={hp_sp:b.hp_sp||0,atk_sp:b.atk_sp||0,def_sp:b.def_sp||0,spa_sp:b.spa_sp||0,spd_sp:b.spd_sp||0,spe_sp:b.spe_sp||0};
    statsSectionHtml=
      '<div class="pub-section">'+
        '<div class="pub-section-head">Stat Allocation <span class="sub">· Lv 50</span></div>'+
        pubStatsSection(pk,sp,nature)+
      '</div>';
  }

  // Moves section
  var movesSectionHtml='';
  if(sf.moves){
    var moveNames=[b.move_1,b.move_2,b.move_3,b.move_4];
    movesSectionHtml=
      '<div class="pub-section">'+
        '<div class="pub-section-head">Moves</div>'+
        pubMoveCards(moveNames,movesMeta)+
      '</div>';
  }

  return (
    '<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
    '<div class="scroll-area">'+
      '<div class="pub-hero">'+
        '<div class="'+cardClass+'">'+
          (glow?'<div class="pub-glow" style="'+glow+'"></div>':'<div class="pub-glow"></div>')+
          '<div class="pub-sprite-wrap">'+
            spriteHtml+
            shinyBadge+
          '</div>'+
          pubTypeChips(pk)+
          '<div class="pub-name">'+pubEscape(name)+'</div>'+
          '<div class="pub-author">'+pubByline(author)+'</div>'+
          (metaChips?'<div class="pub-meta-row">'+metaChips+'</div>':'')+
        '</div>'+
      '</div>'+
      infoGridHtml+
      itemSectionHtml+
      statsSectionHtml+
      movesSectionHtml+
      pubSocialRowHtml('build',likeData)+
    '</div>'+
    pubCtaHtml()
  );
}

function pubTeamFullHtml(t,author,members,sf,likeData){
  var rosterSize=Math.max(members.length,Math.min(6,t.roster_size||6));
  var visibleMembers=members.slice(0,rosterSize);
  var memberCardsHtml='';
  visibleMembers.forEach(function(m){
    var spriteUrl=m.is_shiny&&m.shiny_url?m.shiny_url:m.image_url;
    var sprite=spriteUrl?'<img class="pt-mem-sprite" src="'+pubEscape(spriteUrl)+'" alt="'+pubEscape(m.pk_name||'')+'">':'';
    var t1=m.type_1,t2=m.type_2;
    var typeChips='<div class="pt-mem-types">';
    if(t1&&TC[t1])typeChips+='<span class="pt-mem-type-chip" style="background:linear-gradient(135deg,'+TC[t1].m+','+TC[t1].d+')">'+pubEscape(t1)+'</span>';
    if(t2&&TC[t2])typeChips+='<span class="pt-mem-type-chip" style="background:linear-gradient(135deg,'+TC[t2].m+','+TC[t2].d+')">'+pubEscape(t2)+'</span>';
    typeChips+='</div>';

    // Corner badge: arrow-up-right for tappable (public member build), lock for private
    var isTappable=m.build_is_public&&m.build_share_code;
    var cornerBadge=isTappable
      ?'<div class="pt-mem-link" title="Tap to view this build"><i class="ph-bold ph-arrow-up-right"></i></div>'
      :'<div class="pt-mem-lock" title="Build not shared individually"><i class="ph-bold ph-lock"></i></div>';
    var onclickAttr=isTappable?' onclick="location.hash=\'#/b/'+pubEscape(m.build_share_code)+'\'"':'';
    var cardClass='pt-mem'+(isTappable?' tappable':' private');

    memberCardsHtml+=(
      '<div class="'+cardClass+'"'+onclickAttr+'>'+
        cornerBadge+
        sprite+
        '<div class="pt-mem-name">'+pubEscape(m.pk_name||'—')+'</div>'+
        typeChips+
      '</div>'
    );
  });
  for(var i=visibleMembers.length;i<rosterSize;i++){
    memberCardsHtml+='<div class="pt-mem pt-mem-empty-slot"><span class="pt-mem-empty-icon">+</span></div>';
  }
  if(!memberCardsHtml){
    memberCardsHtml='<div class="pt-empty">No members</div>';
  }

  // Type coverage — only if toggle enabled
  var coverageHtml=sf.type_coverage?pubTeamCoverageHtml(members):'';

  return (
    '<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
    '<div class="scroll-area">'+
      '<div class="pt-hero">'+
        '<div class="pt-hero-card">'+
          '<div class="pt-hero-glow"></div>'+
          '<span class="pt-hero-emoji">🏆</span>'+
          '<div class="pt-hero-name">'+pubEscape(t.name||'Unnamed team')+'</div>'+
          '<div class="pt-hero-meta">'+
            (t.format?'<span class="pt-hero-chip"><strong>'+pubEscape(t.format)+'</strong></span>':'')+
            '<span class="pt-hero-chip">'+visibleMembers.length+' member'+(visibleMembers.length===1?'':'s')+'</span>'+
          '</div>'+
          '<div class="pub-author">'+pubByline(author)+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="pub-section">'+
        '<div class="pub-section-head"><span>Roster</span><span class="count">'+visibleMembers.length+' / '+rosterSize+'</span></div>'+
        '<div class="pt-roster">'+memberCardsHtml+'</div>'+
      '</div>'+
      coverageHtml+
      pubSocialRowHtml('team',likeData)+
    '</div>'+
    pubCtaHtml('team')
  );
}

function pubNotFoundHtml(kind){
  var label=kind.charAt(0).toUpperCase()+kind.slice(1);
  return (
    '<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
    '<div class="pub-wrap">'+
      '<div class="pub-card">'+
        '<div class="pub-404">🔎</div>'+
        '<div class="pub-name">'+label+' not found</div>'+
        '<div class="pub-author" style="margin-bottom:0">This link may be private or no longer exist</div>'+
      '</div>'+
    '</div>'+
    '<button class="pub-cta" onclick="pubBackToApp()"><span>Back to app</span><span class="cta-arrow">→</span></button>'
  );
}

function pubErrorHtml(kind,msg){
  return (
    '<div class="pub-brand"><div class="pub-brand-mark">⚡</div><span>Champions Forge</span></div>'+
    '<div class="pub-wrap">'+
      '<div class="pub-card">'+
        '<div class="pub-404">⚠️</div>'+
        '<div class="pub-name">Failed to load '+pubEscape(kind)+'</div>'+
        '<div class="pub-author" style="margin-bottom:0">'+pubEscape(msg)+'</div>'+
      '</div>'+
    '</div>'+
    '<button class="pub-cta" onclick="pubBackToApp()"><span>Back to app</span><span class="cta-arrow">→</span></button>'
  );
}

function pubCtaHtml(kind){
  // Signed-out visitors: "Create your build/team" (signup CTA).
  // Signed-in viewers: "Back to my app".
  var label=kind==='team'?'Create your team':'Create your build';
  if(usr){
    return '<button class="pub-cta" onclick="pubBackToApp()"><span>Back to my app</span><span class="cta-arrow">→</span></button>';
  }
  return '<button class="pub-cta" onclick="pubSignupCta()"><span>'+label+'</span><span class="cta-arrow">→</span></button>';
}

function pubSignupCta(){
  if(usr){pubBackToApp();return}
  authMode='signup';
  if(typeof showLoginModal==='function')showLoginModal('Sign up to create and share your own competitive Pokémon builds.');
}

