// ═══════════════════════════════════════
// SOCIAL ROW HELPERS (Drop F.3)
// Likes + Copy-to-my-builds/teams on public detail views.
// Visible only to signed-in viewers who are NOT the content owner.
// ═══════════════════════════════════════

function pubSocialRowHtml(kind,likeData){
  // Only show for signed-in users viewing someone else's content
  if(!usr||!likeData)return '';
  if(usr.id===likeData.ownerId)return '';
  var liked=likeData.liked;
  var count=likeData.count;
  var id=likeData.id;
  var heartFill=liked?'#ef4444':'none';
  var heartStroke=liked?'#ef4444':'currentColor';
  var likedClass=liked?' liked':'';
  var heartSvg='<svg width="16" height="16" viewBox="0 0 24 24" fill="'+heartFill+'" stroke="'+heartStroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  var copySvg='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  var copyLabel=kind==='team'?'Copy to my teams':'Copy to my builds';
  var toggleFn=kind==='team'?'toggleTeamLike':'toggleBuildLike';
  var copyFn=kind==='team'?'copyTeam':'copyBuild';
  return (
    '<div class="pub-social-row">'+
      '<button class="like-btn'+likedClass+'" id="pub-like-btn" onclick="'+toggleFn+'(\''+pubEscape(id)+'\')" aria-label="'+(liked?'Unlike':'Like')+'">'+
        heartSvg+
        '<span id="pub-like-cnt">'+count+'</span>'+
      '</button>'+
      '<button class="copy-btn" id="pub-copy-btn" onclick="'+copyFn+'(\''+pubEscape(id)+'\')">'+
        copySvg+
        copyLabel+
      '</button>'+
    '</div>'
  );
}

// Apply liked/unliked visual state to the like button (used for optimistic updates + rollback)
function _applyLikeState(btn,cnt,liked,count){
  if(!btn||!cnt)return;
  btn.classList.toggle('liked',liked);
  var svg=btn.querySelector('svg');
  if(svg){svg.setAttribute('fill',liked?'#ef4444':'none');svg.setAttribute('stroke',liked?'#ef4444':'currentColor');}
  cnt.textContent=count;
}

async function toggleBuildLike(id){
  if(!usr){if(typeof showLoginModal==='function')showLoginModal('Sign in to like builds.');return;}
  var btn=document.getElementById('pub-like-btn');
  var cnt=document.getElementById('pub-like-cnt');
  if(!btn||!cnt)return;
  var isLiked=btn.classList.contains('liked');
  var count=parseInt(cnt.textContent)||0;
  var newLiked=!isLiked;
  var newCount=isLiked?count-1:count+1;
  _applyLikeState(btn,cnt,newLiked,newCount);
  btn.classList.add('pop');setTimeout(function(){btn.classList.remove('pop');},300);
  try{
    if(newLiked){
      var u=new URL(API+'/rest/v1/build_likes');
      u.searchParams.set('on_conflict','user_id,build_id');
      var r=await authFetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=minimal,resolution=ignore-duplicates'}),body:JSON.stringify({user_id:usr.id,build_id:id})},true);
      if(!r.ok&&r.status!==409)throw new Error(r.status);
    }else{
      await rm('build_likes',{'user_id':'eq.'+usr.id,'build_id':'eq.'+id},true);
    }
  }catch(e){
    _applyLikeState(btn,cnt,isLiked,count);
    toast('Could not update like','err');
  }
}

async function toggleTeamLike(id){
  if(!usr){if(typeof showLoginModal==='function')showLoginModal('Sign in to like teams.');return;}
  var btn=document.getElementById('pub-like-btn');
  var cnt=document.getElementById('pub-like-cnt');
  if(!btn||!cnt)return;
  var isLiked=btn.classList.contains('liked');
  var count=parseInt(cnt.textContent)||0;
  var newLiked=!isLiked;
  var newCount=isLiked?count-1:count+1;
  _applyLikeState(btn,cnt,newLiked,newCount);
  btn.classList.add('pop');setTimeout(function(){btn.classList.remove('pop');},300);
  try{
    if(newLiked){
      var u=new URL(API+'/rest/v1/team_likes');
      u.searchParams.set('on_conflict','user_id,team_id');
      var r=await authFetch(u.toString(),{method:'POST',headers:Object.assign(h(true),{'Prefer':'return=minimal,resolution=ignore-duplicates'}),body:JSON.stringify({user_id:usr.id,team_id:id})},true);
      if(!r.ok&&r.status!==409)throw new Error(r.status);
    }else{
      await rm('team_likes',{'user_id':'eq.'+usr.id,'team_id':'eq.'+id},true);
    }
  }catch(e){
    _applyLikeState(btn,cnt,isLiked,count);
    toast('Could not update like','err');
  }
}

