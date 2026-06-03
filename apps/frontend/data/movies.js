/* ───────────────────────── CineLog — data + rating engine ───────────────────────── */

// 9 weighted rating categories (weights sum to 100)
window.CL_CATEGORIES = [
  { key: 'story',        label: 'Story / Screenplay',       short: 'Story',        weight: 18, desc: 'Plot, structure & dialogue' },
  { key: 'direction',    label: 'Direction',                 short: 'Direction',    weight: 13, desc: 'Vision and control of craft' },
  { key: 'performances', label: 'Performances / Characters', short: 'Performances', weight: 12, desc: 'Acting, presence & arcs' },
  { key: 'pacing',       label: 'Pacing / Editing',          short: 'Pacing',       weight: 10, desc: 'Rhythm and momentum' },
  { key: 'visuals',      label: 'Visuals / Art Direction',   short: 'Visuals',      weight: 10, desc: 'Cinematography & design' },
  { key: 'music',        label: 'Music / Sound',             short: 'Sound',        weight: 7,  desc: 'Score and soundscape' },
  { key: 'themes',       label: 'Themes / Depth',            short: 'Themes',       weight: 10, desc: 'Meaning and resonance' },
  { key: 'originality',  label: 'Originality / Concept',     short: 'Originality',  weight: 8,  desc: 'Freshness of the idea' },
  { key: 'impact',       label: 'Personal Impact / Joy',     short: 'Impact',       weight: 12, desc: 'How deeply it landed' },
];

// ranking modes — each maps to a category key (or a synthetic score)
window.CL_RANKINGS = [
  { id: 'personal',     label: 'Personal Favorites', tag: 'What I love most',          source: 'personal' },
  { id: 'technical',    label: 'Technical Best',      tag: 'Weighted craft average',    source: 'technical' },
  { id: 'objective',    label: 'Objective Best',      tag: 'Detached assessment',       source: 'objective' },
  { id: 'story',        label: 'Best Story',          tag: 'Screenplay & structure',    source: 'story' },
  { id: 'direction',    label: 'Best Direction',      tag: 'Authorship & control',      source: 'direction' },
  { id: 'performances', label: 'Best Performances',   tag: 'Acting & characters',       source: 'performances' },
  { id: 'pacing',       label: 'Best Pacing',         tag: 'Rhythm & editing',          source: 'pacing' },
  { id: 'visuals',      label: 'Best Visuals',        tag: 'Image & art direction',     source: 'visuals' },
  { id: 'music',        label: 'Best Sound',          tag: 'Music & soundscape',        source: 'music' },
  { id: 'themes',       label: 'Deepest',             tag: 'Themes & resonance',        source: 'themes' },
  { id: 'originality',  label: 'Most Original',       tag: 'Concept & freshness',       source: 'originality' },
  { id: 'impact',       label: 'Highest Impact',      tag: 'Personal resonance',        source: 'impact' },
];

// poster palettes — toned gradients standing in for real art
const P = {
  prestige:  { from: '#1c2b30', to: '#0a0f12', accent: '#d9b27a', ink: '#ece4d4' },
  br2049:    { from: '#3a1c10', to: '#0c0a12', accent: '#e8772e', ink: '#f4d8b0' },
  batman:    { from: '#2a0f10', to: '#0a0708', accent: '#b8493f', ink: '#e9c7b0' },
  parasite:  { from: '#1d241b', to: '#0a0c0a', accent: '#9aa676', ink: '#e6e8d8' },
  interstel: { from: '#241d12', to: '#08090c', accent: '#caa05f', ink: '#ece0c4' },
  whiplash:  { from: '#301808', to: '#0c0805', accent: '#e8b048', ink: '#f3dca8' },
  arrival:   { from: '#15201f', to: '#080c0d', accent: '#7c9a92', ink: '#dfe7e3' },
  social:    { from: '#0e1a26', to: '#070a0e', accent: '#5b86a8', ink: '#d6e2ec' },
  spiderv:   { from: '#2a0d34', to: '#0c0716', accent: '#e0407f', ink: '#f2cfe2' },
  dune:      { from: '#3a2812', to: '#0d0a07', accent: '#cf9b4f', ink: '#f0dcb4' },
};

function makeWatch(date, place, type, scoresOrNote, note) {
  if (typeof scoresOrNote === 'string') return { date, place, type, scored: false, note: scoresOrNote };
  return { date, place, type, scored: true, note: note || '' };
}

