// #SECTION: DASHBOARD
// ═══════════════════════════════════════
// DASHBOARD — "Competitive HQ"
// Gradient stat cards with icon watermarks,
// recent builds compact list, quick action buttons.
// ═══════════════════════════════════════

// Pokéball SVG for Collection card watermark
var POKEBALL_ICON='<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="5"/><path d="M5 50A45 45 0 0 1 95 50" fill="currentColor"/><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="5"/></svg>';

// Helper to navigate to a page from dashboard
function dashNav(page){
  document.querySelectorAll('.sb-item').forEach(function(n){n.classList.remove('active')});
  var tgt=document.querySelector('[data-p='+page+']');if(tgt)tgt.classList.add('active');
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('show')});
  document.getElementById('pg-'+page).classList.add('show');
}

function renderDash(){
  var c=document.getElementById('dashContent');
  if(!c)return;
  var obt=Object.keys(uDex).length,total=allPkmn.length||258;
  var shinyCount=Object.keys(uShinyDex).length;

  // Stat cards
  var stats='<div class="da-stats">'+
    '<div class="da-stat da-collection"><div class="da-stat-label">Collection</div><div class="da-stat-val">'+obt+' <span class="da-stat-sub">/ '+total+'</span></div><div class="da-stat-glow">'+POKEBALL_ICON+'</div></div>'+
    '<div class="da-stat da-builds"><div class="da-stat-label">Active Builds</div><div class="da-stat-val">'+allBuilds.length+'</div><div class="da-stat-glow"><i class="ph-duotone ph-sword"></i></div></div>'+
    '<div class="da-stat da-teams"><div class="da-stat-label">Teams</div><div class="da-stat-val">'+allTeams.length+'</div><div class="da-stat-glow"><i class="ph-duotone ph-trophy"></i></div></div>'+
    '<div class="da-stat da-shiny"><div class="da-stat-label">Shiny Dex</div><div class="da-stat-val">'+shinyCount+'</div><div class="da-stat-glow"><i data-lucide="sparkles" stroke-width="1.5"></i></div></div>'+
  '</div>';

  // Signed-out state
  if(!usr){
    c.innerHTML=stats+
      '<div class="da-section" style="padding-top:.5rem">'+
        '<div class="card" style="text-align:center;padding:1.3rem;max-width:420px;margin:0 auto">'+
          '<div style="margin-bottom:.5rem;font-size:1.8rem">🔐</div>'+
          '<h3 style="font-size:1rem;font-weight:700;margin-bottom:.3rem">Save your progress</h3>'+
          '<p style="font-size:.82rem;color:var(--muted);line-height:1.5">Sign in or create an account to save your builds, teams, items, and Pokédex progress.</p>'+
          '<div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.9rem">'+
            '<button class="btn btn-red" onclick="authMode=\'login\';showLoginModal()">Sign In</button>'+
            '<button class="btn btn-ghost" onclick="authMode=\'signup\';showLoginModal()">Sign Up</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    requestAnimationFrame(function(){if(typeof lucide!=='undefined')lucide.createIcons()});
    return;
  }

  // Recent builds
  var recentHtml='';
  if(allBuilds.length){
    recentHtml=allBuilds.slice(0,5).map(function(b){
      var rImg=b.is_shiny&&b.shiny_url?b.shiny_url:(b.image_url||'');
      return '<div class="da-build" onclick="showBuildDetail(\''+b.id+'\');dashNav(\'builds\')">'+
        '<img class="da-build-img" src="'+rImg+'" onerror="this.style.opacity=\'0.2\'">'+
        '<div class="da-build-info">'+
          '<div class="da-build-name">'+(b.pokemon_name||'?')+(b.is_shiny?' <span style="color:var(--purple)">✦</span>':'')+'</div>'+
          '<div class="da-build-sub">'+b.build_name+' · '+(b.battle_format||'')+'</div>'+
        '</div>'+
        '<div class="da-build-sp">'+(b.total_sp||0)+' SP</div>'+
      '</div>';
    }).join('');
  }else{
    recentHtml='<div style="color:var(--muted);font-size:.82rem;padding:.5rem 0">No builds yet — create your first!</div>';
  }

  // Quick actions
  var quickHtml='<div class="da-quick">'+
    '<button class="da-qbtn" onclick="showBuildEditor();dashNav(\'builds\')"><div class="da-qbtn-icon">⚔️</div>New Build</button>'+
    '<button class="da-qbtn" onclick="showTeamEditor();dashNav(\'teams\')"><div class="da-qbtn-icon">🏆</div>New Team</button>'+
    '<button class="da-qbtn" onclick="dashNav(\'dex\')"><div class="da-qbtn-icon">📋</div>Browse Dex</button>'+
    '<button class="da-qbtn" onclick="dashNav(\'profile\')"><div class="da-qbtn-icon">👤</div>Profile</button>'+
  '</div>';

  c.innerHTML=stats+
    '<div class="da-section"><div class="da-section-title">⚡ Recent Builds</div>'+recentHtml+'</div>'+
    '<div class="da-section"><div class="da-section-title">🚀 Quick Actions</div></div>'+
    quickHtml;

  // Initialize Lucide icons (for the sparkles icon)
  requestAnimationFrame(function(){if(typeof lucide!=='undefined')lucide.createIcons()});
}