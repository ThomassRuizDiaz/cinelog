import { useState, useCallback, useEffect, useMemo } from 'react';
import { AppShell, LayoutDebug } from './components';
import type { TabId } from './components';
import ScreenLayer from './navigation/ScreenLayer';
import HomeScreen from './screens/HomeScreen';
import LibraryScreen from './screens/LibraryScreen';
import WatchlistScreen from './screens/WatchlistScreen';
import RankingsScreen from './screens/RankingsScreen';
import AddScreen from './screens/AddScreen';
import ActorsScreen from './screens/ActorsScreen';
import ActorDetailScreen from './screens/ActorDetailScreen';
import DetailScreen from './screens/DetailScreen';
import RatingScreen from './screens/RatingScreen';
import SettingsScreen from './screens/SettingsScreen';
import GptExportScreen from './screens/GptExportScreen';
import DesktopView from './screens/DesktopView';
import LoginScreen from './screens/LoginScreen';
import { AuthProvider } from './contexts/AuthContext';
import { useMediaQuery } from './hooks/useMediaQuery';
import { getAuthStatus, logout } from './api/auth';
import type { AuthStatus } from './api/auth';
import type { MockMovie } from './types/movie';
import type { RatingScores, InitialRatingData } from './types/rating';
import { fmtScore } from './lib/scoring';

type AuthState = 'checking' | 'unauthenticated' | 'authenticated';