// scores: [story, direction, performances, pacing, visuals, music, themes, originality, impact]
window.CL_MOVIES = [
  {
    id: 'the-prestige', title: 'The Prestige', year: 2006, director: 'Christopher Nolan',
    genres: ['Drama', 'Mystery', 'Sci-Fi'], runtime: 130, poster: P.prestige,
    scores: { story: 5, direction: 4.5, performances: 4.5, pacing: 4.5, visuals: 4.5, music: 4, themes: 4.5, originality: 4.5, impact: 5 },
    personal: 5.0, objective: 4.58,
    review: 'A brilliant obsessive thriller that feels like a magic trick every time.',
    note: 'The third act still rearranges my brain. Borden / Angier — the cost of the trick.',
    watches: [
      { date: '2026-05-21', place: 'Home', type: 'Rewatch', scored: true, note: 'Caught the bird cage foreshadow on watch four.' },
      { date: '2023-11-02', place: 'Home', type: 'Rewatch', scored: true, note: 'Are you watching closely?' },
      { date: '2019-08-14', place: 'Cinema', type: 'First Watch', scored: true, note: 'Repertory screening. Floored.' },
    ],
  },
  {
    id: 'blade-runner-2049', title: 'Blade Runner 2049', year: 2017, director: 'Denis Villeneuve',
    genres: ['Sci-Fi', 'Drama', 'Mystery'], runtime: 164, poster: P.br2049,
    scores: { story: 4, direction: 5, performances: 4, pacing: 3.5, visuals: 5, music: 5, themes: 4.5, originality: 4, impact: 4.5 },
    personal: 4.5, objective: 4.42,
    review: 'A vast, aching tone poem — the most beautiful film about being no one.',
    note: 'Deakins paints with fog and sodium light. The Vegas sequence is a cathedral.',
    watches: [
      { date: '2026-04-30', place: 'Home', type: 'Rewatch', scored: true, note: 'IMAX restoration at home, lights off.' },
      { date: '2017-10-07', place: 'Cinema', type: 'First Watch', scored: true, note: 'Opening night. Left in silence.' },
    ],
  },
  {
    id: 'the-batman', title: 'The Batman', year: 2022, director: 'Matt Reeves',
    genres: ['Crime', 'Mystery', 'Action'], runtime: 176, poster: P.batman,
    scores: { story: 4, direction: 4.5, performances: 4, pacing: 3.5, visuals: 4.5, music: 4.5, themes: 4, originality: 3.5, impact: 4 },
    personal: 4.0, objective: 4.05,
    review: 'Noir as a downpour — Gotham as a crime scene that never stops bleeding.',
    note: 'The Nirvana needle-drop and that red-flare freeway chase. Grime over gloss.',
    watches: [
      { date: '2026-03-12', place: 'Home', type: 'Rewatch', scored: true, note: '' },
      { date: '2022-03-05', place: 'Cinema', type: 'First Watch', scored: true, note: 'Dolby. The Batman walk.' },
    ],
  },
  {
    id: 'parasite', title: 'Parasite', year: 2019, director: 'Bong Joon-ho',
    genres: ['Thriller', 'Drama', 'Comedy'], runtime: 132, poster: P.parasite,
    scores: { story: 5, direction: 5, performances: 4.5, pacing: 4.5, visuals: 4.5, music: 4, themes: 5, originality: 4.5, impact: 4.5 },
    personal: 4.5, objective: 4.72,
    review: 'A staircase of a film — every step down is funnier and more devastating.',
    note: 'The flood sequence. Architecture as class. Nothing wasted.',
    watches: [
      { date: '2026-02-08', place: 'Home', type: 'Rewatch', scored: true, note: 'Watched the black & white cut.' },
      { date: '2019-11-15', place: 'Cinema', type: 'First Watch', scored: true, note: '' },
    ],
  },
  {
    id: 'interstellar', title: 'Interstellar', year: 2014, director: 'Christopher Nolan',
    genres: ['Sci-Fi', 'Adventure', 'Drama'], runtime: 169, poster: P.interstel,
    scores: { story: 4, direction: 4.5, performances: 4.5, pacing: 3.5, visuals: 5, music: 5, themes: 4.5, originality: 4, impact: 5 },
    personal: 5.0, objective: 4.28,
    review: 'Love across the event horizon. Hans Zimmer\u2019s organ still wrecks me.',
    note: 'Docking scene. "Do not go gentle." The bookshelf. I forgive the exposition.',
    watches: [
      { date: '2026-01-19', place: 'Cinema', type: 'Rewatch', scored: true, note: '70mm re-release. Worth every minute.' },
      { date: '2014-11-09', place: 'Cinema', type: 'First Watch', scored: true, note: '' },
    ],
  },
  {
    id: 'whiplash', title: 'Whiplash', year: 2014, director: 'Damien Chazelle',
    genres: ['Drama', 'Music'], runtime: 106, poster: P.whiplash,
    scores: { story: 4.5, direction: 4.5, performances: 5, pacing: 5, visuals: 4, music: 5, themes: 4, originality: 4, impact: 4.5 },
    personal: 4.5, objective: 4.4,
    review: 'Cut like a drum solo. The last nine minutes are the best in modern cinema.',
    note: 'Not my tempo. Editing as percussion. Simmons is a force of nature.',
    watches: [
      { date: '2025-12-02', place: 'Home', type: 'Rewatch', scored: true, note: 'Heart rate genuinely elevated.' },
      { date: '2015-01-22', place: 'Home', type: 'First Watch', scored: true, note: '' },
    ],
  },
  {
    id: 'arrival', title: 'Arrival', year: 2016, director: 'Denis Villeneuve',
    genres: ['Sci-Fi', 'Drama', 'Mystery'], runtime: 116, poster: P.arrival,
    scores: { story: 4.5, direction: 4.5, performances: 4.5, pacing: 4, visuals: 4.5, music: 4.5, themes: 5, originality: 5, impact: 4.5 },
    personal: 4.5, objective: 4.46,
    review: 'A film that rewrites its own grammar of time. Grief told non-linearly.',
    note: 'If you could see your whole life, would you change anything? Quietly shattering.',
    watches: [
      { date: '2025-10-28', place: 'Home', type: 'Rewatch', scored: true, note: '' },
      { date: '2016-11-11', place: 'Cinema', type: 'First Watch', scored: true, note: 'Did not expect to cry.' },
    ],
  },
  {
    id: 'the-social-network', title: 'The Social Network', year: 2010, director: 'David Fincher',
    genres: ['Drama', 'Biography'], runtime: 120, poster: P.social,
    scores: { story: 5, direction: 4.5, performances: 4.5, pacing: 5, visuals: 4, music: 4.5, themes: 4, originality: 4, impact: 4 },
    personal: 4.0, objective: 4.33,
    review: 'Sorkin\u2019s dialogue at sprint speed over Reznor\u2019s cold dread. Flawless.',
    note: 'The deposition framing. "You\u2019re not an asshole, Mark." The final refresh.',
    watches: [
      { date: '2025-09-14', place: 'Home', type: 'Rewatch', scored: true, note: '' },
      { date: '2010-10-15', place: 'Cinema', type: 'First Watch', scored: true, note: '' },
    ],
  },
  {
    id: 'into-the-spider-verse', title: 'Spider-Man: Into the Spider-Verse', year: 2018, director: 'Persichetti, Ramsey & Rothman',
    genres: ['Animation', 'Action', 'Adventure'], runtime: 117, poster: P.spiderv,
    scores: { story: 4.5, direction: 4.5, performances: 4, pacing: 4.5, visuals: 5, music: 4.5, themes: 4, originality: 5, impact: 4.5 },
    personal: 4.5, objective: 4.5,
    review: 'It reinvented what animation can look like. Every frame is a poster.',
    note: 'The leap of faith. Half-tone dots and chromatic aberration as emotion.',
    watches: [
      { date: '2025-08-03', place: 'Home', type: 'Rewatch', scored: true, note: 'Paused constantly to admire frames.' },
      { date: '2018-12-14', place: 'Cinema', type: 'First Watch', scored: true, note: '' },
    ],
  },
  {
    id: 'dune-part-two', title: 'Dune: Part Two', year: 2024, director: 'Denis Villeneuve',
    genres: ['Sci-Fi', 'Adventure', 'Drama'], runtime: 166, poster: P.dune,
    scores: { story: 4, direction: 5, performances: 4.5, pacing: 4, visuals: 5, music: 5, themes: 4, originality: 3.5, impact: 4.5 },
    personal: 4.5, objective: 4.4,
    review: 'Operatic scale with a black sun at its heart. The arena scene is monolithic.',
    note: 'Feyd-Rautha in monochrome. Sandworm riding. Villeneuve\u2019s desert is a deity.',
    watches: [
      { date: '2026-05-10', place: 'Cinema', type: 'First Watch', scored: true, note: 'IMAX 70mm. Felt it in my chest.' },
    ],
  },
];

/* ── rating engine ── */
window.CL = (function () {
  const cats = window.CL_CATEGORIES;

  function technical(scores) {
    let sum = 0, w = 0;
    for (const c of cats) { sum += (scores[c.key] || 0) * c.weight; w += c.weight; }
    return sum / w;
  }
  function roundHalf(v) { return Math.round(v * 2) / 2; }
  function visible(scores) { return roundHalf(technical(scores)); }

  // active rating = latest scored watch; here scores live on the movie for the mock
  function rankValue(movie, source) {
    if (source === 'personal') return movie.personal;
    if (source === 'technical') return technical(movie.scores);
    if (source === 'objective') return movie.objective;
    return movie.scores[source]; // a specific category
  }

  function fmt(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function fmt1(v) { return (Math.round(v * 10) / 10).toFixed(1); }

  return { technical, roundHalf, visible, rankValue, fmt, fmt1, cats };
})();
