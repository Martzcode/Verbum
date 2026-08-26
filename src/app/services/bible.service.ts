import { Injectable, signal } from '@angular/core';
import type { BookInfo, Chapter, SupportedLocale, SearchResult } from '../models/bible.model';
import { VERSION_MAP } from '../models/bible.model';

@Injectable({ providedIn: 'root' })
export class BibleService {
  private chapterCache = new Map<string, Chapter>();
  private booksCache = new Map<SupportedLocale, BookInfo[]>();
  private allChaptersCache = new Map<string, Chapter[]>();
  loading = signal(false);

  private cacheKey(locale: SupportedLocale, bookId: string, chapter: number): string {
    return `${locale}:${bookId}:${chapter}`;
  }

  async getBooks(locale: SupportedLocale): Promise<BookInfo[]> {
    if (this.booksCache.has(locale)) {
      return this.booksCache.get(locale)!;
    }
    try {
      const res = await fetch(`/bibles/manifest.json`);
      const manifest: { books: BookInfo[] } = await res.json();
      this.booksCache.set(locale, manifest.books);
      return manifest.books;
    } catch {
      console.error(`Failed to load books manifest`);
      return [];
    }
  }

  async getChapter(locale: SupportedLocale, bookId: string, chapter: number): Promise<Chapter | null> {
    const key = this.cacheKey(locale, bookId, chapter);
    if (this.chapterCache.has(key)) {
      return this.chapterCache.get(key)!;
    }

    const version = VERSION_MAP[locale];
    try {
      const res = await fetch(`/bibles/${version}/${bookId}/${chapter}.json`);
      if (!res.ok) return null;
      const data: Chapter = await res.json();
      this.chapterCache.set(key, data);
      return data;
    } catch {
      console.error(`Failed to load chapter: ${locale}/${bookId}/${chapter}`);
      return null;
    }
  }

  async search(locale: SupportedLocale, query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const books = await this.getBooks(locale);
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const book of books) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        const chapter = await this.getChapter(locale, book.id, ch);
        if (!chapter) continue;

        for (const verse of chapter.verses) {
          if (verse.text.toLowerCase().includes(lowerQuery)) {
            const idx = verse.text.toLowerCase().indexOf(lowerQuery);
            const start = Math.max(0, idx - 30);
            const end = Math.min(verse.text.length, idx + query.length + 30);
            const matchedText = (start > 0 ? '…' : '') +
              verse.text.substring(start, end) +
              (end < verse.text.length ? '…' : '');

            results.push({
              bookId: book.id,
              bookName: book.name[locale] || book.name['en'] || book.id,
              chapter: ch,
              verse: verse.verse,
              text: verse.text,
              matchedText,
            });
          }
        }
      }
    }

    return results;
  }
}
