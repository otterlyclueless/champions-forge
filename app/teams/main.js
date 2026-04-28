// #SECTION: TEAMS
// ═══════════════════════════════════════
// TEAMS
// Team list, detail, editor, roster selection,
// save/update/delete, and team composition logic.
// ═══════════════════════════════════════

var teamView='list',editTeamId=null,detailTeamId=null,selBuildIds=[],teamRosterSize=6;
// Mobile-first team view state
var tdView='bars'; // Bars or Hex view for team member stats
var tdCollapsed={}; // {buildId: true} means collapsed — persists across re-renders
var tmCoverageOpen=false; // Editor-only collapsible coverage summary state
var tdCoverageOpen=false; // Detail-only collapsible coverage summary state

// ── Team Identity ─────────────────────────────────────────
var TM_ICONS=['🔥','⚡','💧','🌿','❄️','🌑','🌟','🛡️','⚔️','🎯','💎','🐉'];
var TM_THEMES=['Crimson','Ocean','Storm','Forest','Gold','Shadow','Frost','Ember'];
var TM_THEME_COLORS={Crimson:'#ef4444',Ocean:'#3b82f6',Storm:'#8b5cf6',Forest:'#22c55e',Gold:'#f59e0b',Shadow:'#64748b',Frost:'#06b6d4',Ember:'#f97316'};
var TM_ARCHETYPES=['Hyper Offense','Balance','Stall','Weather','Trick Room','VoltTurn','Sand','Rain','Sun','Speed Control'];
var tmSelIcon='',tmSelTheme='',tmSelArch='';

function selTI(field,val){
  if(field==='icon'){tmSelIcon=tmSelIcon===val?'':val;}
  else if(field==='theme'){tmSelTheme=tmSelTheme===val?'':val;}
  else if(field==='arch'){tmSelArch=tmSelArch===val?'':val;}
  var pickerId={icon:'tiIconPicker',theme:'tiThemePicker',arch:'tiArchPicker'}[field];
  var el=document.getElementById(pickerId);if(!el)return;
  el.innerHTML=_tiChips(field);
}
function _tiChips(field){
  if(field==='icon')return TM_ICONS.map(function(v){return'<button class="ti-chip ti-icon-chip'+(v===tmSelIcon?' active':'')+'" onclick="selTI(\'icon\',\''+v+'\')" type="button">'+v+'</button>';}).join('');
  if(field==='theme')return TM_THEMES.map(function(v){var col=TM_THEME_COLORS[v]||'#888';return'<button class="ti-chip ti-theme-chip'+(v===tmSelTheme?' active':'')+'" onclick="selTI(\'theme\',\''+v+'\')" type="button" style="--tc:'+col+'">'+v+'</button>';}).join('');
  return TM_ARCHETYPES.map(function(v){return'<button class="ti-chip ti-arch-chip'+(v===tmSelArch?' active':'')+'" onclick="selTI(\'arch\',\''+v+'\')" type="button">'+v+'</button>';}).join('');
}
function tmIdentityHtml(){
  return '<div class="card ti-card">'+
    '<div class="ed-label" style="margin-top:0">✨ Team Identity <span class="ti-optional">optional</span></div>'+
    '<div class="ti-section"><div class="ti-section-label">Icon</div><div class="ti-picker" id="tiIconPicker">'+_tiChips('icon')+'</div></div>'+
    '<div class="ti-section"><div class="ti-section-label">Theme</div><div class="ti-picker" id="tiThemePicker">'+_tiChips('theme')+'</div></div>'+
    '<div class="ti-section ti-section-last"><div class="ti-section-label">Archetype</div><div class="ti-picker" id="tiArchPicker">'+_tiChips('arch')+'</div></div>'+
  '</div>';
}

function toggleTeamEditorCoverage(){tmCoverageOpen=!tmCoverageOpen;renderTeams()}

