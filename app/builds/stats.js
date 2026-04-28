// PURE STAT CALC HELPERS (shared by dex detail + build editor)
// ═══════════════════════════════════════
function bsCalcStatFor(key,base,spVal,nature){
  var m=1;
  if(nature){
    if(BSNATMAP[nature.increased_stat]===key)m=1.1;
    if(BSNATMAP[nature.decreased_stat]===key)m=0.9;
  }
  if(key==='hp')return Math.floor((2*base+31)*50/100)+60+spVal;
  return Math.floor((Math.floor((2*base+31)*50/100)+5)*m)+spVal;
}
function bsGetCalcStatsFor(poke,sp,nature){
  if(!poke)return BSK.map(function(k){return{key:k,base:0,sp:0,calc:0,natMod:1}});
  return BSK.map(function(k){
    var base=poke[BSDB[k]]||0,spVal=sp[k]||0,m=1;
    if(nature){
      if(BSNATMAP[nature.increased_stat]===k)m=1.1;
      if(BSNATMAP[nature.decreased_stat]===k)m=0.9;
    }
    return{key:k,base:base,sp:spVal,calc:bsCalcStatFor(k,base,spVal,nature),natMod:m};
  });
}

// ═══════════════════════════════════════
// BUILD EDITOR STAT PREVIEW (bars + hex + SP sliders)
// DOM IDs prefixed ed-* to avoid clash with dex detail panel
// ═══════════════════════════════════════
var edView='bars';

function edGetPoke(){return allPkmn.find(function(x){return x.id===selPkmnId})}
function edGetNature(){
  var sel=document.getElementById('edNat');
  if(!sel||!sel.value)return null;
  var n=allNatures.find(function(x){return x.id===sel.value});
  return n&&n.increased_stat?n:null;
}

function edBuildBars(){
  return '<div class="bs-grid">'+BSK.map(function(k){
    return '<div class="bs-row"><span class="bs-label">'+BSN[k]+'</span><div class="bs-track"><div class="bs-fill" id="ed-bf-'+k+'" style="background:'+BSC[k]+'"></div></div><span class="bs-val" style="color:'+BSC[k]+'" id="ed-bv-'+k+'">0</span><span class="bs-nat-ind" id="ed-bi-'+k+'"></span></div>';
  }).join('')+'</div>';
}
function edUpdateBars(stats){
  stats.forEach(function(st){
    var f=document.getElementById('ed-bf-'+st.key),v=document.getElementById('ed-bv-'+st.key),i=document.getElementById('ed-bi-'+st.key);
    if(f)f.style.width=Math.min(st.calc/300*100,100)+'%';
    if(v)v.textContent=st.calc;
    if(i)i.innerHTML=st.natMod>1?'<span style="color:var(--green)">▲</span>':st.natMod<1?'<span style="color:var(--red)">▼</span>':'';
  });
}

