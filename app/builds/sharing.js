// #SECTION: SHARE TOGGLE (Drop F.2a)
// ═══════════════════════════════════════
// SHARE TOGGLE
// Share card rendered inside the build editor form when editing an existing
// build (editBuildId truthy). Toggle flips builds.is_public; first-ever ON
// call generates a share code via ensureShareCode() from app-router.js.
// share_code is preserved on OFF so re-enabling reuses the same URL.
// ═══════════════════════════════════════

// Build the share URL for a given code. Uses current origin so the link is
// right whether running on localhost (Live Server), GitHub Pages, or future
// custom domain.
function edShareUrl(code){
  if(!code)return '';
  var base=location.origin+location.pathname.replace(/\/index\.html$/,'/');
  if(!base.endsWith('/'))base+='/';
  return base+'#/b/'+code;
}

// ═══════════════════════════════════════
// ABILITY PICKER — Drop G.2b
// Replaces free-text #edAbi with a bottom
// sheet showing legal abilities for the
// selected Pokémon. saveBuild() reads the
// hidden #edAbi input unchanged.
// ═══════════════════════════════════════
// Ability picker, Nature picker, Item picker, Move picker → see app/pickers/*
// (extracted to reduce file size)


// Read share_fields with defaults (all visible when NULL).
// Keys: moves, ability, stats, item — all boolean.
function edGetShareFields(b){
  var raw=b&&b.share_fields;
  var f={moves:true,ability:true,stats:true,item:true};
  if(raw&&typeof raw==='object'){
    if(raw.moves===false)f.moves=false;
    if(raw.ability===false)f.ability=false;
    if(raw.stats===false)f.stats=false;
    if(raw.item===false)f.item=false;
  }
  return f;
}

// Count visible fields (out of 4) for the customise summary
function edShareVisibleCount(fields){
  var c=0;
  if(fields.moves)c++;
  if(fields.ability)c++;
  if(fields.stats)c++;
  if(fields.item)c++;
  return c;
}

// Dynamic summary for the customise panel header: "3 of 4 fields visible · Stats hidden"
function edShareSummaryText(fields){
  var visible=edShareVisibleCount(fields);
  var hiddenList=[];
  if(!fields.moves)hiddenList.push('Moves');
  if(!fields.ability)hiddenList.push('Ability');
  if(!fields.stats)hiddenList.push('Stats');
  if(!fields.item)hiddenList.push('Item');
  var base=visible+' of 4 fields visible';
  if(hiddenList.length===0)return base;
  return base+' · '+hiddenList.join(', ')+' hidden';
}

// Dynamic hint sentence showing exactly what's visible on the public page
function edShareHintText(fields){
  var visibleParts=['Pokémon','name','format'];
  if(fields.moves)visibleParts.push('Moves');
  if(fields.ability)visibleParts.push('Ability');
  if(fields.item)visibleParts.push('Item');
  visibleParts.push('Nature');
  if(fields.stats)visibleParts.push('Stats');
  var handle=userProfile&&userProfile.username?userProfile.username:'username';
  var hiddenList=[];
  if(!fields.moves)hiddenList.push('Moves');
  if(!fields.ability)hiddenList.push('Ability');
  if(!fields.stats)hiddenList.push('Stats');
  if(!fields.item)hiddenList.push('Item');
  var base='Visible: '+visibleParts.join(', ')+', <strong>@'+pubEscape(handle)+'</strong> byline.';
  if(hiddenList.length)base+=' '+hiddenList.join(', ')+' hidden.';
  return base;
}

