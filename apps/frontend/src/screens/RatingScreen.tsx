import { useState, useRef } from 'react';
import { ScoreConstellation, Stars, RatingScaleControl, RatingCategoryCard, RatingCompleteOverlay, Icon } from '../components';
import type { MockMovie } from '../types/movie';
import type { RatingScores, InitialRatingData } from '../types/rating';
import { CATEGORIES } from '../data/categories';
import { technical, roundHalf, roundQuarter, fmt, fmtScore } from '../lib/scoring';
import { saveRating, buildSaveRatingRequest } from '../api/watchEntries';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';

interface RatingScreenProps {
  movie: MockMovie;
  /** When present, calls PUT /api/watch-entries/{watchEntryId}/rating on save. */
  watchEntryId?: number;
  /** Pre-populate category notes when editing an existing rated entry. */
  initialRatingData?: InitialRatingData;
  onClose: () => void;
  onSave: (movie: MockMovie, scores: RatingScores, finalScore: number) => void;
}

/* Session-scoped flag: the celebratory sparkle burst plays only on the first
 * full-rating save of a session; later saves still show the calm confirmation. */
let celebratedThisSession = false;

export default function RatingScreen({ movie, watchEntryId, initialRatingData, onClose, onSave }: RatingScreenProps) {
  const { signOut } = useAuth();
  const isFirstCelebration = useRef(false);
  const [scores, setScores] = useState<RatingScores>({ ...movie.scores });
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [catNotes, setCatNotes] = useState<Record<string, string>>(
    initialRatingData?.categoryNotes ?? {},
  );
  const [override, setOverride] = useState(() =>
    movie.personal > 0 && Math.abs(movie.personal - roundQuarter(technical(movie.scores))) > 0.01);
  const [personal, setPersonal] = useState(movie.personal);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const tech = technical(scores);
  const visible = roundQuarter(tech);
  const finalScore = override ? personal : visible;

  const finishSave = () => {
    isFirstCelebration.current = !celebratedThisSession;
    celebratedThisSession = true;
    setSaved(true);
  };

  const doSave = async () => {
    if (saving) return;
    setSaveError(null);

    if (watchEntryId) {
      /* Real API save */
      setSaving(true);
      try {
        await saveRating(watchEntryId, buildSaveRatingRequest(scores, {
          personalFinalScore: override ? personal : undefined,
          categoryNotes: catNotes,
        }));
        setSaving(false);
        finishSave();
        setTimeout(() => onSave(movie, scores, finalScore), 1500);
      } catch (err) {
        setSaving(false);
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        if (err instanceof ApiError && err.isValidation) {
          setSaveError(`Validación: ${err.message}`);
        } else {
          setSaveError(err instanceof ApiError ? err.message : 'Error al guardar. Inténtalo de nuevo.');
        }
      }
    } else {
      /* Mock flow — no API call */
      finishSave();
      setTimeout(() => onSave(movie, scores, finalScore), 1500);
    }
  };

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 150px)', position: 'absolute', inset: 0 }}>
      {/* sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'linear-gradient(180deg, var(--ink-900) 72%, rgba(8,8,11,0))', padding: 'var(--safe-top) 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="pressable cl-tap" onClick={onClose} style={{ border: '1px solid var(--line-strong)', background: 'var(--ink-800)', width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--text)', flexShrink: 0 }}>
          <Icon name="close" size={19} color="currentColor" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Puntuación</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</div>
        </div>
      </div>

      {/* live constellation panel */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 18px', borderRadius: 22, background: 'linear-gradient(155deg, var(--ink-800), var(--ink-850))', border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
          <ScoreConstellation scores={scores} size={150} showLabels={false} highlight={openCat as Parameters<typeof ScoreConstellation>[0]['highlight']} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 11 }}>Perfil en vivo</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="display tnum" style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)', lineHeight: 0.95 }}>{fmt(tech)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>/10</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 5 }}>Media técnica</div>
            <div style={{ height: 1, background: 'var(--line)', margin: '13px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Stars value={visible} size={14} />
              <span className="tnum display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{fmtScore(visible)}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>Visible</div>
          </div>
        </div>
      </div>

      {/* category cards */}
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CATEGORIES.map(c => (
          <RatingCategoryCard
            key={c.key}
            category={c}
            value={scores[c.key]}
            onChange={v => setScores(s => ({ ...s, [c.key]: v }))}
            isOpen={openCat === c.key}
            onToggleNote={() => setOpenCat(prev => prev === c.key ? null : c.key)}
            noteValue={catNotes[c.key] ?? ''}
            onNoteChange={n => setCatNotes(prev => ({ ...prev, [c.key]: n }))}
          />
        ))}
      </div>

      {/* personal override */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ padding: '15px 16px', borderRadius: 16, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Puntuación personal final</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3 }}>Ignora el cálculo cuando el corazón discrepa</div>
            </div>
            <button className="cl-tap" onClick={() => setOverride(o => !o)} style={{ border: 'none', background: 'none', padding: 0, flexShrink: 0 }}>
              <span style={{ width: 46, height: 27, borderRadius: 20, background: override ? 'var(--accent)' : 'var(--ink-680)', display: 'block', position: 'relative', transition: 'background var(--dur) var(--ease-out)' }}>
                <span style={{ position: 'absolute', top: 3, left: override ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left var(--dur) var(--ease-spring)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
              </span>
            </button>
          </div>
          {override && (
            <div style={{ marginTop: 14, animation: 'fadeIn 240ms ease both' }}>
              <RatingScaleControl value={personal} onChange={setPersonal} starSize={18} />
            </div>
          )}
        </div>
      </div>

      {/* save error */}
      {saveError && (
        <div style={{ margin: '14px 16px 0', padding: '11px 14px', borderRadius: 12, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070', letterSpacing: '0.02em' }}>{saveError}</div>
        </div>
      )}

      {/* sticky save bar */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, padding: '14px 16px calc(var(--safe-bottom) + 10px)', background: 'linear-gradient(180deg, rgba(8,8,11,0), var(--ink-900) 36%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px 11px 16px', borderRadius: 18, background: 'rgba(22,22,28,0.86)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--line-strong)', boxShadow: '0 -8px 30px -10px rgba(0,0,0,0.6)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {override ? 'Final · personal' : 'Final · calculado'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
              <span className="display tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{fmtScore(finalScore)}</span>
              <Stars value={roundHalf(finalScore)} size={13} />
            </div>
          </div>
          <button
            className="pressable cl-tap"
            onClick={() => void doSave()}
            disabled={saving}
            style={{ border: 'none', borderRadius: 14, padding: '14px 24px', background: saving ? 'var(--ink-720)' : 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: saving ? 'var(--text-faint)' : '#1a1206', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, boxShadow: saving ? 'none' : '0 10px 24px -10px var(--accent)', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 180ms' }}
          >
            {saving ? 'Guardando…' : 'Guardar puntuación'}
          </button>
        </div>
      </div>

      {/* cinematic save-complete moment */}
      {saved && <RatingCompleteOverlay finalScore={finalScore} celebrate={isFirstCelebration.current} />}
    </div>
  );
}
