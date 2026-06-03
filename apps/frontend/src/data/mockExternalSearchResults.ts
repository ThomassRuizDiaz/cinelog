import type { ExternalMovieResult } from '../types/movie';

/* Simulates GET /api/external/movies/search?query=nolan results */
export const MOCK_SEARCH_RESULTS: ExternalMovieResult[] = [
  {
    source: 'TMDB',
    externalId: '1124',
    title: 'The Prestige',
    originalTitle: 'The Prestige',
    releaseYear: 2006,
    directors: ['Christopher Nolan'],
    posterPath: '/bdN3gXuIZYaJP7ftKK2sU0nPtEA.jpg',
    posterUrl: null,
    genres: ['Drama', 'Mystery', 'Science Fiction'],
  },
  {
    source: 'TMDB',
    externalId: '27205',
    title: 'Inception',
    originalTitle: 'Inception',
    releaseYear: 2010,
    directors: ['Christopher Nolan'],
    posterPath: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    posterUrl: null,
    genres: ['Action', 'Science Fiction', 'Adventure'],
  },
  {
    source: 'TMDB',
    externalId: '157336',
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    releaseYear: 2014,
    directors: ['Christopher Nolan'],
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    posterUrl: null,
    genres: ['Adventure', 'Drama', 'Science Fiction'],
  },
];
