// #SECTION: APP PICKERS
// ═══════════════════════════════════════
// APP PICKERS (extracted from app-builds.js)
// Ability Picker · Nature Picker · Item Picker · Move Picker
// Depends on: app-builds.js (selPkmnId, edRefresh, editorShiny)
//             app-profile.js (NAT_SC, NAT_ARCH, allNatures)
//             app-teams.js (selBuildIds, renderTeams)
// ═══════════════════════════════════════


var ablPickerCache={};

// ─── Desktop Finder-window picker (≥1024px only) ─────────────────────────────
// On desktop, pickers open as a THIRD column — stat calc | form | picker.
// The form stays fully visible. Mobile behavior is completely unchanged.
function _edDeskPicker(html,title){
  if(window.innerWidth<1024)return false;
  var col=document.getElementById('edPickerCol');
  if(!col)return false;
  col.innerHTML=
    '<div class="ed-dp-hdr">'+
      '<span class="ed-dp-title">'+title+'</span>'+
      '<button class="ed-dp-close" onclick="_edDeskClose()">✕</button>'+
    '</div>'+
    '<div class="ed-dp-body">'+html+'</div>';
  col.classList.add('open');
  // Match height to form col so all 3 cols line up, with inner scroll
  requestAnimationFrame(function(){
    var formCol=document.querySelector('.ed-right-col');
    if(formCol){
      var h=Math.min(formCol.getBoundingClientRect().height,window.innerHeight-160);
      col.style.height=h+'px';
    }
  });
  return true;
}
function _edDeskClose(){
  var col=document.getElementById('edPickerCol');
  if(!col)return;
  col.style.height='';
  col.classList.remove('open');
  setTimeout(function(){col.innerHTML='';},300);
}
// Strategy section: desktop intercept — opens text fields in third panel
function _edStrategyClick(e){
  if(window.innerWidth<1024)return true; // mobile: normal <details> toggle
  e.preventDefault();
  var b=editBuildId?allBuilds.find(function(x){return x.id===editBuildId}):null;
  var html=
    '<div><label class="ed-label">Win Condition</label>'+
    '<textarea class="ed-textarea ed-dp-strat-ta" id="edWin">'+(b?b.win_condition||'':'')+'</textarea></div>'+
    '<div style="margin-top:.6rem"><label class="ed-label">Strengths</label>'+
    '<textarea class="ed-textarea ed-dp-strat-ta" id="edStr">'+(b?b.strengths||'':'')+'</textarea></div>'+
    '<div style="margin-top:.6rem"><label class="ed-label">Weaknesses</label>'+
    '<textarea class="ed-textarea ed-dp-strat-ta" id="edWeak">'+(b?b.weaknesses||'':'')+'</textarea></div>';
  _edDeskPicker(html,'Strategy');
  // Size textareas to fill the panel height evenly
  requestAnimationFrame(function(){
    var col=document.getElementById('edPickerCol');
    if(!col)return;
    var available=col.getBoundingClientRect().height - 54 - 24 - 3*32 - 2*10; // header + padding + labels + gaps
    var taH=Math.max(Math.floor(available/3), 60);
    ['edWin','edStr','edWeak'].forEach(function(id){
      var el=document.getElementById(id);
      if(el)el.style.height=taH+'px';
    });
  });
  return false;
}

