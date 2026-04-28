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
  // Drop E: kick off learnset load in background so legality flags on the moveset
  // cards flip from 'pending' to 'legal' / 'illegal' once data arrives.
  if(b.pokemon_id&&!learnsetCache[b.pokemon_id]){
    loadLearnset(b.pokemon_id).then(function(){
      var grid=document.getElementById('bdMoves');
      if(grid){
        var ms=[b.move_1,b.move_2,b.move_3,b.move_4];
        var fs=movesetFontSize(ms);
        grid.innerHTML=ms.map(function(m){return bdMoveCard(m,b.pokemon_id,fs)}).join('');
      }
    });
  }
  var bImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
  var t1=TC[b.type_1]||TC.Normal;var t2=b.type_2?TC[b.type_2]:null;
  var heroGrad=t2?'linear-gradient(135deg,'+t1.m+'88,'+t2.m+'88)':'linear-gradient(135deg,'+t1.m+'66,'+t1.d+'88)';
  var sL={hp:'HP',attack:'Atk',defense:'Def',sp_attack:'SpA',sp_defense:'SpD',speed:'Spe'};
  var natDetail=b.nature_name||'—';
  if(b.increased_stat)natDetail+=' <span style="color:var(--green);font-size:.68rem">▲'+sL[b.increased_stat]+'</span> <span style="color:var(--red);font-size:.68rem">▼'+sL[b.decreased_stat]+'</span>';
  var favIcon=b.is_favourite?'⭐':'☆';
  var favLabel=b.is_favourite?'Remove favourite':'Add to favourites';
  var safeName=b.build_name.replace(/'/g,"\\'");
  var isShiny=b.is_shiny;

  // Build the stat section with SP tags
  var poke=allPkmn.find(function(x){return x.id===b.pokemon_id});
  var nature=b.nature_name?allNatures.find(function(n){return n.name===b.nature_name}):null;
  var spObj={hp:b.hp_sp||0,atk:b.atk_sp||0,def:b.def_sp||0,spa:b.spa_sp||0,spd:b.spd_sp||0,spe:b.spe_sp||0};
  var totalSP=BSK.reduce(function(s,k){return s+spObj[k]},0);
  var stats=bsGetCalcStatsFor(poke,spObj,nature);
  var bstTotal=stats.reduce(function(s,st){return s+st.calc},0);
  var bstCls=bstTotal>=600?'bst-elite':bstTotal>=500?'bst-high':bstTotal>=400?'bst-mid':'bst-low';

  // Stat bars HTML with SP tags
  var barsHtml='<div class="bs-grid">'+stats.map(function(st){
    var spVal=spObj[st.key]||0;
    var pct=Math.min(st.calc/300*100,100);
    return '<div class="bs-row"><span class="bs-label">'+BSN[st.key]+'</span><div class="bs-track"><div class="bs-fill" style="width:'+pct+'%;background:'+BSC[st.key]+'"></div></div><span class="bs-val" style="color:'+BSC[st.key]+'">'+st.calc+'</span><span class="bs-sp-tag'+(spVal>0?' has-sp':'')+'">+'+spVal+'</span><span class="bs-nat-ind">'+(st.natMod>1?'<span style="color:var(--green)">▲</span>':st.natMod<1?'<span style="color:var(--red)">▼</span>':'')+'</span></div>';
  }).join('')+'</div>';

  // Hex HTML
  var typeCol=(TC[b.type_1]||TC.Normal).m;
  var hexHtml=bdBuildHex(poke,stats);

  // SP progress
  var spPct=Math.min(totalSP/SP_MAX*100,100);

  // Header — standardised .vh-* pattern matching Teams detail
  var hdr='<div class="pg-head"><div class="vh-title-row">'+
    '<span class="vh-back" onclick="showBuildBack()">← '+(b.pokemon_name||'?')+'</span>'+
    '<div class="vh-actions" onclick="event.stopPropagation()">'+
      '<button class="vh-btn vh-btn-sm vh-btn-edit" onclick="showBuildEditor(\''+b.id+'\')" aria-label="Edit build">✏️</button>'+
      '<button class="vh-btn vh-btn-sm" onclick="confirmDelBuild(\''+b.id+'\',\''+safeName+'\')" aria-label="Delete build" style="color:var(--red);border-color:color-mix(in srgb,var(--red) 30%,var(--border))"><i class="ph-bold ph-trash"></i></button>'+
      '<div class="om-wrap">'+
        '<button class="vh-btn vh-btn-sm vh-btn-more" onclick="toggleBldOm(\'bd-'+b.id+'\')" aria-label="More">⋮</button>'+
        '<div class="om-menu" id="bldOm-bd-'+b.id+'">'+
          '<button class="om-item" onclick="closeAllBldOms();togFav(null,\''+b.id+'\')"><span class="om-item-icon">'+favIcon+'</span>'+favLabel+'</button>'+
          '<button class="om-item" onclick="closeAllBldOms();dupBuild(\''+b.id+'\')"><span class="om-item-icon">🔄</span>Duplicate build</button>'+
          (b.is_public&&b.share_code?'<button class="om-item" onclick="closeAllBldOms();shareImage(\'build\',\''+b.id+'\')"><span class="om-item-icon">🔗</span>Share build</button>':'')+
          '<button class="om-item" onclick="closeAllBldOms();exportShowdown(\''+b.id+'\')"><span class="om-item-icon">📤</span>Export to Showdown</button>'+
          '<div class="om-sep"></div>'+
          '<button class="om-item destructive" onclick="closeAllBldOms();confirmDelBuild(\''+b.id+'\',\''+safeName+'\')"><span class="om-item-icon">🗑</span>Delete build</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="pg-sub">'+b.build_name+(b.is_favourite?' ⭐':'')+(isShiny?' · <span style="color:var(--purple)">✦ Shiny</span>':'')+'</div></div>';

  // Drop G.3: pre-compute ability legality for use in detail rendering
  var _ablState=b.ability?abilityLegalityState(b.ability,b.pokemon_id):'empty';
  c.innerHTML=hdr+'<div class="bd-stack">'+
    // Drop F.2: Public pill spans full width above the 2-col
    bdPublicPillHtml(b)+
    '<div class="bd-desktop-wrap">'+
      // ── Left col: art + tags + config + type effectiveness ──
      '<div class="bd-left">'+
        '<div class="bd-hero card'+(isShiny?' shiny-holo':'')+'" style="background:'+heroGrad+'">'+
          '<div class="bd-hero-dex">#'+String(b.dex_number||0).padStart(4,'0')+'</div>'+
          '<img src="'+bImg+'" onerror="this.style.opacity=\'0.2\'">'+
          '<div class="bd-hero-types"><span class="type-pill" style="background:'+t1.m+'">'+b.type_1+'</span>'+(t2?'<span class="type-pill" style="background:'+t2.m+'">'+b.type_2+'</span>':'')+'</div>'+
          (isShiny?'<div class="bd-shiny-badge">✦ Shiny Variant</div>':'')+
        '</div>'+
        '<div class="bd-summary">'+(b.battle_format?'<span class="btag btag-fmt">'+b.battle_format+'</span>':'')+(b.archetype?'<span class="btag btag-arch" style="--ac:'+archColour(b.archetype)+'">'+b.archetype+'</span>':'')+(b.item_name?'<span class="btag btag-item">'+b.item_name+'</span>':'')+(b.nature_name?'<span class="btag btag-nat">'+b.nature_name+'</span>':'')+(b.ability?'<span class="btag btag-abi'+(_ablState==='illegal'?' btag-warn':'')+'">'+(_ablState==='illegal'?'<i class="ph-fill ph-warning"></i> ':'')+b.ability+'</span>':'')+'</div>'+
        '<div class="card"><h3 style="font-size:.85rem;font-weight:800;margin-bottom:.7rem">⚙️ Configuration</h3>'+
          '<div class="bd-config">'+
            '<span class="bd-config-label">Ability</span><span class="bd-config-val">'+(b.ability||'—')+(_ablState==='illegal'?' <span style="color:var(--gold)" title="Not a valid ability for this Pok\u00e9mon"><i class="ph-fill ph-warning"></i></span>':'')+'</span>'+
            '<span class="bd-config-label">Item</span><span class="bd-config-val">'+(b.item_name||'—')+'</span>'+
            '<span class="bd-config-label">Nature</span><span class="bd-config-val">'+natDetail+'</span>'+
            '<span class="bd-config-label">Archetype</span><span class="bd-config-val">'+(b.archetype||'—')+'</span>'+
          '</div></div>'+
        '<div class="card"><h3 style="font-size:.85rem;font-weight:800;margin-bottom:.7rem">⚡ Type Effectiveness</h3>'+renderMatchupHtml(b.type_1,b.type_2)+'</div>'+
      '</div>'+
      // ── Right col: stats + moves + strategy ──
      '<div class="bd-right">'+
        '<div class="card"><h3 style="font-size:.85rem;font-weight:800;margin-bottom:.7rem">📊 Stats</h3>'+
          '<div class="bs-view-toggle"><button class="bs-view-btn'+(bdView==='bars'?' active':'')+'" data-view="bars" onclick="bdSwitchView(\'bars\')">📊 Bars</button><button class="bs-view-btn'+(bdView==='hex'?' active':'')+'" data-view="hex" onclick="bdSwitchView(\'hex\')">⬢ Hex</button></div>'+
          '<div class="bs-view'+(bdView==='bars'?' active':'')+'" id="bd-barsView">'+barsHtml+'</div>'+
          '<div class="bs-view'+(bdView==='hex'?' active':'')+'" id="bd-hexView">'+hexHtml+'</div>'+
          '<div class="bs-total"><span class="bs-total-label">Lv50 Stat Total</span><span class="bs-total-val '+bstCls+'">'+bstTotal+'</span></div>'+
          '<div class="bd-sp-bar-wrap"><span class="bd-sp-label">SP Used</span><div class="bd-sp-track"><div class="bd-sp-fill" style="width:'+spPct+'%"></div></div><span class="bd-sp-val">'+totalSP+' / '+SP_MAX+'</span></div>'+
          '<div style="font-size:.58rem;color:var(--muted);margin-top:4px;text-align:right">Lv50 · IVs max (31) · <code style="font-family:inherit;background:var(--surface2);padding:1px 5px;border-radius:4px;font-size:.56rem;color:var(--text2)">1 SP = +1 stat</code></div>'+
        '</div>'+
        '<div class="card"><h3 style="font-size:.85rem;font-weight:800;margin-bottom:.7rem">🎯 Moveset</h3>'+
          '<div class="bd-moves" id="bdMoves">'+(function(){var ms=[b.move_1,b.move_2,b.move_3,b.move_4];var fs=movesetFontSize(ms);return ms.map(function(m){return bdMoveCard(m,b.pokemon_id,fs)}).join('')})()+'</div>'+
        '</div>'+
        (b.win_condition||b.strengths||b.weaknesses?
          '<details class="card bd-strategy" open><summary>💡 Strategy</summary><div style="margin-top:.7rem">'+
            (b.win_condition?'<div style="margin-bottom:.7rem"><div class="bd-strat-label" style="color:var(--gold)">Win Condition</div><div class="bd-strat-text">'+b.win_condition+'</div></div>':'')+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">'+
              (b.strengths?'<div><div class="bd-strat-label" style="color:var(--green)">Strengths</div><div class="bd-strat-text">'+b.strengths.replace(/\n/g,'<br>')+'</div></div>':'')+
              (b.weaknesses?'<div><div class="bd-strat-label" style="color:var(--red)">Weaknesses</div><div class="bd-strat-text">'+b.weaknesses.replace(/\n/g,'<br>')+'</div></div>':'')+
            '</div></div></details>':'')+
      '</div>'+
    '</div>'+
  '</div>'
}