export default function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [authState, setAuthState] = useState<AuthState>('checking');
  const [currentUser, setCurrentUser] = useState<AuthStatus | null>(null);

  const [tab, setTab] = useState<TabId>('home');
  const [detailMovie, setDetailMovie] = useState<MockMovie | null>(null);
  const [actorDetailId, setActorDetailId] = useState<number | null>(null);
  const [ratingMovie, setRatingMovie] = useState<MockMovie | null>(null);
  const [ratingWatchEntryId, setRatingWatchEntryId] = useState<number | null>(null);
  const [ratingSource, setRatingSource] = useState<'add' | 'detail' | null>(null);
  const [ratingInitialData, setRatingInitialData] = useState<InitialRatingData | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gptExportOpen, setGptExportOpen] = useState(false);
  const [logWatchMovie, setLogWatchMovie] = useState<MockMovie | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getAuthStatus()
      .then(user => {
        setCurrentUser(user.authenticated ? user : null);
        setAuthState(user.authenticated ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        setAuthState('unauthenticated');
      });
  }, []);

  const handleLogin = useCallback((user: AuthStatus) => {
    setCurrentUser(user);
    setAuthState('authenticated');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      /* session may already be gone */
    }
    setCurrentUser(null);
    setAuthState('unauthenticated');
  }, []);

  const authContextValue = useMemo(
    () => ({ currentUser, signOut: handleLogout }),
    [currentUser, handleLogout],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const handleTabChange = useCallback((t: TabId) => {
    setDetailMovie(null);
    setActorDetailId(null);
    setRatingMovie(null);
    setRatingWatchEntryId(null);
    setRatingSource(null);
    setRatingInitialData(null);
    setSettingsOpen(false);
    if (t !== 'add') setLogWatchMovie(null);
    setTab(t);
  }, []);

  const handleOpenMovie = useCallback((movie: MockMovie) => {
    setDetailMovie(movie);
  }, []);

  const handleOpenActor = useCallback((id: number) => {
    setActorDetailId(id);
  }, []);

  /* From an actor's performance → open that movie's detail; close the actor layer. */
  const handleOpenMovieFromActor = useCallback((movie: MockMovie) => {
    setActorDetailId(null);
    setDetailMovie(movie);
  }, []);

  /* Called from DetailScreen "Edit Rating" — passes real watchEntryId and category notes when available */
  const handleRate = useCallback((movie: MockMovie, watchEntryId?: number, ratingData?: InitialRatingData) => {
    setDetailMovie(null);
    setTimeout(() => {
      setRatingMovie(movie);
      setRatingWatchEntryId(watchEntryId ?? null);
      setRatingSource('detail');
      setRatingInitialData(ratingData ?? null);
    }, 60);
  }, []);

  /* Called from AddScreen after import + watch entry creation — real save */
  const handleRateAfterWatch = useCallback((movie: MockMovie, watchEntryId: number) => {
    setRatingMovie(movie);
    setRatingWatchEntryId(watchEntryId);
    setRatingSource('add');
  }, []);

  const handleLogWatch = useCallback((movie: MockMovie) => {
    setDetailMovie(null);
    setLogWatchMovie(movie);
    setTab('add');
  }, []);

  const handleSaveRating = useCallback((_movie: MockMovie, _scores: RatingScores, finalScore: number) => {
    const wasNewRating = ratingSource === 'add';
    setRatingMovie(null);
    setRatingWatchEntryId(null);
    setRatingSource(null);
    setRatingInitialData(null);
    if (wasNewRating) {
      /* New movie just rated — navigate to Library so user can see it */
      handleTabChange('library');
    }
    setTimeout(() => showToast(`${_movie.title} puntuada con ${fmtScore(finalScore)}★`), 420);
  }, [ratingSource, handleTabChange, showToast]);

  const handleSaved = useCallback((title: string) => {
    setLogWatchMovie(null);
    handleTabChange('library');
    if (title) showToast(`${title} añadida al archivo`);
  }, [handleTabChange, showToast]);

  const handleMovieDeleted = useCallback(() => {
    setDetailMovie(null);
    handleTabChange('library');
    setTimeout(() => showToast('Película eliminada del archivo'), 300);
  }, [handleTabChange, showToast]);

  /* ── Auth loading splash ── */
  if (authState === 'checking') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--ink-900)', display: 'grid', placeItems: 'center' }}>
        <div className="display" style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span>
        </div>
      </div>
    );
  }

  /* ── Login gate ── */
  if (authState === 'unauthenticated') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  /* ── Desktop ── */
  if (isDesktop) {
    return (
      <AuthProvider value={authContextValue}>
        <DesktopView />
      </AuthProvider>
    );
  }

  /* ── Mobile app ── */
  let tabScreen: React.ReactNode;
  switch (tab) {
    case 'home':
      tabScreen = (
        <HomeScreen
          onOpenMovie={handleOpenMovie}
          onTabChange={handleTabChange}
          onSettings={() => setSettingsOpen(true)}
        />
      );
      break;
    case 'library':
      tabScreen = <LibraryScreen onOpenMovie={handleOpenMovie} />;
      break;
    case 'actors':
      tabScreen = <ActorsScreen onOpenActor={handleOpenActor} />;
      break;
    case 'watchlist':
      tabScreen = (
        <WatchlistScreen
          onTabChange={handleTabChange}
          onRateAfterConvert={handleRateAfterWatch}
        />
      );
      break;
    case 'rankings':
      tabScreen = <RankingsScreen onOpenMovie={handleOpenMovie} />;
      break;
    case 'add':
      tabScreen = (
        <AddScreen
          key={logWatchMovie?.id ?? 'search'}
          onRateAfterWatch={handleRateAfterWatch}
          onSaved={handleSaved}
          onSavedToWatchlist={(title) => {
            handleTabChange('watchlist');
            if (title) showToast(`${title} guardada en Watchlist`);
          }}
          initialStep={logWatchMovie ? 'entry' : 'search'}
          initialLibraryMovie={logWatchMovie ?? undefined}
          onCancel={logWatchMovie ? () => { setLogWatchMovie(null); handleTabChange('library'); } : undefined}
        />
      );
      break;
  }

  return (
    <AuthProvider value={authContextValue}>
      <AppShell activeTab={tab} onTabChange={handleTabChange} toast={toast}>
        {/* tab content */}
        <div style={{ position: 'absolute', inset: 0 }} key={tab}>
          {tabScreen}
        </div>

        {/* settings (push) */}
        <ScreenLayer
          content={settingsOpen ? true : null}
          anim="push"
          zIndex={40}
          render={() => (
            <SettingsScreen
              onBack={() => setSettingsOpen(false)}
              currentUser={currentUser ?? undefined}
              onLogout={handleLogout}
              onOpenGptExport={() => setGptExportOpen(true)}
            />
          )}
        />

        {/* GPT export (push, above settings) */}
        <ScreenLayer
          content={gptExportOpen ? true : null}
          anim="push"
          zIndex={41}
          render={() => (
            <GptExportScreen onBack={() => setGptExportOpen(false)} />
          )}
        />

        {/* detail (push) */}
        <ScreenLayer
          content={detailMovie}
          anim="push"
          zIndex={42}
          render={movie => (
            <DetailScreen
              key={movie.id}
              movie={movie}
              onBack={() => setDetailMovie(null)}
              onRate={handleRate}
              onLogWatch={handleLogWatch}
              onDeleted={handleMovieDeleted}
              onOpenActor={handleOpenActor}
            />
          )}
        />

        {/* actor detail (push, above movie detail) */}
        <ScreenLayer
          content={actorDetailId}
          anim="push"
          zIndex={50}
          render={id => (
            <ActorDetailScreen
              key={id}
              actorId={id}
              onBack={() => setActorDetailId(null)}
              onOpenMovie={handleOpenMovieFromActor}
            />
          )}
        />

        {/* rating (sheet) */}
        <ScreenLayer
          content={ratingMovie}
          anim="sheet"
          zIndex={55}
          render={movie => (
            <RatingScreen
              movie={movie}
              watchEntryId={ratingWatchEntryId ?? undefined}
              initialRatingData={ratingInitialData ?? undefined}
              onClose={() => { setRatingMovie(null); setRatingWatchEntryId(null); setRatingInitialData(null); }}
              onSave={handleSaveRating}
            />
          )}
        />
      </AppShell>
      {import.meta.env.DEV && <LayoutDebug />}
    </AuthProvider>
  );
}
