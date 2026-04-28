// #SECTION: TEAM DETAIL VIEW
// ───────────────────────────────────────
// TEAM DETAIL VIEW
// Detailed single-team screen layout and rendering.
// ───────────────────────────────────────

function renderTeamDetail(c){
  var t=allTeams.find(function(x){return x.id===detailTeamId});
  if(!t){showTeamList();return}
  var fc=t.format==='Singles'?'fmt-s':'fmt-d';
  var rosterSize=Math.max((t.members||[]).length,Math.min(6,Number(t.roster_size)||6));
  var safeName=t.name.replace(/'/g,"\\'");
  var tdThemeCol=t.team_theme?TM_THEME_COLORS[t.team_theme]||null:null;
  var tdHeadStyle=tdThemeCol?'border-bottom:2px solid '+tdThemeCol+';':'';
  var tdIcon=t.team_icon?'<span style="font-size:1rem;margin-right:.25rem;opacity:.9">'+t.team_icon+'</span>':'';
  var tdArch=t.team_archetype?'<span class="tml-arch-pill" style="margin-left:.35rem">'+t.team_archetype+'</span>':'';

  // Header with Edit + overflow menu
var hdr='<div class="pg-head" style="'+tdHeadStyle+'"><div class="vh-title-row">'+
      '<span class="vh-back" onclick="showTeamBack()">← '+t.name+'</span>'+
      '<div class="vh-actions" onclick="event.stopPropagation()">'+
        '<button class="vh-btn vh-btn-sm vh-btn-edit" onclick="showTeamEditor(\''+t.id+'\')" aria-label="Edit team">✏️</button>'+
        '<button class="vh-btn vh-btn-sm" onclick="confirmDelTeam(\''+t.id+'\',\''+safeName+'\')" aria-label="Delete team" style="color:var(--red);border-color:color-mix(in srgb,var(--red) 30%,var(--border))"><i class="ph-bold ph-trash"></i></button>'+
        '<div class="om-wrap">'+
          '<button class="vh-btn vh-btn-sm vh-btn-more" onclick="toggleTmlOm(\''+t.id+'\')" aria-label="More">⋮</button>'+
          '<div class="om-menu" id="tmlOm-'+t.id+'">'+
            (t.is_public&&t.share_code?'<button class="om-item" onclick="closeAllTmlOms();shareImage(\'team\',\''+t.id+'\')"><span class="om-item-icon">🔗</span>Share team</button>':'')+
            (t.is_public&&t.share_code?'<div class="om-sep"></div>':'')+
            '<button class="om-item destructive" onclick="closeAllTmlOms();confirmDelTeam(\''+t.id+'\',\''+safeName+'\')"><span class="om-item-icon">🗑</span>Delete team</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="pg-sub">'+tdIcon+(t.format||'')+' · '+(t.members||[]).length+' / '+rosterSize+' members'+tdArch+'</div>'+
  '</div>';

  var members='';
  var detailMembers=(t.members||[]).slice(0,rosterSize);
  detailMembers.forEach(function(m,idx){members+=tdRenderMember(m,idx+1,false)});
  var emptySlots='';
  for(var i=detailMembers.length;i<rosterSize;i++){emptySlots+='<div class="td-empty-slot" style="cursor:default">Empty Slot '+(i+1)+'</div>'}

  var viewToggle='<div style="display:flex;gap:.5rem;align-items:center">'+
    '<div class="td-view-toggle" style="flex:1"><button class="td-view-btn'+(tdView==='bars'?' active':'')+'" data-view="bars" onclick="setTdView(\'bars\')">📊 Bars</button><button class="td-view-btn'+(tdView==='hex'?' active':'')+'" data-view="hex" onclick="setTdView(\'hex\')">⬢ Hex</button></div>'+
    '<button class="btn btn-ghost" style="min-height:38px;padding:.35rem .7rem;font-size:.72rem;flex-shrink:0" onclick="expandAllTdMembers()">Expand all</button>'+
    '<button class="btn btn-ghost" style="min-height:38px;padding:.35rem .7rem;font-size:.72rem;flex-shrink:0" onclick="collapseAllTdMembers()">Collapse all</button>'+
  '</div>';

  // Type coverage + battle log retained
  var rec=getTeamRecord(t.id);
  var recordHtml=rec.total?'<span style="font-size:.72rem;font-weight:500;color:var(--muted);margin-left:.4rem">'+rec.w+'W '+rec.l+'L '+rec.d+'D · <span style="color:'+(rec.rate>=50?'var(--green)':'var(--red)')+'">'+rec.rate+'% WR</span></span>':'';
  var battleLogItems=allBattles.filter(function(b){return b.team_id===t.id}).slice(0,10);
  var battleLogHtml=battleLogItems.length?battleLogItems.map(function(l){
    var icon=l.result==='win'?'🏆':l.result==='loss'?'💀':'🤝';
    var col=l.result==='win'?'var(--green)':l.result==='loss'?'var(--red)':'var(--muted)';
    var d=new Date(l.battle_date);var ds=d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    return '<div style="display:flex;align-items:center;gap:.5rem;padding:.5rem .7rem;border-radius:10px;background:var(--surface);margin-bottom:.35rem"><span style="font-size:1rem">'+icon+'</span><span style="font-size:.78rem;font-weight:700;color:'+col+'">'+l.result.charAt(0).toUpperCase()+l.result.slice(1)+'</span>'+(l.opponent_notes?'<span style="font-size:.72rem;color:var(--muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+l.opponent_notes+'</span>':'<span style="flex:1"></span>')+'<span style="font-size:.65rem;color:var(--muted)">'+ds+'</span><button style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:.7rem" onclick="event.stopPropagation();delBattle(\''+l.id+'\')">✕</button></div>';
  }).join(''):'<p style="color:var(--muted);font-size:.78rem">No battles logged yet</p>';

  // Hero banner — 6 sprites at a glance (hidden on mobile via CSS)
  var heroHtml='<div class="td-hero">'+
    detailMembers.map(function(m){
      var img=m.is_shiny&&m.shiny_url?m.shiny_url:(m.image_url||'');
      return '<div class="td-hero-mem"><img class="td-hero-img" src="'+img+'" onerror="this.style.opacity=\'0.15\'"><div class="td-hero-name">'+(m.pokemon_name||'')+'</div></div>';
    }).join('')+
    (function(){var e='';for(var i=detailMembers.length;i<rosterSize;i++){e+='<div class="td-hero-mem td-hero-slot-empty"><div class="td-hero-empty-img"><i class="ph-bold ph-plus"></i></div><div class="td-hero-name" style="opacity:.3">Slot '+(i+1)+'</div></div>'}return e})()+
  '</div>';

  c.innerHTML=hdr+heroHtml+'<div class="td-stack">'+
    // Drop F.2: Public pill (only renders when team is public)
    tdPublicPillHtml(t)+
    viewToggle+
    '<div class="td-summary"><span class="td-fmt '+fc+'">'+(t.format||'?')+'</span><span style="color:var(--muted);font-size:.72rem">'+detailMembers.length+' of '+rosterSize+' slots filled · tap to inspect</span></div>'+
    (t.notes?'<div class="card" style="padding:.8rem 1rem"><div style="font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;font-weight:700;margin-bottom:.3rem">Notes</div><div style="font-size:.82rem;line-height:1.45;color:var(--text2)">'+t.notes+'</div></div>':'')+
    members+
    emptySlots+
    teamDetailCoverageHtml(detailMembers)+
    '<div class="card"><h3>📈 Battle Log '+recordHtml+'</h3>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.4rem;margin-bottom:.7rem"><button class="btn btn-ghost" style="color:var(--green);min-height:40px;font-size:.78rem;padding:.4rem .3rem" onclick="logBattle(\''+t.id+'\',\'win\')">🏆 Win</button><button class="btn btn-ghost" style="color:var(--red);min-height:40px;font-size:.78rem;padding:.4rem .3rem" onclick="logBattle(\''+t.id+'\',\'loss\')">💀 Loss</button><button class="btn btn-ghost" style="min-height:40px;font-size:.78rem;padding:.4rem .3rem" onclick="logBattle(\''+t.id+'\',\'draw\')">🤝 Draw</button></div>'+
      battleLogHtml+
    '</div>'+
  '</div>';
}

function togBldPick(id){openTeamBuildPicker(Math.min(teamRosterSize,selBuildIds.length+1))}
function rmSlot(i){selBuildIds.splice(i,1);renderTeams()}

async function saveTeam(){
  var name=document.getElementById('tmName').value.trim();if(!name){toast('Enter a team name','err');return}
  var sizeEl=document.getElementById('tmRosterSize');
  var rosterSize=Math.max(selBuildIds.length,Math.min(6,Number(sizeEl&&sizeEl.value)||teamRosterSize||6));
  var body={user_id:usr.id,name:name,format:document.getElementById('tmFmt').value,notes:document.getElementById('tmNotes').value||null,status:'Testing',roster_size:rosterSize,team_icon:tmSelIcon||null,team_theme:tmSelTheme||null,team_archetype:tmSelArch||null};
  try{var tid;
  // On edit we replace the roster links so slot order stays in sync with the current picker state.
  if(editTeamId){await upd('teams',{'id':'eq.'+editTeamId},body,true);tid=editTeamId;await rm('team_builds',{'team_id':'eq.'+tid},true)}
  else{var res=await ins('teams',body,true);tid=res[0].id}
  for(var i=0;i<selBuildIds.length;i++){await ins('team_builds',{team_id:tid,build_id:selBuildIds[i],slot_position:i+1},true)}
  toast(editTeamId?'Team updated!':'Team created!');await loadTeamRoster();showTeamList();renderDash()}catch(e){toast(e.message,'err')}
}
function confirmDelTeam(id,name){
  resetConfirmMod();
  document.getElementById('cmEmoji').textContent='🏆';
  document.getElementById('cmTitle').textContent='Delete Team?';
  document.getElementById('cmMsg').textContent='Delete "'+name+'"? This cannot be undone.';
  document.getElementById('cmBtn').onclick=function(){delTeam(id)};
  document.getElementById('confirmMod').classList.add('open');
}
async function delTeam(id){try{await rm('teams',{'id':'eq.'+id},true);closeCm();toast('Team deleted');await loadTeamRoster();renderTeams();renderDash()}catch(e){toast(e.message,'err')}}