// Mobile-first rich picker: gradient bg, Mega badge, types, shiny toggle
function filterPkPicker(){
  var inp=document.getElementById('pkSrch');
  var s=(inp?inp.value:pickerSearchValue).toLowerCase();
  pickerSearchValue=s;
  var f=allPkmn.filter(function(p){
var isObt=!!uDex[p.id]||!!uShinyDex[p.id];
if(s&&p.name.toLowerCase().indexOf(s)===-1&&String(p.dex_number).indexOf(s)===-1)return false;
if(pickerTypeFilter&&p.type_1!==pickerTypeFilter&&p.type_2!==pickerTypeFilter)return false;
if(pickerFormFilter&&p.form!==pickerFormFilter)return false;
if(pickerObtainedOnly&&!isObt)return false;
return true;
  });
  var grid=document.getElementById('pkPicker');
  if(!grid)return;
  if(!f.length){grid.innerHTML='<div style="grid-column:1/-1;color:var(--muted);text-align:center;padding:2rem;font-size:.85rem">No Pokémon match</div>';return}
  grid.innerHTML=f.slice(0,150).map(function(p){
    var t1=TC[p.type_1]||TC.Normal,t2=p.type_2?TC[p.type_2]:null;
var showShiny=(pickerShinyAll||!!uShinyDex[p.id])&&p.shiny_url;
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
if(editorStep==='picker'&&p&&p.shiny_url)editorShiny=!!pickerShinyAll||!!uShinyDex[p.id];
  editorStep='form';
  renderBuilds();
}
// Clamp per-stat values and enforce the shared SP budget before syncing the slider + number input.
// Legacy setSp/adjSp kept for backward compat (no-ops that route to edSet)
function setSp(s,v){edSet(s,v)}
function adjSp(s,d){edAdj(s,d)}

async function saveBuild(){
  if(window.__savingBuild){return}
  window.__savingBuild=true;
  var btn=document.getElementById('saveBuildBtn');
  var originalText='💾 Save Build';
  if(btn){
    originalText=btn.innerHTML;
    btn.disabled=true;
    btn.style.opacity=.6;
    btn.innerHTML='Saving...';
  }
  try {
    if(!selPkmnId){toast('Select a Pokémon','err');return}
    var name=document.getElementById('edName').value.trim();if(!name){toast('Enter a build name','err');return}
    // Read shiny from JS state (mobile pass) with fallback to legacy #edShiny button
    var isShiny=editorShiny||(document.getElementById('edShiny')&&document.getElementById('edShiny').classList.contains('active'));
    // Mirror the editor fields into the flat Supabase row shape used by the `builds` table.
    var body={user_id:usr.id,pokemon_id:selPkmnId,name:name,battle_format:document.getElementById('edFmt').value,archetype:document.getElementById('edArch').value||null,item_id:document.getElementById('edItem').value||null,nature_id:document.getElementById('edNat').value||null,ability:document.getElementById('edAbi').value||null,move_1:document.getElementById('edM1').value||null,move_2:document.getElementById('edM2').value||null,move_3:document.getElementById('edM3').value||null,move_4:document.getElementById('edM4').value||null,hp_sp:spV.hp,atk_sp:spV.atk,def_sp:spV.def,spa_sp:spV.spa,spd_sp:spV.spd,spe_sp:spV.spe,is_shiny:isShiny,win_condition:document.getElementById('edWin').value||null,strengths:document.getElementById('edStr').value||null,weaknesses:document.getElementById('edWeak').value||null,status:'Testing'};
    if(editBuildId){
      await upd('builds',{'id':'eq.'+editBuildId},body,true);toast('Build updated!');
    } else {
      await ins('builds',body,true);toast('Build created!');
    }
    await loadBuilds();showBuildList();
  } catch(e) {
    toast(e.message,'err');
  } finally {
    window.__savingBuild=false;
    var btn=document.getElementById('saveBuildBtn');
    if(btn){
      btn.disabled=false;
      btn.style.opacity=1;
      btn.innerHTML=originalText;
    }
  }
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
function showMoveDetail(name){
  var m=allMoveIndex[name];
  var col=m&&TC[m.type]?TC[m.type].m:'var(--surface2)';
  var catIcon=m&&m.category==='Physical'?'⚔️':m&&m.category==='Special'?'✨':'🛡️';
  var html='<div style="margin-bottom:.65rem;display:flex;align-items:center;gap:.55rem">'+
    '<span class="type-pill" style="background:'+col+';font-size:.78rem;padding:4px 14px">'+(m?m.type:'Unknown')+'</span>'+
    '<span style="font-size:.82rem;font-weight:700;color:var(--muted)">'+catIcon+' '+(m?m.category:'Unknown')+'</span>'+
  '</div>'+
  '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem;margin-bottom:.75rem">'+
    '<div style="text-align:center;background:var(--surface);border-radius:10px;padding:.5rem"><div style="font-size:.56rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700;margin-bottom:.1rem">Power</div><div style="font-size:1.05rem;font-weight:900">'+((m&&m.power>0)?m.power:'—')+'</div></div>'+
    '<div style="text-align:center;background:var(--surface);border-radius:10px;padding:.5rem"><div style="font-size:.56rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700;margin-bottom:.1rem">Accuracy</div><div style="font-size:1.05rem;font-weight:900">'+((m&&m.accuracy)?m.accuracy+'%':'—')+'</div></div>'+
    '<div style="text-align:center;background:var(--surface);border-radius:10px;padding:.5rem"><div style="font-size:.56rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700;margin-bottom:.1rem">PP</div><div style="font-size:1.05rem;font-weight:900">'+((m&&m.pp)?m.pp:'—')+'</div></div>'+
  '</div>'+
  (m&&m.short?'<div style="font-size:.82rem;color:var(--text2);line-height:1.55;text-align:left">'+m.short+'</div>':'<div style="font-size:.8rem;color:var(--muted)">No move data available.</div>');
  resetConfirmMod();
  document.getElementById('cmEmoji').textContent=col!=='var(--surface2)'?'🎯':'❓';
  document.getElementById('cmTitle').textContent=name;
  document.getElementById('cmMsg').innerHTML=html;
  document.getElementById('cmBtn').textContent='Close';
  document.getElementById('cmBtn').onclick=closeCm;
  document.getElementById('cmBtn').className='btn btn-ghost';
  document.getElementById('confirmMod').classList.add('open');
}
function showLoginModal(msg){
  var isSignup=authMode==='signup';
  // Drop F.1: in-modal mode toggle so public-view visitors (where the sidebar
  // is hidden) can flip between Sign In and Create Account without losing the
  // context-specific prompt. Also a nice UX win for the sidebar-triggered modal.
  var toggleLink=isSignup
    ? 'Already have an account? <a href="#" onclick="event.preventDefault();authMode=\'login\';showLoginModal()" style="color:var(--red);font-weight:700;text-decoration:none">Sign in</a>'
    : 'New here? <a href="#" onclick="event.preventDefault();authMode=\'signup\';showLoginModal()" style="color:var(--red);font-weight:700;text-decoration:none">Create an account</a>';
  document.getElementById('cmEmoji').textContent=isSignup?'✨':'🔐';
  document.getElementById('cmTitle').textContent=isSignup?'Create Account':'Sign In';
  document.getElementById('cmMsg').innerHTML=(msg?'<div style="font-size:.84rem;color:var(--muted);margin-bottom:.9rem;line-height:1.5">'+msg+'</div>':'')+
    '<div style="display:flex;flex-direction:column;gap:.65rem;text-align:left">'+
      '<input type="email" id="loginEmail" placeholder="Email" class="ed-input">'+
      '<input type="password" id="loginPass" placeholder="Password" class="ed-input">'+
      (isSignup?'<div style="position:relative"><span style="position:absolute;left:.7rem;top:50%;transform:translateY(-50%);color:var(--muted);font-weight:700;font-size:.88rem;pointer-events:none">@</span><input type="text" id="loginUsername" placeholder="username (optional)" class="ed-input" style="padding-left:1.55rem" autocomplete="off" spellcheck="false"></div>':'')+
      '<div style="font-size:.72rem;color:var(--muted)">'+(isSignup?'Create an account to save your builds, teams, items, and Pokédex progress.':'Sign in to access your saved builds, teams, items, and collection progress.')+'</div>'+
      '<div style="font-size:.78rem;color:var(--muted);text-align:center;padding-top:.6rem;border-top:1px solid var(--border);margin-top:.25rem">'+toggleLink+'</div>'+
    '</div>';
  document.getElementById('cmBtn').textContent=isSignup?'Create Account':'Sign In';
  document.getElementById('cmBtn').className='btn btn-red';
  document.querySelector('#confirmMod .btn.btn-ghost').textContent='Close';
  document.getElementById('cmBtn').onclick=function(){if(authMode==='signup')signup();else login()};
  document.getElementById('confirmMod').classList.add('open');
  setTimeout(function(){var el=document.getElementById('loginEmail');if(el)el.focus()},0);
}

function maybeShowInitialAuthPrompt(){}

