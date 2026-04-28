// ═══════════════════════════════════════
// ═══════════════════════════════════════
// ITEM PICKER (Drop D.2)
// Bottom-sheet replacement for the native <select>.
// Filters items by the selected Pokémon's species_lock and hides
// Mega Stones entirely when the Pokémon is already a Mega form.
// ═══════════════════════════════════════

var _pickerCategory='all',_pickerSearch='';

function openItemPicker(){
  _pickerCategory='all';_pickerSearch='';
  // Desktop: render item picker inside third panel
  if(window.innerWidth>=1024){
    // Inject a stub #itemPickerOv into the panel; render functions target it by id
    if(_edDeskPicker('<div id="itemPickerOv" style="display:block;background:transparent"></div>','Choose Item')){
      renderItemPickerShell();
      renderItemPickerBody();
      return;
    }
  }
  renderItemPickerShell();
  renderItemPickerBody();
  document.getElementById('itemPickerOv').classList.add('open');
}
function closeItemPicker(){
  _edDeskClose(); // desktop: close third panel
  var ov=document.getElementById('itemPickerOv');
  if(ov)ov.classList.remove('open'); // mobile
}
// Search & filter changes update ONLY the body — shell (with the focused input) stays intact.
function setPickerCategory(cat){_pickerCategory=cat||'all';updatePickerTabs();renderItemPickerBody()}
function setPickerSearch(val){_pickerSearch=(val||'').toLowerCase();updatePickerTabs();renderItemPickerBody()}

// Items eligible for THIS Pokémon (species-lock + mega-form rules).
function pickerEligibleItems(){
  var p=selPkmnId?allPkmn.find(function(x){return x.id===selPkmnId}):null;
  var pname=p?p.name:null;
  var isMega=p&&p.form==='Mega';
  return allItems.filter(function(i){
    // Mega stones: hide entirely for Mega forms; otherwise match species_lock
    if(i.category==='mega_stone'){
      if(isMega)return false;
      return i.species_lock&&pname&&i.species_lock===pname;
    }
    // Other species-locked items (e.g. Light Ball → Pikachu)
    if(i.species_lock){
      return pname&&i.species_lock===pname;
    }
    return true;
  });
}

function pickerVpBadge(item){
  if(item.acquisition==='base_game')return '<span class="picker-item-cost"><i class="ph-bold ph-gift"></i> Free</span>';
  if(item.acquisition==='mega_tutorial')return '<span class="picker-item-cost"><i class="ph-bold ph-trophy"></i> Tutorial</span>';
  if(item.acquisition==='transfer_plza')return '<span class="picker-item-cost"><i class="ph-bold ph-arrows-clockwise"></i> Z-A</span>';
  if(item.acquisition==='shop'&&item.vp_cost)return '<span class="picker-item-cost"><i class="ph-bold ph-shopping-cart"></i> '+item.vp_cost+'</span>';
  return '';
}

// Tab counts that respect the current search but ignore the current category.
function pickerTabCounts(){
  var eligible=pickerEligibleItems();
  var counts={all:0,hold:0,berry:0,mega_stone:0};
  eligible.forEach(function(i){
    if(_pickerSearch&&i.name.toLowerCase().indexOf(_pickerSearch)===-1)return;
    counts.all++;
    if(counts[i.category]!==undefined)counts[i.category]++;
  });
  return counts;
}

