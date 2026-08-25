export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  book: string;
  bookId: string;
  chapter: number;
  verses: Verse[];
}

export interface BookInfo {
  id: string;
  name: Record<string, string>;
  testament: 'ot' | 'nt';
  chapters: number;
}

export interface Favorite {
  id: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  bookName: string;
  version: string;
  timestamp: number;
}

export type BibleVersion = 'ls1910' | 'kjv' | 'rv1909' | 'luther1912';
export type SupportedLocale = 'fr' | 'en' | 'es' | 'de';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['fr', 'en', 'es', 'de'];

export const VERSION_MAP: Record<SupportedLocale, BibleVersion> = {
  fr: 'ls1910',
  en: 'kjv',
  es: 'rv1909',
  de: 'luther1912',
};

export interface SearchResult {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  matchedText: string;
}
