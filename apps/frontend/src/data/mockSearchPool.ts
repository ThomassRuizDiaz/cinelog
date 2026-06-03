import { MOCK_MOVIES } from './mockMovies';
import type { PosterPalette } from '../types/movie';

export interface MockSearchResult {
  id: string;
  title: string;
  year: number;
  director: string;
  genres: string[];
  runtime: number;
  poster: PosterPalette;
  inLibrary: boolean;
}

const EXTERNAL_ONLY: MockSearchResult[] = [
  { id: 'ext-oppenheimer', title: 'Oppenheimer', year: 2023, director: 'Christopher Nolan', genres: ['Drama', 'History', 'Thriller'], runtime: 180, poster: { from: '#2b1208', to: '#0a0706', accent: '#e07b32', ink: '#f2d2ab' }, inLibrary: false },
  { id: 'ext-lalaland', title: 'La La Land', year: 2016, director: 'Damien Chazelle', genres: ['Romance', 'Drama', 'Music'], runtime: 128, poster: { from: '#241433', to: '#0a0710', accent: '#7a6fd0', ink: '#e6dcf2' }, inLibrary: false },
  { id: 'ext-nocountry', title: 'No Country for Old Men', year: 2007, director: 'Coen Brothers', genres: ['Crime', 'Thriller', 'Drama'], runtime: 122, poster: { from: '#2a2316', to: '#0b0907', accent: '#b89a5f', ink: '#ece2cb' }, inLibrary: false },
  { id: 'ext-furyroad', title: 'Mad Max: Fury Road', year: 2015, director: 'George Miller', genres: ['Action', 'Adventure', 'Sci-Fi'], runtime: 120, poster: { from: '#3a1808', to: '#0c0705', accent: '#e2702a', ink: '#f4cda4' }, inLibrary: false },
  { id: 'ext-sicario', title: 'Sicario', year: 2015, director: 'Denis Villeneuve', genres: ['Crime', 'Drama', 'Thriller'], runtime: 121, poster: { from: '#291a14', to: '#08070a', accent: '#c06a4a', ink: '#e9cdbd' }, inLibrary: false },
];

export const MOCK_SEARCH_POOL: MockSearchResult[] = [
  ...MOCK_MOVIES.map(m => ({
    id: m.id, title: m.title, year: m.year, director: m.director,
    genres: m.genres, runtime: m.runtime, poster: m.poster, inLibrary: true,
  })),
  ...EXTERNAL_ONLY,
];

export const SEARCH_SUGGESTIONS = ['Oppenheimer', 'Sicario', 'Fury Road', 'La La Land', 'No Country'];
