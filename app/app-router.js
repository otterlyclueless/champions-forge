// #SECTION: HASH ROUTER (Drop F.1)
// ═══════════════════════════════════════
// HASH ROUTER
// Parses URL hash and dispatches to public view renderers.
// Routes:
//   #/b/<code>   public build   (4-6 char base62)
//   #/t/<code>   public team
//   #/u/<name>   public profile (stub placeholder for F.3+)
// Invalid / empty hash falls through to normal signed-in app UI.
// ═══════════════════════════════════════

var _pubRoute=null;         // {kind:'build'|'team'|'profile', code?, name?} | null
var _pubRouteSticky=false;  // true once a public route has been rendered (controls whether we hide sidebar on signed-out)

function parseHash(hash){
  if(!hash||hash==='#'||hash==='#/')return null;
  var path=hash.replace(/^#/,'');
  var m;
  if(m=path.match(/^\/b\/([0-9a-zA-Z]{4,8})$/))return{kind:'build',code:m[1]};
  if(m=path.match(/^\/t\/([0-9a-zA-Z]{4,8})$/))return{kind:'team',code:m[1]};
  if(m=path.match(/^\/u\/([a-zA-Z0-9_-]{3,20})$/))return{kind:'profile',name:m[1].toLowerCase()};
  return null;
}

function handleHashRoute(){
  var route=parseHash(location.hash);
  _pubRoute=route;
  if(!route){
    hidePublicPage();
    return false;
  }
  _pubRouteSticky=true;
  showPublicPage();
  if(route.kind==='build')renderPublicBuild(route.code);
  else if(route.kind==='team')renderPublicTeam(route.code);
  else if(route.kind==='profile')renderPublicProfile(route.name);
  return true;
}

function showPublicPage(){
  // Hide all normal pages
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('show')});
  // Show public container
  var pg=document.getElementById('pg-public');
  if(pg)pg.classList.add('show');
  // Clear sidebar active state (no app-page selected)
  document.querySelectorAll('.sb-item.active').forEach(function(i){i.classList.remove('active')});
  // On public route, hide sidebar for signed-out visitors (no nav narget anyway).
  // Signed-in viewers keep the sidebar so they can get back to their own app.
  document.body.classList.add('pub-route');
  if(usr){document.body.classList.add('pub-route-authed')}
  else{document.body.classList.remove('pub-route-authed')}
}

function hidePublicPage(){
  var pg=document.getElementById('pg-public');
  if(pg){pg.classList.remove('show');pg.innerHTML=''}
  document.body.classList.remove('pub-route');
  document.body.classList.remove('pub-route-authed');
  // If this is the first load and no other page is active, fall back to dashboard
  var anyActive=document.querySelector('.page.show');
  if(!anyActive){
    var dash=document.getElementById('pg-dash');if(dash)dash.classList.add('show');
    var dashItem=document.querySelector('.sb-item[data-p="dash"]');if(dashItem)dashItem.classList.add('active');
  }
}
