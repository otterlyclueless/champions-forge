// LOADUSER BOOTSTRAP OVERRIDE
// Expand the signed-in bootstrap so all dashboard,
// profile, team, and battle data loads together.
// ═══════════════════════════════════════
var origLoadUser=loadUser;
loadUser=async function(){await Promise.all([loadBuilds(),loadTeamRoster(),loadUDex(),loadUItems(),loadProfile(),loadUserAch(),loadBattles()]);renderDash();renderDex();renderBuilds();renderTeams();renderItems();renderProfile();checkAchievements()};

// ═══════════════════════════════════════
// APP INITIALIZATION
// Initial data loading and startup behavior.
// ═══════════════════════════════════════
restoreSession();updAuth();loadPkmn();loadItems();loadNatures();loadMoveIndex();loadAchievements();if(usr){loadUser()}else{maybeShowInitialAuthPrompt()}

// ═══════════════════════════════════════
// PWA / SERVICE WORKER
// Register service worker for installable app behavior.
// ═══════════════════════════════════════
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(function(){console.log('SW registered')}).catch(function(e){console.log('SW failed:',e)})}