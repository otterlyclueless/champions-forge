// ═══════════════════════════════════════
// ARCHETYPE PICKER
// Bottom-sheet picker for build archetype.
// 22 predefined roles + custom text entry at the bottom.
// ═══════════════════════════════════════

var _archPkCatIcons={Offense:'ph-sword',Setup:'ph-trend-up',Defense:'ph-shield',Support:'ph-gear',VGC:'ph-trophy'};
var _archPkCatOrder=['Offense','Setup','Defense','Support','VGC'];

function openArchPicker(){
  // Desktop: render as third panel
  var archContent='<div class="arch-pk-list" id="archPkList">'+_archPickerRows()+'</div>'+
    '<div class="arch-pk-custom">'+
      '<div class="arch-pk-custom-label"><i class="ph-bold ph-pencil"></i> Custom</div>'+
      '<div class="arch-pk-custom-row">'+
        '<input class="arch-pk-custom-input" id="archCustomIn" type="text" placeholder="Type a custom archetype…" maxlength="40" value="'+(edSelArch&&!BLD_ARCHETYPES.find(function(a){return a.name===edSelArch;})?edSelArch:'')+'" autocomplete="off">'+
        '<button class="arch-pk-custom-btn" onclick="_archPickCustom()" type="button">Use</button>'+
      '</div>'+
    '</div>';
  if(_edDeskPicker(archContent,'Archetype')){
    setTimeout(function(){
      var inp=document.getElementById('archCustomIn');
      if(inp)inp.onkeydown=function(e){if(e.key==='Enter')_archPickCustom();};
    },0);
    return;
  }
  // Mobile: bottom-sheet overlay
  var ov=document.getElementById('archPickerOv');
  if(!ov){
    ov=document.createElement('div');ov.id='archPickerOv';
    ov.style.cssText='position:fixed;inset:0;z-index:1800;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);';
    document.body.appendChild(ov);
  }
  ov.innerHTML='<div class="arch-pk-sheet">'+
    '<div class="arch-pk-handle"></div>'+
    '<div class="arch-pk-head">'+
      '<div class="arch-pk-title">Archetype</div>'+
      '<button class="arch-pk-close" onclick="closeArchPicker()" type="button">✕</button>'+
    '</div>'+
    '<div class="arch-pk-list" id="archPkList">'+_archPickerRows()+'</div>'+
    '<div class="arch-pk-custom">'+
      '<div class="arch-pk-custom-label"><i class="ph-bold ph-pencil"></i> Custom</div>'+
      '<div class="arch-pk-custom-row">'+
        '<input class="arch-pk-custom-input" id="archCustomIn" type="text" placeholder="Type a custom archetype…" maxlength="40" value="'+(edSelArch&&!BLD_ARCHETYPES.find(function(a){return a.name===edSelArch;})?edSelArch:'')+'" autocomplete="off">'+
        '<button class="arch-pk-custom-btn" onclick="_archPickCustom()" type="button">Use</button>'+
      '</div>'+
    '</div>'+
  '</div>';
  ov.style.display='flex';
  ov.onclick=function(e){if(e.target===ov)closeArchPicker();};
  // Submit custom on Enter
  setTimeout(function(){
    var inp=document.getElementById('archCustomIn');
    if(inp)inp.onkeydown=function(e){if(e.key==='Enter')_archPickCustom();};
  },0);
}

function _archPickerRows(){
  var list=typeof BLD_ARCHETYPES!=='undefined'?BLD_ARCHETYPES:[];
  var cats={};
  list.forEach(function(a){if(!cats[a.cat])cats[a.cat]=[];cats[a.cat].push(a);});
  var curPreset=edSelArch&&list.find(function(a){return a.name===edSelArch;});
  var html='<div class="arch-pk-none'+(edSelArch===''?' sel':'')+'" onclick="pickArch(\'\')">'+
    '<span>— None —</span>'+
    (edSelArch===''?'<i class="ph-bold ph-check" style="color:var(--red)"></i>':'')+
  '</div>';
  _archPkCatOrder.forEach(function(cat){
    if(!cats[cat])return;
    html+='<div class="arch-pk-cat"><i class="ph-bold '+_archPkCatIcons[cat]+'"></i>'+cat+'</div>';
    cats[cat].forEach(function(a){
      var sel=edSelArch===a.name;
      html+='<div class="arch-pk-row'+(sel?' sel':'')+'" style="--ac:'+a.color+'" onclick="pickArch(\''+a.name.replace(/'/g,"\\'")+'\')">'+
        '<div class="arch-pk-icon"><i class="ph-bold '+a.icon+'"></i></div>'+
        '<div class="arch-pk-info">'+
          '<div class="arch-pk-name">'+a.name+'</div>'+
          '<div class="arch-pk-desc">'+a.desc+'</div>'+
        '</div>'+
        (sel?'<i class="ph-bold ph-check arch-pk-check"></i>':'')+
      '</div>';
    });
  });
  return html;
}

function _archPickCustom(){
  var inp=document.getElementById('archCustomIn');
  var val=inp?inp.value.trim():'';
  if(!val)return;
  pickArch(val);
}

function pickArch(name){
  selBldArch(name);
  _edDeskClose(); // desktop: close third panel
  closeArchPicker(); // mobile: close overlay
}

function closeArchPicker(){
  var ov=document.getElementById('archPickerOv');
  if(ov){ov.style.display='none';ov.innerHTML='';}
}
