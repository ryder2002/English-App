import { getRelevantDocs } from '../src/lib/ai-rag';

(async () => {
  const q = process.argv[2] || 'grammar passive voice';
  const docs = await getRelevantDocs(q, 5);
  console.log('Query:', q);
  console.log('Found docs:');
  docs.forEach((d, i) => {
    console.log(i+1, d.title, d.path, '\n', d.snippet.slice(0, 300), '\n---');
  });
})();
