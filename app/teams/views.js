function renderTeams(){
  var c=document.getElementById('teamsView');
  if(!tk){c.innerHTML='<div class="pg-head"><div class="pg-title">🏆 Teams</div><div class="pg-sub">Sign in to manage teams</div></div><div class="empty"><div class="em">🔒</div>Sign in to see teams</div>';return}
  if(teamView==='editor'){renderTeamEditor(c);return}
  if(teamView==='detail'){renderTeamDetail(c);return}
  var hdr='<div class="pg-head vh-list-header"><div class="pg-top"><div><div class="pg-title">🏆 Teams</div><div class="pg-sub">Your competitive team compositions</div></div><div class="vh-actions"><button class="vh-btn vh-btn-md vh-btn-new" onclick="showTeamEditor()">+</button></div></div></div>';
  if(!allTeams.length){c.innerHTML=hdr+'<div class="empty"><div class="em">🏆</div>No teams yet</div>';return}
  c.innerHTML=hdr+'<div class="tml-stack">'+allTeams.map(function(t){
    var fc=t.format==='Singles'?'fmt-s':'fmt-d';
    var memCount=(t.members||[]).length;
    var rosterSize=Math.max(memCount,Math.min(6,Number(t.roster_size)||6));
    var visibleMembers=(t.members||[]).slice(0,rosterSize);
    var mems=visibleMembers.map(function(m){var mImg=m.is_shiny&&m.shiny_url?m.shiny_url:(m.image_url||'');return '<div class="tml-mem"><img class="tml-mem-img" src="'+mImg+'" onerror="this.style.opacity=\'0.2\'"><div class="tml-mem-name">'+(m.pokemon_name||'?')+'</div></div>'}).join('');
    for(var i=visibleMembers.length;i<rosterSize;i++){mems+='<div class="tml-mem"><div class="tml-mem-empty">+</div></div>'}
    var safeName=t.name.replace(/'/g,"\\'");
    var tmCol=t.team_theme?TM_THEME_COLORS[t.team_theme]||null:null;
    var tmCardStyle=tmCol?'border-left:3px solid '+tmCol+';--tm-col:'+tmCol+';':'';
    var tmIcon=t.team_icon?'<span class="tml-icon-badge">'+t.team_icon+'</span>':'';
    var tmArch=t.team_archetype?'<span class="tml-arch-pill">'+t.team_archetype+'</span>':'';
    return '<div class="tml-card" style="'+tmCardStyle+'" onclick="showTeamDetail(\''+t.id+'\')">'+
'<div class="tml-head">'+
  '<div class="tml-head-text">'+
    '<div class="tml-name">'+tmIcon+t.name+'</div>'+
    '<div class="tml-meta">'+
      '<span class="tml-fmt '+fc+'">'+(t.format||'?')+'</span>'+
      '<span class="tml-count">'+memCount+' / '+rosterSize+'</span>'+
      tmArch+
    '</div>'+
  '</div>'+
'<div class="vh-actions" onclick="event.stopPropagation()">'+
  '<button class="vh-btn vh-btn-md vh-btn-edit" onclick="showTeamEditor(\''+t.id+'\')" aria-label="Edit team">✏️</button>'+
  '<button class="vh-btn vh-btn-md" onclick="confirmDelTeam(\''+t.id+'\',\''+safeName+'\')" aria-label="Delete team" style="color:var(--red);border-color:color-mix(in srgb,var(--red) 30%,var(--border))"><i class="ph-bold ph-trash"></i></button>'+
  '<div class="om-wrap">'+
    '<button class="vh-btn vh-btn-md vh-btn-more" onclick="event.stopPropagation();toggleTmlOm(\''+t.id+'\')" aria-label="More">⋮</button>'+
      '<div class="om-menu" id="tmlOm-'+t.id+'">'+
        '<button class="om-item" onclick="event.stopPropagation();closeAllTmlOms();showTeamDetail(\''+t.id+'\')"><span class="om-item-icon">📋</span>View detail</button>'+
        (t.is_public&&t.share_code?'<button class="om-item" onclick="event.stopPropagation();closeAllTmlOms();shareImage(\'team\',\''+t.id+'\')"><span class="om-item-icon">🔗</span>Share team</button>':'')+
        '<div class="om-sep"></div>'+
        '<button class="om-item destructive" onclick="event.stopPropagation();closeAllTmlOms();confirmDelTeam(\''+t.id+'\',\''+safeName+'\')"><span class="om-item-icon">🗑</span>Delete team</button>'+
      '</div>'+
    '</div>'+
  '</div>'+
'</div>'+
'<div class="tml-members">'+mems+'</div>'+
'</div>';
  }).join('')+'</div>';
}

function closeAllTmlOms(){document.querySelectorAll('[id^="tmlOm-"]').forEach(function(m){m.classList.remove('open');var c=m.closest('.tml-card');if(c)c.classList.remove('om-active')})}
function toggleTmlOm(id){var m=document.getElementById('tmlOm-'+id);if(!m)return;var wasOpen=m.classList.contains('open');closeAllTmlOms();if(!wasOpen){m.classList.add('open');var c=m.closest('.tml-card');if(c)c.classList.add('om-active')}}
document.addEventListener('click',function(e){if(!e.target.closest('.om-wrap')){closeAllTmlOms();closeAllBldOms()}});

// Team member stat helpers — reuse Drop 2/3 bsCalcStatFor / bsGetCalcStatsFor
function tdGetMemberStats(m,b){
  var poke=allPkmn.find(function(p){return(p.id===m.pokemon_id)||(p.name===m.pokemon_name&&p.dex_number===m.dex_number)});
  if(!poke)return null;
  var sp={hp:b.hp_sp||0,atk:b.atk_sp||0,def:b.def_sp||0,spa:b.spa_sp||0,spd:b.spd_sp||0,spe:b.spe_sp||0};
  var nature=b.increased_stat?{increased_stat:b.increased_stat,decreased_stat:b.decreased_stat}:null;
  return{poke:poke,stats:bsGetCalcStatsFor(poke,sp,nature),nature:nature};
}

function tdRenderBars(stats){
  return '<div class="td-bs-grid">'+stats.map(function(st){
    var pct=Math.min(st.calc/300*100,100);
    var natInd=st.natMod>1?' <span style="color:var(--green)">▲</span>':st.natMod<1?' <span style="color:var(--red)">▼</span>':'';
    var natCol=st.natMod>1?'var(--green)':st.natMod<1?'var(--red)':BSC[st.key];
    return '<div class="td-bs-row"><span class="td-bs-label">'+BSN[st.key]+'</span><div class="td-bs-track"><div class="td-bs-fill" style="width:'+pct+'%;background:'+BSC[st.key]+'"></div></div><span class="td-bs-val" style="color:'+natCol+'">'+st.calc+'</span><span class="td-bs-nat-ind">'+natInd+'</span></div>';
  }).join('')+'</div>';
}

function tdRenderHex(poke,stats){
  var typeCol=(TC[poke.type_1]||TC.Normal).m;
  var cx=160,cy=140,r=62,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
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
    var si=order[i],k=BSK[si],st=stats[si],pt=polar(angles[i],r+20);
    var anchor='middle';if(angles[i]===-30||angles[i]===30)anchor='start';if(angles[i]===150||angles[i]===210)anchor='end';
    var natInd=st.natMod>1?' ▲':st.natMod<1?' ▼':'';
    var natCol=st.natMod>1?'var(--green)':st.natMod<1?'var(--red)':BSC[k];
    var isTop=angles[i]===-90,isBot=angles[i]===90;
    if(isTop){labels+='<text x="'+pt.x+'" y="'+(pt.y-8)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="9" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+5)+'" text-anchor="middle" fill="'+natCol+'" font-size="11" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">'+st.calc+natInd+'</text>'}
    else if(isBot){labels+='<text x="'+pt.x+'" y="'+(pt.y+4)+'" text-anchor="middle" fill="'+natCol+'" font-size="11" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">'+st.calc+natInd+'</text><text x="'+pt.x+'" y="'+(pt.y+15)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="9" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text>'}
    else{labels+='<text x="'+pt.x+'" y="'+(pt.y-3)+'" text-anchor="'+anchor+'" fill="'+BSC[k]+'" font-size="9" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+9)+'" text-anchor="'+anchor+'" fill="'+natCol+'" font-size="11" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">'+st.calc+natInd+'</text>'}
  }
  return '<div class="td-bs-hex-wrap"><svg class="td-bs-hex-svg" viewBox="0 0 320 280">'+
    '<polygon points="'+outerPts+'" fill="none" stroke="var(--border)" stroke-width="1.2"/>'+
    '<polygon points="'+g75+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".3"/>'+
    '<polygon points="'+g50+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".3"/>'+
    '<polygon points="'+g25+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".3"/>'+
    spokes+
    '<polygon points="'+statPts.join(' ')+'" fill="'+typeCol+'25" stroke="'+typeCol+'" stroke-width="2" stroke-linejoin="round"/>'+
    labels+'</svg></div>';
}

// Render a single team member card (collapsible). editorMode adds Change/Remove actions.
function tdRenderMember(m,slot,editorMode){
  var b=allBuilds.find(function(x){return x.id===m.build_id})||m;
  var mImg=(b.is_shiny||m.is_shiny)&&(b.shiny_url||m.shiny_url)?(b.shiny_url||m.shiny_url):(b.image_url||m.image_url||'');
  var t1=(TC[m.type_1||b.type_1]||TC.Normal).m,t2=(m.type_2||b.type_2)?((TC[m.type_2||b.type_2]||TC.Normal).m):null;
  var headerGrad=t2?'linear-gradient(135deg,'+t1+'CC,'+t2+'CC)':'linear-gradient(135deg,'+t1+'BB,'+t1+'66)';
  var statData=tdGetMemberStats(m,b);
  var collapsedKey=m.build_id||m.id||('s'+slot);
  var collapsed=!!tdCollapsed[collapsedKey];
  var dName=displayName({name:m.pokemon_name||b.pokemon_name,form:m.form||b.form});
  var isMega=(m.form||b.form)==='Mega';

  // Compact stats for collapsed header (Atk / SpA / Spe / BST)
  var compactStats='';
  if(statData){
    var atk=statData.stats.find(function(s){return s.key==='atk'});
    var spa=statData.stats.find(function(s){return s.key==='spa'});
    var spe=statData.stats.find(function(s){return s.key==='spe'});
    var bst=statData.stats.reduce(function(s,st){return s+st.calc},0);
    compactStats='<span class="td-mem-compact-stats"><span style="color:'+BSC.atk+'">'+atk.calc+'</span><span style="color:'+BSC.spa+'">'+spa.calc+'</span><span style="color:'+BSC.spe+'">'+spe.calc+'</span><span style="color:rgba(255,255,255,.5)">·</span><span>BST '+bst+'</span></span>';
  }

  var natSl={hp:'HP',attack:'Atk',defense:'Def',sp_attack:'SpA',sp_defense:'SpD',speed:'Spe'};
  var natInfo=b.nature_name?'<span class="td-mem-nature-chip">'+b.nature_name+(b.increased_stat?' <span style="color:var(--green);font-size:.6rem">▲'+natSl[b.increased_stat]+'</span> <span style="color:var(--red);font-size:.6rem">▼'+natSl[b.decreased_stat]+'</span>':'')+'</span>':'';
  var bst=statData?statData.stats.reduce(function(s,st){return s+st.calc},0):0;
  var bstCls=bst>=1100?'bst-elite':bst>=950?'bst-high':bst>=800?'bst-mid':'bst-low';

  var moves=[b.move_1||m.move_1,b.move_2||m.move_2,b.move_3||m.move_3,b.move_4||m.move_4].filter(Boolean).map(function(mv){return '<div class="td-mem-move">'+mv+'</div>'}).join('');
  var tags='';
  if(b.item_name||m.item_name)tags+='<span class="btag btag-item">'+(b.item_name||m.item_name)+'</span>';
  if(b.ability)tags+='<span class="btag btag-abi">'+b.ability+'</span>';
  if(b.archetype||m.archetype)tags+='<span class="btag btag-arch">'+(b.archetype||m.archetype)+'</span>';

  var clickHandler=editorMode?'onclick="toggleTdMember(\''+collapsedKey+'\')"':'onclick="toggleTdMember(\''+collapsedKey+'\')"';

  return '<div class="td-member'+(collapsed?' collapsed':'')+'" data-key="'+collapsedKey+'">'+
    '<div class="td-mem-head" '+clickHandler+'><div style="position:absolute;inset:0;background:'+headerGrad+';opacity:.5;z-index:0"></div>'+
      '<div class="td-mem-slot">#'+slot+'</div>'+
      '<img class="td-mem-img" src="'+mImg+'" onerror="this.style.opacity=0.2">'+
      '<div class="td-mem-head-info">'+
        '<div class="td-mem-name"><span>'+(m.pokemon_name||b.pokemon_name||'?')+'</span>'+(isMega?megaBadge(18):'')+(b.is_shiny||m.is_shiny?' <span style="color:var(--purple);font-size:.7rem">✦</span>':'')+'</div>'+
        (b.build_name||m.build_name?'<div class="td-mem-sub" style="color:rgba(255,255,255,.8)">'+(b.build_name||m.build_name)+'</div>':'')+
        '<div class="td-mem-types"><span class="type-pill" style="background:'+t1+'">'+(m.type_1||b.type_1)+'</span>'+(t2?'<span class="type-pill" style="background:'+t2+'">'+(m.type_2||b.type_2)+'</span>':'')+'</div>'+
        compactStats+
      '</div>'+
      (editorMode?'<button class="td-quick-remove" onclick="event.stopPropagation();removeTeamMember(\''+(m.build_id||m.id)+'\')" aria-label="Remove '+(m.pokemon_name||b.pokemon_name||'Pokémon')+' from team">✕</button>':'')+
      '<div class="td-chevron">▾</div>'+
    '</div>'+
    '<div class="td-mem-body-wrap"><div class="td-mem-body">'+
      '<div class="td-mem-stats">'+
        natInfo+
        (statData?(tdView==='hex'?tdRenderHex(statData.poke,statData.stats):tdRenderBars(statData.stats)):'<div style="color:var(--muted);font-size:.78rem">Stats unavailable</div>')+
        (statData?'<div class="td-bs-total"><span class="td-bs-total-label">Lv50 Total</span><span class="td-bs-total-val '+bstCls+'">'+bst+'</span></div>':'')+
      '</div>'+
      (tags||moves?'<div class="td-mem-foot">'+(tags?'<div class="td-mem-tags">'+tags+'</div>':'')+(moves?'<div class="td-mem-moves">'+moves+'</div>':'')+'</div>':'')+
      (editorMode?'<div class="td-mem-editor-actions"><button onclick="event.stopPropagation();openTeamBuildPicker('+slot+')">🔄 Change Build</button><button class="td-remove" onclick="event.stopPropagation();removeTeamMember(\''+(m.build_id||m.id)+'\')">✕ Remove</button></div>':'<div style="padding:.5rem .85rem .85rem;border-top:1px solid var(--border)"><button class="btn btn-ghost" style="width:100%;min-height:40px;font-size:.78rem" onclick="event.stopPropagation();showBuildDetail(\''+(m.build_id||m.id)+'\',\'team\')">View build detail →</button></div>')+
    '</div></div>'+
  '</div>';
}

function toggleTdMember(key){
  var card=document.querySelector('.td-member[data-key="'+key+'"]');
  if(!card)return;
  var wasCollapsed=card.classList.toggle('collapsed');
  tdCollapsed[key]=wasCollapsed;
}
function setTdView(v){tdView=v;renderTeams()}
function expandAllTdMembers(){document.querySelectorAll('.td-member').forEach(function(c){c.classList.remove('collapsed');tdCollapsed[c.dataset.key]=false})}
function collapseAllTdMembers(){document.querySelectorAll('.td-member').forEach(function(c){c.classList.add('collapsed');tdCollapsed[c.dataset.key]=true})}
function setTeamRosterSize(v){
  var n=Math.max(1,Math.min(6,Number(v)||6));
  if(n<selBuildIds.length){
    selBuildIds=selBuildIds.slice(0,n);
  }
  teamRosterSize=n;
  renderTeams();
}
function scrollToPicker(){openTeamBuildPicker(Math.min(teamRosterSize,selBuildIds.length+1))}
function removeTeamMember(buildId){var i=selBuildIds.indexOf(buildId);if(i!==-1)selBuildIds.splice(i,1);renderTeams()}

function renderTeamEditor(c){
  var t=editTeamId?allTeams.find(function(x){return x.id===editTeamId}):null;
  // Snapshot live editor values before re-render so slot changes don't wipe unsaved text
  var _ne=document.getElementById('tmName'),_no2=document.getElementById('tmNotes'),_nf=document.getElementById('tmFmt');
  var liveName=_ne!==null?_ne.value:(t?t.name||'':'');
  var liveNotes=_no2!==null?_no2.value:(t?t.notes||'':'');
  var liveFmt=_nf!==null?_nf.value:(t?t.format||'Singles':'Singles');

  var hdr='<div class="pg-head"><div class="pg-top"><div><div class="pg-title" style="cursor:pointer" onclick="showTeamList()">← '+(t?'Edit Team':'New Team')+'</div><div class="pg-sub">Assemble your roster</div></div></div></div>';
  var fmtSelectedS=liveFmt==='Singles'?' selected':'';
  var fmtSelectedD=liveFmt==='Doubles'?' selected':'';
  var fmtCls=liveFmt==='Doubles'?'fmt-d':'fmt-s';
  teamRosterSize=Math.max(selBuildIds.length,Math.min(6,teamRosterSize||Number(t&&t.roster_size)||6));
  var fmtLabel=liveFmt||'Singles';

  // Team Info card
  var teamInfo='<div class="card">'+
    '<label class="ed-label" style="margin-top:0">Team Name</label>'+
    '<input class="ed-input" id="tmName" value="'+liveName.replace(/"/g,'&quot;')+'" placeholder="e.g. Storm Surge Protocol">'+
    '<label class="ed-label">Format</label>'+
    '<select class="ed-select" id="tmFmt"><option value="Singles"'+fmtSelectedS+'>Singles</option><option value="Doubles"'+fmtSelectedD+'>Doubles</option></select>'+
    '<label class="ed-label">Roster Size</label>'+
    '<select class="ed-select" id="tmRosterSize" onchange="setTeamRosterSize(this.value)">'+
      [1,2,3,4,5,6].map(function(n){return '<option value="'+n+'"'+(teamRosterSize===n?' selected':'')+'>'+n+' Pokémon</option>'}).join('')+
    '</select>'+
    '<div style="font-size:.68rem;color:var(--muted);margin-top:.35rem">Defaults to 6. Use 4 for compact doubles rosters or practice squads.</div>'+ 
    '<label class="ed-label">Notes</label>'+
    '<textarea class="ed-textarea" id="tmNotes" placeholder="Strategy, matchups, meta notes...">'+liveNotes+'</textarea>'+
  '</div>';

  // Build members in order of selBuildIds
  var memberCards='';
  selBuildIds.forEach(function(bid,idx){
    var b=allBuilds.find(function(x){return x.id===bid});
    if(!b)return;
    // Synthesize a team-roster-shaped object from the build
    var m={
      build_id:b.id,pokemon_id:b.pokemon_id,pokemon_name:b.pokemon_name,
      type_1:b.type_1,type_2:b.type_2,form:b.form,
      image_url:b.image_url,shiny_url:b.shiny_url,is_shiny:b.is_shiny,
      build_name:b.build_name,archetype:b.archetype,item_name:b.item_name
    };
    memberCards+=tdRenderMember(m,idx+1,true);
  });
  var emptySlots='';
  for(var i=selBuildIds.length;i<teamRosterSize;i++){
    emptySlots+='<div class="td-empty-slot" onclick="openTeamBuildPicker('+(i+1)+')">+ Add Pokémon to Slot '+(i+1)+'</div>';
  }

  var viewToggle='<div style="display:flex;gap:.5rem;align-items:center">'+
    '<div class="td-view-toggle" style="flex:1"><button class="td-view-btn'+(tdView==='bars'?' active':'')+'" data-view="bars" onclick="setTdView(\'bars\')">📊 Bars</button><button class="td-view-btn'+(tdView==='hex'?' active':'')+'" data-view="hex" onclick="setTdView(\'hex\')">⬢ Hex</button></div>'+
    '<button class="btn btn-ghost" style="min-height:38px;padding:.35rem .7rem;font-size:.72rem;flex-shrink:0" onclick="expandAllTdMembers()">Expand all</button>'+
    '<button class="btn btn-ghost" style="min-height:38px;padding:.35rem .7rem;font-size:.72rem;flex-shrink:0" onclick="collapseAllTdMembers()">Collapse all</button>'+
  '</div>';

  c.innerHTML=hdr+'<div class="td-stack te-editor" style="padding-bottom:6rem">'+
    '<div class="te-left">'+teamInfo+tmIdentityHtml()+'</div>'+
    '<div class="te-right">'+
      '<div style="display:flex;align-items:baseline;justify-content:space-between;padding:0 .2rem;margin-top:.3rem"><div style="font-weight:800;font-size:.9rem">Roster <span style="color:var(--muted);font-weight:500;font-size:.78rem;margin-left:.3rem">'+selBuildIds.length+' / '+teamRosterSize+'</span></div><span class="td-fmt '+fmtCls+'">'+fmtLabel+'</span></div>'+
      viewToggle+
      memberCards+
      emptySlots+
      teamEditorCoverageHtml()+
      // Drop F.2: Share card (only renders when editing an existing team)
      tmShareSectionHtml()+
    '</div>'+
  '</div>'+
  '<div class="save-bar"><button class="btn btn-ghost" onclick="showTeamList()">Cancel</button><button class="btn btn-red" onclick="saveTeam()">💾 Save Team</button></div>';
}

