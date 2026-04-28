// #SECTION: BATTLE LOG
// ═══════════════════════════════════════
// BATTLE LOG
// Record wins/losses/draws and calculate team records.
// ═══════════════════════════════════════

var allBattles=[];
async function loadBattles(){if(!tk)return;try{allBattles=await q('battle_log',{order:'battle_date.desc',limit:'200'},true)}catch(e){}}
async function logBattle(teamId,result,notes){
  try{await ins('battle_log',{user_id:usr.id,team_id:teamId,result:result,opponent_notes:notes||null},true);
  toast(result==='win'?'🏆 Victory logged!':result==='loss'?'💀 Loss logged':'📊 Draw logged');
  await loadBattles();renderTeams()}catch(e){toast(e.message,'err')}
}
async function delBattle(bid){try{await rm('battle_log',{'id':'eq.'+bid},true);toast('Removed');await loadBattles();renderTeams()}catch(e){toast(e.message,'err')}}
function getTeamRecord(teamId){var w=0,l=0,d=0;allBattles.forEach(function(b){if(b.team_id===teamId){if(b.result==='win')w++;else if(b.result==='loss')l++;else d++}});return{w:w,l:l,d:d,total:w+l+d,rate:w+l+d>0?Math.round(w/(w+l+d)*100):0}}
