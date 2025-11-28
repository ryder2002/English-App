# AI RAG (Retrieval-Augmented Generation) Configuration

This project now includes a lightweight RAG configuration integrated into the AI chatbot flow. The goal is to ensure that the AI assistant:  
- Uses the project website documentation (the `docs/` folder) and database vocabulary entries only for content sources.
- Restricts answers to English and Chinese language learning topics, and only uses the website documentation and site database when responding.
- Returns structured vocabulary definitions from the internal vocabulary database for precise word lookups.

## How the RAG works
- The chatbot flow (`src/ai/flows/interact-with-language-chatbot.ts`) now calls the retriever (`src/lib/ai-rag.ts`) before invoking the LLM.
- `ai-rag.ts` scans `docs/` files and prioritizes relevant documents using simple token matching.
- If a vocabulary match is found in the database, the chatbot will call `generateVocabularyDetails` flow to produce authoritative, structured dictionary-like answers.
- The assistant prompt is explicitly instructed: "You MUST ONLY USE the information provided in the website documentation context below to answer the user's question. Do not invent facts or use external sources outside this website."

## Files Updated
- `src/lib/ai-rag.ts` — Document retriever that reads `docs/` and adds matching `vocabulary` database rows as context.
- `src/ai/flows/interact-with-language-chatbot.ts` — Updated prompt to include the contextDocs variable and RAG instructions; added DB vocabulary matched flow.

## Retrieval behavior
- Top 3 matching docs are included as context in the LLM prompt.
- Top vocabulary DB items (max 3) matching the query are included, and if a vocabulary ID is matched the `generateVocabularyDetails` flow is called to provide a high-quality structured answer.

## Deployment/Operation
- To add or update site docs for RAG indexing, add or edit `.md` files under `docs/` and re-run the service; the retriever reads `docs/` at runtime and caches them.
- For accurate vocabulary retrieval, keep the `vocabulary` DB updated and indexed.

## Troubleshooting
- If the AI returns non-RAG answers:
  - Confirm the `docs/` folder includes relevant matching content.
  - Confirm the vocabulary table has matching entries for word queries.
  - If you want RAG disabled, set a setting in `src/contexts/settings-context.tsx` to control `useRag` (future enhancement).  

For a stricter enforcement, the model is instructed to only use the context and to explicitly say it doesn't have enough information if not present.

If you want a more robust retriever (embedding-based) or an external vector DB (Supabase + pg_vector, Pinecone), I can add a migration path and ingestion script to generate embeddings and store them in a vector DB.