async function copyBuild(id){
  if(!usr){if(typeof showLoginModal==='function')showLoginModal('Sign in to copy builds.');return;}
  var btn=document.getElementById('pub-copy-btn');
  var origHtml=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.textContent='Copying…';}
  try{
    var rows=await q('builds',{id:'eq.'+id,is_public:'eq.true',select:'name,pokemon_id,is_shiny,battle_format,archetype,ability,item_id,nature_id,move_1,move_2,move_3,move_4,hp_sp,atk_sp,def_sp,spa_sp,spd_sp,spe_sp,share_fields'},!!tk);
    if(!rows||!rows.length)throw new Error('Build not found');
    var orig=rows[0];
    var newBuild={
      user_id:usr.id,
      name:(orig.name||'Build')+' (copied)',
      pokemon_id:orig.pokemon_id,
      is_shiny:orig.is_shiny||false,
      battle_format:orig.battle_format||null,
      archetype:orig.archetype||null,
      ability:orig.ability||null,
      item_id:orig.item_id||null,
      nature_id:orig.nature_id||null,
      move_1:orig.move_1||null,
      move_2:orig.move_2||null,
      move_3:orig.move_3||null,
      move_4:orig.move_4||null,
      hp_sp:orig.hp_sp||0,atk_sp:orig.atk_sp||0,def_sp:orig.def_sp||0,
      spa_sp:orig.spa_sp||0,spd_sp:orig.spd_sp||0,spe_sp:orig.spe_sp||0,
      share_fields:orig.share_fields||null,
      is_public:false,is_favourite:false
    };
    var result=await ins('builds',newBuild,true);
    if(result&&result[0])allBuilds.unshift(result[0]);
    if(btn){btn.disabled=false;btn.textContent='✓ Copied!';btn.style.color='#10b981';}
    toast('Build copied to your collection');
  }catch(e){
    toast(e.message||'Could not copy build','err');
    if(btn){btn.disabled=false;btn.innerHTML=origHtml;btn.style.color='';}
  }
}

async function copyTeam(id){
  if(!usr){if(typeof showLoginModal==='function')showLoginModal('Sign in to copy teams.');return;}
  var btn=document.getElementById('pub-copy-btn');
  var origHtml=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.textContent='Copying…';}
  try{
    var results=await Promise.all([
      q('teams',{id:'eq.'+id,is_public:'eq.true',select:'name,format,share_fields'},!!tk),
      q('team_builds',{team_id:'eq.'+id,select:'build_id,slot_position',order:'slot_position.asc'},!!tk)
    ]);
    var teamRows=results[0],memberRows=results[1];
    if(!teamRows||!teamRows.length)throw new Error('Team not found');
    var orig=teamRows[0];
    var newTeam={user_id:usr.id,name:(orig.name||'Team')+' (copied)',format:orig.format||null,is_public:false};
    var teamResult=await ins('teams',newTeam,true);
    if(!teamResult||!teamResult[0])throw new Error('Could not create team copy');
    var newTeamId=teamResult[0].id;
    if(memberRows&&memberRows.length){
      var tbInserts=memberRows.map(function(m){return{team_id:newTeamId,build_id:m.build_id,slot_position:m.slot_position};});
      await ins('team_builds',tbInserts,true);
    }
    allTeams.unshift(teamResult[0]);
    if(btn){btn.disabled=false;btn.textContent='✓ Copied!';btn.style.color='#10b981';}
    toast('Team copied to your collection');
  }catch(e){
    toast(e.message||'Could not copy team','err');
    if(btn){btn.disabled=false;btn.innerHTML=origHtml;btn.style.color='';}
  }
}

