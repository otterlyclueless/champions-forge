// #SECTION: MOVE PICKER (Drop E)
// ═══════════════════════════════════════
// MOVE PICKER
// Full-screen sheet that lists the selected Pokémon's legal move pool,
// with search, legal-types-only filter, STAB watermark, an expandable
// glossary, and used-slot dimming. Writes the chosen move name back to
// hidden inputs (edM1..edM4) so saveBuild() contract stays unchanged.
// Mirrors the Drop D.2 item picker pattern: stable shell + re-rendered
// body so the search input never loses focus mid-keystroke.
// ═══════════════════════════════════════

// Picker state (underscore-prefixed to match item-picker convention)
var _mpSlot=0,_mpSearch='',_mpType='all',_mpGlossOpen=false,_mpLearnset=[];

// Small category letters for inline chips: P / S / St
function mpCatAbbr(c){return c==='Status'?'St':(c||'').charAt(0)}

// Pulls the 4 currently-held move names from hidden inputs (so the shared
// font size reflects live state, including after a pick).
function msCurrentNames(){
  var out=[];
  for(var i=1;i<=4;i++){var el=document.getElementById('edM'+i);out.push(el?el.value:'')}
  return out;
}

// Slot field for the editor: hidden input (saveBuild reads this) + clickable card
// that shows type-gradient + name when filled, or a dashed empty placeholder.
// Legality: flagged via moveLegalityState(name, selPkmnId) so legacy free-text
// picks surface as "unknown" or "illegal" warnings instead of silently rendering.
// fontSize is a shared rem value computed across all 4 slots so the row stays uniform.
function msSlotField(slot,curName,fontSize){
  var id='edM'+slot;
  var esc=(curName||'').replace(/"/g,'&quot;');
  var state=moveLegalityState(curName,selPkmnId);
  return '<input type="hidden" id="'+id+'" value="'+esc+'">'+
    '<button type="button" class="ms-slot'+(curName?' filled':'')+' ms-state-'+state+'" id="'+id+'Btn" data-slot="'+slot+'" onclick="openMovePicker('+slot+')">'+
      msSlotInner(curName,selPkmnId,fontSize)+
    '</button>';
}

// Inner markup for a slot button — reused when the picker updates the button after a pick.
// Two-line stack: name on top, small type chip below. Keeps the row fixed height,
// prevents horizontal overflow from long names + type labels.
function msSlotInner(name,pokemonId,fontSize){
  if(!name){
    return '<span class="ms-empty"><i class="ph-bold ph-plus-circle"></i>Pick a move</span>'+
      '<i class="ph-bold ph-caret-down ms-chev"></i>';
  }
  var state=moveLegalityState(name,pokemonId);
  var m=allMoveIndex[name];
  var type=m?m.type:null;
  var col=type&&TC[type]?TC[type]:null;
  // Unknown moves: no gradient (no type info); neutral surface so the warning
  // icon reads clearly. Illegal moves: keep the gradient (type is known) but
  // overlay the warning.
  var bg=(col&&state!=='unknown')?'linear-gradient(135deg,'+col.m+','+col.d+')':'var(--surface)';
  var typeLbl=(type&&state!=='unknown')?('<span class="ms-type-mini">'+type.toUpperCase()+'</span>'):'';
  var warn='';
  if(state==='unknown')warn='<span class="ms-warn" title="Unknown move name — not in Champions"><i class="ph-fill ph-warning"></i></span>';
  else if(state==='illegal'){
    var p=pokemonId?allPkmn.find(function(x){return x.id===pokemonId}):null;
    var pname=p?displayName(p):'this Pokémon';
    warn='<span class="ms-warn" title="Not legal for '+pname.replace(/"/g,'&quot;')+'"><i class="ph-fill ph-warning"></i></span>';
  }
  var nameStyle=fontSize?(' style="font-size:'+fontSize+'"'):'';
  return '<span class="ms-filled-bg" style="background:'+bg+'"></span>'+
    '<span class="ms-text">'+
      '<span class="ms-name"'+nameStyle+'>'+name+'</span>'+
      typeLbl+
    '</span>'+
    warn+
    '<i class="ph-bold ph-caret-down ms-chev"></i>';
}

// Re-render all 4 slot buttons — used after loadLearnset resolves so 'pending'
// legality states flip, and after a pick so the shared font size re-computes
// against the new set of 4 names.
function msRefreshSlots(){
  var names=msCurrentNames();
  var fs=movesetFontSize(names);
  for(var i=1;i<=4;i++){
    var id='edM'+i;
    var btn=document.getElementById(id+'Btn');
    if(!btn)continue;
    var name=names[i-1];
    var state=moveLegalityState(name,selPkmnId);
    btn.className='ms-slot'+(name?' filled':'')+' ms-state-'+state;
    btn.innerHTML=msSlotInner(name,selPkmnId,fs);
  }
}

// Build detail move card — name only over a type-matched gradient.
// Uses allMoveIndex as the lookup (preloaded at boot). Falls back to a
// neutral tile for empty / unknown moves. Adds a ⚠️ badge for legacy
// free-text moves that are unknown or illegal for the species.
// Passes a shared font-size so every card in the grid stays visually uniform.
function bdMoveCard(name,pokemonId,fontSize){
  var fs=fontSize?' style="font-size:'+fontSize+'"':'';
  var safeN=(name||'').replace(/'/g,"\\'");
  if(!name)return '<div class="bd-move bd-move-empty"'+fs+'>—</div>';
  var state=moveLegalityState(name,pokemonId);
  var m=allMoveIndex[name];
  // Unknown: no type info, plain card + warning badge
  if(state==='unknown'||!m||!TC[m.type]){
    return '<div class="bd-move bd-move-plain bd-move-warn"'+fs+' title="Unknown move name — not in Champions" onclick="event.stopPropagation();showMoveDetail(\''+safeN+'\')">'+
      '<i class="ph-fill ph-warning bd-move-flag"></i>'+
      '<span class="bd-move-name">'+name+'</span>'+
    '</div>';
  }
  var col=TC[m.type];
  var warnCls=(state==='illegal')?' bd-move-warn':'';
  var warnIcon='';
  if(state==='illegal'){
    var p=pokemonId?allPkmn.find(function(x){return x.id===pokemonId}):null;
    var pname=p?displayName(p):'this Pokémon';
    warnIcon='<i class="ph-fill ph-warning bd-move-flag" title="Not legal for '+pname.replace(/"/g,'&quot;')+'"></i>';
  }
  var bgStyle='background:linear-gradient(135deg,'+col.m+','+col.d+')';
  var style=fontSize?(' style="'+bgStyle+';font-size:'+fontSize+'"'):(' style="'+bgStyle+'"');
  return '<div class="bd-move bd-move-typed'+warnCls+'"'+style+' onclick="event.stopPropagation();showMoveDetail(\''+safeN+'\')">'+
    warnIcon+
    '<span class="bd-move-name">'+name+'</span>'+
  '</div>';
}

// Open picker for slot N. Loads the learnset (cached), builds shell + body.
async function openMovePicker(slot){
  if(!selPkmnId){toast('Pick a Pokémon first','warn');return}
  _mpSlot=slot;_mpSearch='';_mpType='all';_mpGlossOpen=false;
  _mpLearnset=learnsetCache[selPkmnId]||[];

  // Desktop: persistent 4-tab Finder-window pane
  if(window.innerWidth>=1024){
    var p=allPkmn.find(function(x){return x.id===selPkmnId});
    var pname=p?displayName(p):'';
    var slotTabs=[1,2,3,4].map(function(n){
      var el=document.getElementById('edM'+n);var filled=el&&el.value;
      return '<button class="ed-dp-slot-tab'+(n===slot?' active':'')+'" onclick="switchPickerSlot('+n+')">'+
        '<span class="ed-dp-slot-n">Move '+n+'</span>'+
        '<span class="ed-dp-slot-lbl">'+(filled?el.value:'Pick a move')+'</span>'+
      '</button>';
    }).join('');
    var deskHtml=
      '<div class="ed-dp-slot-tabs" id="mpDeskTabs">'+slotTabs+'</div>'+
      '<div style="margin-bottom:.6rem"><input id="mpSearch" type="text" placeholder="Search moves…" value="" oninput="setMovePickerSearch(this.value)" autocomplete="off" style="width:100%;padding:.52rem .9rem;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit;font-size:.85rem"></div>'+
      '<div class="ed-dp-type-wrap" id="mpTypes"></div>'+
      '<div id="mpList" class="ed-dp-move-list"></div>';
    if(_edDeskPicker(deskHtml,'Pick Moves — '+pname)){
      var types=mpLegalTypes();
      var tw=document.getElementById('mpTypes');
      if(tw)tw.innerHTML='<button class="mp-tp all on" onclick="setMovePickerType(\'all\')">ALL</button>'+
        types.map(function(t){return '<button class="mp-tp t-'+t+'" onclick="setMovePickerType(\''+t+'\')">'+t.toUpperCase()+'</button>'}).join('');
      renderMovePickerBody();
      if(!learnsetCache[selPkmnId]){_mpLearnset=await loadLearnset(selPkmnId);renderMovePickerBody();}
      return;
    }
  }

  // Mobile: existing bottom-sheet overlay
  renderMovePickerShell();
  renderMovePickerBody();
  document.getElementById('movePickerOv').classList.add('open');
  if(!learnsetCache[selPkmnId]){
    _mpLearnset=await loadLearnset(selPkmnId);
    renderMovePickerShell();
    renderMovePickerBody();
  }
}
function closeMovePicker(){
  _edDeskClose(); // desktop: return to form (no-op on mobile)
  document.getElementById('movePickerOv').classList.remove('open'); // mobile
}

// Search / filter handlers — body-only re-render so search input keeps focus.
function setMovePickerSearch(v){_mpSearch=(v||'').toLowerCase();renderMovePickerBody()}
function setMovePickerType(t){_mpType=t||'all';updateMovePickerTypePills();renderMovePickerBody()}
function toggleMoveGloss(){_mpGlossOpen=!_mpGlossOpen;var p=document.getElementById('mpGloss');var b=document.getElementById('mpGlossBtn');if(p)p.classList.toggle('open',_mpGlossOpen);if(b)b.classList.toggle('open',_mpGlossOpen)}

// Drop E QoL: Tap a slot chip at the top of the picker to switch slots without
// closing. Re-renders shell + body since the slot badge, used-dimming, current
// highlight, footer count, and warning banner all depend on _mpSlot. Search
// value is preserved via state (_mpSearch is already written on every keystroke).
function switchPickerSlot(n){
  if(!n||n===_mpSlot)return;
  _mpSlot=n;
  // Desktop: update tabs + crossfade move list (no re-animation)
  var deskTabs=document.getElementById('mpDeskTabs');
  if(deskTabs){
    deskTabs.querySelectorAll('.ed-dp-slot-tab').forEach(function(btn,i){
      var s=i+1;var el=document.getElementById('edM'+s);var filled=el&&el.value;
      btn.classList.toggle('active',s===n);
      var lbl=btn.querySelector('.ed-dp-slot-lbl');
      if(lbl)lbl.textContent=filled?el.value:'Pick a move';
    });
    var list=document.getElementById('mpList');
    if(list){
      list.style.opacity='0';
      setTimeout(function(){renderMovePickerBody();list.style.opacity='1';},150);
    }
    return;
  }
  // Mobile: existing full shell re-render
  renderMovePickerShell();
  renderMovePickerBody();
}

// Names currently sitting in the OTHER slots — used to dim already-picked rows.
function mpUsedMoves(){
  var out={};
  for(var i=1;i<=4;i++){
    if(i===_mpSlot)continue;
    var el=document.getElementById('edM'+i);
    if(el&&el.value)out[el.value]=i;
  }
  return out;
}

// Legal types present in THIS species' learnset — used to build pills.
function mpLegalTypes(){
  var s={},o=[];
  _mpLearnset.forEach(function(m){if(!s[m.type]){s[m.type]=1;o.push(m.type)}});
  return o.sort();
}

// Stable shell: header (back · title · slot badge · glossary button),
// sticky species context chip, search input, legal-types-only pills.
// Writes the <input> once so focus survives filter re-renders.
function renderMovePickerShell(){
  var p=allPkmn.find(function(x){return x.id===selPkmnId});
  var pname=p?displayName(p):'';
  var types=mpLegalTypes();
  var typeBtns='<button class="mp-tp all'+(_mpType==='all'?' on':'')+'" data-t="all" onclick="setMovePickerType(\'all\')">ALL</button>'+
    types.map(function(t){return '<button class="mp-tp t-'+t+(_mpType===t?' on':'')+'" data-t="'+t+'" onclick="setMovePickerType(\''+t+'\')">'+t.toUpperCase()+'</button>'}).join('');
  // Species context chip (matches proof)
  var t1=p&&p.type_1?p.type_1:null,t2=p&&p.type_2?p.type_2:null;
  var t1Col=t1&&TC[t1]?TC[t1]:null,t2Col=t2&&TC[t2]?TC[t2]:null;
  var ctxBg=t1Col?('linear-gradient(135deg,'+t1Col.m+'26,'+(t2Col?t2Col.m:t1Col.d)+'20)'):'rgba(255,255,255,.04)';
  var slots=[1,2,3,4].map(function(n){
    var el=document.getElementById('edM'+n);
    var filled=el&&el.value;
    var cls='mp-ctx-slot'+(n===_mpSlot?' current':(filled?' filled':''));
    var titleText='Slot '+n+(filled?': '+(el.value.replace(/"/g,'&quot;')):'')+(n===_mpSlot?' (editing)':' — tap to switch');
    return '<button type="button" class="'+cls+'" title="'+titleText+'" onclick="switchPickerSlot('+n+')">'+n+'</button>';
  }).join('');
  var ctx='<div class="mp-ctx" style="background:'+ctxBg+'">'+
    (p&&p.image_url?'<img src="'+p.image_url+'" alt="" onerror="this.style.opacity=\'0.2\'">':'<div class="mp-ctx-sprite"></div>')+
    '<div class="mp-ctx-info">'+
      '<div class="mp-ctx-name">'+pname+'</div>'+
      '<div class="mp-ctx-types">'+
        (t1?'<span class="tt t-'+t1+'">'+t1.toUpperCase()+'</span>':'')+
        (t2?'<span class="tt t-'+t2+'">'+t2.toUpperCase()+'</span>':'')+
      '</div>'+
    '</div>'+
    '<div class="mp-ctx-slots">'+slots+'</div>'+
  '</div>';
  // Glossary content (hidden by default; toggled open via mpGloss button)
  var gloss='<div class="gloss-inner">'+
    '<div class="gloss-title"><i class="ph-fill ph-info"></i> Move key</div>'+
    '<div class="gloss-grid">'+
      '<div class="gloss-item"><div class="k"><span class="swatch" style="background:#fb923c"></span>Power</div><div class="v">Base damage before modifiers. Higher = stronger hit.</div></div>'+
      '<div class="gloss-item"><div class="k"><span class="swatch" style="background:#a78bfa"></span>Accuracy</div><div class="v">% chance the move hits. — means always hits.</div></div>'+
      '<div class="gloss-item"><div class="k"><span class="swatch" style="background:#7dd3fc"></span>PP</div><div class="v">Uses per battle. Runs out, then Struggle.</div></div>'+
      '<div class="gloss-item"><div class="k"><span class="mp-cat Physical" style="width:12px;height:12px;font-size:7px">P</span>Physical</div><div class="v">Uses the user\'s Attack stat.</div></div>'+
      '<div class="gloss-item"><div class="k"><span class="mp-cat Special" style="width:12px;height:12px;font-size:7px">S</span>Special</div><div class="v">Uses the user\'s Sp. Atk stat.</div></div>'+
      '<div class="gloss-item"><div class="k"><span class="mp-cat Status" style="width:12px;height:12px;font-size:7px">St</span>Status</div><div class="v">No damage. Buffs, debuffs, or field effects.</div></div>'+
      '<div class="gloss-item" style="grid-column:1 / -1;margin-top:3px"><div class="k"><span class="swatch" style="background:linear-gradient(90deg,#fbbf24,rgba(251,191,36,.2))"></span>STAB (highlighted row)</div><div class="v">Same Type Attack Bonus. Moves matching the Pokémon\'s type deal 1.5× damage.</div></div>'+
    '</div>'+
  '</div>';
  // Count used + total
  var usedCount=(document.getElementById('edM1')&&document.getElementById('edM1').value?1:0)+
    (document.getElementById('edM2')&&document.getElementById('edM2').value?1:0)+
    (document.getElementById('edM3')&&document.getElementById('edM3').value?1:0)+
    (document.getElementById('edM4')&&document.getElementById('edM4').value?1:0);
  var vpTotal=usedCount*250;
  var html='<div class="mp-sheet">'+
    '<div class="mp-head">'+
      '<div class="mp-top">'+
        '<button class="mp-back" onclick="closeMovePicker()" aria-label="Close"><i class="ph-bold ph-caret-left"></i></button>'+
        '<div class="mp-title">'+
          '<div class="mp-title-main">Pick a Move <button class="mp-gloss-btn'+(_mpGlossOpen?' open':'')+'" id="mpGlossBtn" onclick="toggleMoveGloss()">?</button></div>'+
          '<div class="mp-title-sub">'+_mpLearnset.length+' available'+(pname?' for '+pname:'')+'</div>'+
        '</div>'+
        '<span class="mp-slot-badge">Slot '+_mpSlot+'</span>'+
      '</div>'+
      '<div class="mp-search"><i class="ph-bold ph-magnifying-glass"></i><input id="mpSearch" placeholder="Search moves..." value="'+_mpSearch.replace(/"/g,'&quot;')+'" oninput="setMovePickerSearch(this.value)" autocomplete="off"></div>'+
      '<div class="mp-types" id="mpTypes">'+typeBtns+'</div>'+
    '</div>'+
    '<div class="mp-gloss-panel'+(_mpGlossOpen?' open':'')+'" id="mpGloss">'+gloss+'</div>'+
    ctx+
    '<div class="mp-list" id="mpList"></div>'+
    '<div class="mp-foot">'+
      '<div class="mp-foot-left"><b>'+usedCount+' / 4</b> moves selected<br><span>Tap a move to fill Slot '+_mpSlot+'</span></div>'+
      '<div class="mp-foot-vp"><i class="ph-fill ph-coin-vertical"></i>'+vpTotal.toLocaleString()+' VP</div>'+
    '</div>'+
  '</div>';
  document.getElementById('movePickerOv').innerHTML=html;
}

// Type-pill active class refresh (body-level) — no full shell re-render.
function updateMovePickerTypePills(){
  var wrap=document.getElementById('mpTypes');if(!wrap)return;
  wrap.querySelectorAll('.mp-tp').forEach(function(btn){btn.classList.toggle('on',btn.dataset.t===_mpType)});
}

// Helpers to format a meta line like "100 · 100% · 16pp", colour-coded.
function mpFmtMeta(m){
  var parts=[];
  parts.push(m.power>0?'<span class="pwr">'+m.power+'</span>':'<span class="none">—</span>');
  parts.push('<span class="dot">·</span>');
  parts.push(m.accuracy?'<span class="acc">'+m.accuracy+'%</span>':'<span class="none">—</span>');
  parts.push('<span class="dot">·</span>');
  parts.push('<span class="pp">'+m.pp+'pp</span>');
  return parts.join(' ');
}

// Body re-render: filters + row build. Called on every search/filter keystroke.
function renderMovePickerBody(){
  var list=document.getElementById('mpList');if(!list)return;
  var used=mpUsedMoves();
  var p=allPkmn.find(function(x){return x.id===selPkmnId});
  var stabTypes={};
  if(p){if(p.type_1)stabTypes[p.type_1]=1;if(p.type_2)stabTypes[p.type_2]=1}
  var currentName=(document.getElementById('edM'+_mpSlot)||{}).value||'';
  var filtered=_mpLearnset.filter(function(m){
    if(_mpSearch&&m.name.toLowerCase().indexOf(_mpSearch)===-1)return false;
    if(_mpType!=='all'&&m.type!==_mpType)return false;
    return true;
  });
  if(!_mpLearnset.length){list.innerHTML='<div class="mp-empty">Loading legal moves…</div>';return}
  // Drop E: If the current slot holds a move that isn't in this species' legal pool,
  // show a warning banner so the user knows why they can't see it in the list.
  var warnBanner='';
  if(currentName){
    var inLearnset=false;
    for(var i=0;i<_mpLearnset.length;i++){if(_mpLearnset[i].name===currentName){inLearnset=true;break}}
    if(!inLearnset){
      var pp=allPkmn.find(function(x){return x.id===selPkmnId});
      var pname=pp?displayName(pp):'this Pokémon';
      var reason=allMoveIndex[currentName]?('isn\'t legal for '+pname):'isn\'t a known Champions move';
      warnBanner='<div class="mp-warn-banner">'+
        '<i class="ph-fill ph-warning"></i>'+
        '<div><b>Current pick &ldquo;'+currentName+'&rdquo; '+reason+'.</b><br>Pick a replacement below.</div>'+
      '</div>';
    }
  }
  if(!filtered.length){list.innerHTML=warnBanner+'<div class="mp-empty">No moves match</div>';return}
  var html=warnBanner+filtered.map(function(m){
    var stab=!!stabTypes[m.type];
    var inOther=used[m.name];
    var isCurrent=m.name===currentName;
    var cls='mp-row'+(stab?' stab':'')+(inOther?' used':'')+(isCurrent?' current':'');
    var rightSide=inOther
      ?'<span class="mp-used-badge">IN SLOT '+inOther+'</span>'
      :'<div class="mp-meta">'+mpFmtMeta(m)+'</div>';
    var onclick=inOther?'':' onclick="pickMove(\''+m.name.replace(/'/g,"\\'")+'\')"';
    return '<div class="'+cls+'"'+onclick+'>'+
      '<div class="mp-top-line">'+
        '<span class="mp-type-pill t-'+m.type+'">'+m.type.toUpperCase()+'</span>'+
        '<span class="mp-cat '+m.category+'" title="'+m.category+'">'+mpCatAbbr(m.category)+'</span>'+
        '<span class="mp-name">'+m.name+'</span>'+
        rightSide+
      '</div>'+
      '<div class="mp-desc">'+(m.short||'')+'</div>'+
    '</div>';
  }).join('');
  list.innerHTML=html;
}

// Write choice back to hidden input, refresh ALL 4 slot buttons so the shared
// font size re-balances across the row, then close. Also writes the legality
// state class in case the user replaced an illegal move.
function pickMove(name){
  var id='edM'+_mpSlot;
  var hidden=document.getElementById(id);
  if(hidden)hidden.value=name;
  msRefreshSlots();
  closeMovePicker();
}

// Backdrop click dismisses the move picker.
document.addEventListener('click',function(e){
  var ov=document.getElementById('movePickerOv');
  if(ov&&e.target===ov)closeMovePicker();
});