function teamEditorCoverageHtml(){
  var members=[];
  selBuildIds.forEach(function(bid){
    var b=allBuilds.find(function(x){return x.id===bid});
    if(!b)return;
    members.push({type_1:b.type_1,type_2:b.type_2});
  });
  var filled=members.length;
  var label=filled?filled+' / '+teamRosterSize+' slots analysed':'Add Pokémon to analyse coverage';
  return '<div class="card tm-coverage-card">'+
    '<div class="tm-coverage-head" onclick="toggleTeamEditorCoverage()" role="button" tabindex="0" aria-expanded="'+(tmCoverageOpen?'true':'false')+'" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();toggleTeamEditorCoverage()}">'+
      '<div class="tm-coverage-title">'+
        '<span class="tm-coverage-icon">🎯</span>'+
        '<div><div class="tm-coverage-name">Team Coverage</div><div class="tm-coverage-sub">'+label+'</div></div>'+
      '</div>'+
      '<span class="tm-coverage-chev '+(tmCoverageOpen?'open':'')+'">▸</span>'+
    '</div>'+
    '<div class="tm-coverage-body" style="'+(tmCoverageOpen?'':'display:none')+'">'+teamCoverageHtml(members)+'</div>'+
  '</div>';
}

function toggleTeamDetailCoverage(){tdCoverageOpen=!tdCoverageOpen;renderTeams()}

function teamDetailCoverageHtml(members){
  var filled=(members||[]).length;
  var label=filled?filled+' members analysed':'Add Pokémon to analyse coverage';
  return '<div class="card tm-coverage-card">'+
    '<div class="tm-coverage-head" onclick="toggleTeamDetailCoverage()" role="button" tabindex="0" aria-expanded="'+(tdCoverageOpen?'true':'false')+'" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();toggleTeamDetailCoverage()}">'+
      '<div class="tm-coverage-title">'+
        '<span class="tm-coverage-icon">🎯</span>'+
        '<div><div class="tm-coverage-name">Type Coverage</div><div class="tm-coverage-sub">'+label+'</div></div>'+
      '</div>'+
      '<span class="tm-coverage-chev '+(tdCoverageOpen?'open':'')+'">▸</span>'+
    '</div>'+
    '<div class="tm-coverage-body" style="'+(tdCoverageOpen?'':'display:none')+'">'+teamCoverageHtml(members||[])+'</div>'+
  '</div>';
}

function showTeamList(){teamView='list';renderTeams()}
function showTeamBack(){
  if(typeof appNavContext!=='undefined'&&appNavContext.teamSource==='home'){
    appNavContext.teamSource='list';if(typeof dashNav==='function')dashNav('dash');return;
  }
  if(typeof appNavContext!=='undefined'&&appNavContext.teamSource==='profile'){
    appNavContext.teamSource='list';if(typeof dashNav==='function')dashNav('profile');return;
  }
  showTeamList();
}
function showTeamDetail(id,source){
  if(typeof appNavContext!=='undefined')appNavContext.teamSource=source||'list';
  detailTeamId=id;
  teamView='detail';
  tdCoverageOpen=false;

  var t=allTeams.find(function(x){return x.id===id});
  if(t&&t.members){
    t.members.forEach(function(m){
      var key=m.build_id||m.id;
      if(key)tdCollapsed[key]=true;
    });
  }

  renderTeams();
}
function showTeamEditor(id){
  editTeamId=id||null;teamView='editor';
  if(id){
    var t=allTeams.find(function(x){return x.id===id});
    if(t&&t.members)selBuildIds=t.members.map(function(m){return m.build_id});
    else selBuildIds=[];
    teamRosterSize=Math.max(selBuildIds.length,Math.min(6,Number(t&&t.roster_size)||6));
    tmSelIcon=t&&t.team_icon||'';
    tmSelTheme=t&&t.team_theme||'';
    tmSelArch=t&&t.team_archetype||'';
  }else{
    selBuildIds=[];
    teamRosterSize=6;
    tmSelIcon='';tmSelTheme='';tmSelArch='';
  }
  renderTeams()
}

async function loadTeamRoster(){
  if(!tk)return;
  // Pull the base teams plus their flattened roster rows, then stitch members onto each team client-side.
  try{var teams=await q('teams',{order:'created_at.desc'},true);var roster=[];try{roster=await q('team_roster',{order:'team_id.asc,slot_position.asc'},true)}catch(e){}allTeams=teams.map(function(t){t.members=(roster||[]).filter(function(r){return r.team_id===t.id});return t});document.getElementById('nc2').textContent=allTeams.length}catch(e){}
}

