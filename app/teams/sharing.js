// ═══════════════════════════════════════
// TEAM SHARE TOGGLE (Drop F.2)
// Team editor share card + team detail pill.
// Customise panel has one toggle: show_type_coverage (default OFF).
// ═══════════════════════════════════════

function tmShareUrl(code){
  if(!code)return '';
  var base=location.origin+location.pathname.replace(/\/index\.html$/,'/');
  if(!base.endsWith('/'))base+='/';
  return base+'#/t/'+code;
}

function tmGetShareFields(t){
  var raw=t&&t.share_fields;
  var f={type_coverage:false};
  if(raw&&typeof raw==='object'){
    if(raw.type_coverage===true)f.type_coverage=true;
  }
  return f;
}

function tmShareSummaryText(fields){
  return fields.type_coverage?'Coverage shown':'Coverage hidden';
}

function tmShareHintText(fields){
  var handle=userProfile&&userProfile.username?userProfile.username:'username';
  var base='Visible: team name, format, 6-slot roster, <strong>@'+handle.replace(/</g,'&lt;')+'</strong> byline.';
  if(fields.type_coverage)base+=' Type coverage shown.';
  else base+=' Coverage hidden.';
  base+=' Notes stay private.';
  return base;
}

// Render the Share card HTML inside the team editor. Returns '' when not
// editing an existing team.
function tmShareSectionHtml(){
  if(!editTeamId)return '';
  var t=allTeams.find(function(x){return x.id===editTeamId});if(!t)return '';
  var isOn=!!t.is_public;
  var code=t.share_code||'';
  var url=code?tmShareUrl(code):'';
  var fields=tmGetShareFields(t);
  var summaryText=tmShareSummaryText(fields);
  var hintText=tmShareHintText(fields);

  function checkRow(field,label,sub){
    var on=!!fields[field];
    return (
      '<div class="ed-check-row '+(on?'on':'off')+'" data-field="'+field+'" onclick="tmToggleShareField(\''+field+'\')" tabindex="0" role="checkbox" aria-checked="'+(on?'true':'false')+'" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();tmToggleShareField(\''+field+'\')}">'+
        '<div class="ed-check">'+(on?'<i class="ph-bold ph-check"></i>':'')+'</div>'+
        '<div>'+
          '<div class="ed-check-label">'+label+'</div>'+
          '<div class="ed-check-sub">'+sub+'</div>'+
        '</div>'+
      '</div>'
    );
  }

  return (
    '<div class="card ed-share-card'+(isOn?' active':'')+'" id="tmShareCard">'+
      '<div class="ed-share-head">'+
        '<div class="ed-share-title">'+
          '<i class="ph-bold ph-share-network"></i>'+
          '<div>'+
            '<h3>Share publicly</h3>'+
            '<span class="label-sub">Anyone with the link can view</span>'+
          '</div>'+
        '</div>'+
        '<div class="ed-share-toggle'+(isOn?' on':'')+'" id="tmShareToggle" role="switch" aria-checked="'+(isOn?'true':'false')+'" tabindex="0" onclick="tmToggleShare()" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();tmToggleShare()}">'+
          '<div class="knob"></div>'+
        '</div>'+
      '</div>'+
      '<div class="ed-share-body" id="tmShareBody" style="'+(isOn?'':'display:none')+'">'+

        // Customise panel — just 1 toggle for teams
        '<div class="ed-customise" id="tmCustomise">'+
          '<div class="ed-customise-summary" onclick="tmToggleCustomiseExpand()">'+
            '<div class="left">'+
              '<i class="ph-bold ph-sliders-horizontal"></i>'+
              '<div>'+
                '<div class="title">Customise what\'s shared</div>'+
                '<div class="sub" id="tmCustomiseSummary">'+summaryText+'</div>'+
              '</div>'+
            '</div>'+
            '<span class="chev">▸</span>'+
          '</div>'+
          '<div class="ed-customise-body">'+
            '<div class="ed-customise-inner">'+
              checkRow('type_coverage','Type Coverage','Resists + weaknesses grid on public page')+
            '</div>'+
          '</div>'+
        '</div>'+

        '<div class="ed-share-url-row">'+
          '<div class="ed-share-url" id="tmShareUrlEl">'+(url?url.replace(/^https?:\/\//,''):'')+'</div>'+
          '<button type="button" class="ed-share-copy-btn" id="tmShareCopyBtn" onclick="tmCopyShareUrl()"><i class="ph-bold ph-copy"></i></button>'+
          '<button type="button" class="ed-share-share-btn" id="tmShareShareBtn" onclick="tmShareNow()"><i class="ph-bold ph-share-network"></i> Share</button>'+
        '</div>'+
        '<div class="ed-share-hint">'+
          '<i class="ph ph-info"></i>'+
          '<span id="tmShareHint">'+hintText+'</span>'+
        '</div>'+

      '</div>'+
    '</div>'
  );
}

function tmToggleCustomiseExpand(){
  var panel=document.getElementById('tmCustomise');if(!panel)return;
  panel.classList.toggle('open');
}

async function tmToggleShare(){
  if(!editTeamId){toast('Save the team first','err');return}
  var t=allTeams.find(function(x){return x.id===editTeamId});if(!t){toast('Team not found','err');return}
  var toggle=document.getElementById('tmShareToggle');
  if(!toggle||toggle.classList.contains('loading'))return;

  var wasOn=!!t.is_public;
  var turningOn=!wasOn;

  if(turningOn&&(!userProfile||!userProfile.username)){
    showUsernameModal(function(){tmToggleShare();});
    return;
  }
  toggle.classList.add('loading');
  try{
    var code=t.share_code;
    if(turningOn&&!code){
      code=await ensureShareCode('team',editTeamId);
      t.share_code=code;
    }
    await upd('teams',{'id':'eq.'+editTeamId},{is_public:turningOn},true);
    t.is_public=turningOn;

    var card=document.getElementById('tmShareCard');
    var body=document.getElementById('tmShareBody');
    var urlEl=document.getElementById('tmShareUrlEl');
    toggle.classList.toggle('on',turningOn);
    toggle.setAttribute('aria-checked',turningOn?'true':'false');
    if(card)card.classList.toggle('active',turningOn);
    if(body)body.style.display=turningOn?'':'none';
    if(urlEl&&code)urlEl.textContent=tmShareUrl(code).replace(/^https?:\/\//,'');

    toast(turningOn?'Team is now public ✨':'Team is now private');
  }catch(e){
    console.log('tmToggleShare failed:',e);
    toast(e.message||'Failed to update sharing','err');
  }finally{
    toggle.classList.remove('loading');
  }
}

async function tmToggleShareField(field){
  if(!editTeamId){toast('Save the team first','err');return}
  if(['type_coverage'].indexOf(field)===-1)return;
  var t=allTeams.find(function(x){return x.id===editTeamId});if(!t)return;
  var row=document.querySelector('.ed-check-row[data-field="'+field+'"]');
  if(!row||row.classList.contains('loading'))return;

  var current=tmGetShareFields(t);
  var newVal=!current[field];
  var updatedFields=Object.assign({},current,(function(){var o={};o[field]=newVal;return o})());
  // For teams: default state is {type_coverage:false}. Only store if non-default.
  var isDefault=!updatedFields.type_coverage;
  var payload=isDefault?null:updatedFields;

  row.classList.add('loading');
  try{
    await upd('teams',{'id':'eq.'+editTeamId},{share_fields:payload},true);
    t.share_fields=payload;

    row.classList.toggle('on',newVal);
    row.classList.toggle('off',!newVal);
    row.setAttribute('aria-checked',newVal?'true':'false');
    var checkIcon=row.querySelector('.ed-check');
    if(checkIcon)checkIcon.innerHTML=newVal?'<i class="ph-bold ph-check"></i>':'';

    var fields=tmGetShareFields(t);
    var summaryEl=document.getElementById('tmCustomiseSummary');
    if(summaryEl)summaryEl.textContent=tmShareSummaryText(fields);
    var hintEl=document.getElementById('tmShareHint');
    if(hintEl)hintEl.innerHTML=tmShareHintText(fields);

    var fieldLabel={type_coverage:'Type Coverage'}[field];
    toast((newVal?'Showing ':'Hiding ')+fieldLabel+' on public view');
  }catch(e){
    console.log('tmToggleShareField failed:',e);
    toast(e.message||'Failed to update','err');
  }finally{
    row.classList.remove('loading');
  }
}

async function tmCopyShareUrl(){
  if(!editTeamId)return;
  var t=allTeams.find(function(x){return x.id===editTeamId});if(!t||!t.share_code){toast('No share URL yet','err');return}
  var url=tmShareUrl(t.share_code);
  var btn=document.getElementById('tmShareCopyBtn');
  var ok=false;
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      await navigator.clipboard.writeText(url);ok=true;
    }else{
      var ta=document.createElement('textarea');ta.value=url;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.focus();ta.select();try{ok=document.execCommand('copy')}catch(_){ok=false}
      document.body.removeChild(ta);
    }
  }catch(_){ok=false}
  if(ok&&btn){
    var origHtml=btn.innerHTML;btn.classList.add('copied');btn.innerHTML='<i class="ph-bold ph-check"></i> Copied!';
    setTimeout(function(){btn.classList.remove('copied');btn.innerHTML=origHtml},1500);
    toast('Share link copied');
  }else{
    toast('Copy failed — select the URL manually','err');
  }
}

// ═══════════════════════════════════════
// TEAM DETAIL PUBLIC PILL (Drop F.2)
// ═══════════════════════════════════════

function tdPublicPillHtml(t){
  if(!t||!t.is_public||!t.share_code)return '';
  var url=tmShareUrl(t.share_code);
  var fields=tmGetShareFields(t);
  var summaryText=tmShareSummaryText(fields);
  return (
    '<div class="bd-pill-wrap">'+
      '<div class="bd-pill" id="tdPill" onclick="tdTogglePill()" tabindex="0" role="button" aria-expanded="false" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();tdTogglePill()}">'+
        '<i class="ph-bold ph-globe"></i>'+
        '<span>Public</span>'+
        '<span class="chev">▸</span>'+
      '</div>'+
      '<div class="bd-pill-panel" id="tdPillPanel">'+
        '<div class="bd-pill-panel-inner">'+
          '<div class="bd-pill-stats" id="tdPillSummary">'+summaryText+'</div>'+
          '<div class="bd-pill-url-row">'+
            '<div class="bd-pill-url">'+url.replace(/^https?:\/\//,'')+'</div>'+
            '<button type="button" class="bd-pill-btn" onclick="tdPillCopy()" aria-label="Copy link"><i class="ph-bold ph-copy"></i></button>'+
            '<button type="button" class="bd-pill-btn primary" onclick="tdPillShare()"><i class="ph-bold ph-share-network"></i> Share</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'
  );
}

function tdTogglePill(){
  var pill=document.getElementById('tdPill');if(!pill)return;
  var open=pill.classList.toggle('open');
  pill.setAttribute('aria-expanded',open?'true':'false');
}

async function tdPillCopy(){
  var t=allTeams.find(function(x){return x.id===detailTeamId});
  if(!t||!t.share_code){toast('No share URL','err');return}
  var url=tmShareUrl(t.share_code);
  if(typeof copyUrl==='function')return copyUrl(url);
  try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(_){toast('Copy failed','err')}
}

async function tdPillShare(){
  var t=allTeams.find(function(x){return x.id===detailTeamId});
  if(!t||!t.share_code){toast('No share URL','err');return}
  // Drop F.2.1: render image card + native share
  if(typeof shareImage==='function')return shareImage('team',t.id);
  // Fallback — URL-only
  var url=tmShareUrl(t.share_code);
  var title=t.name||'Champions Forge team';
  if(typeof shareOrCopy==='function')return shareOrCopy(url,title,'Check out my Champions Forge team!');
  try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(_){toast('Copy failed','err')}
}

// Team editor Share button — same handler as pill
async function tmShareNow(){
  if(!editTeamId){toast('Save the team first','err');return}
  var t=allTeams.find(function(x){return x.id===editTeamId});
  if(!t){toast('Team not found','err');return}
  if(!t.is_public||!t.share_code){toast('Make the team public first','err');return}
  if(typeof shareImage==='function')return shareImage('team',t.id);
  var url=tmShareUrl(t.share_code);
  if(typeof shareOrCopy==='function')return shareOrCopy(url,t.name||'Champions Forge team','Check out my team!');
  try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(_){toast('Copy failed','err')}
}

