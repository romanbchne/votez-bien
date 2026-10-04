/* ============================================================================
   VOTEZ BIEN ! — app.js
   État + rendu. Toute la logique de calcul vit dans scoring.js (testée
   séparément) : ce fichier ne fait qu'appeler ces fonctions et mettre à
   jour le DOM.
   ========================================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'votezbien:v6:state';
  const SCALE_LABELS = ['Beaucoup plus A', 'Plutôt A', 'Entre les deux', 'Plutôt B', 'Beaucoup plus B'];
  const IMP_LABELS = ['Peu important', 'Important', 'Essentiel'];

  let state = freshState();
  let lastDimResults = null;
  let lastOverall = null;
  let compareSelection = [];
  let familyFilter = null;
  let lastFocusedEl = null;

  function freshState() {
    return { phase: 'main', index: 0, answers: {}, importances: {}, diagnosticQuestions: [], completed: false };
  }

  /* ---------------- Persistance locale (namespace propre, aucun serveur) ---------------- */
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible : l'app continue de fonctionner sans reprise */ } }
  function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function clearState() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }
  function hasProgress(s) { return !!(s && s.answers && Object.keys(s.answers).length > 0); }

  /* ---------------- Ensemble de questions actif ---------------- */
  function fullQuestionSet() { return QUESTIONS.concat(state.diagnosticQuestions || []); }
  function currentList() { return state.phase === 'diagnostic' ? state.diagnosticQuestions : QUESTIONS; }
  function currentQuestion() { return currentList()[state.index]; }

  function computeResults() {
    lastDimResults = Scoring.computeDimensionResults(state.answers, state.importances, fullQuestionSet());
    lastOverall = Scoring.computeOverall(lastDimResults);
    return { dimResults: lastDimResults, overall: lastOverall };
  }

  function positionLabel(dimKey, score) {
    if (score === null || score === undefined) return 'Pas de position établie';
    const dim = DIMENSIONS[dimKey];
    const p = (score + 2) / 4 * 100;
    if (p < 43) return 'Plutôt ' + lower(dim.labelLeft);
    if (p > 57) return 'Plutôt ' + lower(dim.labelRight);
    return 'Position équilibrée entre les deux';
  }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  /* Anneau visuel de correspondance : le pourcentage affiché est TOUJOURS
     la même valeur qui sert à classer les partis (aucun écart entre ce qui
     est montré et ce qui est trié), et n'est jamais affiché seul dans
     l'application — toujours à côté d'une phrase d'explication et d'un
     accès au détail dimension par dimension. */
  // Légende explicative sous chaque pourcentage (jamais un chiffre nu).
  function captionFor(m) {
    if (m.partyKnownCount < 3) return 'Parti centré sur un seul sujet : comparaison trop partielle pour un pourcentage';
    if (m.comparableCount < 3) return 'Pas encore assez de réponses de votre part pour comparer';
    return 'Rapprochement sur ' + m.rapprochements + ' des ' + m.comparableCount + ' thèmes comparables';
  }

  function matchRingHTML(percent, size) {
    size = size || 64;
    const stroke = size < 56 ? 5 : 6;
    const r = size / 2 - stroke;
    const c = 2 * Math.PI * r;
    const mid = size / 2;
    if (percent === null || percent === undefined) {
      return `<div class="match-ring match-ring-empty" style="--size:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle class="ring-bg" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}"/></svg><span class="ring-label ring-label-empty">?</span></div>`;
    }
    const offset = (c * (1 - percent / 100)).toFixed(2);
    return `<div class="match-ring" style="--size:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle class="ring-bg" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}"/><circle class="ring-fill" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}" style="stroke-dasharray:${c.toFixed(2)};stroke-dashoffset:${offset}"/></svg><span class="ring-label">${percent}%</span></div>`;
  }

  /* ================================================================
     NAVIGATION ENTRE ÉCRANS
     ================================================================ */
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
    document.querySelectorAll('.navlink[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (name === 'results') renderResults();
    if (name === 'parties') renderParties();
    if (name === 'compare') renderCompare();
    if (name === 'method') renderMethod();
    if (name === 'checkpoint') renderCheckpoint();
  }

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      if ((target === 'results' || target === 'parties') && !state.completed) return;
      showScreen(target);
    });
  });

  /* ================================================================
     ACCUEIL
     ================================================================ */
  function renderCompassTeaser() {
    const g = document.getElementById('compassSpokes');
    if (!g) return;
    const lengths = [96, 70, 88, 55, 78, 62]; // purement illustratif, pas de données réelles avant le test
    const cx = 130, cy = 130;
    let html = '';
    lengths.forEach((len, i) => {
      const angle = (Math.PI * 2 * i) / lengths.length - Math.PI / 2;
      const x2 = cx + Math.cos(angle) * len, y2 = cy + Math.sin(angle) * len;
      const xf = cx + Math.cos(angle) * 110, yf = cy + Math.sin(angle) * 110;
      html += `<line class="spoke-track" x1="${cx}" y1="${cy}" x2="${xf}" y2="${yf}"/>`;
      html += `<line class="spoke-fill" x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"/>`;
    });
    g.innerHTML = html;
  }

  function refreshResumeBanner() {
    const stored = loadState();
    const banner = document.getElementById('resumeBanner');
    if (hasProgress(stored) && !stored.completed) banner.hidden = false;
    else banner.hidden = true;
  }

  document.getElementById('btnStart').addEventListener('click', () => {
    state = freshState();
    saveState();
    beginQuiz();
  });
  document.getElementById('btnResume').addEventListener('click', () => {
    const stored = loadState();
    if (stored) { state = stored; beginQuiz(); }
  });
  document.getElementById('btnRestart').addEventListener('click', () => {
    clearState();
    state = freshState();
    refreshResumeBanner();
  });

  function beginQuiz() {
    document.getElementById('navResults').disabled = !state.completed;
    document.getElementById('navParties').disabled = !state.completed;
    if (state.phase === 'checkpoint') { showScreen('checkpoint'); return; }
    showScreen('quiz');
    renderQuestion();
  }

  /* ================================================================
     QUIZ
     ================================================================ */
  function renderQuestion() {
    const q = currentQuestion();
    if (!q) return; // sécurité : ne devrait jamais arriver
    const list = currentList();

    const chipWrap = document.getElementById('phaseChipWrap');
    chipWrap.innerHTML = state.phase === 'diagnostic'
      ? '<span class="phase-chip">Questions de précision — sur les sujets où votre position reste à préciser</span>'
      : '';

    const doneBefore = state.phase === 'main' ? state.index : QUESTIONS.length + state.index;
    const total = QUESTIONS.length + (state.diagnosticQuestions.length || 8);
    document.getElementById('progressFill').style.width = Math.round((doneBefore / total) * 100) + '%';
    document.getElementById('progressLabel').textContent = (doneBefore + 1) + ' / ' + total;

    document.getElementById('qTopic').textContent = q.topic;
    document.getElementById('qDim').textContent = DIMENSIONS[q.dim].name;
    document.getElementById('qWhy').textContent = q.why || '';
    document.getElementById('qWhy').classList.remove('show');
    document.getElementById('propA').textContent = q.a;
    document.getElementById('propB').textContent = q.b;

    const clA = document.getElementById('clarifyA'), clB = document.getElementById('clarifyB');
    if (q.clarifyA) { clA.textContent = q.clarifyA; clA.hidden = false; } else clA.hidden = true;
    if (q.clarifyB) { clB.textContent = q.clarifyB; clB.hidden = false; } else clB.hidden = true;
    const plainBox = document.getElementById('plainBox');
    if (q.plain) { document.getElementById('plainText').textContent = q.plain; plainBox.hidden = false; } else plainBox.hidden = true;

    const existing = state.answers[q.id];
    const scaleWrap = document.getElementById('scaleButtons');
    scaleWrap.innerHTML = '';
    SCALE_LABELS.forEach((label, j) => {
      const v = j - 2;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'scale-btn' + (existing === v ? ' sel' : '');
      b.textContent = label;
      b.setAttribute('aria-pressed', existing === v ? 'true' : 'false');
      b.addEventListener('click', () => { state.answers[q.id] = v; saveState(); renderQuestion(); });
      scaleWrap.appendChild(b);
    });
    const dkBtn = document.getElementById('dkBtn');
    dkBtn.classList.toggle('sel', existing === 'dk');
    dkBtn.onclick = () => { state.answers[q.id] = 'dk'; saveState(); renderQuestion(); };

    const impWrap = document.getElementById('impChoices');
    impWrap.innerHTML = '';
    const existingImp = state.importances[q.id];
    IMP_LABELS.forEach((label, lvl) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'imp-btn' + (existingImp === lvl ? ' sel' : '');
      b.textContent = label;
      b.setAttribute('aria-pressed', existingImp === lvl ? 'true' : 'false');
      b.addEventListener('click', () => { state.importances[q.id] = lvl; saveState(); renderQuestion(); });
      impWrap.appendChild(b);
    });

    const canAdvance = (typeof existing === 'number' || existing === 'dk') && typeof existingImp === 'number';
    document.getElementById('btnNext').disabled = !canAdvance;
    document.getElementById('btnNext').textContent = (state.phase === 'diagnostic' && state.index === list.length - 1) ? 'Voir mon profil' : 'Suivant';
    document.getElementById('btnBack').disabled = (state.phase === 'main' && state.index === 0);
  }

  document.getElementById('qWhyToggle').addEventListener('click', () => {
    document.getElementById('qWhy').classList.toggle('show');
  });

  document.getElementById('btnBack').addEventListener('click', () => {
    if (state.index > 0) { state.index--; }
    else if (state.phase === 'diagnostic') { state.phase = 'checkpoint'; saveState(); showScreen('checkpoint'); return; }
    saveState();
    renderQuestion();
  });

  document.getElementById('btnNext').addEventListener('click', () => {
    const list = currentList();
    if (state.index < list.length - 1) {
      state.index++;
      saveState();
      renderQuestion();
      return;
    }
    if (state.phase === 'main') {
      state.phase = 'checkpoint';
      saveState();
      showScreen('checkpoint');
      return;
    }
    // fin de la phase diagnostique : le test est terminé
    state.completed = true;
    saveState();
    document.getElementById('navResults').disabled = false;
    document.getElementById('navParties').disabled = false;
    computeResults();
    showScreen('results');
  });

  /* ================================================================
     PALIER INTERMÉDIAIRE — après les 21 questions principales
     ================================================================ */
  function beginDiagnosticPhase() {
    const dimResults = Scoring.computeDimensionResults(state.answers, state.importances, QUESTIONS);
    const topPartyMatches = Scoring.computePartyMatches(dimResults, PARTIES);
    state.diagnosticQuestions = Scoring.selectDiagnosticQuestions({
      dimResults, bank: BANK, askedIds: QUESTIONS.map(q => q.id), count: 8, topPartyMatches
    });
    state.phase = 'diagnostic';
    state.index = 0;
    saveState();
    showScreen('quiz');
    renderQuestion();
  }

  function renderCheckpoint() {
    const dimResults = Scoring.computeDimensionResults(state.answers, state.importances, QUESTIONS);
    const overall = Scoring.computeOverall(dimResults);
    const root = document.getElementById('checkpointContent');
    let html = `<p class="eyebrow-note">Étape 1 sur 2 — terminée</p>
      <h1>Premier aperçu</h1>
      <p class="lede">Voici une lecture encore <strong>provisoire</strong> de votre profil, fondée sur vos 21 premières réponses.</p>`;

    if (overall.determined) {
      html += `<div class="spectrum">
        <p class="confidence-note" style="margin-bottom:.3rem">Tendance provisoire : <strong>${overall.label}</strong></p>
        <div class="spectrum-bar"><div class="spectrum-dot" style="left:${(overall.score + 1) / 2 * 100}%"></div></div>
        <div class="spectrum-labels"><span>Gauche</span><span>Droite</span></div>
      </div>`;
    } else {
      html += `<div class="undetermined-box"><p style="margin-bottom:0">Vos réponses jusqu’ici ne suffisent pas encore à dégager une tendance fiable — les questions suivantes devraient aider à clarifier cela.</p></div>`;
    }

    // Volontairement AUCUN nom de parti ni pourcentage avant les questions de
    // précision : les afficher permettrait d'orienter ses réponses vers un
    // résultat espéré, ce qui fausserait précisément la mesure qu'on veut
    // affiner. On dit seulement, sans les nommer, si plusieurs partis sont
    // proches, et que les questions cibleront ce qui les distingue.
    let nextExplainer = 'L’application a repéré les thèmes où votre position reste encore incertaine et va vous poser 8 questions ciblées sur ces points précis.';
    if (overall.determined) {
      if (Scoring.findNearTie(Scoring.computePartyMatches(dimResults, PARTIES))) {
        nextExplainer = 'Pour l’instant, <strong>plusieurs partis se rapprochent de vous à peu près autant</strong>. Les 8 questions suivantes portent surtout sur les sujets où ces partis diffèrent réellement, pour voir de qui vous êtes le plus proche. Leurs noms restent volontairement cachés jusqu’à la fin, pour ne pas influencer vos réponses.';
      }
    }

    html += `<div class="checkpoint-next">
      <h2>8 questions pour affiner — puis vos partis</h2>
      <p class="lede">${nextExplainer}</p>
      <div class="btn-row">
        <button class="btn btn-brass" id="btnContinueDiag">Continuer (8 questions)</button>
        <button class="btn btn-ghost" id="btnBackToMain">Revoir mes réponses précédentes</button>
      </div>
      <button class="btn-link-skip" id="btnSkipDiag" type="button">Voir un résultat préliminaire sans ces questions</button>
    </div>`;
    root.innerHTML = html;

    document.getElementById('btnContinueDiag').addEventListener('click', beginDiagnosticPhase);
    document.getElementById('btnBackToMain').addEventListener('click', () => {
      state.phase = 'main'; state.index = QUESTIONS.length - 1; saveState(); showScreen('quiz'); renderQuestion();
    });
    document.getElementById('btnSkipDiag').addEventListener('click', () => {
      state.diagnosticQuestions = [];
      state.completed = true;
      saveState();
      document.getElementById('navResults').disabled = false;
      document.getElementById('navParties').disabled = false;
      computeResults();
      showScreen('results');
    });
  }

  /* ================================================================
     RÉSULTATS
     ================================================================ */

  /* ================================================================
     DÉPARTAGE — quand les deux premiers partis sont à quasi-égalité
     ================================================================ */
  function importanceLabel(imp) { return imp >= 0.75 ? 'essentiel' : imp >= 0.35 ? 'important' : 'peu important'; }

  function departagerHTML(pair, dimResults) {
    const a = pair[0], b = pair[1];
    const rows = [];
    DIM_KEYS.forEach(k => {
      const pa = a.perDim.find(p => p.dim === k), pb = b.perDim.find(p => p.dim === k);
      if (!pa.available || !pb.available) return;
      const gapBetweenParties = Math.abs(pa.partyScore - pb.partyScore);
      rows.push({ k, pa, pb, gapBetweenParties });
    });
    const distinguishing = rows.filter(r => r.gapBetweenParties >= 0.5).sort((x, y) => y.gapBetweenParties - x.gapBetweenParties).slice(0, 3);

    let html = `<div class="depart-box">
      <h2>Départager vos deux partis les plus proches</h2>
      <p class="lede"><strong>${a.party.name}</strong> (${a.matchPercent} %) et <strong>${b.party.name}</strong> (${b.matchPercent} %) sont à quasi-égalité pour vous : l’écart est plus petit que la marge d’incertitude de ces estimations, il ne suffit donc pas pour trancher. Voici ce qui les distingue réellement, sujet par sujet.</p>`;

    if (!distinguishing.length) {
      html += `<p class="confidence-note">Sur les 6 thèmes mesurés ici, ces deux partis ont des positions quasi identiques : seule la lecture de leurs programmes détaillés permet de les distinguer.</p>`;
    } else {
      html += '<div class="depart-list">';
      distinguishing.forEach(r => {
        const dim = DIMENSIONS[r.k];
        const dA = r.pa.distance, dB = r.pb.distance;
        let tag;
        if (Math.abs(dA - dB) < 0.25) tag = 'À égale distance de vous';
        else tag = 'Plus proche de vous : ' + (dA < dB ? a.party.short : b.party.short);
        html += `<div class="depart-item">
          <div class="depart-item-head"><h3>${dim.name}</h3><span class="dc-tag ${Math.abs(dA - dB) < 0.25 ? 'assez-proche' : 'proche'}">${tag}</span></div>
          <p class="dc-detail">Vous : ${positionLabel(r.k, r.pa.userScore)}<br>${a.party.short} : ${positionLabel(r.k, r.pa.partyScore)}<br>${b.party.short} : ${positionLabel(r.k, r.pb.partyScore)}</p>
          <p class="depart-imp">Ce sujet compte pour vous : <strong>${importanceLabel(dimResults[r.k].importance)}</strong></p>
        </div>`;
      });
      html += '</div><p class="confidence-note">Si l’un de ces sujets compte particulièrement pour vous, c’est lui qui devrait faire pencher votre choix. Sur les autres sujets, les deux partis sont à peu près aussi proches de vous l’un que l’autre.</p>';
    }
    html += `<div class="btn-row" style="margin-top:1rem">
        <button class="btn btn-brass btn-sm" id="btnCompareTie" data-a="${a.party.id}" data-b="${b.party.id}">Comparer côte à côte</button>
      </div></div>`;
    return html;
  }

  function renderResults() {
    if (!lastDimResults) computeResults();
    const { dimResults, overall } = { dimResults: lastDimResults, overall: lastOverall };
    const root = document.getElementById('resultsContent');
    let html = '';

    if (!overall.determined) {
      html += `<div class="undetermined-box"><h2 style="margin-top:0">Profil non déterminé</h2>
        <p style="margin-bottom:0">Trop peu de réponses exploitables (${overall.totalAnswered} sur ${overall.totalQuestions}, le reste en « je ne sais pas ») pour dégager une orientation fiable. C’est un résultat honnête, pas un bug : plutôt que d’inventer une tendance à partir de réponses absentes, l’application préfère vous le dire clairement.</p></div>`;
    } else {
      html += `<div class="result-headline">
        <p class="eyebrow-note">Votre orientation générale</p>
        <h1 class="label">${overall.label}</h1>
        <p class="confidence-note">Confiance globale dans cette lecture : ${Math.round(overall.overallConfidence * 100)}% · fondée sur ${overall.totalAnswered} réponses exploitables sur ${overall.totalQuestions}.</p>
      </div>`;
      if (overall.composite) {
        html += `<div class="composite-box"><strong>Profil composite.</strong> Vos thèmes ne pointent pas tous dans la même direction (par exemple à gauche sur certains sujets, à droite sur d’autres). L’étiquette ci-dessus résume une moyenne : le détail par thème ci-dessous est plus informatif que ce seul résultat.</div>`;
      }
      html += `<div class="spectrum">
        <div class="spectrum-bar"><div class="spectrum-dot" style="left:${(overall.score + 1) / 2 * 100}%"></div></div>
        <div class="spectrum-labels"><span>Gauche</span><span>Droite</span></div>
      </div>`;
    }

    // ---- Vos meilleures correspondances (partis) ----
    // N'a de sens que si le profil global est déterminé : sur un profil
    // "non déterminé", la plupart des partis afficheraient de toute façon
    // un anneau vide (pas assez de dimensions comparables) — inutile et
    // potentiellement trompeur à montrer en avant de page dans ce cas.
    if (overall.determined) {
      const matches = Scoring.computePartyMatches(dimResults, PARTIES);
      const top = matches.slice(0, 3);
      const tiePair = Scoring.findNearTie(matches);
      html += `<div class="best-matches">
        <h2>Vos meilleures correspondances</h2>
        <p class="lede">Le pourcentage compare, thème par thème, votre position à celle de chaque parti, en donnant plus de poids à ce qui compte le plus pour vous — jamais un thème auquel vous n’avez pas répondu. Le détail complet, avec les points communs et les différences, est à un clic.</p>
        <div class="match-grid">`;
      top.forEach((m, i) => {
        html += `<button class="match-card${i === 0 ? ' top' : ''}" style="--card-accent:${m.party.color}" data-party="${m.party.id}">
          ${i === 0 ? '<span class="top-badge">' + (tiePair ? 'En tête, de très peu' : 'Le plus proche de vous') + '</span>' : (i === 1 && tiePair ? '<span class="top-badge">Presque à égalité</span>' : '')}
          ${matchRingHTML(m.matchPercent, i === 0 ? 84 : 64)}
          <div class="match-card-name"><h3>${m.party.name}</h3><span class="party-family">${m.party.family}</span></div>
        </button>`;
      });
      html += `</div><div class="btn-row" style="margin-top:1rem"><button class="btn btn-ghost btn-sm" id="btnSeeAllParties">Voir les 16 formations et leur détail</button></div></div>`;
      if (tiePair) html += departagerHTML(tiePair, dimResults);
    }

    html += '<div class="dim-list">';
    DIM_KEYS.forEach(k => {
      const d = dimResults[k];
      const dim = DIMENSIONS[k];
      const hasScore = d.n > 0;
      const p = hasScore ? (d.score + 2) / 4 * 100 : 50;
      const confPct = Math.round(d.confidence * 100);
      const clarityText = d.n === 0 ? 'Aucune réponse exploitable' : d.confidence < 0.35 ? 'Profil encore nuancé' : d.confidence < 0.65 ? 'Profil assez clair' : 'Profil clair';
      html += `<div class="dim-row">
        <div class="dim-row-head"><h3>${dim.name}</h3><span class="dim-pos-label">${hasScore ? positionLabel(k, d.score) : 'Non renseigné'}</span></div>
        <p class="dim-plain">${dim.plain}</p>
        <div class="dim-bar-track"><div class="dim-bar-dot" style="left:${p}%; ${hasScore ? '' : 'opacity:.25'}"></div></div>
        <div class="dim-conf"><span class="conf-track"><span class="conf-fill" style="width:${confPct}%"></span></span> ${clarityText} · ${confPct}%</div>
        ${dim.note ? `<div class="dim-note">${dim.note}</div>` : ''}
      </div>`;
    });
    html += '</div>';

    const topics = Scoring.priorityTopics(state.importances, fullQuestionSet()).slice(0, 5);
    if (topics.length) {
      html += `<div class="priorities-box"><h2>Vos priorités</h2><p class="lede">Les sujets que vous avez déclarés les plus importants — indépendamment de votre position dessus.</p>
        <div class="chip-list">${topics.map(t => `<span class="chip">${t.topic}</span>`).join('')}</div></div>`;
    }

    html += `<div class="share-row">
      <button class="btn btn-brass" id="btnGoParties">Explorer les partis qui s’en rapprochent</button>
      <button class="btn btn-ghost" id="btnShare">Copier un résumé</button>
      <button class="btn btn-ghost" id="btnRedo">Refaire le test</button>
    </div>`;

    root.innerHTML = html;
    const goParties = document.getElementById('btnGoParties');
    if (goParties) goParties.addEventListener('click', () => showScreen('parties'));
    const seeAll = document.getElementById('btnSeeAllParties');
    if (seeAll) seeAll.addEventListener('click', () => showScreen('parties'));
    root.querySelectorAll('.match-card').forEach(card => {
      card.addEventListener('click', () => openPartyDrawer(card.dataset.party));
    });
    const cmpTie = document.getElementById('btnCompareTie');
    if (cmpTie) cmpTie.addEventListener('click', () => { compareSelection = [cmpTie.dataset.a, cmpTie.dataset.b]; showScreen('compare'); });
    const shareBtn = document.getElementById('btnShare');
    if (shareBtn) shareBtn.addEventListener('click', shareResults);
    const redoBtn = document.getElementById('btnRedo');
    if (redoBtn) redoBtn.addEventListener('click', () => {
      clearState(); state = freshState(); lastDimResults = null; lastOverall = null;
      document.getElementById('navResults').disabled = true;
      document.getElementById('navParties').disabled = true;
      showScreen('home'); refreshResumeBanner();
    });
  }

  function shareResults() {
    if (!lastOverall) return;
    const lines = ['Mon profil politique — Votez bien !', lastOverall.determined ? ('Orientation générale : ' + lastOverall.label) : 'Profil non déterminé'];
    DIM_KEYS.forEach(k => {
      const d = lastDimResults[k];
      lines.push(DIMENSIONS[k].name + ' : ' + (d.n > 0 ? positionLabel(k, d.score) : 'non renseigné'));
    });
    const text = lines.join('\n');
    if (navigator.share) {
      navigator.share({ title: 'Mon profil politique', text }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Résumé copié dans le presse-papiers')).catch(() => showToast('Impossible de copier automatiquement'));
    } else {
      showToast('Copie automatique indisponible sur ce navigateur');
    }
  }

  /* ================================================================
     PARTIS
     ================================================================ */
  function renderParties() {
    if (!lastDimResults) computeResults();
    const matches = Scoring.computePartyMatches(lastDimResults, PARTIES);

    const families = Array.from(new Set(PARTIES.map(p => p.family)));
    const filterWrap = document.getElementById('familyFilters');
    filterWrap.innerHTML = '<button class="filter-chip' + (familyFilter === null ? ' sel' : '') + '" data-fam="">Toutes les familles</button>' +
      families.map(f => `<button class="filter-chip${familyFilter === f ? ' sel' : ''}" data-fam="${f}">${f}</button>`).join('');
    filterWrap.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => { familyFilter = btn.dataset.fam || null; renderParties(); });
    });

    const grid = document.getElementById('partyGrid');
    const list = matches.filter(m => !familyFilter || m.party.family === familyFilter);
    grid.innerHTML = list.map(m => {
      const checked = compareSelection.includes(m.party.id) ? ' checked' : '';
      return `<button class="party-card" style="--card-accent:${m.party.color}" data-party="${m.party.id}">
        <div class="party-card-body">
          ${matchRingHTML(m.matchPercent, 56)}
          <div class="party-card-text">
            <h3>${m.party.name}</h3><div class="party-family">${m.party.family}</div>
            <div class="match-caption">${captionFor(m)}</div>
          </div>
        </div>
        <p class="party-status">${m.party.status}</p>
        <label class="compare-pick" onclick="event.stopPropagation()"><input type="checkbox" data-compare="${m.party.id}"${checked}> Ajouter au comparateur</label>
      </button>`;
    }).join('') || '<p>Aucun parti dans cette famille.</p>';

    grid.querySelectorAll('.party-card').forEach(card => {
      card.addEventListener('click', () => openPartyDrawer(card.dataset.party));
    });
    grid.querySelectorAll('[data-compare]').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.compare;
        if (cb.checked) {
          if (compareSelection.length >= 3) { cb.checked = false; showToast('3 partis maximum pour la comparaison'); return; }
          compareSelection.push(id);
        } else {
          compareSelection = compareSelection.filter(x => x !== id);
        }
      });
    });
  }

  function openPartyDrawer(partyId) {
    const party = PARTIES.find(p => p.id === partyId);
    if (!party || !lastDimResults) return;
    const match = Scoring.computePartyMatch(lastDimResults, party);
    lastFocusedEl = document.activeElement;

    let html = `<div class="drawer-top">
      ${matchRingHTML(match.matchPercent, 60)}
      <div><h2 style="margin-bottom:.2rem">${party.name}</h2><p class="party-family" style="margin:0">${party.family}</p></div>
      <button class="drawer-close" id="drawerCloseBtn" aria-label="Fermer">✕ Fermer</button></div>
      <p class="confidence-note" style="margin-top:.6rem">${match.matchPercent !== null ? ('Correspondance calculée sur ' + match.comparableCount + ' des 6 thèmes (ceux où vous avez répondu et où ce parti a une position établie), pondérée par l’importance que vous leur avez donnée.') : captionFor(match) + '.'}</p>
      <p style="margin-top:1rem">${party.status}</p>
      <p class="confidence-note">Positions estimées à partir des programmes publics, situation arrêtée en ${formatStatusDate(party.statusDate)}.</p>
      <div class="source-row">
        <a class="btn btn-ghost btn-sm" href="${party.site}" target="_blank" rel="noopener">Site officiel</a>
        <a class="btn btn-ghost btn-sm" href="${party.program}" target="_blank" rel="noopener">Programme</a>
      </div>
      <h3 style="margin-top:1.6rem">Thème par thème</h3>
      <div class="dim-compare">`;

    match.perDim.forEach(p => {
      const dim = DIMENSIONS[p.dim];
      const userLabel = p.userScore !== null ? positionLabel(p.dim, p.userScore) : 'Non renseigné par vous';
      const partyLabel = positionLabel(p.dim, p.partyScore);
      html += `<div class="dc-item">
        <div class="dc-head"><span>${dim.name}</span><span class="dc-tag ${p.category.key}">${p.category.label}</span></div>
        <div class="dc-detail">Vous : ${userLabel}<br>${party.short} : ${partyLabel}</div>
      </div>`;
    });
    html += '</div>';
    if (match.perDim.some(p => !p.available)) {
      html += '<p class="dim-note" style="margin-top:1rem">Les thèmes marqués « non renseigné » ou « non comparable » ne comptent ni comme rapprochement ni comme opposition : soit vous n’y avez pas assez répondu, soit ce parti n’y a pas de position établie.</p>';
    }

    const drawer = document.getElementById('partyDrawer');
    drawer.innerHTML = html;
    drawer.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    document.getElementById('drawerBackdrop').classList.add('show');
    document.getElementById('drawerCloseBtn').addEventListener('click', closePartyDrawer);
    document.getElementById('drawerCloseBtn').focus();
  }
  function closePartyDrawer() {
    document.getElementById('partyDrawer').classList.remove('show');
    document.getElementById('partyDrawer').setAttribute('aria-hidden', 'true');
    document.getElementById('drawerBackdrop').classList.remove('show');
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
  }
  document.getElementById('drawerBackdrop').addEventListener('click', closePartyDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePartyDrawer(); });

  function formatStatusDate(ym) {
    if (!ym) return 'date inconnue';
    const [y, m] = ym.split('-');
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return mois[parseInt(m, 10) - 1] + ' ' + y;
  }

  /* ================================================================
     COMPARER
     ================================================================ */
  function renderCompare() {
    const root = document.getElementById('compareContent');
    if (compareSelection.length === 0) {
      root.innerHTML = '<p class="lede">Aucun parti sélectionné pour l’instant. Depuis l’écran « Les partis », cochez « Ajouter au comparateur » sur les formations qui vous intéressent.</p><div class="btn-row"><button class="btn btn-primary" id="btnGoPartiesFromCompare">Voir les partis</button></div>';
      const b = document.getElementById('btnGoPartiesFromCompare');
      if (b) b.addEventListener('click', () => showScreen('parties'));
      return;
    }
    if (!lastDimResults) computeResults();
    const parties = compareSelection.map(id => PARTIES.find(p => p.id === id)).filter(Boolean);
    let html = '<div class="compare-table-wrap"><table class="compare"><thead><tr><th>Thème</th><th>Vous</th>' +
      parties.map(p => `<th>${p.short}</th>`).join('') + '</tr></thead><tbody>';
    DIM_KEYS.forEach(k => {
      const d = lastDimResults[k];
      html += `<tr><td>${DIMENSIONS[k].name}</td><td>${d.n > 0 ? positionLabel(k, d.score) : 'Non renseigné'}</td>`;
      parties.forEach(p => { html += `<td>${positionLabel(k, p.positions[k])}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="btn-row" style="margin-top:1.2rem"><button class="btn btn-ghost" id="btnClearCompare">Vider la comparaison</button></div>';
    root.innerHTML = html;
    document.getElementById('btnClearCompare').addEventListener('click', () => { compareSelection = []; renderCompare(); });
  }

  /* ================================================================
     MÉTHODE
     ================================================================ */
  function renderMethod() {
    const ul = document.getElementById('methodDims');
    if (ul.dataset.filled) return;
    ul.innerHTML = DIM_KEYS.map(k => {
      const d = DIMENSIONS[k];
      return `<li><strong>${d.name}</strong> — de « ${d.labelLeft} » (score négatif) à « ${d.labelRight} » (score positif)</li>`;
    }).join('');
    ul.dataset.filled = '1';
  }

  /* ================================================================
     TOAST
     ================================================================ */
  let toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    renderCompassTeaser();
    refreshResumeBanner();
    const stored = loadState();
    if (stored && stored.completed) {
      state = stored;
      document.getElementById('navResults').disabled = false;
      document.getElementById('navParties').disabled = false;
      computeResults();
    }
    showScreen('home');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => { /* PWA hors-ligne indisponible, l’app reste utilisable */ });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // exposé pour les tests d'intégration (jsdom) uniquement — n'affecte pas
  // le fonctionnement normal dans le navigateur.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { _internalsForTests: () => ({ state, computeResults, freshState }) };
  }
})();
