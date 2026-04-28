// ═══════════════════════════════════════
// BOOT: listen for hash changes; initial handleHashRoute call is made by app-init
// after reference data loading kicks off.
// ═══════════════════════════════════════
window.addEventListener('hashchange',handleHashRoute);

window._championsRouter={
  init:handleHashRoute,
  parseHash:parseHash,
  isPublicRoute:function(){return _pubRoute!==null}
};
