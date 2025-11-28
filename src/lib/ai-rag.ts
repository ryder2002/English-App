import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

interface DocInfo {
  path: string;
  title: string;
  snippet: string;
  tokens: Set<string>;
}

// Simple tokenization - lowercase words, remove punctuation
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[\W_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

let cachedDocs: DocInfo[] | null = null;

function readDocsFolder(): DocInfo[] {
  if (cachedDocs) return cachedDocs;
  const docsDir = path.resolve(process.cwd(), 'docs');
  const files: string[] = [];
  try {
    const walk = (dir: string) => {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else if (/\.mdx?$|\.txt$|\.html?$/.test(full)) files.push(full);
      }
    };
    if (fs.existsSync(docsDir)) walk(docsDir);
  } catch (e) {
    // ignore
  }

  const docs: DocInfo[] = files.map((file) => {
    const content = fs.readFileSync(file, 'utf8');
    // naive title: first line if it looks like heading
    let title = path.basename(file);
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const first = lines[0];
      if (first.startsWith('#')) {
        title = first.replace(/^#+\s*/, '');
      } else {
        title = path.basename(file);
      }
    }
    const snippet = content.slice(0, 1200);
    const tokens = new Set(tokenize(content));
    return { path: path.relative(process.cwd(), file), title, snippet, tokens };
  });

  cachedDocs = docs;
  return docs;
}

export async function getRelevantDocs(query: string, topN = 3): Promise<{ title: string; path: string; snippet: string }[]> {
  const docs = readDocsFolder();
  if (!query || query.trim().length === 0) return [];
  const qTokens = tokenize(query);
  const scores = docs.map((doc) => {
    let score = 0;
    for (const t of qTokens) if (doc.tokens.has(t)) score++;
    return { doc, score };
  });
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, topN).filter(s => s.score > 0).map(s => ({ title: s.doc.title, path: s.doc.path, snippet: s.doc.snippet.slice(0, 1200) }));

  // Also add matching vocabulary items as context (if available) - use DB
  try {
    const vocabMatches = await prisma.vocabulary.findMany({
      where: {
        OR: [
          { word: { contains: query, mode: 'insensitive' } },
          { vietnameseTranslation: { contains: query, mode: 'insensitive' } },
          { folder: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: topN
    });
    for (const v of vocabMatches) {
      top.push({ title: `Vocabulary: ${v.word}`, path: `db:vocabulary:${v.id}`, snippet: `${v.word} (${v.language}) - ${v.vietnameseTranslation} - folder: ${v.folder}` });
    }
  } catch (e) {
    // ignore DB errors (e.g., when no connection available in dev/test)
  }

  return top.slice(0, topN);
}
