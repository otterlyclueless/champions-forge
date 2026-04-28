// ═══════════════════════════════════════
// SHARE HELPERS (Drop F.2)
// Used by build/team detail pills and the editor share cards.
// Exposed globally so any view can call them.
// ═══════════════════════════════════════

// Build the absolute share URL for a given kind + code.
// kind: 'build' | 'team'
function buildShareUrl(kind,code){
  if(!code)return '';
  var base=location.origin+location.pathname.replace(/\/index\.html$/,'/');
  if(!base.endsWith('/'))base+='/';
  return base+'#/'+(kind==='team'?'t':'b')+'/'+code;
}

// Web Share API with clipboard fallback.
// Returns a promise that resolves when the share completes (or is silently
// cancelled by the user dismissing the share sheet — that's not an error).
async function shareOrCopy(url,title,text){
  if(!url){toast('Nothing to share','err');return}
  // Prefer Web Share API when available (mobile Safari, Chrome on Android, etc.)
  if(navigator.share){
    try{
      await navigator.share({title:title||'Champions Forge',text:text||'',url:url});
      return;
    }catch(e){
      // AbortError = user cancelled the share sheet. Not actually an error.
      if(e&&e.name==='AbortError')return;
      // Other errors fall through to clipboard fallback below
      console.log('navigator.share failed, falling back:',e);
    }
  }
  // Clipboard fallback
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      await navigator.clipboard.writeText(url);
    }else{
      var ta=document.createElement('textarea');
      ta.value=url;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.focus();ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast('Link copied to clipboard');
  }catch(_){
    toast('Copy failed — select the URL manually','err');
  }
}

// Simple clipboard copy with toast (used by Copy-only buttons)
async function copyUrl(url){
  if(!url)return;
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      await navigator.clipboard.writeText(url);
    }else{
      var ta=document.createElement('textarea');
      ta.value=url;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.focus();ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast('Link copied');
  }catch(_){toast('Copy failed','err')}
}

function pubBackToApp(){
  // Clear the hash — router's hashchange listener picks this up and hides the public page.
  if(history&&history.replaceState){
    history.replaceState(null,'',location.pathname+location.search);
    handleHashRoute();
  }else{
    location.hash='';
  }
}

// ═══════════════════════════════════════
// IMAGE CARD RENDERER (Drop F.2.1)
// Renders 1200×630 PNG via html2canvas + hidden off-screen DOM.
// Triggered from editor/detail Share button. Uses Web Share API with files
// when available (mobile: gives user Save to Camera Roll / AirDrop / Messages
// / Discord / etc.); falls back to download + URL clipboard copy on desktop.
// ═══════════════════════════════════════

// Feature detection — Web Share Level 2 with file attachments
function canShareFiles(testFile){
  if(!navigator.share||!navigator.canShare)return false;
  try{return navigator.canShare({files:[testFile]})}catch(_){return false}
}

// Drop F.2.1 v7: localStorage sprite cache — first share of a Pokémon is slow
// (fetches through CORS proxy), subsequent shares are instant.
// Max ~4MB cache; oldest half evicted when over quota.
var SPRITE_CACHE_KEY='champions_sprite_cache_v1';
var SPRITE_CACHE_MAX=4*1024*1024;

function readSpriteCache(){
  try{return JSON.parse(localStorage.getItem(SPRITE_CACHE_KEY)||'{}')}
  catch(_){return{}}
}
function writeSpriteCache(cache){
  try{
    var serialized=JSON.stringify(cache);
    if(serialized.length>SPRITE_CACHE_MAX){
      // Simple LRU-ish eviction: drop oldest half of entries (insertion-ordered keys)
      var keys=Object.keys(cache);
      for(var i=0;i<Math.floor(keys.length/2);i++)delete cache[keys[i]];
      serialized=JSON.stringify(cache);
    }
    localStorage.setItem(SPRITE_CACHE_KEY,serialized);
  }catch(_){/* quota or private mode — silently skip */}
}