// Small escape helper used here; router defines its own pubEscape.
function pubEscapeLocal(s){
  if(s==null)return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Render the Share card HTML. Returns '' when not editing an existing build.
// Now includes a collapsible Customise panel ABOVE the URL row (per user's
// Proof 1 v2 feedback — privacy decisions come first).
function edShareSectionHtml(){
  if(!editBuildId)return '';
  var b=allBuilds.find(function(x){return x.id===editBuildId});if(!b)return '';
  var isOn=!!b.is_public;
  var code=b.share_code||'';
  var url=code?edShareUrl(code):'';
  var fields=edGetShareFields(b);
  var summaryText=edShareSummaryText(fields);
  var hintText=edShareHintText(fields);

  // Customise panel checkboxes
  var subPreviewMoves=[b.move_1,b.move_2,b.move_3,b.move_4].filter(function(m){return m&&m.trim()}).join(', ')||'No moves set';
  var subPreviewAbility=b.ability&&b.ability.trim()?b.ability.trim():'No ability set';
  var subPreviewStats='HP '+(b.hp_sp||0)+' · Atk '+(b.atk_sp||0)+' · Def '+(b.def_sp||0)+' · SpA '+(b.spa_sp||0)+' · SpD '+(b.spd_sp||0)+' · Spe '+(b.spe_sp||0);
  var subPreviewItem='—';
  if(b.item_id){
    var itRow=(typeof allItems!=='undefined'&&allItems)?allItems.find(function(x){return x.id===b.item_id}):null;
    subPreviewItem=itRow?itRow.name:'(set)';
  }

  function checkRow(field,label,sub){
    var on=!!fields[field];
    return (
      '<div class="ed-check-row '+(on?'on':'off')+'" data-field="'+field+'" onclick="edToggleShareField(\''+field+'\')" tabindex="0" role="checkbox" aria-checked="'+(on?'true':'false')+'" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();edToggleShareField(\''+field+'\')}">'+
        '<div class="ed-check">'+(on?'<i class="ph-bold ph-check"></i>':'')+'</div>'+
        '<div>'+
          '<div class="ed-check-label">'+pubEscapeLocal(label)+'</div>'+
          '<div class="ed-check-sub">'+pubEscapeLocal(sub)+'</div>'+
        '</div>'+
      '</div>'
    );
  }

  return (
    '<div class="ed-card ed-share-card'+(isOn?' active':'')+'" id="edShareCard" style="margin-top:1rem">'+
      '<div class="ed-share-head">'+
        '<div class="ed-share-title">'+
          '<i class="ph-bold ph-share-network"></i>'+
          '<div>'+
            '<h3>Share publicly</h3>'+
            '<span class="label-sub">Anyone with the link can view</span>'+
          '</div>'+
        '</div>'+
        '<div class="ed-share-toggle'+(isOn?' on':'')+'" id="edShareToggle" role="switch" aria-checked="'+(isOn?'true':'false')+'" tabindex="0" onclick="edToggleShare()" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();edToggleShare()}">'+
          '<div class="knob"></div>'+
        '</div>'+
      '</div>'+
      '<div class="ed-share-body" id="edShareBody" style="'+(isOn?'':'display:none')+'">'+

        // CUSTOMISE PANEL — collapsible, above URL row
        '<div class="ed-customise" id="edCustomise">'+
          '<div class="ed-customise-summary" onclick="edToggleCustomiseExpand()">'+
            '<div class="left">'+
              '<i class="ph-bold ph-sliders-horizontal"></i>'+
              '<div>'+
                '<div class="title">Customise what\'s shared</div>'+
                '<div class="sub" id="edCustomiseSummary">'+pubEscapeLocal(summaryText)+'</div>'+
              '</div>'+
            '</div>'+
            '<span class="chev">▸</span>'+
          '</div>'+
          '<div class="ed-customise-body">'+
            '<div class="ed-customise-inner">'+
              checkRow('moves','Moves',subPreviewMoves)+
              checkRow('ability','Ability',subPreviewAbility)+
              checkRow('stats','Stat Allocation',subPreviewStats)+
              checkRow('item','Held Item',subPreviewItem)+
            '</div>'+
          '</div>'+
        '</div>'+

        // URL row + Copy button + Share button (Drop F.2.1)
        '<div class="ed-share-url-row">'+
          '<div class="ed-share-url" id="edShareUrl">'+(url?url.replace(/^https?:\/\//,''):'')+'</div>'+
          '<button type="button" class="ed-share-copy-btn" id="edShareCopyBtn" onclick="edCopyShareUrl()"><i class="ph-bold ph-copy"></i></button>'+
          '<button type="button" class="ed-share-share-btn" id="edShareShareBtn" onclick="edShareNow()"><i class="ph-bold ph-share-network"></i> Share</button>'+
        '</div>'+

        // Dynamic hint row
        '<div class="ed-share-hint">'+
          '<i class="ph ph-info"></i>'+
          '<span id="edShareHint">'+hintText+'</span>'+
        '</div>'+

      '</div>'+
    '</div>'
  );
}

// Expand/collapse the customise panel
function edToggleCustomiseExpand(){
  var panel=document.getElementById('edCustomise');if(!panel)return;
  panel.classList.toggle('open');
}

// Toggle a specific share field (moves / ability / stats / item).
// Persists immediately — no save button needed.
async function edToggleShareField(field){
  if(!editBuildId){toast('Save the build first','err');return}
  if(['moves','ability','stats','item'].indexOf(field)===-1)return;
  var b=allBuilds.find(function(x){return x.id===editBuildId});if(!b)return;
  var row=document.querySelector('.ed-check-row[data-field="'+field+'"]');
  if(!row||row.classList.contains('loading'))return;

  var current=edGetShareFields(b);
  var newVal=!current[field];
  var updatedFields=Object.assign({},current,(function(){var o={};o[field]=newVal;return o})());

  // If all 4 are true and share_fields is null, keep null (don't bloat the DB)
  var allTrue=updatedFields.moves&&updatedFields.ability&&updatedFields.stats&&updatedFields.item;
  var payload=allTrue?null:updatedFields;

  row.classList.add('loading');
  try{
    await upd('builds',{'id':'eq.'+editBuildId},{share_fields:payload},true);
    b.share_fields=payload;

    // Optimistic DOM update — no full re-render
    row.classList.toggle('on',newVal);
    row.classList.toggle('off',!newVal);
    row.setAttribute('aria-checked',newVal?'true':'false');
    var checkIcon=row.querySelector('.ed-check');
    if(checkIcon)checkIcon.innerHTML=newVal?'<i class="ph-bold ph-check"></i>':'';

    // Refresh dynamic text
    var fields=edGetShareFields(b);
    var summaryEl=document.getElementById('edCustomiseSummary');
    if(summaryEl)summaryEl.textContent=edShareSummaryText(fields);
    var hintEl=document.getElementById('edShareHint');
    if(hintEl)hintEl.innerHTML=edShareHintText(fields);

    var fieldLabel={moves:'Moves',ability:'Ability',stats:'Stats',item:'Item'}[field];
    toast((newVal?'Showing ':'Hiding ')+fieldLabel+' on public view');
  }catch(e){
    console.log('edToggleShareField failed:',e);
    toast(e.message||'Failed to update','err');
  }finally{
    row.classList.remove('loading');
  }
}

// Flip the share toggle. Optimistic UI updates in place — no full re-render —
// so the toggle animation and slider drag patterns from other editor widgets
// aren't disrupted. Network failure reverts the visual state.
async function edToggleShare(){
  if(!editBuildId){toast('Save the build first','err');return}
  var b=allBuilds.find(function(x){return x.id===editBuildId});if(!b){toast('Build not found','err');return}
  var toggle=document.getElementById('edShareToggle');
  if(!toggle||toggle.classList.contains('loading'))return;

  var wasOn=!!b.is_public;
  var turningOn=!wasOn;

  // Username gate: show bottom-sheet modal so user can set username in-flow.
  if(turningOn&&(!userProfile||!userProfile.username)){
    showUsernameModal(function(){edToggleShare();});
    return;
  }

  // Lock the toggle during the API roundtrip
  toggle.classList.add('loading');

  try{
    var code=b.share_code;
    if(turningOn&&!code){
      // ensureShareCode is defined in app-router.js
      code=await ensureShareCode('build',editBuildId);
      b.share_code=code;
    }
    // PATCH is_public
    await upd('builds',{'id':'eq.'+editBuildId},{is_public:turningOn},true);
    b.is_public=turningOn;

    // Visual state update
    var card=document.getElementById('edShareCard');
    var body=document.getElementById('edShareBody');
    var urlEl=document.getElementById('edShareUrl');
    toggle.classList.toggle('on',turningOn);
    toggle.setAttribute('aria-checked',turningOn?'true':'false');
    if(card)card.classList.toggle('active',turningOn);
    if(body)body.style.display=turningOn?'':'none';
    if(urlEl&&code)urlEl.textContent=edShareUrl(code).replace(/^https?:\/\//,'');

    toast(turningOn?'Build is now public ✨':'Build is now private');
  }catch(e){
    console.log('edToggleShare failed:',e);
    toast(e.message||'Failed to update sharing','err');
    // Revert visual state: nothing to revert since we haven't touched the DOM on failure path
  }finally{
    toggle.classList.remove('loading');
  }
}

// ═══════════════════════════════════════
// BUILD DETAIL PUBLIC PILL (Drop F.2)
// Small "🌐 Public" pill rendered on the detail page when build is public.
// Tapping expands to show URL + Copy + Share buttons inline.
// ═══════════════════════════════════════

function bdPublicPillHtml(b){
  if(!b||!b.is_public||!b.share_code)return '';
  var url=edShareUrl(b.share_code);
  var fields=edGetShareFields(b);
  var summaryText=edShareSummaryText(fields);
  return (
    '<div class="bd-pill-wrap">'+
      '<div class="bd-pill" id="bdPill" onclick="bdTogglePill()" tabindex="0" role="button" aria-expanded="false" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();bdTogglePill()}">'+
        '<i class="ph-bold ph-globe"></i>'+
        '<span>Public</span>'+
        '<span class="chev">▸</span>'+
      '</div>'+
      '<div class="bd-pill-panel" id="bdPillPanel">'+
        '<div class="bd-pill-panel-inner">'+
          '<div class="bd-pill-stats" id="bdPillSummary">'+pubEscapeLocal(summaryText)+'</div>'+
          '<div class="bd-pill-url-row">'+
            '<div class="bd-pill-url">'+pubEscapeLocal(url.replace(/^https?:\/\//,''))+'</div>'+
            '<button type="button" class="bd-pill-btn" onclick="bdPillCopy()" aria-label="Copy link"><i class="ph-bold ph-copy"></i></button>'+
            '<button type="button" class="bd-pill-btn primary" onclick="bdPillShare()"><i class="ph-bold ph-share-network"></i> Share</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'
  );
}

function bdTogglePill(){
  var pill=document.getElementById('bdPill');if(!pill)return;
  var open=pill.classList.toggle('open');
  pill.setAttribute('aria-expanded',open?'true':'false');
}

async function bdPillCopy(){
  var b=allBuilds.find(function(x){return x.id===detailBuildId});
  if(!b||!b.share_code){toast('No share URL','err');return}
  var url=edShareUrl(b.share_code);
  if(typeof copyUrl==='function')return copyUrl(url);
  // Inline fallback
  try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(_){toast('Copy failed','err')}
}

async function bdPillShare(){
  var b=allBuilds.find(function(x){return x.id===detailBuildId});
  if(!b||!b.share_code){toast('No share URL','err');return}
  // Drop F.2.1: render image card + native share (OS sheet with Save to Camera Roll etc.)
  if(typeof shareImage==='function')return shareImage('build',b.id);
  // Fallback — URL-only share via shareOrCopy
  var url=edShareUrl(b.share_code);
  var title=b.build_name||'Champions Forge build';
  if(typeof shareOrCopy==='function')return shareOrCopy(url,title,'Check out my Champions Forge build!');
  try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(_){toast('Copy failed','err')}
}

// Editor Share button — same handler as detail pill, render image + native share
async function edShareNow(){
  if(!editBuildId){toast('Save the build first','err');return}
  var b=allBuilds.find(function(x){return x.id===editBuildId});
  if(!b){toast('Build not found','err');return}
  if(!b.is_public||!b.share_code){toast('Make the build public first','err');return}
  if(typeof shareImage==='function')return shareImage('build',b.id);
  // Fallback
  var url=edShareUrl(b.share_code);
  if(typeof shareOrCopy==='function')return shareOrCopy(url,b.name||'Champions Forge build','Check out my build!');
  try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(_){toast('Copy failed','err')}
}

// Copy share URL to clipboard. Modern clipboard API + legacy textarea fallback
// for older Safari. Button flashes green "Copied!" for ~1.5s on success.
async function edCopyShareUrl(){
  if(!editBuildId)return;
  var b=allBuilds.find(function(x){return x.id===editBuildId});if(!b||!b.share_code){toast('No share URL yet','err');return}
  var url=edShareUrl(b.share_code);
  var btn=document.getElementById('edShareCopyBtn');
  var ok=false;
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      await navigator.clipboard.writeText(url);
      ok=true;
    }else{
      // Fallback for old iOS / permission-blocked contexts
      var ta=document.createElement('textarea');
      ta.value=url;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.focus();ta.select();
      try{ok=document.execCommand('copy')}catch(_){ok=false}
      document.body.removeChild(ta);
    }
  }catch(_){ok=false}

  if(ok&&btn){
    var origHtml=btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML='<i class="ph-bold ph-check"></i> Copied!';
    setTimeout(function(){
      btn.classList.remove('copied');
      btn.innerHTML=origHtml;
    },1500);
    toast('Share link copied');
  }else{
    toast('Copy failed — select the URL manually','err');
  }
}
