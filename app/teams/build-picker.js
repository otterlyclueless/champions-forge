// ═══════════════════════════════════════
// TEAM BUILD PICKER
// Slot-aware build picker used by the Teams editor.
// Opens as a bottom sheet instead of sending the user down to a long inline list.
// Writes selected build ids into selBuildIds, preserving saveTeam() contract.
// ═══════════════════════════════════════

var _tbpSlot=1,_tbpSearch='',_tbpFormat='all',_tbpType='all',_tbpMode='available';

function tbpEsc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function tbpJs(v){return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}

function ensureTeamBuildPickerOverlay(){
  var ov=document.getElementById('teamBuildPickerOv');
  if(ov)return ov;
  ov=document.createElement('div');
  ov.id='teamBuildPickerOv';
  ov.setAttribute('aria-hidden','true');
  ov.style.cssText='position:fixed;inset:0;z-index:1900;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);padding:0;';
  document.body.appendChild(ov);
  return ov;
}

function openTeamBuildPicker(slot){
  var maxSlot=Math.min(6,(selBuildIds||[]).length+1);
  _tbpSlot=Math.max(1,Math.min(Number(slot)||1,maxSlot));
  _tbpSearch='';
  _tbpFormat='all';
  _tbpType='all';
  _tbpMode='available';
  var ov=ensureTeamBuildPickerOverlay();
  renderTeamBuildPickerShell();
  renderTeamBuildPickerBody();
  ov.style.display='flex';
  ov.setAttribute('aria-hidden','false');
  ov.onclick=function(e){if(e.target===ov)closeTeamBuildPicker();};
  setTimeout(function(){var input=document.getElementById('tbpSearchInput');if(input)input.focus();},60);
}

function closeTeamBuildPicker(){
  var ov=document.getElementById('teamBuildPickerOv');
  if(!ov)return;
  ov.style.display='none';
  ov.setAttribute('aria-hidden','true');
}

function setTeamBuildPickerSearch(v){_tbpSearch=(v||'').toLowerCase();renderTeamBuildPickerBody()}
function setTeamBuildPickerFormat(v){_tbpFormat=v||'all';renderTeamBuildPickerShell();renderTeamBuildPickerBody()}
function setTeamBuildPickerType(v){_tbpType=v||'all';renderTeamBuildPickerShell();renderTeamBuildPickerBody()}
function setTeamBuildPickerMode(v){_tbpMode=v||'available';renderTeamBuildPickerShell();renderTeamBuildPickerBody()}

function tbpBuildTypeOptions(){
  var seen={},out=[];
  (allBuilds||[]).forEach(function(b){
    [b.type_1,b.type_2].forEach(function(t){if(t&&!seen[t]){seen[t]=1;out.push(t)}});
  });
  return out.sort();
}

function tbpVisibleBuilds(){
  var selected=selBuildIds||[];
  var currentId=selected[_tbpSlot-1]||'';
  return (allBuilds||[]).filter(function(b){
    if(!b||!b.id)return false;
    var alreadySelected=selected.indexOf(b.id)!==-1&&b.id!==currentId;
    if(_tbpMode==='available'&&alreadySelected)return false;
    if(_tbpMode==='favourites'&&!b.is_favourite)return false;
    if(_tbpFormat!=='all'){
      var bf=b.battle_format||b.format||'';
      if(bf!==_tbpFormat)return false;
    }
    if(_tbpType!=='all'&&b.type_1!==_tbpType&&b.type_2!==_tbpType)return false;
    if(_tbpSearch){
      var hay=[b.pokemon_name,b.build_name,b.archetype,b.item_name,b.ability,b.nature_name,b.type_1,b.type_2].join(' ').toLowerCase();
      if(hay.indexOf(_tbpSearch)===-1)return false;
    }
    return true;
  });
}

function tbpPill(label,value,current,handler){
  return '<button type="button" class="it-pill'+(value===current?' active':'')+'" onclick="'+handler+'(\''+tbpJs(value)+'\')">'+label+'</button>';
}

