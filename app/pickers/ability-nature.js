async function _loadAblOptionsForPkmn(pokemonId){
  if(ablPickerCache[pokemonId])return ablPickerCache[pokemonId];
  try{
    var rows=await q('pokemon_abilities',{'pokemon_id':'eq.'+pokemonId,select:'slot,ability_id',order:'slot.asc'});
    var opts=rows.map(function(row){
      var abl=(window.allAbilities||[]).find(function(a){return a.id===row.ability_id});
      return{slot:row.slot,id:row.ability_id,name:abl?abl.name:'?',desc:abl?abl.short_description||'':''};
    });
    ablPickerCache[pokemonId]=opts;
    return opts;
  }catch(e){ablPickerCache[pokemonId]=[];return[];}
}

function openAbilityPicker(){
  var curAbi=document.getElementById('edAbi')?document.getElementById('edAbi').value||''  :'';
  var pkmnName=selPkmnId?(window.allPkmn||[]).find(function(p){return p.id===selPkmnId}):null;
  var pkmnLabel=pkmnName?pkmnName.name:'';
  // Desktop: render inline in right column
  if(_edDeskPicker('<div class="abl-pk-list" id="ablPkList"><div class="abl-pk-empty">Loading…</div></div>',
    'Choose Ability'+(pkmnLabel?' — '+pkmnLabel:''))){
    if(!selPkmnId){var l=document.getElementById('ablPkList');if(l)l.innerHTML='<div class="abl-pk-empty">Select a Pokémon first to see its legal abilities.</div>';return;}
    _loadAblOptionsForPkmn(selPkmnId).then(function(opts){_renderAblPickerContent(opts,curAbi);});
    return;
  }
  // Mobile: bottom-sheet overlay
  var ov=document.getElementById('abilityPickerOv');
  if(!ov)return;
  ov.innerHTML='<div class="abl-pk-sheet">'+
    '<div class="abl-pk-handle"></div>'+
    '<div class="abl-pk-head">'+
      '<div><div class="abl-pk-title">Choose Ability</div>'+(pkmnLabel?'<div class="abl-pk-sub">'+pkmnLabel+'</div>':'')+'</div>'+
      '<button class="abl-pk-close" onclick="closeAbilityPicker()">✕</button>'+
    '</div>'+
    '<div class="abl-pk-list" id="ablPkList"><div class="abl-pk-empty">Loading…</div></div>'+
  '</div>';
  ov.classList.add('open');
  ov.onclick=function(e){if(e.target===ov)closeAbilityPicker();};
  if(!selPkmnId){
    document.getElementById('ablPkList').innerHTML='<div class="abl-pk-empty">Select a Pokémon first to see its legal abilities.</div>';
    return;
  }
  _loadAblOptionsForPkmn(selPkmnId).then(function(opts){_renderAblPickerContent(opts,curAbi);});
}