function edBuildHex(poke){
  var typeCol=(TC[poke.type_1]||TC.Normal).m;
  var cx=180,cy=175,r=78,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
  function polar(a,rd){var d=a*Math.PI/180;return{x:cx+rd*Math.cos(d),y:cy+rd*Math.sin(d)}}
  var outerPts=angles.map(function(a){var p=polar(a,r);return p.x+','+p.y}).join(' ');
  var g75=angles.map(function(a){var p=polar(a,r*.75);return p.x+','+p.y}).join(' ');
  var g50=angles.map(function(a){var p=polar(a,r*.5);return p.x+','+p.y}).join(' ');
  var g25=angles.map(function(a){var p=polar(a,r*.25);return p.x+','+p.y}).join(' ');
  var spokes=angles.map(function(a){var p=polar(a,r);return'<line x1="'+cx+'" y1="'+cy+'" x2="'+p.x+'" y2="'+p.y+'" stroke="var(--border)" stroke-width="1"/>'}).join('');
  var labels='';
  for(var i=0;i<6;i++){
    var si=order[i],k=BSK[si],pt=polar(angles[i],r+26);
    var anchor='middle';if(angles[i]===-30||angles[i]===30)anchor='start';if(angles[i]===150||angles[i]===210)anchor='end';
    var isTop=angles[i]===-90,isBot=angles[i]===90;
    if(isTop){labels+='<text x="'+pt.x+'" y="'+(pt.y-10)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+5)+'" text-anchor="middle" id="ed-hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text>'}
    else if(isBot){labels+='<text x="'+pt.x+'" y="'+(pt.y+4)+'" text-anchor="middle" id="ed-hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text><text x="'+pt.x+'" y="'+(pt.y+18)+'" text-anchor="middle" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text>'}
    else{labels+='<text x="'+pt.x+'" y="'+(pt.y-4)+'" text-anchor="'+anchor+'" fill="'+BSC[k]+'" font-size="11" font-weight="700" font-family="Plus Jakarta Sans,sans-serif">'+BSN[k]+'</text><text x="'+pt.x+'" y="'+(pt.y+12)+'" text-anchor="'+anchor+'" id="ed-hv-'+k+'" fill="'+BSC[k]+'" font-size="14" font-weight="800" font-family="Plus Jakarta Sans,sans-serif" style="font-variant-numeric:tabular-nums">0</text>'}
  }
  return '<div class="bs-hex-wrap"><svg class="bs-hex-svg" viewBox="0 0 360 360"><polygon points="'+outerPts+'" fill="none" stroke="var(--border)" stroke-width="1.5"/><polygon points="'+g75+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g50+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/><polygon points="'+g25+'" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".35"/>'+spokes+'<polygon id="ed-hexPoly" points="'+cx+','+cy+'" fill="'+typeCol+'25" stroke="'+typeCol+'" stroke-width="2.5" stroke-linejoin="round" style="transition:all .3s ease"/>'+labels+'</svg></div>';
}
function edUpdateHex(stats){
  var cx=180,cy=175,r=78,angles=[-90,-30,30,90,150,210],order=[0,1,2,5,4,3];
  function polar(a,rd){var d=a*Math.PI/180;return{x:cx+rd*Math.cos(d),y:cy+rd*Math.sin(d)}}
  var pts=[];for(var i=0;i<6;i++){var si=order[i];var pct=Math.min(stats[si].calc/300,1);var pt=polar(angles[i],r*Math.max(pct,0.05));pts.push(pt.x+','+pt.y)}
  var poly=document.getElementById('ed-hexPoly');if(poly)poly.setAttribute('points',pts.join(' '));
  for(var i=0;i<6;i++){var si=order[i],st=stats[si],el=document.getElementById('ed-hv-'+st.key);if(el){el.textContent=st.calc+(st.natMod>1?' ▲':st.natMod<1?' ▼':'');el.style.fill=st.natMod>1?'var(--green)':st.natMod<1?'var(--red)':BSC[st.key]}}
}

function edBuildSP(){
  var rows=BSK.map(function(k){
    var col=BSC[k];
    return '<div class="dsp-row">'+
      '<span class="dsp-name" style="color:'+col+'">'+BSN[k]+'</span>'+
      '<button class="dsp-pm" onpointerdown="edAdj(\''+k+'\',-1)">−</button>'+
      '<div class="dsp-slider-wrap">'+
        '<div class="dsp-slider-track"><div class="dsp-slider-fill" id="ed-sf-'+k+'" style="background:'+col+'"></div></div>'+
        '<input type="range" class="dsp-slider" id="ed-sr-'+k+'" min="0" max="32" value="'+spV[k]+'" style="--thumb-col:'+col+'" oninput="edSlide(\''+k+'\',this.value)">'+
      '</div>'+
      '<button class="dsp-pm" onpointerdown="edAdj(\''+k+'\',1)">+</button>'+
      '<input class="dsp-val-box" id="ed-sv-'+k+'" type="number" min="0" max="32" value="'+spV[k]+'" style="color:'+col+'" onchange="edSet(\''+k+'\',this.value)">'+
    '</div>';
  }).join('');
  return '<div class="dsp-section"><div class="dsp-header"><span class="dsp-title">SP Allocation</span><div class="dsp-remain-wrap"><div class="dsp-remain-num ok" id="ed-remainNum">'+SP_MAX+'</div><div class="dsp-remain-label">remaining of '+SP_MAX+'</div></div></div><div class="dsp-grid">'+rows+'</div></div>';
}
function edUpdateSP(){
  var total=BSK.reduce(function(s,k){return s+spV[k]},0),remain=SP_MAX-total;
  var el=document.getElementById('ed-remainNum');if(el){el.textContent=remain;el.className='dsp-remain-num '+(remain<0?'over':remain<=5?'warn':'ok')}
  BSK.forEach(function(k){
    var fill=document.getElementById('ed-sf-'+k),val=document.getElementById('ed-sv-'+k),range=document.getElementById('ed-sr-'+k);
    if(fill)fill.style.width=(spV[k]/32*100)+'%';
    if(range)range.value=spV[k];
    if(val&&document.activeElement!==val)val.value=spV[k];
  });
}
function edUpdateBST(stats){
  var total=stats.reduce(function(s,st){return s+st.calc},0);
  var cls=total>=600?'bst-elite':total>=500?'bst-high':total>=400?'bst-mid':'bst-low';
  var el=document.getElementById('ed-bstVal');if(el){el.textContent=total;el.className='bs-total-val '+cls}
}