function renderTeamBuildPickerShell(){
  var ov=ensureTeamBuildPickerOverlay();
  var selected=selBuildIds||[];
  var currentId=selected[_tbpSlot-1]||'';
  var current=currentId?(allBuilds||[]).find(function(b){return b.id===currentId}):null;
  var typeOptions=tbpBuildTypeOptions();
  var typePills=tbpPill('All Types','all',_tbpType,'setTeamBuildPickerType')+typeOptions.map(function(t){return tbpPill(t,t,_tbpType,'setTeamBuildPickerType')}).join('');
  var html='<div class="picker-sheet tbp-sheet">'+
    '<div class="picker-head tbp-head">'+
      '<div class="picker-handle"></div>'+
      '<div class="picker-title tbp-title">'+
        '<div><span>Choose build for Slot '+_tbpSlot+'</span><div class="tbp-sub">'+(current?'Replacing '+tbpEsc(current.pokemon_name||current.build_name):'Select one of your saved builds')+'</div></div>'+
        '<button type="button" class="picker-close" onclick="closeTeamBuildPicker()" aria-label="Close">✕</button>'+
      '</div>'+
      '<div class="picker-search"><input class="search-box" id="tbpSearchInput" placeholder="Search Pokémon, build, item, role..." value="'+tbpEsc(_tbpSearch)+'" oninput="setTeamBuildPickerSearch(this.value)" autocomplete="off"></div>'+
      '<div class="picker-tabs tbp-tabs">'+
        tbpPill('Available','available',_tbpMode,'setTeamBuildPickerMode')+
        tbpPill('All','all',_tbpMode,'setTeamBuildPickerMode')+
        tbpPill('Favourites','favourites',_tbpMode,'setTeamBuildPickerMode')+
        '<span class="tbp-tab-sep"></span>'+
        tbpPill('All Formats','all',_tbpFormat,'setTeamBuildPickerFormat')+
        tbpPill('Singles','Singles',_tbpFormat,'setTeamBuildPickerFormat')+
        tbpPill('Doubles','Doubles',_tbpFormat,'setTeamBuildPickerFormat')+
      '</div>'+
      '<div class="picker-tabs tbp-tabs tbp-type-tabs">'+typePills+'</div>'+
    '</div>'+
    '<div class="picker-body tbp-body" id="teamBuildPickerBody"></div>'+
  '</div>';
  ov.innerHTML=html;
}

function renderTeamBuildPickerBody(){
  var body=document.getElementById('teamBuildPickerBody');
  if(!body)return;
  var builds=tbpVisibleBuilds();
  var selected=selBuildIds||[];
  var currentId=selected[_tbpSlot-1]||'';
  if(!(allBuilds||[]).length){
    body.innerHTML='<div class="empty" style="padding:2rem 0;text-align:center;color:var(--muted);font-size:.82rem">No builds yet. Create some in the Builds page first.</div>';
    return;
  }
  if(!builds.length){
    body.innerHTML='<div class="empty" style="padding:2rem 0;text-align:center;color:var(--muted);font-size:.82rem">No builds match those filters.</div>';
    return;
  }
  body.innerHTML='<div class="tbp-list">'+builds.map(function(b){
    var picked=b.id===currentId;
    var alreadySelected=selected.indexOf(b.id)!==-1&&!picked;
    var img=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
    var isMega=b.form==='Mega';
    var t1=b.type_1,t2=b.type_2;
    var t1Col=t1&&TC[t1]?TC[t1].m:'var(--muted)';
    var t2Col=t2&&TC[t2]?TC[t2].m:'';
    var sub=[b.archetype,b.nature_name,b.item_name].filter(Boolean).join(' · ')||'No build notes yet';
    var format=b.battle_format||b.format||'';
    return '<button type="button" class="tbp-build-row'+(picked?' selected':'')+(alreadySelected?' already':'')+'" onclick="selectTeamBuildForSlot(\''+tbpJs(b.id)+'\')">'+
      '<div class="tbp-sprite" style="background:linear-gradient(135deg,'+t1Col+'26,var(--surface2))"><img src="'+tbpEsc(img)+'" alt="" onerror="this.style.opacity=\'0.2\'"></div>'+
      '<div class="tbp-info">'+
        '<div class="tbp-name"><span>'+(picked?'✓ ':'')+tbpEsc(b.pokemon_name||'?')+'</span>'+(isMega&&typeof megaBadge==='function'?megaBadge(16):'')+(b.is_shiny?' <span class="tbp-shiny">✦</span>':'')+'</div>'+
        '<div class="tbp-build-name">'+tbpEsc(b.build_name||'Untitled build')+'</div>'+
        '<div class="tbp-meta">'+tbpEsc(sub)+' · '+(b.total_sp||0)+' SP</div>'+
      '</div>'+
      '<div class="tbp-right">'+
        '<div class="tbp-types">'+(t1?'<span class="type-pill" style="background:'+t1Col+'">'+tbpEsc(t1)+'</span>':'')+(t2?'<span class="type-pill" style="background:'+t2Col+'">'+tbpEsc(t2)+'</span>':'')+'</div>'+
        (format?'<span class="tbp-format">'+tbpEsc(format)+'</span>':'')+
        (alreadySelected?'<span class="tbp-already">Already in team</span>':'')+
      '</div>'+
    '</button>';
  }).join('')+'</div>';
}

function selectTeamBuildForSlot(buildId){
  if(!buildId)return;
  var existing=selBuildIds.indexOf(buildId);
  var currentIndex=_tbpSlot-1;
  if(existing!==-1&&existing!==currentIndex){
    toast('That build is already on this team','err');
    return;
  }

  if(typeof tdCollapsed==='object'&&tdCollapsed){
    var previousId=selBuildIds[currentIndex];
    if(previousId&&previousId!==buildId)delete tdCollapsed[previousId];
  }

  if(currentIndex<selBuildIds.length){
    selBuildIds[currentIndex]=buildId;
  }else if(selBuildIds.length<6){
    selBuildIds.push(buildId);
  }else{
    toast('Team is already full','err');
    return;
  }

  if(typeof tdCollapsed==='object'&&tdCollapsed){
    tdCollapsed[buildId]=true;
  }

  closeTeamBuildPicker();
  renderTeams();
}