// Fetch an image URL and return a data: URL. Multiple strategies to deal with
// CORS: cache → direct fetch → corsproxy.io → allorigins.win → transparent 1×1.
// Logs loudly on failure so DevTools can show what broke.
async function spriteToDataUrl(url){
  if(!url)return '';
  if(url.startsWith('data:'))return url;

  // Check localStorage cache first (instant on subsequent shares)
  var cache=readSpriteCache();
  if(cache[url])return cache[url];

  async function fetchToDataUrl(u,label){
    var r=await fetch(u,{mode:'cors',cache:'force-cache'});
    if(!r.ok)throw new Error(label+' status '+r.status);
    var blob=await r.blob();
    // Reject non-image blobs (e.g. proxy returns HTML error page)
    if(blob.type&&blob.type.indexOf('image/')!==0&&blob.type.indexOf('application/octet-stream')!==0){
      throw new Error(label+' wrong mime: '+blob.type);
    }
    return await new Promise(function(res,rej){
      var fr=new FileReader();
      fr.onload=function(){res(fr.result)};
      fr.onerror=function(){rej(new Error(label+' FileReader error'))};
      fr.readAsDataURL(blob);
    });
  }

  function cacheAndReturn(dataUrl){
    cache[url]=dataUrl;
    writeSpriteCache(cache);
    return dataUrl;
  }

  // 1) Direct fetch — works for GitHub (PokeAPI items), etc.
  try{return cacheAndReturn(await fetchToDataUrl(url,'direct'))}catch(e1){
    console.log('[spriteToDataUrl] direct failed for',url,'→',e1.message);
  }

  // 2) CORS proxy #1 — corsproxy.io
  try{
    var proxied1='https://corsproxy.io/?'+encodeURIComponent(url);
    return cacheAndReturn(await fetchToDataUrl(proxied1,'corsproxy.io'));
  }catch(e2){
    console.log('[spriteToDataUrl] corsproxy.io failed for',url,'→',e2.message);
  }

  // 3) CORS proxy #2 — allorigins.win
  try{
    var proxied2='https://api.allorigins.win/raw?url='+encodeURIComponent(url);
    return cacheAndReturn(await fetchToDataUrl(proxied2,'allorigins'));
  }catch(e3){
    console.log('[spriteToDataUrl] allorigins failed for',url,'→',e3.message);
  }

  // 4) CORS proxy #3 — codetabs
  try{
    var proxied3='https://api.codetabs.com/v1/proxy/?quest='+encodeURIComponent(url);
    return cacheAndReturn(await fetchToDataUrl(proxied3,'codetabs'));
  }catch(e4){
    console.log('[spriteToDataUrl] codetabs failed for',url,'→',e4.message);
  }

  // 5) Last resort: transparent 1×1 so the render doesn't abort visibly
  console.warn('[spriteToDataUrl] ALL strategies failed for',url,'- rendering blank');
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
}

// Wait for every <img> inside a container to finish loading (success or error).
// html2canvas can fire before large data-URL images have decoded — without this
// wait, sprites render as zero-size in the captured PNG.
async function waitForImages(root){
  if(!root)return;
  var imgs=root.querySelectorAll('img');
  await Promise.all(Array.prototype.map.call(imgs,function(img){
    return new Promise(function(resolve){
      if(img.complete&&img.naturalWidth>0)return resolve();
      var done=false;
      function finish(){if(done)return;done=true;resolve()}
      img.addEventListener('load',finish,{once:true});
      img.addEventListener('error',finish,{once:true});
      // Safety timeout — don't hang forever if an image never resolves
      setTimeout(finish,4000);
    });
  }));
  // Extra rAF so layout + paint have a chance to flush before html2canvas reads
  await new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r)})});
}

// Slug a pokemon/team name for use as a filename
function slugify(s){
  return (s||'share').toLowerCase().replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'share';
}

// Convert type list to radial gradient stops for team member glow
function imgcardGlowGradient(type1,type2){
  if(!type1||!TC[type1])return 'radial-gradient(circle,#888 0%,transparent 85%)';
  var c1=TC[type1].m;
  var c2=type2&&TC[type2]?TC[type2].m:c1;
  return 'radial-gradient(circle,'+c1+' 0%,'+c2+' 65%,transparent 85%)';
}