function edRefresh(){
  var p=edGetPoke();
  if(!p)return;
  var nature=edGetNature();
  var stats=bsGetCalcStatsFor(p,spV,nature);
  edUpdateBars(stats);
  edUpdateHex(stats);
  edUpdateBST(stats);
  edUpdateSP();
  // Drop H: sync nature picker button label + chips
  var _natBtn=document.getElementById('edNatBtn');
  if(_natBtn){
    var _natLbl=document.getElementById('edNatLabel');
    var _natChips=document.getElementById('edNatChips');
    if(_natLbl)_natLbl.textContent=nature?nature.name:'Select nature…';
    _natBtn.classList.toggle('empty',!nature);
    if(_natChips){
      if(nature&&nature.increased_stat){
        var _u=NAT_SC[nature.increased_stat],_d=NAT_SC[nature.decreased_stat];
        _natChips.innerHTML='<span class="ed-nat-btn-chip" style="background:'+_u.bg+';color:'+_u.c+'">▲ '+_u.s+'</span>'+
          '<span class="ed-nat-btn-chip" style="background:'+_d.bg+';color:'+_d.c+'">▼ '+_d.s+'</span>';
        _natChips.style.display='flex';
      }else{_natChips.innerHTML='';_natChips.style.display='none';}
    }
  }
}

function edSwitchView(view){
  edView=view;
  document.querySelectorAll('#statSection .bs-view-btn').forEach(function(b){b.classList.toggle('active',b.dataset.view===view)});
  var b=document.getElementById('ed-barsView'),h=document.getElementById('ed-hexView');
  if(b)b.classList.toggle('active',view==='bars');
  if(h)h.classList.toggle('active',view==='hex');
  edRefresh();
}

// SP controls (respects 66-cap)
function edSet(key,val){
  var requested=Math.max(0,Math.min(32,parseInt(val)||0));
  var other=BSK.reduce(function(s,k){return s+(k===key?0:spV[k])},0);
  var maxAllowed=Math.max(0,SP_MAX-other);
  spV[key]=Math.min(requested,maxAllowed);
  edRefresh();
}
function edSlide(key,val){edSet(key,val)}
function edAdj(key,delta){edSet(key,spV[key]+delta)}

// Render the full stat section (called from renderBuildEditor and pickPk)
function edBuildStatSection(){
  var p=edGetPoke();
  if(!p)return '<div style="color:var(--muted);font-size:.82rem;padding:.5rem 0">Select a Pokémon to configure stats</div>';
  var t1=(TC[p.type_1]||TC.Normal).m,t2=p.type_2?(TC[p.type_2]||TC.Normal).m:null;
  var html='';
html+='<div style="display:flex;align-items:center;gap:.65rem;padding:.6rem .7rem;background:var(--surface);border-radius:10px;margin-bottom:.8rem"><img src="'+((editorShiny&&p.shiny_url)?p.shiny_url:(p.image_url||''))+'" onerror="this.style.opacity=0.2" style="width:42px;height:42px;object-fit:contain"><div><div style="display:flex;align-items:center;justify-content:flex-start;gap:8px;flex-wrap:nowrap;font-weight:800;font-size:.88rem"><span>'+p.name+'</span>'+(p.form==="Mega"?'<img src="'+MEGA_STONE_URL+'" alt="Mega" style="width:18px;height:18px;object-fit:contain;display:block;flex-shrink:0" onerror="this.style.display=\'none\'">':'')+'</div><div style="display:flex;gap:4px;margin-top:2px"><span class="type-pill" style="background:'+t1+'">'+p.type_1+'</span>'+(p.type_2?'<span class="type-pill" style="background:'+t2+'">'+p.type_2+'</span>':'')+'</div></div></div>';
  html+='<div class="bs-view-toggle"><button class="bs-view-btn'+(edView==='bars'?' active':'')+'" data-view="bars" onclick="edSwitchView(\'bars\')">Bars</button><button class="bs-view-btn'+(edView==='hex'?' active':'')+'" data-view="hex" onclick="edSwitchView(\'hex\')">Hex</button></div>';
  html+='<div class="bs-view'+(edView==='bars'?' active':'')+'" id="ed-barsView">'+edBuildBars()+'</div>';
  html+='<div class="bs-view'+(edView==='hex'?' active':'')+'" id="ed-hexView">'+edBuildHex(p)+'</div>';
  html+='<div class="bs-total"><span class="bs-total-label">Lv50 Stat Total</span><span class="bs-total-val" id="ed-bstVal">0</span></div>';
  html+=edBuildSP();
  html+='<div class="bs-formula">Lv50 · IVs max (31) · <code>1 SP = +1 stat</code></div>';
  return html;
}