// Rebuild the sticky shell once per open. This writes the search <input> which
// is then LEFT ALONE during search/filter updates so focus and cursor position
// stay intact on every keystroke.
function renderItemPickerShell(){
  var p=selPkmnId?allPkmn.find(function(x){return x.id===selPkmnId}):null;
  var pname=p?p.name:'';
  var counts=pickerTabCounts();
  var tabs=['all','hold','berry','mega_stone'].map(function(cat){
    var label={all:'All',hold:'Hold',berry:'Berries',mega_stone:'Megas'}[cat];
    var active=_pickerCategory===cat?' active':'';
    return '<button class="it-pill'+active+'" data-cat="'+cat+'" onclick="setPickerCategory(\''+cat+'\')">'+label+'<span class="count">'+counts[cat]+'</span></button>';
  }).join('');
  var html='<div class="picker-sheet">'+
    '<div class="picker-head">'+
      '<div class="picker-handle"></div>'+
      '<div class="picker-title"><span>Choose Item'+(pname?' for '+pname:'')+'</span><button class="picker-close" onclick="closeItemPicker()" aria-label="Close">✕</button></div>'+
      '<div class="picker-search"><input class="search-box" id="pickerSearchInput" placeholder="Search items..." value="'+_pickerSearch.replace(/"/g,'&quot;')+'" oninput="setPickerSearch(this.value)" autocomplete="off"></div>'+
      '<div class="picker-tabs" id="pickerTabs">'+tabs+'</div>'+
    '</div>'+
    '<div class="picker-body" id="pickerBody"></div>'+
  '</div>';
  document.getElementById('itemPickerOv').innerHTML=html;
}

// Update just the tab labels + counts + active class. Doesn't touch search input.
function updatePickerTabs(){
  var wrap=document.getElementById('pickerTabs');if(!wrap)return;
  var counts=pickerTabCounts();
  wrap.querySelectorAll('.it-pill').forEach(function(btn){
    var cat=btn.dataset.cat;
    btn.classList.toggle('active',_pickerCategory===cat);
    var c=btn.querySelector('.count');if(c)c.textContent=counts[cat];
  });
}

// Rebuild ONLY the item list. Called on every search/filter change.
function renderItemPickerBody(){
  var p=selPkmnId?allPkmn.find(function(x){return x.id===selPkmnId}):null;
  var pname=p?p.name:'';
  var currentId=(document.getElementById('edItem')||{}).value||'';
  var eligible=pickerEligibleItems();
  var filtered=eligible.filter(function(i){
    if(_pickerSearch&&i.name.toLowerCase().indexOf(_pickerSearch)===-1)return false;
    if(_pickerCategory!=='all'&&i.category!==_pickerCategory)return false;
    return true;
  });
  // Group by category for section headers
  var groups={hold:[],berry:[],mega_stone:[]};
  filtered.forEach(function(i){if(groups[i.category])groups[i.category].push(i)});
  var groupLabels={
    hold:'Hold Items',
    berry:'Berries',
    mega_stone:'Mega Stones'+(pname?' for '+pname:'')
  };
  var body='';
  // "None" option at the very top (keeps "no item" selectable)
  body+='<div class="picker-item'+(currentId===''?' selected':'')+'" onclick="pickItem(\'\')"'+
    '><div class="picker-sprite"><i class="ph-bold ph-prohibit" style="color:var(--muted);font-size:1rem"></i></div>'+
    '<div class="picker-item-name">— None —</div></div>';
  ['hold','berry','mega_stone'].forEach(function(cat){
    if(!groups[cat].length)return;
    if(_pickerCategory!=='all'&&_pickerCategory!==cat)return;
    body+='<div class="picker-group-label">'+groupLabels[cat]+'</div>';
    groups[cat].forEach(function(i){
      var sel=currentId===i.id?' selected':'';
      var sprite=i.sprite_url?'<img src="'+i.sprite_url+'" alt="" onerror="this.style.display=\'none\'">':'';
      body+='<div class="picker-item'+sel+'" onclick="pickItem(\''+i.id+'\')">'+
        '<div class="picker-sprite">'+sprite+'</div>'+
        '<div class="picker-item-name">'+i.name+'</div>'+
        pickerVpBadge(i)+
      '</div>';
    });
  });
  if(!filtered.length){
    body+='<div class="empty" style="padding:2rem 0;text-align:center;color:var(--muted);font-size:.82rem">No items match</div>';
  }
  var el=document.getElementById('pickerBody');if(el)el.innerHTML=body;
}

// User taps an item in the picker.
function pickItem(id){
  var hidden=document.getElementById('edItem');if(hidden)hidden.value=id;
  var btn=document.getElementById('edItemBtn');
  if(btn){
    if(!id){
      btn.innerHTML='<span class="placeholder">— None —</span><i class="ph-bold ph-caret-down" style="color:var(--muted)"></i>';
    }else{
      var item=allItems.find(function(i){return i.id===id});
      if(item){
        btn.innerHTML=(item.sprite_url?'<div class="be-select-chosen"><img src="'+item.sprite_url+'" alt=""><span>'+item.name+'</span></div>':'<div class="be-select-chosen"><span>'+item.name+'</span></div>')+
          '<i class="ph-bold ph-caret-down" style="color:var(--muted)"></i>';
      }
    }
  }
  closeItemPicker();
}
// Backdrop click dismisses the picker.
document.addEventListener('click',function(e){
  var ov=document.getElementById('itemPickerOv');
  if(ov&&e.target===ov)closeItemPicker();
});

