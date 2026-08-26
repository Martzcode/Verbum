#!/usr/bin/env node

/**
 * Downloads and converts Malagasy Bible (Baiboly 1865) from getbible.net API
 * into per-book/chapter JSON files matching our format.
 * Usage: node scripts/download-malagasy.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join(__dirname, '..', 'public', 'bibles', 'mg1865');
const API_BASE = 'https://api.getbible.net/v2/mg1865';

const BOOK_MAP = {
  1: { id: 'genesis', name: 'Genesis' },
  2: { id: 'exodus', name: 'Eksoda' },
  3: { id: 'leviticus', name: 'Levitika' },
  4: { id: 'numbers', name: 'Nomina' },
  5: { id: 'deuteronomy', name: 'Deoteronomia' },
  6: { id: 'joshua', name: 'Josoa' },
  7: { id: 'judges', name: 'Mpanjaka' },
  8: { id: 'ruth', name: 'Rota' },
  9: { id: '1-samuel', name: '1 Samuel' },
  10: { id: '2-samuel', name: '2 Samuel' },
  11: { id: '1-kings', name: '1 Mpanjaka' },
  12: { id: '2-kings', name: '2 Mpanjaka' },
  13: { id: '1-chronicles', name: '1 Tantara' },
  14: { id: '2-chronicles', name: '2 Tantara' },
  15: { id: 'ezra', name: 'Ezra' },
  16: { id: 'nehemiah', name: 'Nehemia' },
  17: { id: 'esther', name: 'Ester' },
  18: { id: 'job', name: 'Job' },
  19: { id: 'psalms', name: 'Dontoam-baratra' },
  20: { id: 'proverbs', name: 'Ohabolana' },
  21: { id: 'ecclesiastes', name: 'Mpanao amin-kevitra' },
  22: { id: 'song-of-solomon', name: 'Tonon-kira' },
  23: { id: 'isaiah', name: 'Esaia' },
  24: { id: 'jeremiah', name: 'Jeremia' },
  25: { id: 'lamentations', name: 'Feno fisosotena' },
  26: { id: 'ezekiel', name: 'Ezekiel' },
  27: { id: 'daniel', name: 'Daniel' },
  28: { id: 'hosea', name: 'Osea' },
  29: { id: 'joel', name: 'Joely' },
  30: { id: 'amos', name: 'Amosy' },
  31: { id: 'obadiah', name: 'Obadia' },
  32: { id: 'jonah', name: 'Jona' },
  33: { id: 'micah', name: 'Mika' },
  34: { id: 'nahum', name: 'Nahum' },
  35: { id: 'habakkuk', name: 'Habakoka' },
  36: { id: 'zephaniah', name: 'Sofonia' },
  37: { id: 'haggai', name: 'Hagai' },
  38: { id: 'zechariah', name: 'Zakaria' },
  39: { id: 'malachi', name: 'Malakia' },
  40: { id: 'matthew', name: 'Matiasy' },
  41: { id: 'mark', name: 'Marc' },
  42: { id: 'luke', name: 'Loaka' },
  43: { id: 'john', name: 'Jaona' },
  44: { id: 'acts', name: 'Asa' },
  45: { id: 'romans', name: 'Romana' },
  46: { id: '1-corinthians', name: '1 Korintianina' },
  47: { id: '2-corinthians', name: '2 Korintianina' },
  48: { id: 'galatians', name: 'Galatianina' },
  49: { id: 'ephesians', name: 'Efesianina' },
  50: { id: 'philippians', name: 'Filipianina' },
  51: { id: 'colossians', name: 'Kolosianina' },
  52: { id: '1-thessalonians', name: '1 Thesalonianina' },
  53: { id: '2-thessalonians', name: '2 Thesalonianina' },
  54: { id: '1-timothy', name: '1 Timoty' },
  55: { id: '2-timothy', name: '2 Timoty' },
  56: { id: 'titus', name: 'Tito' },
  57: { id: 'philemon', name: 'Filemona' },
  58: { id: 'hebrews', name: 'Hebreo' },
  59: { id: 'james', name: 'Jakoba' },
  60: { id: '1-peter', name: '1 Petera' },
  61: { id: '2-peter', name: '2 Petera' },
  62: { id: '1-john', name: '1 Jaona' },
  63: { id: '2-john', name: '2 Jaona' },
  64: { id: '3-john', name: '3 Jaona' },
  65: { id: 'jude', name: 'Joda' },
  66: { id: 'revelation', name: 'Apokalypsy' },
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Downloading Malagasy Bible (Baiboly 1865) from getbible.net...\n');

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifestBooks = [];
  let totalChapters = 0;
  let totalVerses = 0;

  for (const [bookNum, bookInfo] of Object.entries(BOOK_MAP)) {
    const bookDir = path.join(OUT_DIR, bookInfo.id);
    fs.mkdirSync(bookDir, { recursive: true });

    process.stdout.write(`  ${bookInfo.name}...`);

    try {
      const data = await fetchJSON(`${API_BASE}/${bookNum}.json`);
      let chaptersCount = 0;

      for (const chapter of data.chapters) {
        const chapterData = {
          book: bookInfo.name,
          bookId: bookInfo.id,
          chapter: chapter.chapter,
          verses: chapter.verses.map(v => ({
            verse: v.verse,
            text: v.text.trim(),
          })),
        };

        fs.writeFileSync(
          path.join(bookDir, `${chapter.chapter}.json`),
          JSON.stringify(chapterData),
          'utf-8',
        );
        chaptersCount++;
        totalVerses += chapter.verses.length;
      }

      manifestBooks.push({
        id: bookInfo.id,
        name: { mg: bookInfo.name, en: bookInfo.name },
        testament: parseInt(bookNum) <= 39 ? 'ot' : 'nt',
        chapters: chaptersCount,
      });

      totalChapters += chaptersCount;
      console.log(` ${chaptersCount} chapters`);
    } catch (e) {
      console.log(` ERROR: ${e.message}`);
    }

    // Be nice to the API
    await sleep(300);
  }

  // Update the main manifest
  const manifestPath = path.join(__dirname, '..', 'public', 'bibles', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Add Malagasy names to existing books
  for (const book of manifest.books) {
    const mgBook = manifestBooks.find(b => b.id === book.id);
    if (mgBook) {
      book.name.mg = mgBook.name.mg;
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nDone! ${totalChapters} chapters, ${totalVerses} verses`);
  console.log(`Updated manifest.json with Malagasy book names`);
}

main().catch(console.error);