// Build image card HTML (1200×630) for a single build
function buildImageHtml(b,pk,item,nature,movesMeta,author,spriteDataUrl,itemDataUrl){
  var spObj={
    hp:(b.hp_sp||0),atk:(b.atk_sp||0),def:(b.def_sp||0),
    spa:(b.spa_sp||0),spd:(b.spd_sp||0),spe:(b.spe_sp||0)
  };
  var stats=(typeof bsGetCalcStatsFor==='function')?bsGetCalcStatsFor(pk,spObj,nature):['hp','atk','def','spa','spd','spe'].map(function(k){
    var cols={hp:'base_hp',atk:'base_atk',def:'base_def',spa:'base_spa',spd:'base_spd',spe:'base_spe'};
    var base=pk[cols[k]]||0;var spVal=spObj[k];
    return{key:k,base:base,sp:spVal,calc:pubCalcStat(k,base,spVal,nature),natMod:1};
  });
  var statMap={};stats.forEach(function(s){statMap[s.key]=s});

  var movesHtml=[b.move_1,b.move_2,b.move_3,b.move_4].filter(function(m){return m&&m.trim()}).map(function(name){
    var meta=movesMeta[name]||null;
    var type=meta?meta.type:'Normal';
    var cat=(meta?meta.category:'')||'';
    var pow=meta?((meta.champions_power!=null?meta.champions_power:meta.power)||0):0;
    var prio=meta?(meta.priority||0):0;
    var catShort=cat.toLowerCase()==='physical'?'PHY':cat.toLowerCase()==='special'?'SPC':cat.toLowerCase()==='status'?'STATUS':'—';
    var footRight='';
    if(catShort==='STATUS'){
      var desc=meta?(meta.short_description||''):'';
      var sm=desc.match(/Raises? the user's ([A-Za-z]+)(?:\s+and\s+([A-Za-z]+))?/i);
      footRight=sm?('+'+sm[1].substring(0,3)+(sm[2]?'/'+sm[2].substring(0,3):'')):(desc?(desc.length>18?desc.substring(0,16)+'…':desc):'—');
    }else{
      if(pow>0){footRight=pow+' BP'+(prio?' · '+(prio>0?'+':'')+prio+' prio':'')}
      else if(prio){footRight=(prio>0?'+':'')+prio+' prio'}
      else footRight='—';
    }
    return (
      '<div class="imgcard-move imgcard-t-'+pubEscape(type)+'">'+
        '<div class="imgcard-move-name">'+pubEscape(name)+'</div>'+
        '<div class="imgcard-move-meta"><span class="imgcard-move-cat">'+catShort+'</span><span>'+pubEscape(footRight)+'</span></div>'+
      '</div>'
    );
  }).join('');

  var typesHtml='';
  if(pk&&pk.type_1){
    typesHtml+='<span class="imgcard-type-chip imgcard-t-'+pubEscape(pk.type_1)+'">'+pubEscape(pk.type_1)+'</span>';
    if(pk.type_2)typesHtml+='<span class="imgcard-type-chip imgcard-t-'+pubEscape(pk.type_2)+'">'+pubEscape(pk.type_2)+'</span>';
  }

  var shinyBadge=b.is_shiny?'<div class="imgcard-shiny-badge"><span>✦</span><span>SHINY</span></div>':'';
  var metaChips='';
  if(b.battle_format)metaChips+='<span class="imgcard-meta-chip">'+pubEscape(b.battle_format)+'</span>';
  if(b.archetype)metaChips+='<span class="imgcard-meta-chip">'+pubEscape(b.archetype)+'</span>';
  if(nature&&nature.name&&b.ability)metaChips+='<span class="imgcard-meta-chip">'+pubEscape(nature.name)+' · '+pubEscape(b.ability)+'</span>';
  else if(nature&&nature.name)metaChips+='<span class="imgcard-meta-chip">'+pubEscape(nature.name)+'</span>';
  else if(b.ability)metaChips+='<span class="imgcard-meta-chip">'+pubEscape(b.ability)+'</span>';

  var itemRowHtml='';
  if(item&&item.name){
    var itemImg=itemDataUrl?'<img class="imgcard-item-sprite" src="'+itemDataUrl+'" alt="">':'';
    itemRowHtml=
      '<div class="imgcard-item-row">'+
        itemImg+
        '<span class="imgcard-item-lbl">Item</span>'+
        '<span class="imgcard-item-text">'+pubEscape(item.name)+'</span>'+
      '</div>';
  }

  var authorInitial=(author&&author.username)?author.username.charAt(0).toUpperCase():'?';
  var authorHandle=author&&author.username?author.username:'anon';
  var url=buildShareUrl('build',b.share_code);

  function statTile(key,label){
    var s=statMap[key]||{calc:0,sp:0};
    var spCls=s.sp>0?'':' zero';
    return (
      '<div class="imgcard-stat imgcard-s-'+key+'">'+
        '<div class="imgcard-stat-lbl">'+label+'</div>'+
        '<div class="imgcard-stat-val">'+s.calc+'</div>'+
        '<div class="imgcard-stat-sp'+spCls+'">+'+s.sp+'</div>'+
      '</div>'
    );
  }

  return (
    '<div class="imgcard imgcard-bc">'+
      '<div class="imgcard-brand"><div class="imgcard-brand-mk">⚡</div><span>Champions Forge</span></div>'+
      '<div class="imgcard-author"><div class="imgcard-author-ava">'+pubEscape(authorInitial)+'</div><span>@'+pubEscape(authorHandle)+'</span></div>'+
      '<div class="imgcard-slotnum">01</div>'+
      '<div class="imgcard-bc-card">'+
        '<div class="imgcard-bc-left">'+
          '<div class="imgcard-sprite-wrap">'+
            '<div class="imgcard-sprite-glow"></div>'+
            (spriteDataUrl?'<img src="'+spriteDataUrl+'" alt="">':'')+
            shinyBadge+
          '</div>'+
          '<div class="imgcard-types">'+typesHtml+'</div>'+
          '<div class="imgcard-species">'+pubEscape(pk?pk.name:'')+'</div>'+
          itemRowHtml+
        '</div>'+
        '<div class="imgcard-bc-right">'+
          '<div>'+
            '<div class="imgcard-bc-kicker">Build</div>'+
            '<div class="imgcard-bc-title">'+pubEscape(b.name||'')+'</div>'+
            '<div class="imgcard-bc-meta-row">'+metaChips+'</div>'+
          '</div>'+
          '<div class="imgcard-bc-moves-sh">Moveset</div>'+
          '<div class="imgcard-bc-moves">'+movesHtml+'</div>'+
          '<div class="imgcard-bc-stats-sh">Stat Spread · Lv 50</div>'+
          '<div class="imgcard-bc-stats">'+
            statTile('hp','HP')+statTile('atk','Atk')+statTile('def','Def')+
            statTile('spa','SpA')+statTile('spd','SpD')+statTile('spe','Spe')+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="imgcard-url">'+pubEscape(url.replace(/^https?:\/\//,''))+'</div>'+
    '</div>'
  );
}

// Team image card HTML (1200×630)
function teamImageHtml(t,members,author,memberSpriteUrls,memberItemUrls){
  var rosterSize=Math.max(members.length,Math.min(6,t.roster_size||6));
  var visibleMembers=members.slice(0,rosterSize);
  var memHtml=visibleMembers.map(function(m,idx){
    var spriteUrl=memberSpriteUrls[m.build_id]||'';
    var itemUrl=memberItemUrls[m.build_id]||'';
    var spriteImg=spriteUrl?'<img class="tc-mem-sprite" src="'+spriteUrl+'" alt="">':'';
    var shinyBadge=m.is_shiny?'<div class="tc-mem-shiny">✦</div>':'';
    var typeChips='';
    if(m.type_1)typeChips+='<span class="tc-mem-type-chip imgcard-t-'+pubEscape(m.type_1)+'">'+pubEscape(m.type_1)+'</span>';
    if(m.type_2)typeChips+='<span class="tc-mem-type-chip imgcard-t-'+pubEscape(m.type_2)+'">'+pubEscape(m.type_2)+'</span>';
    var glowBg=imgcardGlowGradient(m.type_1,m.type_2);
    var moves=[m.move_1,m.move_2,m.move_3,m.move_4].filter(function(x){return x&&x.trim()});
    var moveHtml=moves.map(function(mv){
      var meta=m.movesMeta?m.movesMeta[mv]:null;
      var type=meta?meta.type:'Normal';
      return '<div class="tc-mem-move imgcard-t-'+pubEscape(type)+'"><div class="tc-mem-move-name">'+pubEscape(mv)+'</div></div>';
    }).join('');
    var itemRow='';
    if(m.item_name){
      var itemImg=itemUrl?'<img class="tc-mem-item-sprite" src="'+itemUrl+'" alt="">':'';
      itemRow=
        '<div class="tc-mem-item-row">'+
          itemImg+
          '<span class="tc-mem-item-name">'+pubEscape(m.item_name)+'</span>'+
        '</div>';
    }
    return (
      '<div class="tc-mem">'+
        '<div class="tc-mem-slot">'+(idx+1)+'</div>'+
        '<div class="tc-mem-top">'+
          '<div class="tc-mem-sprite-wrap">'+
            '<div class="tc-mem-sprite-glow" style="background:'+glowBg+'"></div>'+
            spriteImg+
            shinyBadge+
          '</div>'+
          '<div class="tc-mem-name">'+pubEscape(m.pk_name||'—')+'</div>'+
          '<div class="tc-mem-types">'+typeChips+'</div>'+
        '</div>'+
        '<div class="tc-mem-middle">'+
          (m.ability?'<div class="tc-mem-ability">'+pubEscape(m.ability)+'</div>':'')+
          (m.archetype?'<div class="tc-mem-archetype">'+pubEscape(m.archetype)+'</div>':'')+
          itemRow+
        '</div>'+
        '<div class="tc-mem-moves">'+moveHtml+'</div>'+
      '</div>'
    );
  }).join('');
  for(var i=visibleMembers.length;i<rosterSize;i++){
    memHtml+='<div class="tc-mem tc-mem-empty"><span class="tc-mem-empty-icon">+</span></div>';
  }

  // Team Identity
  var _tcThemeColors={Crimson:'#ef4444',Ocean:'#3b82f6',Storm:'#8b5cf6',Forest:'#22c55e',Gold:'#f59e0b',Shadow:'#64748b',Frost:'#06b6d4',Ember:'#f97316'};
  var tcThemeCol=t.team_theme&&_tcThemeColors[t.team_theme]?_tcThemeColors[t.team_theme]:null;
  var tcIconEl=t.team_icon?'<span style="font-size:22px;margin-right:7px;line-height:1;vertical-align:middle">'+pubEscape(t.team_icon)+'</span>':'';
  var tcArchEl=t.team_archetype?'<span class="imgcard-tc-arch-chip">'+pubEscape(t.team_archetype)+'</span>':'';
  var tcThemeOverlay=tcThemeCol?'<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 20%,'+tcThemeCol+'38 0%,transparent 55%);pointer-events:none;z-index:0"></div>':'';

  var authorHandle=author&&author.username?author.username:'anon';
  var url=buildShareUrl('team',t.share_code);

  return (
    '<div class="imgcard imgcard-tc">'+
      tcThemeOverlay+
      '<div class="imgcard-brand"><div class="imgcard-brand-mk">⚡</div><span>Champions Forge</span></div>'+
      '<div class="imgcard-tc-team-head">'+
        '<div class="imgcard-tc-team-name">'+tcIconEl+pubEscape(t.name||'Unnamed team')+'</div>'+
        '<div class="imgcard-tc-team-meta">'+
          (t.format?'<span class="imgcard-tc-team-chip">'+pubEscape(t.format)+'</span>':'')+
          tcArchEl+
          '<span>'+visibleMembers.length+' / '+rosterSize+' · by <strong style="color:#fff">@'+pubEscape(authorHandle)+'</strong></span>'+
        '</div>'+
      '</div>'+
      '<div class="imgcard-tc-grid">'+memHtml+'</div>'+
      '<div class="imgcard-url">'+pubEscape(url.replace(/^https?:\/\//,''))+'</div>'+
    '</div>'
  );
}

// Orchestrator: build HTML, preload sprites as data URLs, html2canvas capture,
// convert to PNG, and either native-share or download.
async function shareImageClientSide(kind,id){
  // Drop F.2.1 v5: swapped html2canvas → html-to-image (better filter/blur support,
  // uses SVG foreignObject rasterization). Feature-detect by checking either global.
  var renderer=window.htmlToImage||window.html2canvas?(window.htmlToImage?'htmlToImage':'html2canvas'):null;
  if(!renderer){
    toast('Image renderer still loading, try again in a moment','err');
    return;
  }
  var host=document.getElementById('imgRenderHost');
  if(!host){
    toast('Render host missing','err');
    return;
  }
  toast('Generating image…','info');

  try{
    var needsAuth=!!tk;
    var html='',filename='',shareTitle='',shareUrl='';

    if(kind==='build'){
      // Look up locally first, otherwise fetch
      var b=allBuilds?allBuilds.find(function(x){return x.id===id}):null;
      if(!b){
        var rows=await q('builds',{id:'eq.'+id,select:'id,name,user_id,pokemon_id,is_shiny,battle_format,archetype,ability,item_id,nature_id,move_1,move_2,move_3,move_4,hp_sp,atk_sp,def_sp,spa_sp,spd_sp,spe_sp,share_fields,share_code'},true);
        b=rows&&rows[0];
      }
      if(!b){toast('Build not found','err');return}

      // Normalize shape (local view uses build_name, raw row uses name)
      if(!b.name&&b.build_name)b.name=b.build_name;

      // Fetch pokemon/item/nature/moves in parallel
      var pkP=q('pokemon',{id:'eq.'+b.pokemon_id,select:'id,name,type_1,type_2,image_url,shiny_url,is_mega,base_hp,base_atk,base_def,base_spa,base_spd,base_spe'},needsAuth).catch(function(){return[]});
      var itemP=b.item_id?q('items',{id:'eq.'+b.item_id,select:'name,sprite_url,short_description'},needsAuth).catch(function(){return[]}):Promise.resolve([]);
      var natureP=b.nature_id?q('natures',{id:'eq.'+b.nature_id,select:'name,increased_stat,decreased_stat'},needsAuth).catch(function(){return[]}):Promise.resolve([]);
      var moveNames=[b.move_1,b.move_2,b.move_3,b.move_4].filter(function(m){return m&&m.trim()});
      var movesP=moveNames.length?q('moves',{name:'in.('+moveNames.map(function(n){return '"'+n.replace(/"/g,'\\"')+'"'}).join(',')+')',select:'name,type,category,power,accuracy,pp,priority,short_description,champions_power,champions_accuracy,champions_pp'},needsAuth).catch(function(){return[]}):Promise.resolve([]);
      var authorP=q('user_profiles',{user_id:'eq.'+b.user_id,select:'username,display_name'},needsAuth).catch(function(){return[]});

      var results=await Promise.all([pkP,itemP,natureP,movesP,authorP]);
      var pk=results[0]&&results[0][0];
      var item=results[1]&&results[1][0]||null;
      var nature=results[2]&&results[2][0]||null;
      var movesMeta={};(results[3]||[]).forEach(function(m){movesMeta[m.name]=m});
      var author=results[4]&&results[4][0]||{};

      // Preload sprites
      var spriteUrl=b.is_shiny&&pk.shiny_url?pk.shiny_url:pk.image_url;
      var spriteDataP=spriteToDataUrl(spriteUrl);
      var itemDataP=(item&&item.sprite_url)?spriteToDataUrl(item.sprite_url):Promise.resolve('');
      var preloaded=await Promise.all([spriteDataP,itemDataP]);

      html=buildImageHtml(b,pk,item,nature,movesMeta,author,preloaded[0],preloaded[1]);
      filename='champions-'+slugify(pk.name||b.name)+'.png';
      shareTitle=b.name||'Champions Forge build';
      shareUrl=buildShareUrl('build',b.share_code);
    }else if(kind==='team'){
      var t=allTeams?allTeams.find(function(x){return x.id===id}):null;
      if(!t){
        var trows=await q('teams',{id:'eq.'+id,select:'id,name,user_id,format,share_code,share_fields,roster_size,team_icon,team_theme,team_archetype'},true);
        t=trows&&trows[0];
      }
      if(!t){toast('Team not found','err');return}

      // Fetch team_builds with nested build + pokemon + get moves/ability/item for each member
      var membersRaw=await q('team_builds',{
        team_id:'eq.'+t.id,
        select:'slot_position,builds(id,name,is_public,share_code,is_shiny,pokemon_id,ability,archetype,item_id,move_1,move_2,move_3,move_4,pokemon(id,name,type_1,type_2,image_url,shiny_url))',
        order:'slot_position.asc'
      },needsAuth).catch(function(){return[]});

      // Collect unique item ids + all move names
      var itemIds={},moveNamesSet={};
      membersRaw.forEach(function(row){
        var bu=row.builds;if(!bu)return;
        if(bu.item_id)itemIds[bu.item_id]=1;
        [bu.move_1,bu.move_2,bu.move_3,bu.move_4].forEach(function(n){if(n&&n.trim())moveNamesSet[n]=1});
      });
      var itemIdArr=Object.keys(itemIds);
      var moveNamesArr=Object.keys(moveNamesSet);

      var itemsP=itemIdArr.length?q('items',{id:'in.('+itemIdArr.join(',')+')',select:'id,name,sprite_url'},needsAuth).catch(function(){return[]}):Promise.resolve([]);
      var movesBatchP=moveNamesArr.length?q('moves',{name:'in.('+moveNamesArr.map(function(n){return '"'+n.replace(/"/g,'\\"')+'"'}).join(',')+')',select:'name,type'},needsAuth).catch(function(){return[]}):Promise.resolve([]);
      var tAuthorP=q('user_profiles',{user_id:'eq.'+t.user_id,select:'username,display_name'},needsAuth).catch(function(){return[]});

      var tResults=await Promise.all([itemsP,movesBatchP,tAuthorP]);
      var itemsMap={};(tResults[0]||[]).forEach(function(it){itemsMap[it.id]=it});
      var movesTypeMap={};(tResults[1]||[]).forEach(function(mv){movesTypeMap[mv.name]={type:mv.type}});
      var teamAuthor=tResults[2]&&tResults[2][0]||{};

      // Build members array with enriched data
      var members=membersRaw.map(function(row){
        var bu=row.builds||{};var pk=bu.pokemon||{};
        var itemRow=bu.item_id?itemsMap[bu.item_id]:null;
        return {
          slot:row.slot_position,
          build_id:bu.id,
          is_shiny:!!bu.is_shiny,
          pk_id:pk.id,pk_name:pk.name,type_1:pk.type_1,type_2:pk.type_2,image_url:pk.image_url,shiny_url:pk.shiny_url,
          ability:bu.ability||'',
          archetype:bu.archetype||null,
          item_name:itemRow?itemRow.name:null,
          item_sprite_url:itemRow?itemRow.sprite_url:null,
          move_1:bu.move_1,move_2:bu.move_2,move_3:bu.move_3,move_4:bu.move_4,
          movesMeta:movesTypeMap
        };
      }).filter(function(m){return m.pk_id});

      // Preload all sprites + items in parallel
      var memberSpriteUrls={},memberItemUrls={};
      var spritePromises=members.map(function(m){
        var su=m.is_shiny&&m.shiny_url?m.shiny_url:m.image_url;
        return spriteToDataUrl(su).then(function(d){memberSpriteUrls[m.build_id]=d});
      });
      var itemPromises=members.filter(function(m){return m.item_sprite_url}).map(function(m){
        return spriteToDataUrl(m.item_sprite_url).then(function(d){memberItemUrls[m.build_id]=d});
      });
      await Promise.all(spritePromises.concat(itemPromises));

      html=teamImageHtml(t,members,teamAuthor,memberSpriteUrls,memberItemUrls);
      filename='champions-team-'+slugify(t.name)+'.png';
      shareTitle=t.name||'Champions Forge team';
      shareUrl=buildShareUrl('team',t.share_code);
    }else{
      toast('Unknown kind: '+kind,'err');
      return;
    }

    // Render off-screen
    host.innerHTML=html;
    var target=host.firstElementChild;
    if(!target){toast('Render failed','err');return}

    // Ensure the target has its canvas-sized dimensions
    target.style.width='1200px';
    target.style.height='630px';

    // CRITICAL: wait for all images (especially large data-URL sprites) to
    // finish decoding before rendering. Without this the capture can fire
    // while imgs are still 0×0 and sprites render blank.
    await waitForImages(target);

    // Render → Blob. Prefer html-to-image (SVG foreignObject, respects blur/filter).
    // Fall back to html2canvas if html-to-image isn't loaded yet.
    // pixelRatio:2 renders at 2400×1260 internally → downscaled to 1200×630 PNG
    // for crisp retina-quality text and sprites.
    var blob;
    if(renderer==='htmlToImage'){
      blob=await window.htmlToImage.toBlob(target,{
        width:1200,height:630,
        pixelRatio:1.5,  // Drop F.2.1 v7: 1.5 vs 2 — ~30-40% faster render, still sharp on retina
        cacheBust:false, // v7: let browser reuse cached data-URLs between captures
        backgroundColor:'transparent',
        style:{margin:'0',padding:'0'},
        fetchRequestInit:{cache:'force-cache'}
      });
    }else{
      var canvas=await html2canvas(target,{
        width:1200,height:630,
        scale:2,
        backgroundColor:null,
        logging:false,
        useCORS:true,
        allowTaint:false,
        imageTimeout:6000
      });
      blob=await new Promise(function(res){canvas.toBlob(function(b){res(b)},'image/png',0.95)});
    }
    if(!blob){toast('Render failed','err');host.innerHTML='';return}

    // Clean up DOM
    host.innerHTML='';

    var file=new File([blob],filename,{type:'image/png'});

    // Try Web Share with files
    // NOTE: on iOS, passing `url` alongside `files` makes the share sheet
    // treat it as a LINK share and hides the "Save Image" action. To get
    // Save to Camera Roll + AirDrop + full image-share options, we pass
    // files-only and embed the URL inside the text field instead.
    if(canShareFiles(file)){
      try{
        await navigator.share({
          files:[file],
          title:shareTitle,
          text:'Check out my Champions Forge '+(kind==='team'?'team':'build')+'!\n'+shareUrl
        });
        return;
      }catch(e){
        if(e&&e.name==='AbortError')return; // user cancelled
        console.log('navigator.share(files) failed:',e);
      }
    }

    // Fallback — download + copy URL
    var objUrl=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=objUrl;a.download=filename;
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(objUrl)},500);
    if(shareUrl&&navigator.clipboard){
      try{await navigator.clipboard.writeText(shareUrl)}catch(_){}
    }
    toast('Image saved · Link copied to clipboard');
  }catch(e){
    console.log('shareImageClientSide error:',e);
    toast(e.message||'Failed to generate image','err');
    var hostEl=document.getElementById('imgRenderHost');
    if(hostEl)hostEl.innerHTML='';
  }
}

// In-session blob cache: rendered PNGs keyed by build/team id.
// Allows instant retry if navigator.share fails (gesture context expiry after async wait).
// Prevents wasting a Browserless unit on re-render for the same share.
var _shareImageCache={};

// Show a floating tap-to-save button (used when native share sheet is unavailable).
// User taps the link — this is a fresh user gesture, so iOS handles the download natively
// without triggering the confusing "View/Download" bar from auto-click.
function _showSaveButton(blob,filename,shareUrl){
  var objUrl=URL.createObjectURL(blob);
  var prev=document.getElementById('share-save-banner');if(prev)prev.parentNode.removeChild(prev);
  var banner=document.createElement('div');
  banner.id='share-save-banner';
  banner.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid rgba(255,255,255,.12);color:#fff;padding:10px 16px;border-radius:14px;z-index:9999;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,.5);font-family:inherit;white-space:nowrap;max-width:calc(100vw - 32px);';
  var link=document.createElement('a');
  link.href=objUrl;link.download=filename;
  link.innerHTML='<span style="font-size:.82rem;font-weight:700;color:#60a5fa">💾 Tap to save image</span>';
  link.style.textDecoration='none';
  link.onclick=function(){
    if(shareUrl&&navigator.clipboard)navigator.clipboard.writeText(shareUrl).catch(function(){});
    setTimeout(function(){if(banner.parentNode){document.body.removeChild(banner);URL.revokeObjectURL(objUrl)}},1000);
  };
  var close=document.createElement('button');
  close.textContent='✕';
  close.style.cssText='background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:.82rem;padding:0;font-family:inherit;line-height:1;flex-shrink:0;';
  close.onclick=function(){if(banner.parentNode){document.body.removeChild(banner);URL.revokeObjectURL(objUrl)}};
  banner.appendChild(link);banner.appendChild(close);
  document.body.appendChild(banner);
  setTimeout(function(){if(banner.parentNode){document.body.removeChild(banner);URL.revokeObjectURL(objUrl)}},30000);
}

// Drop F.2.1b: Edge-first share — calls Supabase Edge Function (Browserless server-side
// render) first, falls back to shareImageClientSide (html-to-image) on any failure.
async function shareImage(kind,id){
  // Capture triggering button synchronously (BEFORE first await) for spinner feedback
  function _startLoad(){document.body.classList.add('share-loading')}
  function _stopLoad(){document.body.classList.remove('share-loading')}

  var EDGE=API+'/functions/v1/share-image';
  var t0=performance.now();

  // Look up share code from local state (share button only shown when is_public + share_code set)
  var shareCode='',shareUrl='',shareTitle='',filename='';
  if(kind==='build'){
    var b=allBuilds?allBuilds.find(function(x){return x.id===id}):null;
    if(!b||!b.share_code){_stopLoad();return shareImageClientSide(kind,id)}
    shareCode=b.share_code;
    shareUrl=buildShareUrl('build',shareCode);
    shareTitle=b.name||b.build_name||'Champions Forge build';
    filename='champions-'+slugify(shareTitle)+'.png';
  }else{
    var t=allTeams?allTeams.find(function(x){return x.id===id}):null;
    if(!t||!t.share_code){_stopLoad();return shareImageClientSide(kind,id)}
    shareCode=t.share_code;
    shareUrl=buildShareUrl('team',shareCode);
    shareTitle=t.name||'Champions Forge team';
    filename='champions-team-'+slugify(shareTitle)+'.png';
  }

  // Cache hit — skip edge fn entirely, re-use previously rendered blob
  // (preserves gesture context + saves a Browserless unit on retry)
  if(_shareImageCache[id]){
    var _cb=_shareImageCache[id];
    var _cf=new File([_cb],filename,{type:'image/png'});
    if(canShareFiles(_cf)){
      try{
        await navigator.share({files:[_cf],title:shareTitle,
          text:'Check out my Champions Forge '+(kind==='team'?'team':'build')+'!\n'+shareUrl});
        return;
      }catch(e){if(e&&e.name==='AbortError')return;console.log('[shareImage] cache share failed:',e)}
    }
    _showSaveButton(_cb,filename,shareUrl);
    return;
  }

  toast('Generating image…','info');
  _startLoad();

  try{
    var res=await fetch(EDGE,{
      method:'POST',
      headers:{
        'apikey':ANON,
        'Authorization':'Bearer '+(tk||ANON),
        'Content-Type':'application/json'
      },
      body:JSON.stringify({kind:kind,id:id,code:shareCode})
    });

    // 429 = Browserless quota exceeded — fall back silently, user still gets image
    if(res.status===429){
      _stopLoad();
      console.log('[shareImage] edge quota exceeded — falling back to client render');
      return shareImageClientSide(kind,id);
    }

    if(!res.ok) throw new Error('edge fn HTTP '+res.status);

    var blob=await res.blob();
    _shareImageCache[id]=blob; // cache for gesture retry — no re-render needed
    _stopLoad();
    console.log('[shareImage] edge render',Math.round(performance.now()-t0),'ms ('+Math.round(blob.size/1024)+'KB)');

    var file=new File([blob],filename,{type:'image/png'});

    if(canShareFiles(file)){
      try{
        await navigator.share({
          files:[file],
          title:shareTitle,
          text:'Check out my Champions Forge '+(kind==='team'?'team':'build')+'!\n'+shareUrl
        });
        return;
      }catch(e){
        if(e&&e.name==='AbortError'){_stopLoad();return;}
        console.log('[shareImage] navigator.share failed:',e);
      }
    }

    // native share not available / gesture expired — show tap-to-save button
    _showSaveButton(blob,filename,shareUrl);

  }catch(edgeErr){
    _stopLoad();
    console.log('[shareImage] edge failed, falling back to client render:',edgeErr.message||edgeErr);
    return shareImageClientSide(kind,id);
  }
}

