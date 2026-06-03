import { useState, useEffect, useMemo } from 'react';
import {
  MoviePoster, ScoreBadge, Stars, GenreChips, ScoreConstellation,
  WatchTimeline, WatchMeta, MovieCard, HalfStepRatingControl, Icon,
} from '../components';
import type { MockMovie } from '../types/movie';
import type { RatingScores } from '../types/rating';
import { RANKING_MODES } from '../data/rankings';
import { CATEGORIES } from '../data/categories';
import { technical, roundHalf, fmt, fmt1, fmtDate } from '../lib/scoring';
import {
  getDashboard, getMovies, getRankings, getMovieDetail,
  RANKING_MODE_MAP, type DashboardResponse,
} from '../api/movies';
import { getRating, saveRating, buildSaveRatingRequest } from '../api/watchEntries';
import {
  adaptMovie, adaptMovieDetail, adaptRankingItem,
  adaptDashboardLatestWatch, adaptRatingScores,
} from '../lib/movieAdapter';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';

/* ── Desk Rating modal ── */
function DeskRating({ movie, watchEntryId, onClose, onSave }: {
  movie: MockMovie;
  watchEntryId?: number;
  onClose: () => void;
  onSave: () => void;
}) {
  const { signOut } = useAuth();
  const [scores, setScores] = useState<RatingScores>({ ...movie.scores });
  const [override, setOverride] = useState(Math.abs(movie.personal - roundHalf(technical(movie.scores))) > 0.01);
  const [personal, setPersonal] = useState(movie.personal);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const tech = technical(scores), vis = roundHalf(tech);
  const finalScore = override ? personal : vis;
  const bump = (d: number) => setPersonal(p => Math.max(0, Math.min(5, Math.round((p + d) * 2) / 2)));

  const doSave = async () => {
    if (saving) return;
    setSaveError(null);
    if (watchEntryId) {
      setSaving(true);
      try {
        await saveRating(watchEntryId, buildSaveRatingRequest(scores, {
          personalFinalScore: override ? personal : undefined,
        }));
        setSaving(false);
        onSave();
      } catch (err) {
        setSaving(false);
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        setSaveError(err instanceof ApiError ? err.message : 'Save failed. Try again.');
      }
    } else {
      onSave();
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', background: 'rgba(6,6,9,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 720, maxHeight: 740, display: 'flex', borderRadius: 24, overflow: 'hidden', background: 'var(--ink-850)', border: '1px solid var(--line-strong)', boxShadow: 'var(--shadow-pop)', animation: 'fadeUp 380ms var(--ease-out) both' }}>
        {/* left: live constellation */}
        <div style={{ width: 300, flexShrink: 0, padding: 26, background: 'linear-gradient(160deg, var(--ink-820), var(--ink-870))', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow">Rating · {movie.year}</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, lineHeight: 1 }}>{movie.title}</div>
          <div style={{ display: 'grid', placeItems: 'center', marginTop: 18 }}>
            <ScoreConstellation scores={scores} size={244} />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="display tnum" style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{fmt(tech)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>TECHNICAL</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stars value={vis} size={15} />
              <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{fmt1(vis)} visible</span>
            </div>
          </div>
        </div>
        {/* right: categories */}
        <div className="cl-scroll" style={{ position: 'relative', flex: 1, padding: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '11px 14px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'var(--text-faint)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 4px' }}>{c.weight}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{c.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <HalfStepRatingControl value={scores[c.key]} onChange={v => setScores(s => ({ ...s, [c.key]: v }))} size={22} gap={5} />
                  <span className="display tnum" style={{ fontSize: 17, fontWeight: 700, color: scores[c.key] > 0 ? 'var(--accent)' : 'var(--text-ghost)', width: 30, textAlign: 'right' }}>{fmt1(scores[c.key])}</span>
                </div>
              </div>
            ))}
          </div>
          {/* personal override */}
          <div style={{ marginTop: 12, padding: '13px 15px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Personal Final Score</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Override the math</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {override && (
                <>
                  <button className="pressable cl-tap" onClick={() => bump(-0.5)} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 18, display: 'grid', placeItems: 'center' }}>−</button>
                  <span className="display tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', width: 34, textAlign: 'center' }}>{fmt1(personal)}</span>
                  <button className="pressable cl-tap" onClick={() => bump(0.5)} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 18, display: 'grid', placeItems: 'center' }}>+</button>
                </>
              )}
              <button className="cl-tap" onClick={() => setOverride(o => !o)} style={{ border: 'none', background: 'none', padding: 0 }}>
                <span style={{ width: 44, height: 26, borderRadius: 20, background: override ? 'var(--accent)' : 'var(--ink-680)', display: 'block', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 3, left: override ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left var(--dur) var(--ease-spring)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
                </span>
              </button>
            </div>
          </div>
          {saveError && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 11, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070' }}>{saveError}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="pressable cl-tap" onClick={onClose} style={{ flex: '0 0 auto', padding: '13px 20px', borderRadius: 13, border: '1px solid var(--line-strong)', background: 'var(--ink-800)', color: 'var(--text-dim)', fontSize: 14, fontWeight: 500 }}>Cancel</button>
            <button className="pressable cl-tap" onClick={() => void doSave()} disabled={saving} style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', background: saving ? 'var(--ink-720)' : 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: saving ? 'var(--text-faint)' : '#1a1206', fontSize: 15, fontWeight: 700, boxShadow: saving ? 'none' : '0 10px 24px -10px var(--accent)', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : `Save Rating · ${fmt1(finalScore)}★`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Desk Detail drawer ── */
function DeskDetail({ movie: initialMovie, onClose, onRate }: {
  movie: MockMovie;
  onClose: () => void;
  onRate: (movie: MockMovie, watchEntryId?: number) => void;
}) {
  const { signOut } = useAuth();
  const [movie, setMovie] = useState(initialMovie);
  const [activeWatchEntryId, setActiveWatchEntryId] = useState<number | null>(null);

  useEffect(() => {
    const id = parseInt(initialMovie.id);
    if (isNaN(id)) return;
    getMovieDetail(id)
      .then(detail => {
        const adapted = adaptMovieDetail(detail);
        const activeEntry = detail.watchEntries.find(we => we.activeRating);
        setActiveWatchEntryId(activeEntry?.id ?? null);
        if (activeEntry?.id) {
          getRating(activeEntry.id)
            .then(rating => setMovie({ ...adapted, scores: adaptRatingScores(rating) }))
            .catch(err => {
              if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
              setMovie(adapted);
            });
        } else {
          setMovie(adapted);
        }
      })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) void signOut();
      });
  }, [initialMovie.id, signOut]);

  const tech = movie.technicalScore ?? technical(movie.scores);
  const latest = movie.watches[0];
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'flex-end', background: 'rgba(6,6,9,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} className="cl-scroll" style={{ position: 'relative', width: 480, height: '100%', background: 'var(--ink-870)', borderLeft: '1px solid var(--line-strong)', animation: 'deskDrawer 360ms var(--ease-out) both' }}>
        {/* backdrop */}
        <div style={{ position: 'relative', height: 260 }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.6)', filter: 'blur(36px)', opacity: 0.5 }}>
              <MoviePoster title={movie.title} year={movie.year} genres={movie.genres} director={movie.director} palette={movie.poster} posterUrl={movie.posterUrl} width={480} rounded={0} frame={false} flat />
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0.3), var(--ink-870))' }} />
          </div>
          <button className="pressable cl-tap" onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, zIndex: 2, width: 38, height: 38, borderRadius: 12, border: '1px solid var(--line-strong)', background: 'rgba(20,20,26,0.7)', color: 'var(--text)', display: 'grid', placeItems: 'center' }}>
            <Icon name="close" size={19} color="currentColor" />
          </button>
          <div style={{ position: 'absolute', left: 28, bottom: -40, display: 'flex', gap: 18, alignItems: 'flex-end', right: 28 }}>
            <MoviePoster title={movie.title} year={movie.year} genres={movie.genres} director={movie.director} palette={movie.poster} posterUrl={movie.posterUrl} width={120} rounded={14} glow />
            <div style={{ paddingBottom: 46 }}>
              <div className="display" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{movie.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)', marginTop: 7 }}>{movie.year} · {movie.director} · {movie.runtime > 0 ? `${movie.runtime}m` : ''}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '54px 28px 0' }}>
          <GenreChips genres={movie.genres} />
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <ScoreBadge value={movie.personal} label="Personal" variant="primary" size="lg" />
            <ScoreBadge value={tech} label="Technical" variant="line" size="lg" />
            <ScoreBadge value={movie.objective} label="Objective" variant="ghost" size="lg" />
          </div>
          {movie.review && (
            <div style={{ marginTop: 20, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5 }}>&ldquo;{movie.review}&rdquo;</div>
          )}
          <div style={{ marginTop: 14 }}>
            {latest && <WatchMeta location={latest.watchLocation} watchType={latest.watchType} />}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="pressable cl-tap" onClick={() => onRate(movie, activeWatchEntryId ?? undefined)} style={{ flex: 1, border: 'none', borderRadius: 13, padding: '13px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="star" size={15} color="#1a1206" /> Edit Rating
            </button>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', marginTop: 24 }}>
            <ScoreConstellation scores={movie.scores} size={290} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.short}</span>
                  <span className="display tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmt1(movie.scores[c.key])}</span>
                </div>
                <div style={{ marginTop: 7, height: 3.5, borderRadius: 3, background: 'var(--ink-680)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(movie.scores[c.key] / 5) * 100}%`, background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="eyebrow" style={{ margin: '24px 0 12px' }}>Watch History · film strip</div>
          <div style={{ paddingBottom: 30 }}><WatchTimeline movie={movie} /></div>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop App ── */
export default function DesktopView() {
  const { currentUser, signOut } = useAuth();
  const displayName = currentUser?.displayName ?? currentUser?.username ?? null;

  const [nav, setNav] = useState<'home' | 'library' | 'rankings'>('home');
  const [detail, setDetail] = useState<MockMovie | null>(null);
  const [rating, setRating] = useState<MockMovie | null>(null);
  const [ratingWatchEntryId, setRatingWatchEntryId] = useState<number | null>(null);
  const [mode, setMode] = useState('personal');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('personal');

  /* API data */
  const [dashData, setDashData] = useState<DashboardResponse | null>(null);
  const [libraryMovies, setLibraryMovies] = useState<MockMovie[]>([]);
  const [rankingList, setRankingList] = useState<{ m: MockMovie; v: number }[]>([]);

  useEffect(() => {
    const handleErr = (err: unknown) => {
      if (err instanceof ApiError && err.isUnauthorized) void signOut();
    };
    getDashboard().then(d => setDashData(d)).catch(handleErr);
    getMovies().then(ms => setLibraryMovies(ms.map(adaptMovie))).catch(handleErr);
  }, [signOut]);

  useEffect(() => {
    const backendMode = RANKING_MODE_MAP[mode];
    if (!backendMode) return;
    getRankings(backendMode)
      .then(items => setRankingList(items.map(r => ({ m: adaptRankingItem(r), v: r.score }))))
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) void signOut();
      });
  }, [mode, signOut]);

  /* Derived from dashboard */
  const latestWatch = dashData?.latestWatch ?? null;
  const latestMovie = latestWatch
    ? adaptDashboardLatestWatch(latestWatch)
    : null;
  const latestEntry = latestWatch;

  const dashStats = dashData?.stats ?? null;
  const top5: MockMovie[] = (dashData?.topPersonal ?? []).slice(0, 5).map(adaptRankingItem);

  const archiveStats = [
    { l: 'Films', v: dashStats?.totalMovies ?? '—' },
    { l: 'Avg personal', v: dashStats?.averagePersonalScore != null ? fmt1(dashStats.averagePersonalScore) : '—' },
    { l: 'Avg technical', v: dashStats?.averageTechnicalScore != null ? fmt1(dashStats.averageTechnicalScore) : '—' },
  ];

  const homeStats = [
    { n: dashStats?.totalMovies ?? '—', l: 'Films' },
    { n: dashStats?.totalWatchEntries ?? '—', l: 'Watches' },
    { n: dashStats?.averagePersonalScore != null ? fmt1(dashStats.averagePersonalScore) : '—', l: 'Avg Pers.' },
    { n: dashStats?.averageTechnicalScore != null ? fmt1(dashStats.averageTechnicalScore) : '—', l: 'Avg Tech.' },
  ];

  const recentWatches = useMemo(() =>
    [...libraryMovies]
      .sort((a, b) => (b.watches[0]?.watchedAt ?? '').localeCompare(a.watches[0]?.watchedAt ?? ''))
      .slice(0, 6),
    [libraryMovies]);

  const libList = useMemo(() => {
    const arr = libraryMovies.filter(m => !q ||
      m.title.toLowerCase().includes(q.toLowerCase()) ||
      m.director.toLowerCase().includes(q.toLowerCase()));
    const val = (m: MockMovie): number | string => {
      if (sort === 'technical') return m.technicalScore ?? 0;
      if (sort === 'objective') return m.objective;
      if (sort === 'year') return m.year;
      if (sort === 'latest') return m.watches[0]?.watchedAt ?? '';
      return m.personal;
    };
    return [...arr].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (sort === 'latest') return String(vb).localeCompare(String(va));
      return Number(vb) - Number(va);
    });
  }, [libraryMovies, q, sort]);

  const modeObj = RANKING_MODES.find(r => r.id === mode) ?? RANKING_MODES[0];

  const navItems = [
    { id: 'home' as const, icon: 'home' as const, l: 'Home' },
    { id: 'library' as const, icon: 'library' as const, l: 'Library' },
    { id: 'rankings' as const, icon: 'rankings' as const, l: 'Rankings' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: 'var(--ink-900)', overflow: 'hidden' }} className="cl-grain">
      {/* left rail */}
      <div style={{ width: 232, flexShrink: 0, borderRight: '1px solid var(--line)', padding: '26px 18px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--ink-870), var(--ink-900))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 4px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 40% 30%, var(--accent-glow), var(--ink-760))', border: '1px solid var(--line-amber)' }}>
            <Icon name="film" size={20} color="var(--accent)" stroke={1.5} />
          </div>
          <div className="display" style={{ fontSize: 21, fontWeight: 700 }}>Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span></div>
        </div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(it => {
            const active = nav === it.id;
            return (
              <button key={it.id} className="cl-tap" onClick={() => setNav(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', color: active ? 'var(--accent-bright)' : 'var(--text-dim)', background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.14), rgba(232,185,116,0.04))' : 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: active ? 600 : 500, transition: 'all var(--dur) var(--ease-out)' }}>
                <Icon name={it.icon} size={19} color="currentColor" stroke={active ? 2.1 : 1.8} /> {it.l}
              </button>
            );
          })}
        </div>
        {/* bottom: archive stats + user/sign-out */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '14px 13px', borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
            <div className="eyebrow" style={{ marginBottom: 9 }}>The Archive</div>
            {archiveStats.map(s => (
              <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                <span>{s.l}</span><span className="tnum" style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            {displayName && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                {displayName}
              </span>
            )}
            <button
              className="pressable cl-tap"
              onClick={() => { void signOut(); }}
              style={{
                marginLeft: 'auto', border: '1px solid rgba(184,73,63,0.25)',
                borderRadius: 10, padding: '7px 11px',
                background: 'rgba(184,73,63,0.05)',
                color: '#b07070', fontFamily: 'var(--font-sans)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Icon name="back" size={13} color="currentColor" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* main */}
      <div className="cl-scroll" style={{ position: 'relative', flex: 1 }}>
        <div style={{ padding: '30px 38px 60px' }}>

          {/* HOME */}
          {nav === 'home' && (
            <div style={{ animation: 'fadeIn 320ms ease both' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Private Screening Room</div>
              <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Good evening.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 26 }}>
                <div>
                  {/* latest hero */}
                  {latestMovie && latestEntry && (
                    <button className="pressable cl-tap" onClick={() => setDetail(latestMovie)} style={{ width: '100%', border: 'none', textAlign: 'left', color: 'var(--text)', position: 'relative', borderRadius: 22, overflow: 'hidden', padding: 0, boxShadow: 'var(--shadow-pop)' }}>
                      <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.5)', filter: 'blur(30px)', opacity: 0.45 }}>
                        <MoviePoster title={latestMovie.title} year={latestMovie.year} genres={latestMovie.genres} director={latestMovie.director} palette={latestMovie.poster} posterUrl={latestMovie.posterUrl} width={700} rounded={0} frame={false} flat />
                      </div>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(8,8,11,0.92) 40%, rgba(8,8,11,0.4))' }} />
                      <div style={{ position: 'relative', padding: 24, display: 'flex', gap: 22, alignItems: 'center' }}>
                        <MoviePoster title={latestMovie.title} year={latestMovie.year} genres={latestMovie.genres} director={latestMovie.director} palette={latestMovie.poster} posterUrl={latestMovie.posterUrl} width={130} rounded={14} glow />
                        <div style={{ flex: 1 }}>
                          <div className="eyebrow" style={{ color: 'var(--accent)' }}>● Latest Watch · {fmtDate(latestEntry.watchedAt)}</div>
                          <div className="display" style={{ fontSize: 28, fontWeight: 700, marginTop: 10, lineHeight: 1 }}>{latestMovie.title}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>{latestMovie.year > 0 ? `${latestMovie.year} · ` : ''}{latestMovie.director !== 'Unknown' ? latestMovie.director : ''}</div>
                          <div style={{ marginTop: 12 }}><WatchMeta location={latestEntry.watchLocation} watchType={latestEntry.watchType} /></div>
                          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
                            <ScoreBadge value={latestMovie.personal} label="Personal" variant="primary" />
                            <ScoreBadge value={latestMovie.technicalScore ?? technical(latestMovie.scores)} label="Technical" variant="line" />
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                  {recentWatches.length > 0 && (
                    <>
                      <div className="eyebrow" style={{ margin: '30px 0 14px' }}>Recent Watches</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {recentWatches.map(m => (
                          <MovieCard key={m.id} movie={m} onOpen={() => setDetail(m)} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {homeStats.map((s, i) => (
                      <div key={i} style={{ background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 10px', textAlign: 'center' }}>
                        <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{s.n}</div>
                        <div className="eyebrow" style={{ marginTop: 6 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {top5.length > 0 && (
                    <>
                      <div className="eyebrow" style={{ margin: '24px 0 12px' }}>Top 5 Personal</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {top5.map((m, i) => (
                          <button key={m.id} className="pressable cl-tap" onClick={() => setDetail(m)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 13, border: '1px solid var(--line)', background: 'var(--ink-820)', color: 'var(--text)', textAlign: 'left' }}>
                            <span className="display tnum" style={{ width: 26, textAlign: 'center', fontSize: 22, fontWeight: 800, color: 'transparent', WebkitTextStroke: '1.2px var(--rank-stroke)' } as React.CSSProperties}>{i + 1}</span>
                            <MoviePoster title={m.title} year={m.year} genres={m.genres} director={m.director} palette={m.poster} posterUrl={m.posterUrl} width={38} rounded={7} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="display" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{m.year}</div>
                            </div>
                            <span className="display tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmt1(m.personal)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LIBRARY */}
          {nav === 'library' && (
            <div style={{ animation: 'fadeIn 320ms ease both' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>{libList.length} of {libraryMovies.length} films</div>
                  <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Library</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, width: 280, borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line-strong)' }}>
                  <Icon name="search" size={17} color="var(--text-faint)" />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search archive" style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, margin: '20px 0 22px' }}>
                {['personal', 'technical', 'objective', 'latest', 'year'].map(s => (
                  <button key={s} className="pressable cl-tap" onClick={() => setSort(s)} style={{ border: sort === s ? '1px solid var(--line-amber)' : '1px solid var(--line)', background: sort === s ? 'rgba(232,185,116,0.1)' : 'var(--ink-800)', color: sort === s ? 'var(--accent-bright)' : 'var(--text-dim)', borderRadius: 11, padding: '8px 15px', fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{s}</button>
                ))}
              </div>
              {libList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-faint)' }}>
                  {libraryMovies.length === 0 ? 'No films in the archive yet.' : 'No results.'}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18 }}>
                  {libList.map((m, i) => (
                    <button key={m.id} className="pressable cl-tap" onClick={() => setDetail(m)} style={{ border: 'none', background: 'none', padding: 0, animation: `fadeUp 420ms var(--ease-out) ${i * 30}ms both` }}>
                      <MoviePoster title={m.title} year={m.year} genres={m.genres} director={m.director} palette={m.poster} posterUrl={m.posterUrl} width={150} rounded={12} />
                      <div style={{ marginTop: 9 }}>
                        <div className="display" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          <Icon name="star" size={11} color="var(--star)" />
                          <span className="display tnum" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>{fmt1(sort === 'technical' ? (m.technicalScore ?? 0) : sort === 'objective' ? m.objective : m.personal)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RANKINGS */}
          {nav === 'rankings' && (
            <div style={{ animation: 'fadeIn 320ms ease both', display: 'grid', gridTemplateColumns: '210px 1fr', gap: 28 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Ranking mode</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {RANKING_MODES.map(r => (
                    <button key={r.id} className="cl-tap" onClick={() => setMode(r.id)} style={{ border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: mode === r.id ? 'linear-gradient(150deg, rgba(232,185,116,0.13), transparent)' : 'transparent', color: mode === r.id ? 'var(--accent-bright)' : 'var(--text-dim)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: mode === r.id ? 600 : 500 }}>{r.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: 2 }}>{r.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div key={mode}>
                <div className="display" style={{ fontSize: 30, fontWeight: 700 }}>{modeObj.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>{modeObj.tag}.</div>
                {rankingList.length === 0 ? (
                  <div style={{ marginTop: 40, textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--text-faint)' }}>No rated films yet.</div>
                ) : (
                  <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {rankingList.map((r, i) => (
                      <button key={r.m.id} className="pressable cl-tap" onClick={() => setDetail(r.m)} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '13px 8px', border: 'none', borderTop: i ? '1px solid var(--line)' : 'none', background: 'none', color: 'var(--text)', textAlign: 'left', animation: `fadeUp 440ms var(--ease-out) ${i * 45}ms both` }}>
                        <span className="display tnum" style={{ width: 64, textAlign: 'center', fontSize: i === 0 ? 52 : 44, fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'transparent', WebkitTextStroke: i === 0 ? 'none' : '1.4px var(--rank-stroke)' } as React.CSSProperties}>{i + 1}</span>
                        <MoviePoster title={r.m.title} year={r.m.year} genres={r.m.genres} director={r.m.director} palette={r.m.poster} posterUrl={r.m.posterUrl} width={54} rounded={9} />
                        <div style={{ flex: 1 }}>
                          <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{r.m.title}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>{r.m.year} · {r.m.director}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="display tnum" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{fmt(r.v)}</div>
                          <div style={{ marginTop: 4 }}><Stars value={roundHalf(r.v)} size={11} /></div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <DeskDetail
          movie={detail}
          onClose={() => setDetail(null)}
          onRate={(m, watchEntryId) => {
            setDetail(null);
            setRating(m);
            setRatingWatchEntryId(watchEntryId ?? null);
          }}
        />
      )}
      {rating && (
        <DeskRating
          movie={rating}
          watchEntryId={ratingWatchEntryId ?? undefined}
          onClose={() => { setRating(null); setRatingWatchEntryId(null); }}
          onSave={() => { setRating(null); setRatingWatchEntryId(null); }}
        />
      )}
    </div>
  );
}
