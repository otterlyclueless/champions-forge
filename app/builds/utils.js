// #SECTION: BUILD UTILITIES
// ═══════════════════════════════════════
// BUILD UTILITIES
// Duplicate builds, favourites, export, and related helpers.
// ═══════════════════════════════════════

async function dupBuild(id){
  var b=allBuilds.find(function(x){return x.id===id});if(!b)return;
  var body={user_id:usr.id,pokemon_id:b.pokemon_id,name:b.build_name+' (Copy)',battle_format:b.battle_format,archetype:b.archetype,item_id:b.item_id||null,nature_id:b.nature_id||null,ability:b.ability,move_1:b.move_1,move_2:b.move_2,move_3:b.move_3,move_4:b.move_4,hp_sp:b.hp_sp,atk_sp:b.atk_sp,def_sp:b.def_sp,spa_sp:b.spa_sp,spd_sp:b.spd_sp,spe_sp:b.spe_sp,is_shiny:b.is_shiny||false,win_condition:b.win_condition,strengths:b.strengths,weaknesses:b.weaknesses,status:'Testing'};
  try{await ins('builds',body,true);toast('Build duplicated!');await loadBuilds();renderBuilds();renderDash()}catch(e){toast(e.message,'err')}
}

async function togFav(ev,id){
  if(ev)ev.stopPropagation();var b=allBuilds.find(function(x){return x.id===id});if(!b)return;
  try{await upd('builds',{'id':'eq.'+id},{is_favourite:!b.is_favourite},true);
  b.is_favourite=!b.is_favourite;toast(b.is_favourite?'⭐ Favourited!':'Unfavourited');renderBuilds()}catch(e){toast(e.message,'err')}
}

// #SECTION: SHOWDOWN EXPORT
// ───────────────────────────────────────
// SHOWDOWN EXPORT
// Build a Showdown-friendly plaintext export.
// ───────────────────────────────────────

function exportShowdown(id){
  var b=allBuilds.find(function(x){return x.id===id});if(!b)return;
  var lines=[];
  var itemStr=b.item_name?' @ '+b.item_name:'';
  // Build a Showdown-friendly plaintext export from the saved build fields.
  lines.push((b.pokemon_name||'Unknown')+itemStr);
  if(b.ability)lines.push('Ability: '+b.ability);
  if(b.nature_name)lines.push(b.nature_name+' Nature');
  // EVs (map SP to EVs — SP×8 is a rough approximation)
  var evs=[];
  if(b.hp_sp)evs.push(b.hp_sp*8+' HP');if(b.atk_sp)evs.push(b.atk_sp*8+' Atk');
  if(b.def_sp)evs.push(b.def_sp*8+' Def');if(b.spa_sp)evs.push(b.spa_sp*8+' SpA');
  if(b.spd_sp)evs.push(b.spd_sp*8+' SpD');if(b.spe_sp)evs.push(b.spe_sp*8+' Spe');
  if(evs.length)lines.push('EVs: '+evs.join(' / '));
  if(b.move_1)lines.push('- '+b.move_1);if(b.move_2)lines.push('- '+b.move_2);
  if(b.move_3)lines.push('- '+b.move_3);if(b.move_4)lines.push('- '+b.move_4);
  var text=lines.join('\n');
  // Show in modal for easy copy (clipboard API blocked in sandbox)
  var mod=document.getElementById('confirmMod');
  document.getElementById('cmEmoji').textContent='📤';
  document.getElementById('cmTitle').textContent='Showdown Export';
  document.getElementById('cmMsg').innerHTML='<textarea style="width:100%;min-height:140px;padding:.6rem;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:monospace;font-size:.82rem;resize:vertical;margin-top:.5rem" onclick="this.select()" readonly>'+text.replace(/</g,'&lt;')+'</textarea><div style="font-size:.72rem;color:var(--muted);margin-top:.4rem">Click the text → Ctrl+C / Cmd+C to copy</div>';
  document.getElementById('cmBtn').textContent='Done';
  document.getElementById('cmBtn').onclick=closeCm;
  document.getElementById('cmBtn').className='btn btn-ghost';
  mod.classList.add('open');
}

// Item picker and Move picker → see app/pickers/*
