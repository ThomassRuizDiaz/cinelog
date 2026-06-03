import type { MockMovie } from '../types/movie';

/* Poster colour palettes — toned gradients used when posterUrl is null */
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
} as const;

export const MOCK_MOVIES: MockMovie[] = [
  {
    id: 'the-prestige', title: 'The Prestige', year: 2006, director: 'Christopher Nolan',
    genres: ['Drama', 'Mystery', 'Sci-Fi'], runtime: 130, poster: P.prestige, posterUrl: null, rated: true,
    scores: { story: 5, direction: 4.5, performances: 4.5, pacing: 4.5, visuals: 4.5, music: 4, themes: 4.5, originality: 4.5, impact: 5 },
    personal: 5.0, objective: 4.58,
    review: 'A brilliant obsessive thriller that feels like a magic trick every time.',
    note: 'The third act still rearranges my brain. Borden / Angier — the cost of the trick.',
    watches: [
      { watchedAt: '2026-05-21', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true,  note: 'Caught the bird cage foreshadow on watch four.' },
      { watchedAt: '2023-11-02', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true,  note: 'Are you watching closely?' },
      { watchedAt: '2019-08-14', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true,  note: 'Repertory screening. Floored.' },
    ],
  },
  {
    id: 'blade-runner-2049', title: 'Blade Runner 2049', year: 2017, director: 'Denis Villeneuve',
    genres: ['Sci-Fi', 'Drama', 'Mystery'], runtime: 164, poster: P.br2049, posterUrl: null, rated: true,
    scores: { story: 4, direction: 5, performances: 4, pacing: 3.5, visuals: 5, music: 5, themes: 4.5, originality: 4, impact: 4.5 },
    personal: 4.5, objective: 4.42,
    review: 'A vast, aching tone poem — the most beautiful film about being no one.',
    note: 'Deakins paints with fog and sodium light. The Vegas sequence is a cathedral.',
    watches: [
      { watchedAt: '2026-04-30', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true, note: 'IMAX restoration at home, lights off.' },
      { watchedAt: '2017-10-07', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: 'Opening night. Left in silence.' },
    ],
  },
  {
    id: 'the-batman', title: 'The Batman', year: 2022, director: 'Matt Reeves',
    genres: ['Crime', 'Mystery', 'Action'], runtime: 176, poster: P.batman, posterUrl: null, rated: true,
    scores: { story: 4, direction: 4.5, performances: 4, pacing: 3.5, visuals: 4.5, music: 4.5, themes: 4, originality: 3.5, impact: 4 },
    personal: 4.0, objective: 4.05,
    review: 'Noir as a downpour — Gotham as a crime scene that never stops bleeding.',
    note: 'The Nirvana needle-drop and that red-flare freeway chase. Grime over gloss.',
    watches: [
      { watchedAt: '2026-03-12', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true, note: '' },
      { watchedAt: '2022-03-05', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: 'Dolby. The Batman walk.' },
    ],
  },
  {
    id: 'parasite', title: 'Parasite', year: 2019, director: 'Bong Joon-ho',
    genres: ['Thriller', 'Drama', 'Comedy'], runtime: 132, poster: P.parasite, posterUrl: null, rated: true,
    scores: { story: 5, direction: 5, performances: 4.5, pacing: 4.5, visuals: 4.5, music: 4, themes: 5, originality: 4.5, impact: 4.5 },
    personal: 4.5, objective: 4.72,
    review: 'A staircase of a film — every step down is funnier and more devastating.',
    note: 'The flood sequence. Architecture as class. Nothing wasted.',
    watches: [
      { watchedAt: '2026-02-08', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true, note: 'Watched the black & white cut.' },
      { watchedAt: '2019-11-15', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: '' },
    ],
  },
  {
    id: 'interstellar', title: 'Interstellar', year: 2014, director: 'Christopher Nolan',
    genres: ['Sci-Fi', 'Adventure', 'Drama'], runtime: 169, poster: P.interstel, posterUrl: null, rated: true,
    scores: { story: 4, direction: 4.5, performances: 4.5, pacing: 3.5, visuals: 5, music: 5, themes: 4.5, originality: 4, impact: 5 },
    personal: 5.0, objective: 4.28,
    review: 'Love across the event horizon. Hans Zimmer’s organ still wrecks me.',
    note: 'Docking scene. "Do not go gentle." The bookshelf. I forgive the exposition.',
    watches: [
      { watchedAt: '2026-01-19', watchType: 'REWATCH',     watchLocation: 'CINEMA', scored: true, note: '70mm re-release. Worth every minute.' },
      { watchedAt: '2014-11-09', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: '' },
    ],
  },
  {
    id: 'whiplash', title: 'Whiplash', year: 2014, director: 'Damien Chazelle',
    genres: ['Drama', 'Music'], runtime: 106, poster: P.whiplash, posterUrl: null, rated: true,
    scores: { story: 4.5, direction: 4.5, performances: 5, pacing: 5, visuals: 4, music: 5, themes: 4, originality: 4, impact: 4.5 },
    personal: 4.5, objective: 4.4,
    review: 'Cut like a drum solo. The last nine minutes are the best in modern cinema.',
    note: 'Not my tempo. Editing as percussion. Simmons is a force of nature.',
    watches: [
      { watchedAt: '2025-12-02', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true, note: 'Heart rate genuinely elevated.' },
      { watchedAt: '2015-01-22', watchType: 'FIRST_WATCH', watchLocation: 'HOME',   scored: true, note: '' },
    ],
  },
  {
    id: 'arrival', title: 'Arrival', year: 2016, director: 'Denis Villeneuve',
    genres: ['Sci-Fi', 'Drama', 'Mystery'], runtime: 116, poster: P.arrival, posterUrl: null, rated: true,
    scores: { story: 4.5, direction: 4.5, performances: 4.5, pacing: 4, visuals: 4.5, music: 4.5, themes: 5, originality: 5, impact: 4.5 },
    personal: 4.5, objective: 4.46,
    review: 'A film that rewrites its own grammar of time. Grief told non-linearly.',
    note: 'If you could see your whole life, would you change anything? Quietly shattering.',
    watches: [
      { watchedAt: '2025-10-28', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true, note: '' },
      { watchedAt: '2016-11-11', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: 'Did not expect to cry.' },
    ],
  },
  {
    id: 'the-social-network', title: 'The Social Network', year: 2010, director: 'David Fincher',
    genres: ['Drama', 'Biography'], runtime: 120, poster: P.social, posterUrl: null, rated: true,
    scores: { story: 5, direction: 4.5, performances: 4.5, pacing: 5, visuals: 4, music: 4.5, themes: 4, originality: 4, impact: 4 },
    personal: 4.0, objective: 4.33,
    review: 'Sorkin’s dialogue at sprint speed over Reznor’s cold dread. Flawless.',
    note: 'The deposition framing. "You’re not an asshole, Mark." The final refresh.',
    watches: [
      { watchedAt: '2025-09-14', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true, note: '' },
      { watchedAt: '2010-10-15', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: '' },
    ],
  },
  {
    id: 'into-the-spider-verse', title: 'Spider-Man: Into the Spider-Verse', year: 2018, director: 'Persichetti, Ramsey & Rothman',
    genres: ['Animation', 'Action', 'Adventure'], runtime: 117, poster: P.spiderv, posterUrl: null, rated: true,
    scores: { story: 4.5, direction: 4.5, performances: 4, pacing: 4.5, visuals: 5, music: 4.5, themes: 4, originality: 5, impact: 4.5 },
    personal: 4.5, objective: 4.5,
    review: 'It reinvented what animation can look like. Every frame is a poster.',
    note: 'The leap of faith. Half-tone dots and chromatic aberration as emotion.',
    watches: [
      { watchedAt: '2025-08-03', watchType: 'REWATCH',     watchLocation: 'HOME',   scored: true, note: 'Paused constantly to admire frames.' },
      { watchedAt: '2018-12-14', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: '' },
    ],
  },
  {
    id: 'dune-part-two', title: 'Dune: Part Two', year: 2024, director: 'Denis Villeneuve',
    genres: ['Sci-Fi', 'Adventure', 'Drama'], runtime: 166, poster: P.dune, posterUrl: null, rated: true,
    scores: { story: 4, direction: 5, performances: 4.5, pacing: 4, visuals: 5, music: 5, themes: 4, originality: 3.5, impact: 4.5 },
    personal: 4.5, objective: 4.4,
    review: 'Operatic scale with a black sun at its heart. The arena scene is monolithic.',
    note: 'Feyd-Rautha in monochrome. Sandworm riding. Villeneuve’s desert is a deity.',
    watches: [
      { watchedAt: '2026-05-10', watchType: 'FIRST_WATCH', watchLocation: 'CINEMA', scored: true, note: 'IMAX 70mm. Felt it in my chest.' },
    ],
  },
];
