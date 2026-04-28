// #SECTION: TEAM COVERAGE ANALYZER
// ═══════════════════════════════════════
// TEAM COVERAGE ANALYZER
// Analyse offensive coverage and defensive weaknesses.
// ═══════════════════════════════════════

function teamCoverageHtml(members){
  if(!members||!members.length)return'<p style="color:var(--muted);font-size:.85rem">Add members to see coverage</p>';
  var offHits={},defWeaks={};
  ALL_T.forEach(function(t){offHits[t]=0;defWeaks[t]=0});
  members.forEach(function(m){
    var t1=m.type_1,t2=m.type_2;
    ALL_T.forEach(function(dt){
      var mult=TCHART[t1]&&TCHART[t1][dt]!==undefined?TCHART[t1][dt]:1;
      if(mult>=2)offHits[dt]++;
      if(t2){
        var m2=TCHART[t2]&&TCHART[t2][dt]!==undefined?TCHART[t2][dt]:1;
        if(m2>=2)offHits[dt]++;
      }
    });
    ALL_T.forEach(function(at){
      var mult=TCHART[at]&&TCHART[at][t1]!==undefined?TCHART[at][t1]:1;
      if(t2)mult*=(TCHART[at]&&TCHART[at][t2]!==undefined?TCHART[at][t2]:1);
      if(mult>=2)defWeaks[at]++;
    });
  });

  var uncov=ALL_T.filter(function(t){return offHits[t]===0});
  var danger=ALL_T.filter(function(t){return defWeaks[t]>=2}).sort(function(a,b){return defWeaks[b]-defWeaks[a]});
  var strong=ALL_T.filter(function(t){return offHits[t]>=3}).sort(function(a,b){return offHits[b]-offHits[a]});
  var isMobile=window.innerWidth<=768;

  if(isMobile){
    var riskRows=ALL_T.filter(function(t){return offHits[t]===0||defWeaks[t]>=2}).sort(function(a,b){
      var aScore=(defWeaks[a]>=2?100+defWeaks[a]:0)+(offHits[a]===0?10:0);
      var bScore=(defWeaks[b]>=2?100+defWeaks[b]:0)+(offHits[b]===0?10:0);
      return bScore-aScore;
    });

    var html='';
    html+='<div style="display:grid;grid-template-columns:1fr;gap:.75rem">';
    html+='<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:12px;padding:.85rem">'+
      '<div style="font-size:.72rem;font-weight:800;color:var(--green);margin-bottom:.45rem;letter-spacing:.02em">⚔ Strong coverage</div>'+
      (strong.length?'<div style="display:flex;flex-wrap:wrap;gap:5px">'+strong.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:9px;padding:3px 8px">'+t+'</span>'}).join('')+'</div>':'<div style="font-size:.78rem;color:var(--muted)">No standout offensive clusters yet.</div>')+
    '</div>';

    html+='<div style="background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.14);border-radius:12px;padding:.85rem">'+
      '<div style="font-size:.72rem;font-weight:800;color:var(--red);margin-bottom:.55rem;letter-spacing:.02em">⚠ Watch-outs</div>'+
      (riskRows.length?'<div style="display:flex;flex-direction:column;gap:.45rem">'+riskRows.map(function(t){
        var notes=[];
        if(offHits[t]===0)notes.push('no coverage');
        if(defWeaks[t]>=2)notes.push('weak ×'+defWeaks[t]);
        return'<div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.5rem .6rem;border-radius:10px;background:var(--surface);border:1px solid var(--border)">'+
          '<div style="display:flex;align-items:center;gap:.45rem;min-width:0"><span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:9px;padding:3px 8px">'+t+'</span></div>'+
          '<span style="font-size:.72rem;color:var(--muted);text-align:right">'+notes.join(' · ')+'</span>'+
        '</div>';
      }).join('')+'</div>':'<div style="font-size:.78rem;color:var(--green)">No major risk clusters. ✓</div>')+
    '</div>';

    html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:.85rem">'+
      '<div style="font-size:.72rem;font-weight:800;color:var(--text);margin-bottom:.55rem;letter-spacing:.02em">18-type snapshot</div>'+
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem">'+ALL_T.map(function(t){
        var tone=defWeaks[t]>=2?'rgba(239,68,68,.08)':offHits[t]>=2?'rgba(34,197,94,.08)':'var(--surface2)';
        var bd=defWeaks[t]>=2?'1px solid rgba(239,68,68,.25)':offHits[t]>=2?'1px solid rgba(34,197,94,.22)':'1px solid var(--border)';
        return'<div style="border-radius:10px;padding:.45rem .5rem;background:'+tone+';border:'+bd+'">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:.35rem;margin-bottom:.25rem"><span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px;padding:2px 6px">'+t+'</span><span style="font-size:.65rem;color:var(--muted)">⚔ '+offHits[t]+' · 🛡 '+defWeaks[t]+'</span></div>'+
        '</div>';
      }).join('')+'</div>'+
    '</div>';

    html+='</div>';
    return html;
  }

  var html='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:1.2rem">';
  ALL_T.forEach(function(t){
    var off=offHits[t],def=defWeaks[t];
    var bg=off>=2?'rgba(34,197,94,.15)':off===0?'rgba(239,68,68,.08)':'var(--surface)';
    var border=def>=2?'2px solid var(--red)':off===0?'1.5px dashed var(--border)':'1px solid var(--border)';
    html+='<div style="border-radius:8px;padding:6px 4px;text-align:center;background:'+bg+';border:'+border+'">'+
      '<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px;padding:1px 5px">'+t+'</span>'+
      '<div style="display:flex;justify-content:center;gap:6px;margin-top:4px;font-size:.6rem;font-weight:600">'+
        '<span style="color:var(--green)" title="Can hit SE">⚔'+off+'</span>'+
        '<span style="color:'+(def>=2?'var(--red)':'var(--muted2)')+'" title="Threatens team">🛡'+def+'</span>'+
      '</div></div>';
  });
  html+='</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem">';
  html+='<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--green);margin-bottom:.4rem">⚔️ STRONG ('+strong.length+')</div>';
  html+=strong.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+strong.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--muted)">—</span>';
  html+='</div>';
  html+='<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--red);margin-bottom:.4rem">❌ NO COVERAGE ('+uncov.length+')</div>';
  html+=uncov.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+uncov.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--green)">Full coverage! ✓</span>';
  html+='</div>';
  html+='<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:.7rem"><div style="font-size:.65rem;font-weight:700;color:var(--red);margin-bottom:.4rem">⚠️ WEAK TO ('+danger.length+')</div>';
  html+=danger.length?'<div style="display:flex;flex-wrap:wrap;gap:3px">'+danger.map(function(t){return'<span class="type-pill" style="background:'+(TC[t]||TC.Normal).m+';font-size:8px">'+t+' ×'+defWeaks[t]+'</span>'}).join('')+'</div>':'<span style="font-size:.72rem;color:var(--green)">Solid! ✓</span>';
  html+='</div></div>';
  html+='<div style="margin-top:.6rem;font-size:.6rem;color:var(--muted);display:flex;gap:1rem"><span>⚔ = team members that can hit SE</span><span>🛡 = team members threatened by this type</span><span style="color:var(--green)">Green = strong coverage</span><span style="color:var(--red)">Red border = dangerous</span></div>';
  return html;
}

