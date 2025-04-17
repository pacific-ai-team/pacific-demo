from typing import List
from app.components.models import Chunk

class Reranker:
    def rerank(self, query: str, chunks: List[Chunk]) -> List[Chunk]:
        """Simulates reranking chunks based on the query."""
        print(f"Reranker: Reranking {len(chunks)} chunks for query '{query}'...")

        # Simple simulation: Sort by predefined similarity score (descending)
        # In a real app, this would involve a more sophisticated model (e.g., Cohere Rerank)
        reranked_chunks = sorted(
            chunks,
            key=lambda c: c.embedding_similarity_score if c.embedding_similarity_score is not None else 0,
            reverse=True
        )

        # Assign a simple reranking score (e.g., based on new position)
        for i, chunk in enumerate(reranked_chunks):
            chunk.reranking_score = 1.0 - (i / len(reranked_chunks)) # Higher rank = higher score

        print(f"Reranker: Reranking complete.")
        return reranked_chunks 