function _renderAblPickerContent(opts,curAbi){
  var listEl=document.getElementById('ablPkList');
  if(!listEl)return;
  var SLOT_LABELS={'1':'Ability 1','2':'Ability 2','hidden':'Hidden Ability'};
  if(!opts||!opts.length){
    listEl.innerHTML='<div class="abl-pk-empty">No ability data for this Pokémon.<br>Use the admin panel to add entries.</div>';
    return;
  }
  listEl.innerHTML=opts.map(function(opt){
    var isSel=opt.name===curAbi;
    return '<div class="abl-pk-card'+(isSel?' sel':'')+'" onclick="pickAbility(\''+opt.name.replace(/'/g,"\\'")+'\')">'+
      '<div class="abl-pk-slot">'+(SLOT_LABELS[opt.slot]||opt.slot)+'</div>'+
      '<div class="abl-pk-name">'+opt.name+'</div>'+
      (opt.desc?'<div class="abl-pk-desc">'+opt.desc+'</div>':'')+
    '</div>';
  }).join('');
}

function pickAbility(name){
  var inp=document.getElementById('edAbi');
  var lbl=document.getElementById('edAbiLabel');
  var btn=document.getElementById('edAbiBtn');
  var warn=document.getElementById('edAbiWarn');
  if(inp)inp.value=name;
  if(lbl)lbl.textContent=name;
  if(btn)btn.classList.remove('empty');
  if(warn)warn.style.display=abilityLegalityState(name,selPkmnId)==='illegal'?'inline':'none';
  _edDeskClose(); // desktop: return to form
  closeAbilityPicker(); // mobile: close overlay
}

function closeAbilityPicker(){
  var ov=document.getElementById('abilityPickerOv');
  if(ov)ov.classList.remove('open');
}

// ─── Drop H: Nature Picker ───────────────────────────────────────────────────
// Bottom-sheet replacement for the native nature <select>.
// Hidden input #edNat preserves saveBuild() / edGetNature() read contract.
// NAT_SC, NAT_ARCH, _natEqBars are global from app-profile.js.
// ─────────────────────────────────────────────────────────────────────────────

var _NAT_GROUPS=[
  {key:'attack',    label:'Attack ▲'},
  {key:'sp_attack', label:'Sp. Atk ▲'},
  {key:'defense',   label:'Defense ▲'},
  {key:'sp_defense',label:'Sp. Def ▲'},
  {key:'speed',     label:'Speed ▲'},
];

function openNaturePicker(){
  var curId=(document.getElementById('edNat')||{}).value||'';
  // Desktop: render inline in right column
  if(_edDeskPicker('<div class="nat-pk-list" id="natPkList">'+_renderNaturePickerContent(curId)+'</div>','Choose Nature'))return;
  // Mobile: bottom-sheet overlay
  var ov=document.getElementById('naturePickerOv');
  if(!ov)return;
  ov.innerHTML='<div class="nat-pk-sheet">'+
    '<div class="nat-pk-handle"></div>'+
    '<div class="nat-pk-head">'+
      '<div class="nat-pk-title">Choose Nature</div>'+
      '<button class="nat-pk-close" onclick="closeNaturePicker()">✕</button>'+
    '</div>'+
    '<div class="nat-pk-list" id="natPkList">'+_renderNaturePickerContent(curId)+'</div>'+
  '</div>';
  ov.classList.add('open');
  ov.onclick=function(e){if(e.target===ov)closeNaturePicker();};
}

function _renderNaturePickerContent(curId){
  var html='<div class="nat-pk-none'+(curId===''?' sel':'')+'" onclick="pickNature(\'\')">'+
    '<span class="nat-pk-none-lbl">— None —</span>'+
  '</div>';
  _NAT_GROUPS.forEach(function(g){
    var nats=allNatures.filter(function(n){return n.increased_stat===g.key;});
    if(!nats.length)return;
    var sc=NAT_SC[g.key];
    html+='<div class="nat-pk-grp" style="color:'+sc.c+'">'+g.label+'</div>';
    nats.forEach(function(n){
      var isSel=n.id===curId;
      var arch=NAT_ARCH[n.name]||'—';
      html+='<div class="nat-pk-row'+(isSel?' sel':'')+'" onclick="pickNature(\''+n.id+'\')">'+
        '<div class="nat-pk-row-left">'+
          '<div class="nat-pk-row-name">'+n.name+'</div>'+
          '<div class="nat-pk-row-arch">'+arch+'</div>'+
        '</div>'+
        '<div class="nat-pk-row-eq">'+_natEqBarsCompact(n)+'</div>'+
      '</div>';
    });
  });
  return html;
}

// 2-bar compact EQ: only boosted (▲ tall) + lowered (▼ short). Used in picker only.
// For full 5-bar EQ used in Reference tab, see _natEqBars() in app-profile.js.
function _natEqBarsCompact(n){
  if(!n.increased_stat)return '';
  var u=NAT_SC[n.increased_stat],d=NAT_SC[n.decreased_stat];
  return '<div class="eq-bars" style="gap:5px;justify-content:center">'+
    '<div class="eq-col">'+
      '<div class="eq-track" style="height:20px;background:var(--surface2);">'+
        '<div class="eq-fill" style="height:90%;background:'+u.c+';opacity:.95;"></div>'+
      '</div>'+
      '<div class="eq-lbl" style="color:'+u.c+';font-weight:900;">'+u.s+'</div>'+
    '</div>'+
    '<div class="eq-col">'+
      '<div class="eq-track" style="height:20px;background:var(--surface2);opacity:.28;">'+
        '<div class="eq-fill" style="height:12%;background:'+d.c+';opacity:.9;"></div>'+
      '</div>'+
      '<div class="eq-lbl" style="opacity:.35;">'+d.s+'</div>'+
    '</div>'+
  '</div>';
}

function pickNature(id){
  var hidEl=document.getElementById('edNat');
  if(hidEl)hidEl.value=id;
  edRefresh();
  _edDeskClose(); // desktop: return to form
  closeNaturePicker(); // mobile: close overlay
}

function closeNaturePicker(){
  var ov=document.getElementById('naturePickerOv');
  if(ov)ov.classList.remove('open');
}

